import Stripe from 'stripe';
import { pool } from '@/lib/database';
import {
  createOfferFromLead,
  getDiscountChoice,
  updateFunnelLead,
  updateOfferStatus,
} from '@/lib/funnel-database';
import type { FunnelLead } from '@/lib/funnel/types';
import {
  calculateFunnelOfferTotal,
  normalizeAddonSelection,
  STARTERWELLE,
  type FunnelAddonSelection,
} from '@/lib/funnel/packages';
import {
  assertFunnelStripePrices,
  buildStripeLineItemsFromSelection,
  buildTestStripeLineItem,
} from '@/lib/funnel/funnel-stripe-line-items';
import { FunnelCheckoutError, mapCheckoutError } from '@/lib/funnel/funnel-checkout-error';

export { FunnelCheckoutError, mapCheckoutError };

const PRODUCTION_BASE_URL = 'https://webwelle.com';

export function getPublicBaseUrl(): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || '';
  const trimmed = fromEnv.replace(/\/$/, '');
  if (trimmed) return trimmed;
  if (process.env.NODE_ENV === 'production') return PRODUCTION_BASE_URL;
  return 'http://localhost:3000';
}

export function getStripeKeyMode(): 'test' | 'live' | 'unknown' {
  const key = process.env.STRIPE_SECRET_KEY || '';
  if (key.startsWith('sk_test_')) return 'test';
  if (key.startsWith('sk_live_')) return 'live';
  return 'unknown';
}

export function getStripeClient(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY fehlt');
  return new Stripe(key, { apiVersion: '2025-08-27.basil' });
}

/** Stripe Checkout: Pflicht-AGB-Checkbox mit Link zur AGB-Seite. */
export function getStripeAgbConsentConfig(
  baseUrl?: string
): Pick<Stripe.Checkout.SessionCreateParams, 'consent_collection' | 'custom_text'> {
  const agbUrl = `${(baseUrl || getPublicBaseUrl()).replace(/\/$/, '')}/agb`;
  return {
    consent_collection: {
      terms_of_service: 'required',
    },
    custom_text: {
      terms_of_service_acceptance: {
        message: `Ich habe die [AGB der WebWelle](${agbUrl}) gelesen und akzeptiere sie. Das Angebot richtet sich ausschließlich an Unternehmer im Sinne des § 14 BGB.`,
      },
    },
  };
}

export function validateLeadForCheckout(lead: FunnelLead): void {
  if (lead.status === 'paid') {
    throw new FunnelCheckoutError('Diese Buchung wurde bereits bezahlt.', 'already_paid');
  }
  if (!lead.email?.trim()) {
    throw new FunnelCheckoutError(
      'Bitte vervollständigen Sie zuerst Ihre Kontaktdaten.',
      'missing_contact'
    );
  }
  if (!lead.first_name?.trim()) {
    throw new FunnelCheckoutError(
      'Bitte vervollständigen Sie zuerst Ihre Kontaktdaten.',
      'missing_contact'
    );
  }
}

export async function buildOfferFromLead(lead: FunnelLead) {
  const addonSelection = normalizeAddonSelection(lead.addon_selection);
  const discount = await getDiscountChoice(lead.id);
  const discountCents = discount?.discount_cents || 0;
  const breakdown = calculateFunnelOfferTotal(addonSelection);

  const items = breakdown.items.map((item) => ({
    label: item.label,
    description: item.description,
    unitAmountCents: item.amountCents,
    billing: 'one_time' as const,
  }));

  const { id: offerId } = await createOfferFromLead({
    leadId: lead.id,
    packageType: STARTERWELLE.id,
    isCustom: items.length > 1,
    title: `${STARTERWELLE.name} – ${lead.company_name || lead.industry_normalized || 'Angebot'}`,
    subtotalCents: breakdown.subtotalCents,
    discountCents,
    items,
    createdBy: 'funnel_auto',
  });

  return {
    offerId,
    addonSelection,
    discountCents,
    breakdown,
    totalCents: Math.max(0, breakdown.subtotalCents - discountCents),
  };
}

export async function createStripeCustomerForLead(
  stripe: Stripe,
  lead: FunnelLead,
  offerId: string
): Promise<string | undefined> {
  if (!lead.email?.trim()) return undefined;

  const address = lead.postal_code
    ? {
        line1: [lead.street, lead.house_number].filter(Boolean).join(' '),
        city: lead.city || undefined,
        postal_code: lead.postal_code,
        country: lead.market || 'DE',
      }
    : undefined;

  const name =
    `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || lead.company_name || undefined;

  const existing = await stripe.customers.list({ email: lead.email.trim(), limit: 1 });
  if (existing.data[0]) {
    const customerId = existing.data[0].id;
    await stripe.customers.update(customerId, {
      name,
      phone: lead.phone || undefined,
      address,
      metadata: { company_name: lead.company_name || '', offer_id: offerId },
    });
    return customerId;
  }

  const created = await stripe.customers.create({
    email: lead.email.trim(),
    name,
    phone: lead.phone || undefined,
    address,
    metadata: { company_name: lead.company_name || '', offer_id: offerId },
  });
  return created.id;
}

async function buildDiscountCoupon(
  stripe: Stripe,
  discountCents: number
): Promise<string | undefined> {
  if (discountCents <= 0) return undefined;

  const coupon = await stripe.coupons.create({
    amount_off: discountCents,
    currency: 'eur',
    duration: 'once',
    name: 'Lieferzeit-Rabatt',
  });
  return coupon.id;
}

export async function createOfferCheckoutSession(params: {
  stripe: Stripe;
  lead: FunnelLead;
  offerId: string;
  selection: FunnelAddonSelection;
  totalCents: number;
  discountCents: number;
  cancelUrl?: string;
  useTestPrice?: boolean;
}): Promise<Stripe.Checkout.Session> {
  const { stripe, lead, offerId, selection, totalCents, discountCents, useTestPrice } = params;
  const baseUrl = getPublicBaseUrl();
  const stripeCustomerId = await createStripeCustomerForLead(stripe, lead, offerId);
  const lineItems = useTestPrice
    ? buildTestStripeLineItem()
    : buildStripeLineItemsFromSelection(selection);
  await assertFunnelStripePrices(stripe, lineItems);
  const discountCouponId = useTestPrice ? undefined : await buildDiscountCoupon(stripe, discountCents);
  const sessionAmountCents = useTestPrice ? 1 : totalCents;

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer: stripeCustomerId,
    customer_email: stripeCustomerId ? undefined : lead.email || undefined,
    line_items: lineItems,
    ...(discountCouponId ? { discounts: [{ coupon: discountCouponId }] } : {}),
    metadata: {
      offerId,
      leadId: lead.id,
      packageType: STARTERWELLE.id,
      ...(useTestPrice ? { testCheckout: 'true' } : {}),
    },
    success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}&offer=1`,
    cancel_url: params.cancelUrl || `${baseUrl}/funnel-5?t=${encodeURIComponent(lead.token)}`,
    locale: 'de',
    billing_address_collection: stripeCustomerId ? 'auto' : 'required',
    phone_number_collection: { enabled: true },
    ...getStripeAgbConsentConfig(baseUrl),
  });

  const client = await pool.connect();
  try {
    await client.query(
      `INSERT INTO offer_checkout_sessions (offer_id, stripe_session_id, stripe_customer_id, amount_cents, status)
       VALUES ($1, $2, $3, $4, 'pending')`,
      [offerId, session.id, stripeCustomerId || null, sessionAmountCents]
    );
    await updateOfferStatus(offerId, 'checkout_sent');
  } finally {
    client.release();
  }

  return session;
}

export async function startFunnelCheckout(
  lead: FunnelLead,
  options?: { useTestPrice?: boolean }
) {
  validateLeadForCheckout(lead);

  try {
    const stripe = getStripeClient();
    const { offerId, addonSelection, discountCents, totalCents } =
      await buildOfferFromLead(lead);

    await updateFunnelLead(lead.token, {
      selected_package: 'starterwelle',
      wants_custom_offer: true,
      status: 'package_selected',
    });

    const session = await createOfferCheckoutSession({
      stripe,
      lead,
      offerId,
      selection: addonSelection,
      totalCents,
      discountCents,
      useTestPrice: options?.useTestPrice,
    });

    if (!session.url) {
      throw new FunnelCheckoutError(
        'Stripe Checkout konnte nicht gestartet werden.',
        'checkout_failed'
      );
    }

    return {
      offerId,
      sessionId: session.id,
      url: session.url,
    };
  } catch (error) {
    throw mapCheckoutError(error);
  }
}
