import { randomBytes } from 'crypto';
import { getRedisClient } from './redis';
import { pool } from './database';

// Sicheren Token generieren (32 Zeichen, hex)
export function generateActivationToken(): string {
  return randomBytes(16).toString('hex'); // 32 Zeichen
}

// Token in Datenbank speichern
export async function saveActivationToken(
  customerEmail: string,
  token: string,
  bookingId?: string
): Promise<void> {
  const client = await pool.connect();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 Tage gültig
  
  try {
    await client.query(
      `INSERT INTO customer_portal_tokens (customer_email, token, expires_at, booking_id)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (token) DO NOTHING`,
      [customerEmail, token, expiresAt, bookingId || null]
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
  }
}

// Token validieren
export async function validateActivationToken(token: string): Promise<{
  valid: boolean;
  email?: string;
  expired?: boolean;
  used?: boolean;
  error?: string;
}> {
  // Erst in Redis prüfen (schneller)
  const redis = getRedisClient();
  if (redis && (await redis.status) === 'ready') {
    const cachedEmail = await redis.get(`portal_token:${token}`);
    if (cachedEmail) {
      // Token ist in Redis, also gültig
      // Aber prüfe trotzdem in DB ob nicht verwendet
      const client = await pool.connect();
      try {
        const result = await client.query(
          `SELECT used_at FROM customer_portal_tokens WHERE token = $1`,
          [token]
        );
        
        if (result.rows.length > 0 && result.rows[0].used_at) {
          return { valid: false, used: true, error: 'Token wurde bereits verwendet' };
        }
        
        return { valid: true, email: cachedEmail };
      } finally {
        client.release();
      }
    }
  }
  
  // Dann in Datenbank prüfen (falls nicht in Redis)
  const client = await pool.connect();
  let result;
  
  try {
    result = await client.query(
      `SELECT customer_email, expires_at, used_at
       FROM customer_portal_tokens
       WHERE token = $1`,
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
    
    return { valid: true, email: row.customer_email };
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

