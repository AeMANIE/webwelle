import { NextRequest } from 'next/server';
import { applyRateLimit, secureResponse } from '@/lib/api-security';
import { previewTanTrust, type TanTrustScope } from '@/lib/tan-trust';
import { RATE_LIMITS } from '@/lib/rate-limit';
import { validateEmail } from '@/lib/validation';

function parseScope(value: string | null): TanTrustScope | null {
  if (value === 'customer' || value === 'admin') return value;
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const rateLimitResponse = await applyRateLimit(request, RATE_LIMITS.API);
    if (rateLimitResponse) return rateLimitResponse;

    const scope = parseScope(request.nextUrl.searchParams.get('scope'));
    if (!scope) {
      return secureResponse({ error: 'Ungültiger scope' }, 400);
    }

    const emailParam = request.nextUrl.searchParams.get('email')?.toLowerCase().trim();
    if (!emailParam || !validateEmail(emailParam)) {
      return secureResponse({ trusted: false });
    }

    const trusted = previewTanTrust(request, scope, emailParam);
    return secureResponse({ trusted });
  } catch (error) {
    console.error('TAN-Trust-Status Fehler:', error);
    return secureResponse({ trusted: false }, 500);
  }
}
