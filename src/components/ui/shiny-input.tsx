'use client';

import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  useShinySweep,
  shinyInputSurfaceClass,
  type ShinySweep,
  type ShinySweepConfig,
} from '@/components/ui/shiny-motion';

interface ShinyInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Optional: externer Sweep (selten – sonst eigene Timeline) */
  sweep?: ShinySweep;
  /** Eigene Animations-Timeline (z. B. SHINY_SWEEP_PRESETS.input) */
  sweepConfig?: ShinySweepConfig;
  wrapperClassName?: string;
}

export const ShinyInput = forwardRef<HTMLInputElement, ShinyInputProps>(
  function ShinyInput(
    { className, wrapperClassName, disabled, sweep: externalSweep, sweepConfig, ...props },
    ref
  ) {
  const internalSweep = useShinySweep({
    paused: Boolean(disabled),
    ...sweepConfig,
  });
  const { borderGradient, bgSweep } = externalSweep ?? internalSweep;

  return (
    <div
      className={cn(
        shinyInputSurfaceClass,
        'flex-1 min-h-[44px] transition-shadow duration-300',
        'focus-within:border-primary/50 focus-within:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_24px_rgba(59,130,246,0.35)]',
        disabled && 'opacity-50 pointer-events-none',
        wrapperClassName,
        className
      )}
    >
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-0 z-10 rounded-[inherit] p-[1px]"
        style={{
          background: borderGradient,
          WebkitMask:
            'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
        }}
      />
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1] opacity-35"
        style={{ background: bgSweep }}
      />
      <input
        ref={ref}
        disabled={disabled}
        className={cn(
          'relative z-20 w-full min-h-[44px] bg-transparent px-4 py-2.5',
          'text-sm text-foreground placeholder:text-muted-foreground',
          'focus:outline-none focus:ring-0 border-0'
        )}
        {...props}
      />
    </div>
  );
  }
);
