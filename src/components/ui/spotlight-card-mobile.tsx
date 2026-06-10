'use client';

import React, { useRef } from 'react';
import './spotlight-card.css';
import './spotlight-card-mobile.css';
import { useServicesMobileGlowCard } from '@/app/components/ServicesMobileGlowContext';
import {
  type GlowCardProps,
  getGlowCardLayoutClasses,
  getGlowSpotlightStyles,
  glowCardBaseClasses,
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

  return (
    <div
      ref={cardRef}
      data-glow
      data-glow-mobile
      style={getGlowSpotlightStyles(glowColor, {
        width,
        height,
        touchAction: 'pan-y',
        forMobile: true,
        glowIndex,
        extras: { '--glow-index': glowIndex },
      })}
      className={`${getGlowCardLayoutClasses(customSize, size)} ${glowCardBaseClasses} ${isActive ? 'is-active' : ''} ${className}`}
    >
      <div className="glow-mobile-inner" aria-hidden />
      {children}
    </div>
  );
};

export { MobileGlowCard };
