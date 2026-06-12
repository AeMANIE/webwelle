import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getBenefitsScrollGlowPrefix,
  shouldEnableBenefitsHoverGlow,
} from './benefits-card-glow';

describe('benefits-card-glow', () => {
  it('touch tablet uses scroll glow at all breakpoints', () => {
    assert.equal(getBenefitsScrollGlowPrefix(true), '');
    assert.equal(shouldEnableBenefitsHoverGlow(true), false);
  });

  it('phone SSR/hydration fallback keeps max-md scroll glow', () => {
    assert.equal(getBenefitsScrollGlowPrefix(null), 'max-md:');
    assert.equal(shouldEnableBenefitsHoverGlow(null), false);
  });

  it('desktop mouse keeps max-md scroll and enables hover', () => {
    assert.equal(getBenefitsScrollGlowPrefix(false), 'max-md:');
    assert.equal(shouldEnableBenefitsHoverGlow(false), true);
  });
});
