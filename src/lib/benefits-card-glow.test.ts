import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  BENEFITS_DESKTOP_SCROLL_BAR_GLOW,
  BENEFITS_TOUCH_SCROLL_BAR_GLOW,
  computeBenefitsScrollActiveIndex,
  getBenefitsHoverGlowClasses,
  getBenefitsScrollGlowClasses,
  getBenefitsScrollGlowPrefix,
  shouldEnableBenefitsHoverGlow,
} from './benefits-card-glow';

describe('benefits-card-glow', () => {
  it('touch tablet uses scroll glow at all breakpoints', () => {
    const scroll = getBenefitsScrollGlowClasses(true);
    assert.match(scroll.bar, /group-\[\.is-in-view\]:w-1\.5/);
    assert.doesNotMatch(scroll.bar, /max-md:/);
    assert.match(scroll.bar, /group-\[\.is-tapped\]:w-1\.5/);
    assert.equal(getBenefitsHoverGlowClasses(true).bar, '');
    assert.equal(getBenefitsScrollGlowPrefix(true), '');
    assert.equal(shouldEnableBenefitsHoverGlow(true), false);
  });

  it('phone SSR/hydration fallback keeps max-md scroll glow', () => {
    const scroll = getBenefitsScrollGlowClasses(null);
    assert.equal(scroll.bar, BENEFITS_DESKTOP_SCROLL_BAR_GLOW);
    assert.equal(getBenefitsHoverGlowClasses(null).bar, '');
    assert.equal(getBenefitsScrollGlowPrefix(null), 'max-md:');
    assert.equal(shouldEnableBenefitsHoverGlow(null), false);
  });

  it('desktop mouse keeps max-md scroll and enables hover', () => {
    const scroll = getBenefitsScrollGlowClasses(false);
    assert.equal(scroll.bar, BENEFITS_DESKTOP_SCROLL_BAR_GLOW);
    assert.match(getBenefitsHoverGlowClasses(false).bar, /md:group-hover:w-1\.5/);
    assert.equal(getBenefitsScrollGlowPrefix(false), 'max-md:');
    assert.equal(shouldEnableBenefitsHoverGlow(false), true);
  });

  it('touch and desktop scroll bar literals differ by breakpoint prefix', () => {
    assert.match(BENEFITS_TOUCH_SCROLL_BAR_GLOW, /^group-\[\.is-in-view\]/);
    assert.match(BENEFITS_DESKTOP_SCROLL_BAR_GLOW, /^max-md:group-\[\.is-in-view\]/);
  });

  it('computeBenefitsScrollActiveIndex picks one card when three overlap in viewport', () => {
    const viewH = 800;
    const cardH = 180;
    const gap = 20;
    const centerY = viewH / 2;

    const makeEl = (top: number) =>
      ({
        getBoundingClientRect: () => ({
          top,
          left: 16,
          width: 360,
          height: cardH,
          bottom: top + cardH,
          right: 376,
          x: 16,
          y: top,
          toJSON: () => ({}),
        }),
      }) as HTMLElement;

    const section = {
      getBoundingClientRect: () => ({
        top: centerY - cardH - gap,
        bottom: centerY + cardH + gap,
        left: 0,
        width: 400,
        height: 3 * cardH + 2 * gap,
        right: 400,
        x: 0,
        y: centerY - cardH - gap,
        toJSON: () => ({}),
      }),
    } as HTMLElement;

    const cards = new Map<number, HTMLElement>([
      [0, makeEl(centerY - cardH - gap)],
      [1, makeEl(centerY - cardH / 2)],
      [2, makeEl(centerY + gap)],
    ]);

    const active = computeBenefitsScrollActiveIndex(cards, section, 390, viewH);
    assert.equal(active, 1);
    assert.notEqual(active, 0);
    assert.notEqual(active, 2);
  });
});
