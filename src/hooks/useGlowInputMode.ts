'use client';

import { useEffect, useState } from 'react';
import { readLayoutEnv, shouldUseTouchGlow } from '@/lib/responsive-layout-mode';

export function useGlowInputMode(): boolean | null {
  const [touchGlow, setTouchGlow] = useState<boolean | null>(null);

  useEffect(() => {
    const sync = () => {
      setTouchGlow(shouldUseTouchGlow(readLayoutEnv()));
    };

    sync();

    const coarseMq = window.matchMedia('(pointer: coarse)');
    const fineHoverMq = window.matchMedia('(hover: hover) and (pointer: fine)');

    const onChange = () => sync();

    window.addEventListener('resize', onChange);
    window.addEventListener('orientationchange', onChange);
    window.visualViewport?.addEventListener('resize', onChange);
    coarseMq.addEventListener('change', onChange);
    fineHoverMq.addEventListener('change', onChange);

    return () => {
      window.removeEventListener('resize', onChange);
      window.removeEventListener('orientationchange', onChange);
      window.visualViewport?.removeEventListener('resize', onChange);
      coarseMq.removeEventListener('change', onChange);
      fineHoverMq.removeEventListener('change', onChange);
    };
  }, []);

  return touchGlow;
}
