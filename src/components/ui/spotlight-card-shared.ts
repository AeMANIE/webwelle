import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';

export interface GlowCardProps {
  children: ReactNode;
  className?: string;
  glowColor?: 'blue' | 'purple' | 'green' | 'red' | 'orange' | 'blueViolet';
  size?: 'sm' | 'md' | 'lg';
  width?: string | number;
  height?: string | number;
  customSize?: boolean;
  glowIndex?: number;
}

export const glowColorMap = {
  blue: { base: 220, spread: 200 },
  purple: { base: 280, spread: 300 },
  green: { base: 120, spread: 200 },
  red: { base: 0, spread: 200 },
  orange: { base: 30, spread: 200 },
  blueViolet: { base: 220, spread: 70 },
};

export const sizeMap = {
  sm: 'w-48 h-64',
  md: 'w-64 h-80',
  lg: 'w-80 h-96',
};

/** Desktop: Maus-Spotlight. Alles andere → Mobile-Glow. */
export const MOBILE_GLOW_QUERY = '(hover: none), (pointer: coarse), (max-width: 767px)';

export function useMobileGlow() {
  const [isMobileGlow, setIsMobileGlow] = useState<boolean | null>(null);

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_GLOW_QUERY);
    const update = () => setIsMobileGlow(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return isMobileGlow;
}

export function getGlowCardLayoutClasses(customSize: boolean, size: GlowCardProps['size']) {
  const sizeClasses = customSize ? '' : sizeMap[size ?? 'md'];
  const aspectClass = !customSize ? 'aspect-[3/4]' : '';
  return `${sizeClasses} ${aspectClass}`.trim();
}

export const glowCardBaseClasses = `
  rounded-2xl
  relative
  isolate
  overflow-visible
  grid
  grid-rows-[1fr_auto]
  shadow-[0_1rem_2rem_-1rem_black]
  p-4
  gap-4
  backdrop-blur-[5px]
`;
