'use client';

import React, { useRef, type PointerEvent } from 'react';
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
  const tapStartRef = useRef<{ x: number; y: number } | null>(null);
  const { isActive, handleTap } = useServicesMobileGlowCard(glowIndex, cardRef);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    tapStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    const start = tapStartRef.current;
    tapStartRef.current = null;
    if (!start) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (dx * dx + dy * dy < 144) handleTap();
  };

  const onPointerCancel = () => {
    tapStartRef.current = null;
  };

  return (
    <div
      ref={cardRef}
      data-glow
      data-glow-mobile
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
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
