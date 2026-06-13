import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  ANIMATION_ADDON,
  BLOG_BUNDLE_10,
  BRANDING_ADDON,
  calculateFunnelOfferTotal,
  listSelectedPackageLabels,
  SEO_PROFI_ADDON,
  STARTERWELLE,
} from '../packages';

describe('listSelectedPackageLabels', () => {
  it('shows only StarterWelle when no addons selected', () => {
    const labels = listSelectedPackageLabels({
      seoProfi: false,
      blogMode: 'none',
      blogCount: 5,
      brandingSelected: false,
      animationSelected: false,
    });
    assert.deepEqual(labels, [STARTERWELLE.name]);
  });

  it('shows only blog bundle without auto-including SEO Profi', () => {
    const labels = listSelectedPackageLabels({
      seoProfi: false,
      blogMode: 'bundle_10',
      blogCount: 5,
      brandingSelected: false,
      animationSelected: false,
    });
    assert.deepEqual(labels, [STARTERWELLE.name, BLOG_BUNDLE_10.name]);
  });

  it('shows SEO Profi and Blog when both are explicitly active', () => {
    const labels = listSelectedPackageLabels({
      seoProfi: true,
      blogMode: 'bundle_10',
      blogCount: 5,
      brandingSelected: false,
      animationSelected: false,
    });
    assert.deepEqual(labels, [
      STARTERWELLE.name,
      SEO_PROFI_ADDON.name,
      BLOG_BUNDLE_10.name,
    ]);
  });

  it('shows all selected addons across tabs', () => {
    const labels = listSelectedPackageLabels({
      seoProfi: true,
      blogMode: 'none',
      blogCount: 5,
      brandingSelected: true,
      animationSelected: true,
    });
    assert.deepEqual(labels, [
      STARTERWELLE.name,
      SEO_PROFI_ADDON.name,
      BRANDING_ADDON.name,
      ANIMATION_ADDON.name,
    ]);
  });
});

describe('calculateFunnelOfferTotal', () => {
  it('charges blog bundle alone at 499 € without SEO Profi', () => {
    const breakdown = calculateFunnelOfferTotal({
      seoProfi: false,
      blogMode: 'bundle_10',
      blogCount: 5,
      brandingSelected: false,
      animationSelected: false,
    });

    assert.equal(breakdown.items.length, 2);
    assert.equal(breakdown.items[1]?.label, BLOG_BUNDLE_10.name);
    assert.equal(breakdown.items[1]?.amountCents, 49900);
    assert.equal(breakdown.subtotalCents, STARTERWELLE.priceCents + 49900);
  });

  it('adds SEO Profi only when explicitly selected', () => {
    const breakdown = calculateFunnelOfferTotal({
      seoProfi: true,
      blogMode: 'bundle_10',
      blogCount: 5,
      brandingSelected: false,
      animationSelected: false,
    });

    assert.equal(breakdown.items.length, 3);
    assert.equal(breakdown.items[1]?.label, BLOG_BUNDLE_10.name);
    assert.equal(breakdown.items[2]?.label, SEO_PROFI_ADDON.name);
    assert.equal(
      breakdown.subtotalCents,
      STARTERWELLE.priceCents + BLOG_BUNDLE_10.priceCents + SEO_PROFI_ADDON.priceCents
    );
  });
});
