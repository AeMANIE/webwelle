import { randomBytes } from 'crypto';
import { getRedisClient } from './redis';
import { pool } from './database';

export type ActivationPurpose =
  | 'new_customer_activation'
  | 'existing_customer_link'
  | 'password_setup'
  | 'resume_analysis';

// Sicheren Token generieren (32 Zeichen, hex)
export function generateActivationToken(): string {
  return randomBytes(16).toString('hex'); // 32 Zeichen
}

async function ensurePortalTokenColumns(client: import('pg').PoolClient) {
  await client.query(`
    ALTER TABLE customer_portal_tokens
    ADD COLUMN IF NOT EXISTS lead_id UUID,
    ADD COLUMN IF NOT EXISTS purpose VARCHAR(50) DEFAULT 'new_customer_activation',
    ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
    CREATE INDEX IF NOT EXISTS idx_portal_tokens_lead_id ON customer_portal_tokens(lead_id);
    CREATE INDEX IF NOT EXISTS idx_portal_tokens_purpose ON customer_portal_tokens(purpose);
  `);
}

export async function getRecentActivationToken(
  customerEmail: string,
  leadId?: string,
  purpose: ActivationPurpose = 'new_customer_activation',
  cooldownMinutes = 60
): Promise<string | null> {
  const client = await pool.connect();

  try {
    await ensurePortalTokenColumns(client);

    const result = await client.query(
      `SELECT token
       FROM customer_portal_tokens
       WHERE LOWER(customer_email) = LOWER($1)
         AND used_at IS NULL
         AND expires_at > NOW()
         AND created_at > NOW() - ($4::int * INTERVAL '1 minute')
         AND COALESCE(purpose, 'new_customer_activation') = $3
         AND ($2::uuid IS NULL OR lead_id = $2::uuid)
       ORDER BY created_at DESC
       LIMIT 1`,
      [customerEmail, leadId || null, purpose, cooldownMinutes]
    );

    return result.rows[0]?.token || null;
  } finally {
    client.release();
  }
}

export async function createActivationTokenIfNeeded(
  customerEmail: string,
  leadId?: string,
  bookingId?: string,
  cooldownMinutes = 60,
  purpose: ActivationPurpose = 'new_customer_activation',
  metadata: Record<string, unknown> = {}
): Promise<{ token: string; created: boolean }> {
  const client = await pool.connect();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  try {
    await client.query('BEGIN');
    await ensurePortalTokenColumns(client);
    await client.query(
      `SELECT pg_advisory_xact_lock(hashtext(LOWER($1) || ':' || COALESCE($2::text, '') || ':' || $3))`,
      [customerEmail, leadId || null, purpose]
    );

    const existing = await client.query(
      `SELECT token
       FROM customer_portal_tokens
       WHERE LOWER(customer_email) = LOWER($1)
         AND used_at IS NULL
         AND expires_at > NOW()
         AND created_at > NOW() - ($4::int * INTERVAL '1 minute')
         AND COALESCE(purpose, 'new_customer_activation') = $3
         AND ($2::uuid IS NULL OR lead_id = $2::uuid)
       ORDER BY created_at DESC
       LIMIT 1`,
      [customerEmail, leadId || null, purpose, cooldownMinutes]
    );

    if (existing.rows[0]?.token) {
      await client.query('COMMIT');
      return { token: existing.rows[0].token, created: false };
    }

    const token = generateActivationToken();
    await client.query(
      `INSERT INTO customer_portal_tokens (customer_email, token, expires_at, booking_id, lead_id, purpose, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)`,
      [
        customerEmail,
        token,
        expiresAt,
        bookingId || null,
        leadId || null,
        purpose,
        JSON.stringify(metadata),
      ]
    );
    await client.query('COMMIT');

    const redis = getRedisClient();
    if (redis && (await redis.status) === 'ready') {
      const ttl = Math.ceil((expiresAt.getTime() - Date.now()) / 1000);
      await redis.setex(`portal_token:${token}`, ttl, customerEmail);
    }

    return { token, created: true };
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

// Token in Datenbank speichern
export async function saveActivationToken(
  customerEmail: string,
  token: string,
  bookingId?: string,
  leadId?: string,
  purpose: ActivationPurpose = 'new_customer_activation',
  metadata: Record<string, unknown> = {}
): Promise<void> {
  const client = await pool.connect();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 Tage gültig
  
  try {
    await ensurePortalTokenColumns(client);
    await client.query(
      `INSERT INTO customer_portal_tokens (customer_email, token, expires_at, booking_id, lead_id, purpose, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
       ON CONFLICT (token) DO NOTHING`,
      [
        customerEmail,
        token,
        expiresAt,
        bookingId || null,
        leadId || null,
        purpose,
        JSON.stringify(metadata),
      ]
    );
    
    // Optional: Auch in Redis cachen (für schnellere Validierung)
    const redis = getRedisClient();
    if (redis && (await redis.status) === 'ready') {
      const ttl = Math.ceil((expiresAt.getTime() - Date.now()) / 1000);
      await redis.setex(`portal_token:${token}`, ttl, customerEmail);
    }
    
    console.log(`✅ Portal-Aktivierungs-Token gespeichert für ${customerEmail}`);
  } catch (error) {
    console.error('❌ Fehler beim Speichern des Portal-Tokens:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Token validieren
export async function validateActivationToken(token: string): Promise<{
  valid: boolean;
  email?: string;
  leadId?: string;
  purpose?: ActivationPurpose;
  customerExists?: boolean;
  portalActivated?: boolean;
  customerName?: string;
  companyName?: string;
  vatId?: string;
  expired?: boolean;
  used?: boolean;
  error?: string;
}> {
  // Redis wird nur als Cache befüllt. Die DB bleibt Quelle der Wahrheit,
  // weil wir Lead- und Kundendaten für den Setup-Flow brauchen.
  const redis = getRedisClient();
  
  const client = await pool.connect();
  let result;
  
  try {
    await client.query('ALTER TABLE customers ADD COLUMN IF NOT EXISTS vat_id VARCHAR(50)');
    await ensurePortalTokenColumns(client);
    result = await client.query(
      `SELECT 
          t.customer_email,
          t.expires_at,
          t.used_at,
          t.lead_id,
          COALESCE(t.purpose, 'new_customer_activation') AS purpose,
          c.id AS customer_id,
          c.name AS customer_name,
          c.company_name,
          c.portal_activated,
          c.vat_id
       FROM customer_portal_tokens t
       LEFT JOIN customers c ON LOWER(c.email) = LOWER(t.customer_email)
       WHERE t.token = $1`,
      [token]
    );
  
    if (result.rows.length === 0) {
      return { valid: false, error: 'Token nicht gefunden' };
    }
    
    const row = result.rows[0];
    
    if (row.used_at) {
      return { valid: false, used: true, error: 'Token wurde bereits verwendet' };
    }
    
    if (new Date(row.expires_at) < new Date()) {
      return { valid: false, expired: true, error: 'Token ist abgelaufen' };
    }
    
    // Token ist gültig, cache in Redis
    if (redis && (await redis.status) === 'ready') {
      const expiresAt = new Date(row.expires_at);
      const ttl = Math.ceil((expiresAt.getTime() - Date.now()) / 1000);
      if (ttl > 0) {
        await redis.setex(`portal_token:${token}`, ttl, row.customer_email);
      }
    }
    
    return {
      valid: true,
      email: row.customer_email,
      leadId: row.lead_id || undefined,
      purpose: row.purpose || 'new_customer_activation',
      customerExists: Boolean(row.customer_id),
      portalActivated: Boolean(row.portal_activated),
      customerName: row.customer_name || undefined,
      companyName: row.company_name || undefined,
      vatId: row.vat_id || undefined,
    };
  } finally {
    client.release();
  }
}

// Token als verwendet markieren
export async function markTokenAsUsed(token: string): Promise<void> {
  const client = await pool.connect();
  
  try {
    await client.query(
      `UPDATE customer_portal_tokens
       SET used_at = CURRENT_TIMESTAMP
       WHERE token = $1 AND used_at IS NULL`,
      [token]
    );
    
    // Aus Redis entfernen
    const redis = getRedisClient();
    if (redis && (await redis.status) === 'ready') {
      await redis.del(`portal_token:${token}`);
    }
    
    console.log(`✅ Portal-Token als verwendet markiert: ${token.substring(0, 8)}...`);
  } catch (error) {
    console.error('❌ Fehler beim Markieren des Tokens als verwendet:', error);
    throw error;
  } finally {
    client.release();
  }
}

