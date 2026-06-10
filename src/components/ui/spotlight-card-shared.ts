import { useEffect, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';

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

export function getGlowSpotlightStyles(
  glowColor: GlowCardProps['glowColor'] = 'blueViolet',
  options?: {
    width?: string | number;
    height?: string | number;
    touchAction?: string;
    extras?: Record<string, string | number>;
  }
): CSSProperties {
  const { base, spread } = glowColorMap[glowColor ?? 'blueViolet'];

  const baseStyles: CSSProperties & Record<string, string | number> = {
    '--base': base,
    '--spread': spread,
    '--radius': '14',
    '--border': '3',
    '--backdrop': 'hsl(240 28% 16% / 0.18)',
    '--backup-border': 'var(--backdrop)',
    '--size': '200',
    '--outer': '1',
    '--bg-spot-opacity': '0.18',
    '--border-spot-opacity': '1',
    '--border-light-opacity': '1',
    '--saturation': '100',
    '--border-size': 'calc(var(--border, 2) * 1px)',
    '--spotlight-size': 'calc(var(--size, 150) * 1px)',
    '--hue': 'calc(var(--base) + (var(--xp, 0) * var(--spread, 0)))',
    backgroundImage: `radial-gradient(
        var(--spotlight-size) var(--spotlight-size) at
        calc(var(--x, 0) * 1px)
        calc(var(--y, 0) * 1px),
        hsl(var(--hue, 210) calc(var(--saturation, 100) * 1%) calc(var(--lightness, 70) * 1%) / var(--bg-spot-opacity, 0.1)), transparent
      )`,
    backgroundColor: 'var(--backdrop, transparent)',
    backgroundSize: 'calc(100% + (2 * var(--border-size))) calc(100% + (2 * var(--border-size)))',
    backgroundPosition: '50% 50%',
    backgroundAttachment: 'fixed',
    border: 'var(--border-size) solid var(--backup-border)',
    position: 'relative',
    touchAction: options?.touchAction ?? 'none',
    ...options?.extras,
  };

  if (options?.width !== undefined) {
    baseStyles.width = typeof options.width === 'number' ? `${options.width}px` : options.width;
  }
  if (options?.height !== undefined) {
    baseStyles.height = typeof options.height === 'number' ? `${options.height}px` : options.height;
  }

  return baseStyles;
}

export function syncGlowSpotlightToViewportCenter(el: HTMLElement) {
  const x = window.innerWidth / 2;
  const y = window.innerHeight / 2;
  el.style.setProperty('--x', x.toFixed(2));
  el.style.setProperty('--xp', (x / window.innerWidth).toFixed(2));
  el.style.setProperty('--y', y.toFixed(2));
  el.style.setProperty('--yp', (y / window.innerHeight).toFixed(2));
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
