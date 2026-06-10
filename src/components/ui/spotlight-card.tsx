'use client';

import React, { useEffect, useRef, ReactNode, CSSProperties, useState } from 'react';
import './spotlight-card.css';

interface GlowCardProps {
  children: ReactNode;
  className?: string;
  glowColor?: 'blue' | 'purple' | 'green' | 'red' | 'orange' | 'blueViolet';
  size?: 'sm' | 'md' | 'lg';
  width?: string | number;
  height?: string | number;
  customSize?: boolean;
}

const glowColorMap = {
  blue: { base: 220, spread: 200 },
  purple: { base: 280, spread: 300 },
  green: { base: 120, spread: 200 },
  red: { base: 0, spread: 200 },
  orange: { base: 30, spread: 200 },
  blueViolet: { base: 220, spread: 70 },
};

const sizeMap = {
  sm: 'w-48 h-64',
  md: 'w-64 h-80',
  lg: 'w-80 h-96',
};

const FINE_POINTER_QUERY = '(hover: hover) and (pointer: fine)';

const GlowCard: React.FC<GlowCardProps> = ({
  children,
  className = '',
  glowColor = 'blueViolet',
  size = 'md',
  width,
  height,
  customSize = false,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isFinePointer, setIsFinePointer] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.matchMedia(FINE_POINTER_QUERY).matches;
  });

  useEffect(() => {
    const mq = window.matchMedia(FINE_POINTER_QUERY);
    const update = () => setIsFinePointer(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const syncCoords = (x: number, y: number) => {
      if (!cardRef.current) return;
      cardRef.current.style.setProperty('--x', x.toFixed(2));
      cardRef.current.style.setProperty('--xp', (x / window.innerWidth).toFixed(2));
      cardRef.current.style.setProperty('--y', y.toFixed(2));
      cardRef.current.style.setProperty('--yp', (y / window.innerHeight).toFixed(2));
    };

    const syncPointer = (e: PointerEvent) => {
      syncCoords(e.clientX, e.clientY);
    };

    const syncTouch = (e: TouchEvent) => {
      if (e.touches.length === 0) return;
      syncCoords(e.touches[0].clientX, e.touches[0].clientY);
    };

    document.addEventListener('pointermove', syncPointer);
    document.addEventListener('touchmove', syncTouch, { passive: true });
    return () => {
      document.removeEventListener('pointermove', syncPointer);
      document.removeEventListener('touchmove', syncTouch);
    };
  }, []);

  const { base, spread } = glowColorMap[glowColor];

  const getSizeClasses = () => {
    if (customSize) {
      return '';
    }
    return sizeMap[size];
  };

  const getInlineStyles = (): CSSProperties => {
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
      backgroundAttachment: isFinePointer ? 'fixed' : 'scroll',
      border: 'var(--border-size) solid var(--backup-border)',
      position: 'relative',
      touchAction: isFinePointer ? 'none' : 'pan-y',
    };

    if (width !== undefined) {
      baseStyles.width = typeof width === 'number' ? `${width}px` : width;
    }
    if (height !== undefined) {
      baseStyles.height = typeof height === 'number' ? `${height}px` : height;
    }

    return baseStyles;
  };

  return (
    <div
      ref={cardRef}
      data-glow
      style={getInlineStyles()}
      className={`
          ${getSizeClasses()}
          ${!customSize ? 'aspect-[3/4]' : ''}
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
          ${className}
        `}
    >
      <div data-glow />
      {children}
    </div>
  );
};

export { GlowCard };
