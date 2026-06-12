import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  shouldAutoAnimateWaveOnScroll,
  shouldUseDesktopWorkflowTimeline,
} from './wave-path-auto-animate';
import type { LayoutEnv } from './responsive-layout-mode';

function env(overrides: Partial<LayoutEnv>): LayoutEnv {
  return {
    cssWidth: 390,
    cssHeight: 844,
    coarsePointer: true,
    fineHover: false,
    segmentCount: 1,
    supportsViewportSegments: false,
    ...overrides,
  };
}

describe('shouldAutoAnimateWaveOnScroll', () => {
  it('iPhone → no scroll auto (uses explicit prop)', () => {
    assert.equal(shouldAutoAnimateWaveOnScroll(env({ cssWidth: 430, cssHeight: 932 })), false);
  });

  it('iPad Pro coarse → scroll auto', () => {
    assert.equal(
      shouldAutoAnimateWaveOnScroll(
        env({ cssWidth: 1024, cssHeight: 1366, coarsePointer: true, fineHover: false }),
      ),
      true,
    );
  });

  it('touch laptop without hover → scroll auto', () => {
    assert.equal(
      shouldAutoAnimateWaveOnScroll(
        env({
          cssWidth: 1440,
          cssHeight: 900,
          coarsePointer: false,
          fineHover: false,
        }),
      ),
      true,
    );
  });

  it('desktop mouse → no scroll auto', () => {
    assert.equal(
      shouldAutoAnimateWaveOnScroll(
        env({
          cssWidth: 1440,
          cssHeight: 900,
          coarsePointer: false,
          fineHover: true,
        }),
      ),
      false,
    );
  });
});

describe('shouldUseDesktopWorkflowTimeline', () => {
  it('narrow viewport → mobile timeline', () => {
    assert.equal(shouldUseDesktopWorkflowTimeline(800, false), false);
  });

  it('wide + desktop mouse → desktop timeline', () => {
    assert.equal(shouldUseDesktopWorkflowTimeline(1280, false), true);
  });

  it('wide + touch tablet → mobile timeline', () => {
    assert.equal(shouldUseDesktopWorkflowTimeline(1280, true), false);
  });

  it('SSR null touchGlow on wide → desktop timeline', () => {
    assert.equal(shouldUseDesktopWorkflowTimeline(1280, null), true);
  });
});
