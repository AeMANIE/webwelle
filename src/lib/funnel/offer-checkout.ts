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
import { buildStripeLineItemsFromSelection } from '@/lib/funnel/funnel-stripe-line-items';

export class FunnelCheckoutError extends Error {
  constructor(
    message: string,
    public code: string
  ) {
    super(message);
    this.name = 'FunnelCheckoutError';
  }
}

function isStripeError(error: unknown): error is Stripe.errors.StripeError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    typeof (error as Stripe.errors.StripeError).type === 'string'
  );
}

export function mapCheckoutError(error: unknown): FunnelCheckoutError {
  if (error instanceof FunnelCheckoutError) return error;

  if (isStripeError(error)) {
    const code = error.code || error.type;
    if (code === 'resource_missing' || error.message.includes('No such price')) {
      return new FunnelCheckoutError(
        'Stripe-Preis nicht gefunden. Bitte STRIPE_PRICE_* in Coolify mit den Price-IDs aus dem Stripe-Dashboard abgleichen (Test vs. Live).',
        'stripe_price_missing'
      );
    }
    return new FunnelCheckoutError(
      `Stripe-Fehler: ${error.message}`,
      'stripe_error'
    );
  }

  if (error instanceof Error) {
    if (/offer_checkout_sessions|relation .* does not exist/i.test(error.message)) {
      return new FunnelCheckoutError(
        'Checkout-Tabelle fehlt in der Datenbank. Bitte Deployment neu starten oder /api/migrate ausführen.',
        'db_schema_missing'
      );
    }
    return new FunnelCheckoutError(error.message, 'checkout_failed');
  }

  return new FunnelCheckoutError(
    'Checkout konnte nicht gestartet werden.',
    'checkout_failed'
  );
}

export function getPublicBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'http://localhost:3000'
  ).replace(/\/$/, '');
}

export function getStripeClient(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY fehlt');
  return new Stripe(key, { apiVersion: '2025-08-27.basil' });
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
}): Promise<Stripe.Checkout.Session> {
  const { stripe, lead, offerId, selection, totalCents, discountCents } = params;
  const baseUrl = getPublicBaseUrl();
  const stripeCustomerId = await createStripeCustomerForLead(stripe, lead, offerId);
  const lineItems = buildStripeLineItemsFromSelection(selection);
  const discountCouponId = await buildDiscountCoupon(stripe, discountCents);

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
    },
    success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}&offer=1`,
    cancel_url: params.cancelUrl || `${baseUrl}/funnel-5?t=${encodeURIComponent(lead.token)}`,
    locale: 'de',
    billing_address_collection: stripeCustomerId ? 'auto' : 'required',
    phone_number_collection: { enabled: true },
  });

  const client = await pool.connect();
  try {
    await client.query(
      `INSERT INTO offer_checkout_sessions (offer_id, stripe_session_id, stripe_customer_id, amount_cents, status)
       VALUES ($1, $2, $3, $4, 'pending')`,
      [offerId, session.id, stripeCustomerId || null, totalCents]
    );
    await updateOfferStatus(offerId, 'checkout_sent');
  } finally {
    client.release();
  }

  return session;
}

export async function startFunnelCheckout(lead: FunnelLead) {
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
