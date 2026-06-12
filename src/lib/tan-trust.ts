import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import type { User } from './auth';
import {
  ADMIN_TAN_TRUST_COOKIE,
  CUSTOMER_TAN_TRUST_COOKIE,
  getSessionCookieOptions,
  TAN_TRUST_MAX_AGE,
} from './auth-cookies';

export const TAN_TRUST_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export type TanTrustScope = 'customer' | 'admin';

interface TanTrustPayload {
  email: string;
  userId: string;
  scope: TanTrustScope;
  pwdVer: string;
  exp: number;
}

function getTrustSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET Umgebungsvariable ist nicht gesetzt');
  }
  return secret;
}

export function computePasswordVersion(passwordMaterial: string): string {
  return crypto.createHash('sha256').update(passwordMaterial).digest('hex').slice(0, 16);
}

function signPayload(payload: TanTrustPayload): string {
  const payloadJson = JSON.stringify(payload);
  const payloadB64 = Buffer.from(payloadJson).toString('base64url');
  const sig = crypto
    .createHmac('sha256', getTrustSecret())
    .update(payloadB64)
    .digest('base64url');
  return `${payloadB64}.${sig}`;
}

function parseTrustToken(token: string): TanTrustPayload | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [payloadB64, sig] = parts;
  const expectedSig = crypto
    .createHmac('sha256', getTrustSecret())
    .update(payloadB64)
    .digest('base64url');

  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8')) as TanTrustPayload;
    if (
      !payload.email ||
      !payload.userId ||
      !payload.scope ||
      !payload.pwdVer ||
      typeof payload.exp !== 'number'
    ) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

function getTrustCookieName(scope: TanTrustScope): string {
  return scope === 'customer' ? CUSTOMER_TAN_TRUST_COOKIE : ADMIN_TAN_TRUST_COOKIE;
}

export function issueTanTrustCookie(
  response: NextResponse,
  scope: TanTrustScope,
  user: User,
  passwordMaterial: string
): void {
  const payload: TanTrustPayload = {
    email: user.email.toLowerCase().trim(),
    userId: user.id,
    scope,
    pwdVer: computePasswordVersion(passwordMaterial),
    exp: Date.now() + TAN_TRUST_MAX_AGE_MS,
  };

  response.cookies.set(
    getTrustCookieName(scope),
    signPayload(payload),
    getSessionCookieOptions(TAN_TRUST_MAX_AGE)
  );
}

export function verifyTanTrust(
  request: NextRequest,
  scope: TanTrustScope,
  email: string,
  passwordMaterial: string
): boolean {
  const token = request.cookies.get(getTrustCookieName(scope))?.value;
  if (!token) return false;

  const payload = parseTrustToken(token);
  if (!payload) return false;

  const normalizedEmail = email.toLowerCase().trim();
  if (payload.scope !== scope) return false;
  if (payload.email !== normalizedEmail) return false;
  if (Date.now() > payload.exp) return false;
  if (payload.pwdVer !== computePasswordVersion(passwordMaterial)) return false;

  return true;
}

export function clearTanTrustCookie(response: NextResponse, scope: TanTrustScope): void {
  const cleared = { ...getSessionCookieOptions(0), maxAge: 0 };
  response.cookies.set(getTrustCookieName(scope), '', cleared);
}

/** Admin pwdVer material from ENV (hash preferred over plain). */
export function getAdminPasswordMaterial(): string {
  return process.env.ADMIN_PASSWORD_HASH || process.env.ADMIN_PASSWORD || '';
}

export async function resolveCustomerPasswordMaterial(
  normalizedEmail: string
): Promise<string | null> {
  const { getCustomerByEmail } = await import('./database');
  const customer = await getCustomerByEmail(normalizedEmail);
  if (customer?.password_hash) return customer.password_hash;

  if (process.env.NODE_ENV !== 'production') {
    const devEmails = ['customer1@example.com', 'anna@demo-company.de', 'harmonie_556@yahoo.com'];
    if (devEmails.includes(normalizedEmail)) {
      return '$2b$12$iwy8veYiyMqIplZUukl.n.TRd9PAR/ln4zemFfk4xA6i5sxTWky5O';
    }
  }

  return null;
}
