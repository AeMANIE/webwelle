'use client';

import { useEffect, useState } from 'react';
import {
  computeLayoutMode,
  readLayoutEnv,
  type LayoutMode,
} from '@/lib/responsive-layout-mode';

export function useLayoutMode(): LayoutMode | null {
  const [layoutMode, setLayoutMode] = useState<LayoutMode | null>(null);

  useEffect(() => {
    const sync = () => {
      const env = readLayoutEnv();
      setLayoutMode(computeLayoutMode(env));
    };

    sync();

    const coarseMq = window.matchMedia('(pointer: coarse)');
    const fineHoverMq = window.matchMedia('(hover: hover) and (pointer: fine)');
    const horizontalSegmentsMq = window.matchMedia('(horizontal-viewport-segments: 2)');
    const verticalSegmentsMq = window.matchMedia('(vertical-viewport-segments: 2)');

    const onChange = () => sync();

    window.addEventListener('resize', onChange);
    window.addEventListener('orientationchange', onChange);
    window.visualViewport?.addEventListener('resize', onChange);
    coarseMq.addEventListener('change', onChange);
    fineHoverMq.addEventListener('change', onChange);
    horizontalSegmentsMq.addEventListener('change', onChange);
    verticalSegmentsMq.addEventListener('change', onChange);

    const devicePosture =
      'devicePosture' in navigator
        ? (navigator as Navigator & { devicePosture?: EventTarget }).devicePosture
        : undefined;
    devicePosture?.addEventListener('change', onChange);

    return () => {
      window.removeEventListener('resize', onChange);
      window.removeEventListener('orientationchange', onChange);
      window.visualViewport?.removeEventListener('resize', onChange);
      coarseMq.removeEventListener('change', onChange);
      fineHoverMq.removeEventListener('change', onChange);
      horizontalSegmentsMq.removeEventListener('change', onChange);
      verticalSegmentsMq.removeEventListener('change', onChange);
      devicePosture?.removeEventListener('change', onChange);
    };
  }, []);

  return layoutMode;
}

export function useLayoutCssWidth(): number {
  const [cssWidth, setCssWidth] = useState(0);

  useEffect(() => {
    const sync = () => setCssWidth(window.innerWidth);
    sync();
    window.addEventListener('resize', sync);
    window.addEventListener('orientationchange', sync);
    return () => {
      window.removeEventListener('resize', sync);
      window.removeEventListener('orientationchange', sync);
    };
  }, []);

  return cssWidth;
}
