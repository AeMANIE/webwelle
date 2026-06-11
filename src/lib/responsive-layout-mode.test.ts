import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  computeLayoutMode,
  getServicesGridClass,
  shouldUseTouchGlow,
  type LayoutEnv,
} from './responsive-layout-mode';

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

describe('computeLayoutMode', () => {
  it('iPhone Max Portrait → mobile', () => {
    assert.equal(
      computeLayoutMode(env({ cssWidth: 430, cssHeight: 932 })),
      'mobile'
    );
  });

  it('iPhone Max Landscape → mobile', () => {
    assert.equal(
      computeLayoutMode(env({ cssWidth: 932, cssHeight: 430 })),
      'mobile'
    );
  });

  it('iPad mini Portrait → mobile', () => {
    assert.equal(
      computeLayoutMode(env({ cssWidth: 744, cssHeight: 1133 })),
      'mobile'
    );
  });

  it('iPad mini Landscape → mobile', () => {
    assert.equal(
      computeLayoutMode(env({ cssWidth: 1133, cssHeight: 744 })),
      'mobile'
    );
  });

  it('iPad Pro 12.9 Portrait → desktop', () => {
    assert.equal(
      computeLayoutMode(env({ cssWidth: 1024, cssHeight: 1366 })),
      'desktop'
    );
  });

  it('Desktop mouse + keyboard → desktop', () => {
    assert.equal(
      computeLayoutMode(
        env({
          cssWidth: 1440,
          cssHeight: 900,
          coarsePointer: false,
          fineHover: true,
        })
      ),
      'desktop'
    );
  });

  it('Fold spanning → mobile', () => {
    assert.equal(
      computeLayoutMode(
        env({
          cssWidth: 884,
          cssHeight: 1104,
          segmentCount: 2,
          supportsViewportSegments: true,
        })
      ),
      'mobile'
    );
  });

  it('Fold cover portrait → desktop', () => {
    assert.equal(
      computeLayoutMode(
        env({
          cssWidth: 412,
          cssHeight: 915,
          coarsePointer: true,
          supportsViewportSegments: true,
        })
      ),
      'desktop'
    );
  });

  it('iPhone portrait is not fold cover desktop', () => {
    assert.equal(
      computeLayoutMode(
        env({
          cssWidth: 393,
          cssHeight: 852,
          coarsePointer: true,
          supportsViewportSegments: true,
        })
      ),
      'mobile'
    );
  });
});

describe('shouldUseTouchGlow', () => {
  it('iPhone → touch glow', () => {
    assert.equal(
      shouldUseTouchGlow(env({ cssWidth: 430, cssHeight: 932 })),
      true
    );
  });

  it('iPad Pro coarse pointer → touch glow', () => {
    assert.equal(
      shouldUseTouchGlow(
        env({ cssWidth: 1024, cssHeight: 1366, coarsePointer: true, fineHover: false })
      ),
      true
    );
  });

  it('iPad Pro desktop layout still uses touch glow when coarse', () => {
    const tabletEnv = env({
      cssWidth: 1024,
      cssHeight: 1366,
      coarsePointer: true,
      fineHover: false,
    });
    assert.equal(computeLayoutMode(tabletEnv), 'desktop');
    assert.equal(shouldUseTouchGlow(tabletEnv), true);
  });

  it('Desktop mouse + keyboard → pointer glow', () => {
    assert.equal(
      shouldUseTouchGlow(
        env({
          cssWidth: 1440,
          cssHeight: 900,
          coarsePointer: false,
          fineHover: true,
        })
      ),
      false
    );
  });
});

describe('getServicesGridClass', () => {
  it('mobile mode → 1 column', () => {
    assert.equal(getServicesGridClass('mobile', 390), 'grid-cols-1');
  });

  it('desktop narrow fold cover → 1 column', () => {
    assert.equal(getServicesGridClass('desktop', 412), 'grid-cols-1');
  });

  it('desktop medium → 2 columns', () => {
    assert.equal(getServicesGridClass('desktop', 800), 'grid-cols-2');
  });

  it('desktop wide → 3 columns', () => {
    assert.equal(getServicesGridClass('desktop', 1280), 'grid-cols-3');
  });

  it('null layout mode → 1 column', () => {
    assert.equal(getServicesGridClass(null, 0), 'grid-cols-1');
  });
});
