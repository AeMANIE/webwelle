import crypto from 'crypto';

export function signPayload(body: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(body).digest('hex');
}

export function verifyN8nSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.N8N_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = signPayload(rawBody, secret);
  try {
    return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature, 'hex'));
  } catch {
    return expected === signature;
  }
}
