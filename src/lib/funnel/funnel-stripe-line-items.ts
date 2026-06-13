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

function resolvePriceId(defaultId: string, envKey: string): string {
  return process.env[envKey]?.trim() || defaultId;
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
