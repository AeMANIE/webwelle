import { NextRequest } from 'next/server';
import { requireAdminAuth, secureResponse } from '@/lib/api-security';
import {
  getPublicBaseUrl,
  getStripeClient,
  getStripeKeyMode,
} from '@/lib/funnel/offer-checkout';
import { verifyFunnelStripePrices } from '@/lib/funnel/funnel-stripe-line-items';

export async function GET(request: NextRequest) {
  const auth = await requireAdminAuth(request);
  if (auth instanceof Response) return auth;

  try {
    const stripe = getStripeClient();
    const prices = await verifyFunnelStripePrices(stripe);
    const allOk = prices.every((p) => p.ok);

    return secureResponse({
      ok: allOk,
      keyMode: getStripeKeyMode(),
      baseUrl: getPublicBaseUrl(),
      nodeEnv: process.env.NODE_ENV || 'unknown',
      prices,
    });
  } catch (error) {
    console.error('verify-stripe-funnel failed:', error);
    return secureResponse(
      {
        ok: false,
        error: 'verify_failed',
        message:
          error instanceof Error ? error.message : 'Stripe-Verifikation fehlgeschlagen.',
      },
      500
    );
  }
}
