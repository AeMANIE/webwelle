import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildStripeLineItemsFromSelection } from './funnel-stripe-line-items';
import {
  BLOG_BUNDLE_10,
  SEO_PROFI_ADDON,
  STARTERWELLE,
} from './packages';

describe('buildStripeLineItemsFromSelection', () => {
  it('includes only StarterWelle price when no addons selected', () => {
    const items = buildStripeLineItemsFromSelection({
      seoProfi: false,
      blogMode: 'none',
      blogCount: 5,
      brandingSelected: false,
      animationSelected: false,
    });

    assert.equal(items.length, 1);
    assert.equal(items[0]?.price, STARTERWELLE.stripePriceId);
  });

  it('maps selected addons to stripe price ids', () => {
    const items = buildStripeLineItemsFromSelection({
      seoProfi: true,
      blogMode: 'bundle_10',
      blogCount: 5,
      brandingSelected: false,
      animationSelected: false,
    });

    assert.equal(items.length, 3);
    assert.equal(items[0]?.price, STARTERWELLE.stripePriceId);
    assert.equal(items[1]?.price, SEO_PROFI_ADDON.stripePriceId);
    assert.equal(items[2]?.price, BLOG_BUNDLE_10.stripePriceId);
  });

  it('uses price_data fallback for custom blog articles', () => {
    const items = buildStripeLineItemsFromSelection({
      seoProfi: false,
      blogMode: 'custom',
      blogCount: 7,
      brandingSelected: false,
      animationSelected: false,
    });

    assert.equal(items.length, 2);
    assert.ok(items[1]?.price_data);
    assert.equal(items[1]?.quantity, 7);
  });
});
