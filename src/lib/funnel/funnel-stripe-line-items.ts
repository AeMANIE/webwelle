import Stripe from 'stripe';
import {
  ANIMATION_ADDON,
  BLOG_BUNDLE_10,
  BLOG_UNIT_PRICE_CENTS,
  BRANDING_ADDON,
  normalizeAddonSelection,
  SEO_PROFI_ADDON,
  STARTERWELLE,
  type FunnelAddonSelection,
} from './packages';
import { FunnelCheckoutError } from './funnel-checkout-error';

export const FUNNEL_STRIPE_PRICE_CONFIG = [
  { envKey: 'STRIPE_PRICE_STARTERWELLE', defaultId: STARTERWELLE.stripePriceId, label: 'StarterWelle' },
  { envKey: 'STRIPE_PRICE_SEO_PROFI', defaultId: SEO_PROFI_ADDON.stripePriceId, label: 'SEO Profi' },
  {
    envKey: 'STRIPE_PRICE_BLOG_BUNDLE_10',
    defaultId: BLOG_BUNDLE_10.stripePriceId,
    label: '10 Blog-Artikel',
  },
  { envKey: 'STRIPE_PRICE_BRANDING', defaultId: BRANDING_ADDON.stripePriceId, label: 'Branding & Logo' },
  { envKey: 'STRIPE_PRICE_ANIMATION', defaultId: ANIMATION_ADDON.stripePriceId, label: 'Animationspaket' },
] as const;

export function sanitizeEnvValue(value: string | undefined): string {
  return value?.trim().replace(/^["']|["']$/g, '') || '';
}

export function resolvePriceId(defaultId: string, envKey: string): string {
  const raw = sanitizeEnvValue(process.env[envKey]);
  return raw || defaultId;
}

export function buildStripeLineItemsFromSelection(
  selection: FunnelAddonSelection
): Stripe.Checkout.SessionCreateParams.LineItem[] {
  const normalized = normalizeAddonSelection(selection);
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
    {
      price: resolvePriceId(STARTERWELLE.stripePriceId, 'STRIPE_PRICE_STARTERWELLE'),
      quantity: 1,
    },
  ];

  if (normalized.seoProfi) {
    lineItems.push({
      price: resolvePriceId(SEO_PROFI_ADDON.stripePriceId, 'STRIPE_PRICE_SEO_PROFI'),
      quantity: 1,
    });
  }

  if (normalized.blogMode === 'bundle_10') {
    lineItems.push({
      price: resolvePriceId(BLOG_BUNDLE_10.stripePriceId, 'STRIPE_PRICE_BLOG_BUNDLE_10'),
      quantity: 1,
    });
  } else if (normalized.blogMode === 'custom') {
    lineItems.push({
      price_data: {
        currency: 'eur',
        product_data: {
          name: `Blog-Artikel (${normalized.blogCount}×)`,
        },
        unit_amount: BLOG_UNIT_PRICE_CENTS,
      },
      quantity: normalized.blogCount,
    });
  }

  if (normalized.brandingSelected) {
    lineItems.push({
      price: resolvePriceId(BRANDING_ADDON.stripePriceId, 'STRIPE_PRICE_BRANDING'),
      quantity: 1,
    });
  }

  if (normalized.animationSelected) {
    lineItems.push({
      price: resolvePriceId(ANIMATION_ADDON.stripePriceId, 'STRIPE_PRICE_ANIMATION'),
      quantity: 1,
    });
  }

  return lineItems;
}

export async function assertFunnelStripePrices(
  stripe: Stripe,
  lineItems: Stripe.Checkout.SessionCreateParams.LineItem[]
): Promise<void> {
  for (const item of lineItems) {
    const priceId = typeof item.price === 'string' ? item.price : undefined;
    if (!priceId) continue;

    try {
      const price = await stripe.prices.retrieve(priceId);
      if (!price.active) {
        throw new FunnelCheckoutError(
          `Stripe-Preis ${priceId} ist nicht aktiv. Bitte im Stripe-Dashboard aktivieren.`,
          'stripe_price_inactive',
          priceId
        );
      }
      if (price.type !== 'one_time') {
        throw new FunnelCheckoutError(
          `Stripe-Preis ${priceId} ist kein Einmalpreis (type: ${price.type}). Für Funnel-Checkout wird one_time benötigt.`,
          'stripe_price_wrong_type',
          priceId
        );
      }
    } catch (error) {
      if (error instanceof FunnelCheckoutError) throw error;
      if (isStripeError(error) && error.code === 'resource_missing') {
        throw new FunnelCheckoutError(
          error.message ||
            `Stripe-Preis ${priceId} wurde nicht gefunden. Prüfen Sie STRIPE_PRICE_* und ob der API-Key zum gleichen Stripe-Konto gehört.`,
          'stripe_price_missing',
          priceId,
          error.code
        );
      }
      throw error;
    }
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

export type FunnelStripePriceVerification = {
  envKey: string;
  label: string;
  resolvedId: string;
  source: 'env' | 'default';
  ok: boolean;
  type?: string;
  active?: boolean;
  unitAmount?: number | null;
  currency?: string;
  error?: string;
  stripeCode?: string;
};

export async function verifyFunnelStripePrices(
  stripe: Stripe
): Promise<FunnelStripePriceVerification[]> {
  const results: FunnelStripePriceVerification[] = [];

  for (const config of FUNNEL_STRIPE_PRICE_CONFIG) {
    const envValue = sanitizeEnvValue(process.env[config.envKey]);
    const resolvedId = envValue || config.defaultId;
    const source = envValue ? 'env' : 'default';

    try {
      const price = await stripe.prices.retrieve(resolvedId);
      results.push({
        envKey: config.envKey,
        label: config.label,
        resolvedId,
        source,
        ok: price.active === true && price.type === 'one_time',
        type: price.type,
        active: price.active,
        unitAmount: price.unit_amount,
        currency: price.currency,
        error:
          price.active !== true
            ? 'Price ist nicht aktiv'
            : price.type !== 'one_time'
              ? `Falscher Typ: ${price.type}`
              : undefined,
      });
    } catch (error) {
      const stripeError = isStripeError(error) ? error : null;
      results.push({
        envKey: config.envKey,
        label: config.label,
        resolvedId,
        source,
        ok: false,
        error:
          stripeError?.message ||
          (error instanceof Error ? error.message : 'Unbekannter Fehler'),
        stripeCode: stripeError?.code,
      });
    }
  }

  return results;
}
