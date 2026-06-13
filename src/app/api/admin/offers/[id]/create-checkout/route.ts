import { NextRequest } from 'next/server';
import { requireAdminAuth, secureResponse } from '@/lib/api-security';
import { getOfferById } from '@/lib/funnel-database';
import { pool } from '@/lib/database';
import {
  createOfferCheckoutSession,
  getStripeClient,
} from '@/lib/funnel/offer-checkout';
import { normalizeAddonSelection } from '@/lib/funnel/packages';
import type { FunnelLead } from '@/lib/funnel/types';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminAuth(request);
  if (auth instanceof Response) return auth;

  const { id: offerId } = await params;
  const { offer } = await getOfferById(offerId);
  if (!offer) return secureResponse({ error: 'not_found' }, 404);

  if (offer.status !== 'signed' && offer.status !== 'draft') {
    return secureResponse(
      { error: 'invalid_status', message: 'Angebot muss unterschrieben oder freigegeben sein' },
      400
    );
  }

  const client = await pool.connect();
  let lead: FunnelLead | null = null;
  try {
    const r = await client.query('SELECT * FROM funnel_leads WHERE id = $1', [offer.lead_id]);
    lead = r.rows[0] as FunnelLead | undefined ?? null;
  } finally {
    client.release();
  }

  if (!lead) {
    return secureResponse({ error: 'lead_not_found' }, 404);
  }

  try {
    const stripe = getStripeClient();
    const selection = normalizeAddonSelection(lead.addon_selection);
    const discountCents = Number(offer.discount_cents) || 0;
    const totalCents = Number(offer.total_cents) || 0;

    const session = await createOfferCheckoutSession({
      stripe,
      lead,
      offerId,
      selection,
      totalCents,
      discountCents,
    });

    return secureResponse({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Admin offer checkout failed:', error);
    return secureResponse(
      { error: 'checkout_failed', message: 'Stripe Checkout konnte nicht erstellt werden.' },
      500
    );
  }
}
