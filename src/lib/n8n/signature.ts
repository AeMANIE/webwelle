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

/** HMAC (client pipeline) or API key (webwelle publish / job-completed). */
export function verifyN8nRequest(
  request: { headers: { get(name: string): string | null } },
  rawBody: string
): boolean {
  if (verifyN8nSignature(rawBody, request.headers.get('x-webwelle-signature'))) {
    return true;
  }
  const apiKey =
    request.headers.get('x-api-key') ||
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  const expected = process.env.N8N_API_KEY?.trim();
  return Boolean(expected && apiKey && apiKey === expected);
}
