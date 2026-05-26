import { NextRequest } from 'next/server';
import Stripe from 'stripe';
import { requireAdminAuth, secureResponse } from '@/lib/api-security';
import { getOfferById, updateOfferStatus } from '@/lib/funnel-database';
import { pool } from '@/lib/database';

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY fehlt');
  return new Stripe(key, { apiVersion: '2025-08-27.basil' });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminAuth(request);
  if (auth instanceof Response) return auth;

  const { id: offerId } = await params;
  const { offer, items } = await getOfferById(offerId);
  if (!offer) return secureResponse({ error: 'not_found' }, 404);

  if (offer.status !== 'signed' && offer.status !== 'draft') {
    return secureResponse(
      { error: 'invalid_status', message: 'Angebot muss unterschrieben oder freigegeben sein' },
      400
    );
  }

  const client = await pool.connect();
  let lead;
  try {
    const r = await client.query('SELECT * FROM funnel_leads WHERE id = $1', [offer.lead_id]);
    lead = r.rows[0];
  } finally {
    client.release();
  }

  const stripe = getStripe();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  let stripeCustomerId: string | undefined;
  if (lead?.email) {
    const existing = await stripe.customers.list({ email: lead.email, limit: 1 });
    if (existing.data[0]) {
      stripeCustomerId = existing.data[0].id;
      await stripe.customers.update(stripeCustomerId, {
        name: `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || undefined,
        phone: lead.phone || undefined,
        address: lead.postal_code
          ? {
              line1: [lead.street, lead.house_number].filter(Boolean).join(' '),
              city: lead.city || undefined,
              postal_code: lead.postal_code,
              country: lead.market || 'DE',
            }
          : undefined,
        metadata: { company_name: lead.company_name || '' },
      });
    } else {
      const created = await stripe.customers.create({
        email: lead.email,
        name: `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || lead.company_name,
        phone: lead.phone || undefined,
        address: lead.postal_code
          ? {
              line1: [lead.street, lead.house_number].filter(Boolean).join(' '),
              city: lead.city || undefined,
              postal_code: lead.postal_code,
              country: lead.market || 'DE',
            }
          : undefined,
        metadata: { company_name: lead.company_name || '', offer_id: offerId },
      });
      stripeCustomerId = created.id;
    }
  }

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
  (items as Array<{ label: string; unit_amount_cents: number; quantity?: number }>).length > 0
      ? (items as Array<{ label: string; unit_amount_cents: number }>).map((item) => ({
          price_data: {
            currency: offer.currency || 'eur',
            product_data: { name: item.label },
            unit_amount: item.unit_amount_cents || Math.round(offer.total_cents / Math.max(1, items.length)),
          },
          quantity: 1,
        }))
      : [
          {
            price_data: {
              currency: offer.currency || 'eur',
              product_data: { name: offer.title || 'WebWelle Angebot' },
              unit_amount: offer.total_cents,
            },
            quantity: 1,
          },
        ];

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer: stripeCustomerId,
    customer_email: stripeCustomerId ? undefined : lead?.email,
    line_items: lineItems,
    metadata: {
      offerId,
      leadId: offer.lead_id,
      packageType: offer.package_type || 'custom_offer',
    },
    success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}&offer=1`,
    cancel_url: `${baseUrl}/funnel-6?t=${lead?.token || ''}`,
    locale: 'de',
    billing_address_collection: stripeCustomerId ? 'auto' : 'required',
    phone_number_collection: { enabled: true },
  });

  const db = await pool.connect();
  try {
    await db.query(
      `INSERT INTO offer_checkout_sessions (offer_id, stripe_session_id, stripe_customer_id, amount_cents, status)
       VALUES ($1, $2, $3, $4, 'pending')`,
      [offerId, session.id, stripeCustomerId || null, offer.total_cents]
    );
    await updateOfferStatus(offerId, 'checkout_sent');
  } finally {
    db.release();
  }

  return secureResponse({ sessionId: session.id, url: session.url });
}
