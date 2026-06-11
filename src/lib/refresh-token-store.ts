import crypto from 'crypto';
import { pool } from './database';
import type { User } from './auth';
import { ROLE_HIERARCHY, normalizeLegacyJwtRole } from './rbac';

export const REFRESH_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function generateRefreshTokenValue(): string {
  return crypto.randomBytes(32).toString('base64url');
}

export async function ensureRefreshTokensTable(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(255) NOT NULL,
        user_role VARCHAR(20) NOT NULL,
        user_email VARCHAR(255) NOT NULL,
        user_name VARCHAR(255) NOT NULL,
        customer_id VARCHAR(255),
        staff_id VARCHAR(255),
        token_hash VARCHAR(64) NOT NULL UNIQUE,
        expires_at TIMESTAMPTZ NOT NULL,
        revoked_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash ON refresh_tokens(token_hash);
      CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id, user_role);
      ALTER TABLE refresh_tokens ADD COLUMN IF NOT EXISTS customer_id VARCHAR(255);
      ALTER TABLE refresh_tokens ADD COLUMN IF NOT EXISTS staff_id VARCHAR(255);
    `);
  } finally {
    client.release();
  }
}

export async function storeRefreshToken(
  user: User,
  token: string,
  expiresAt: Date
): Promise<void> {
  await ensureRefreshTokensTable();
  const client = await pool.connect();
  try {
    await client.query(
      `INSERT INTO refresh_tokens (
         user_id, user_role, user_email, user_name, customer_id, staff_id, token_hash, expires_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        user.id,
        user.role,
        user.email,
        user.name,
        user.customerId ?? null,
        user.staffId ?? null,
        hashToken(token),
        expiresAt,
      ]
    );
  } finally {
    client.release();
  }
}

function rowToUser(row: {
  user_id: string;
  user_role: string;
  user_email: string;
  user_name: string;
  customer_id?: string | null;
  staff_id?: string | null;
}): User | null {
  const role = normalizeLegacyJwtRole(row.user_role);
  if (!role) return null;
  return {
    id: row.user_id,
    email: row.user_email,
    name: row.user_name,
    role,
    roleLevel: ROLE_HIERARCHY[role],
    customerId: row.customer_id ?? undefined,
    staffId: row.staff_id ?? undefined,
  };
}

export async function rotateRefreshToken(
  token: string
): Promise<{ user: User; newToken: string } | null> {
  await ensureRefreshTokensTable();
  const client = await pool.connect();
  try {
    const hash = hashToken(token);
    const result = await client.query(
      `SELECT user_id, user_role, user_email, user_name, customer_id, staff_id, expires_at, revoked_at
       FROM refresh_tokens WHERE token_hash = $1`,
      [hash]
    );
    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    if (row.revoked_at) return null;
    if (new Date(row.expires_at) < new Date()) return null;

    await client.query(
      `UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = $1`,
      [hash]
    );

    const user = rowToUser(row);
    if (!user) return null;

    const newToken = generateRefreshTokenValue();
    const expiresAt = new Date(Date.now() + REFRESH_MAX_AGE_MS);
    await client.query(
      `INSERT INTO refresh_tokens (
         user_id, user_role, user_email, user_name, customer_id, staff_id, token_hash, expires_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        user.id,
        user.role,
        user.email,
        user.name,
        user.customerId ?? null,
        user.staffId ?? null,
        hashToken(newToken),
        expiresAt,
      ]
    );

    return { user, newToken };
  } finally {
    client.release();
  }
}

export async function revokeRefreshToken(token: string): Promise<void> {
  await ensureRefreshTokensTable();
  const client = await pool.connect();
  try {
    await client.query(
      `UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = $1 AND revoked_at IS NULL`,
      [hashToken(token)]
    );
  } finally {
    client.release();
  }
}

export async function revokeAllUserRefreshTokens(userId: string, role: string): Promise<void> {
  await ensureRefreshTokensTable();
  const client = await pool.connect();
  try {
    await client.query(
      `UPDATE refresh_tokens SET revoked_at = NOW()
       WHERE user_id = $1 AND user_role = $2 AND revoked_at IS NULL`,
      [userId, role]
    );
  } finally {
    client.release();
  }
}
