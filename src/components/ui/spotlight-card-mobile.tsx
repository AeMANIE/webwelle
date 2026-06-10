'use client';

import React, { useEffect, useRef } from 'react';
import './spotlight-card.css';
import './spotlight-card-mobile.css';
import { useServicesMobileGlowCard } from '@/app/components/ServicesMobileGlowContext';
import {
  type GlowCardProps,
  getGlowCardLayoutClasses,
  getGlowSpotlightStyles,
  glowCardBaseClasses,
  syncGlowSpotlightToViewportCenter,
} from './spotlight-card-shared';

const MobileGlowCard: React.FC<GlowCardProps> = ({
  children,
  className = '',
  glowColor = 'blueViolet',
  size = 'md',
  width,
  height,
  customSize = false,
  glowIndex = 0,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const isActive = useServicesMobileGlowCard(glowIndex, cardRef);

  useEffect(() => {
    if (!isActive || !cardRef.current) return;

    const el = cardRef.current;
    const sync = () => syncGlowSpotlightToViewportCenter(el);

    sync();
    window.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync, { passive: true });

    return () => {
      window.removeEventListener('scroll', sync);
      window.removeEventListener('resize', sync);
    };
  }, [isActive]);

  return (
    <div
      ref={cardRef}
      data-glow
      data-glow-mobile
      style={getGlowSpotlightStyles(glowColor, {
        width,
        height,
        touchAction: 'pan-y',
        extras: { '--glow-index': glowIndex },
      })}
      className={`${getGlowCardLayoutClasses(customSize, size)} ${glowCardBaseClasses} ${isActive ? 'is-active' : ''} ${className}`}
    >
      <div data-glow aria-hidden />
      {children}
    </div>
  );
};

export { MobileGlowCard };
