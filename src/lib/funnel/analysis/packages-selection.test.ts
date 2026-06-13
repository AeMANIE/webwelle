import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  ANIMATION_ADDON,
  BLOG_BUNDLE_10,
  BRANDING_ADDON,
  listSelectedPackageLabels,
  SEO_PROFI_ADDON,
  STARTERWELLE,
} from './packages';

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

  it('shows SEO Profi and Blog when both are active', () => {
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
