'use client';

import React, { useEffect, useRef, useState, CSSProperties } from 'react';
import './spotlight-card-mobile.css';
import {
  type GlowCardProps,
  getGlowCardLayoutClasses,
  glowCardBaseClasses,
} from './spotlight-card-shared';

const MobileGlowCard: React.FC<GlowCardProps> = ({
  children,
  className = '',
  size = 'md',
  width,
  height,
  customSize = false,
  glowIndex = 0,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsActive(entry.isIntersecting);
      },
      {
        threshold: 0,
        rootMargin: '40px 0px 40px 0px',
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const getInlineStyles = (): CSSProperties => {
    const baseStyles: CSSProperties & Record<string, string | number> = {
      '--glow-index': glowIndex,
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
      data-glow-mobile
      style={getInlineStyles()}
      className={`${getGlowCardLayoutClasses(customSize, size)} ${glowCardBaseClasses} ${isActive ? 'is-active' : ''} ${className}`}
    >
      <div className="glow-mobile-orbit" aria-hidden>
        <div className="glow-mobile-orbit__spin" />
      </div>
      <div className="glow-mobile-shine" aria-hidden />
      {children}
    </div>
  );
};

export { MobileGlowCard };
