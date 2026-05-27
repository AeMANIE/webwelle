'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  useShinySweep,
  SHINY_SWEEP_PRESETS,
  type ShinySweepConfig,
} from '@/components/ui/shiny-motion';

interface ShinyPanelProps {
  children: React.ReactNode;
  className?: string;
  sweepConfig?: ShinySweepConfig;
}

/**
 * Dunkles Panel mit Shiny-Button-Optik: Radial-Glow, Raster, wandernder Lichtstreifen.
 */
export function ShinyPanel({
  children,
  className,
  sweepConfig = SHINY_SWEEP_PRESETS.panel,
}: ShinyPanelProps) {
  const { borderGradient, bgSweep } = useShinySweep(sweepConfig);

  return (
    <div
      className={cn(
        'relative isolate overflow-visible rounded-xl md:rounded-2xl',
        'border border-primary/25',
        'shadow-[0_8px_40px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.04)]',
        className
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit] z-0 bg-[#0a0e14]"
      >
      {/* Deckend dunkel – wie Shiny-Input */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(14,20,31,1) 0%, rgba(8,11,18,1) 55%, rgba(6,9,15,1) 100%)',
        }}
      />

      {/* Nur dezenter Akzent oben – bleibt insgesamt dunkel */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1] opacity-40"
        style={{
          background:
            'radial-gradient(ellipse 80% 45% at 50% 0%, rgba(59,130,246,0.14) 0%, transparent 65%)',
        }}
      />

      {/* Feines Punkt-Raster */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1] opacity-[0.06]"
        style={{
          backgroundImage:
            'radial-gradient(circle at center, rgba(147,197,253,0.7) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
        }}
      />

      {/* Diagonale Linien (sehr dezent) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1] opacity-[0.025]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(-12deg, transparent, transparent 40px, rgba(255,255,255,0.4) 40px, rgba(255,255,255,0.4) 41px)',
        }}
      />

      {/* Animierter Licht-Sweep – schwach auf dunklem Grund */}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[2] opacity-20"
        style={{ background: bgSweep }}
      />

      {/* Dezenter Glow unten rechts */}
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -right-24 h-48 w-48 rounded-full z-[1] opacity-[0.12] blur-3xl"
        style={{ background: 'rgba(59,130,246,0.5)' }}
      />

      {/* Animierter Rand-Glanz */}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[3] rounded-[inherit] p-[1px]"
        style={{
          background: borderGradient,
          WebkitMask:
            'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
        }}
      />
      </div>

      {/* Inhalt */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
