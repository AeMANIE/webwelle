'use client';

import React, { useEffect, useRef } from 'react';
import './spotlight-card.css';
import {
  type GlowCardProps,
  getGlowCardLayoutClasses,
  getGlowSpotlightStyles,
  glowCardBaseClasses,
} from './spotlight-card-shared';

const DesktopGlowCard: React.FC<GlowCardProps> = ({
  children,
  className = '',
  glowColor = 'blueViolet',
  size = 'md',
  width,
  height,
  customSize = false,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const syncPointer = (e: PointerEvent) => {
      if (!cardRef.current) return;
      const { clientX: x, clientY: y } = e;
      cardRef.current.style.setProperty('--x', x.toFixed(2));
      cardRef.current.style.setProperty('--xp', (x / window.innerWidth).toFixed(2));
      cardRef.current.style.setProperty('--y', y.toFixed(2));
      cardRef.current.style.setProperty('--yp', (y / window.innerHeight).toFixed(2));
    };

    document.addEventListener('pointermove', syncPointer);
    return () => document.removeEventListener('pointermove', syncPointer);
  }, []);

  const coarsePointer =
    typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;

  return (
    <div
      ref={cardRef}
      data-glow
      style={getGlowSpotlightStyles(glowColor, {
        width,
        height,
        touchAction: coarsePointer ? 'pan-y' : 'none',
      })}
      className={`${getGlowCardLayoutClasses(customSize, size)} ${glowCardBaseClasses} ${className}`}
    >
      <div data-glow />
      {children}
    </div>
  );
};

export { DesktopGlowCard };
