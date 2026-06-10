'use client';

import type { FC } from 'react';
import { useMobileGlow, type GlowCardProps, glowCardBaseClasses, getGlowCardLayoutClasses } from './spotlight-card-shared';
import { DesktopGlowCard } from './spotlight-card-desktop';
import { MobileGlowCard } from './spotlight-card-mobile';

export type { GlowCardProps } from './spotlight-card-shared';

const GlowCardFallback: FC<GlowCardProps> = ({
  children,
  className = '',
  size = 'md',
  customSize = false,
}) => (
  <div
    className={`${getGlowCardLayoutClasses(customSize, size)} ${glowCardBaseClasses} ${className}`}
    style={{
      backgroundColor: 'hsl(240 28% 16% / 0.18)',
      border: '3px solid hsl(240 28% 16% / 0.18)',
      touchAction: 'pan-y',
    }}
  >
    {children}
  </div>
);

const GlowCard: FC<GlowCardProps> = (props) => {
  const isMobileGlow = useMobileGlow();

  if (isMobileGlow === null) {
    return <GlowCardFallback {...props} />;
  }

  return isMobileGlow ? <MobileGlowCard {...props} /> : <DesktopGlowCard {...props} />;
};

export { GlowCard };
