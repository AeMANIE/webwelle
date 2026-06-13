import { NextRequest } from 'next/server';
import { secureResponse } from '@/lib/api-security';
import {
  FunnelCheckoutError,
  getStripeClient,
  startFunnelCheckout,
} from '@/lib/funnel/offer-checkout';
import { getFunnelLeadByToken } from '@/lib/funnel-database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = String(body.token || '').trim();
    if (!token) {
      return secureResponse({ error: 'missing_token', message: 'Session fehlt.' }, 400);
    }

    const lead = await getFunnelLeadByToken(token);
    if (!lead) {
      return secureResponse({ error: 'not_found', message: 'Lead nicht gefunden.' }, 404);
    }

    const result = await startFunnelCheckout(lead);
    return secureResponse(result);
  } catch (error) {
    if (error instanceof FunnelCheckoutError) {
      return secureResponse({ error: error.code, message: error.message }, 400);
    }
    console.error('Funnel checkout create failed:', error);
    return secureResponse(
      { error: 'checkout_failed', message: 'Checkout konnte nicht gestartet werden.' },
      500
    );
  }
}
