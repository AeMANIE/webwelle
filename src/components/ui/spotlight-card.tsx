'use client';

import type { FC } from 'react';
import { useFinePointer, type GlowCardProps } from './spotlight-card-shared';
import { DesktopGlowCard } from './spotlight-card-desktop';
import { MobileGlowCard } from './spotlight-card-mobile';

export type { GlowCardProps } from './spotlight-card-shared';

const GlowCard: FC<GlowCardProps> = (props) => {
  const isFinePointer = useFinePointer();
  return isFinePointer ? <DesktopGlowCard {...props} /> : <MobileGlowCard {...props} />;
};

export { GlowCard };
