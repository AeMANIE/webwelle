'use client';

import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  useShinySweep,
  shinySurfaceClass,
  type ShinySweep,
  type ShinySweepConfig,
} from '@/components/ui/shiny-motion';

interface ShinyButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children: React.ReactNode;
  className?: string;
  /** Klassen für den Button-Text (z. B. text-orange-400) */
  labelClassName?: string;
  sweep?: ShinySweep;
  sweepConfig?: ShinySweepConfig;
}

export function ShinyButton({
  children,
  className,
  labelClassName,
  disabled,
  type = 'button',
  sweep: externalSweep,
  sweepConfig,
  ...props
}: ShinyButtonProps) {
  const internalSweep = useShinySweep({
    paused: Boolean(disabled),
    ...sweepConfig,
  });
  const { textMask, borderGradient, bgSweep } = externalSweep ?? internalSweep;

  return (
    <motion.button
      type={type}
      disabled={disabled}
      whileTap={disabled ? undefined : { scale: 0.96 }}
      whileHover={disabled ? undefined : { scale: 1.02 }}
      className={cn(
        shinySurfaceClass,
        'px-6 py-2.5 min-h-[44px] font-medium',
        'hover:shadow-[0_0_32px_rgba(59,130,246,0.45)]',
        'transition-shadow duration-300',
        'disabled:pointer-events-none disabled:opacity-50',
        className
      )}
      {...props}
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
        className={cn(
          'relative z-20 block text-sm font-semibold tracking-wide text-white',
          labelClassName
        )}
        style={{
          WebkitMaskImage: textMask,
          maskImage: textMask,
          WebkitMaskSize: '100% 100%',
          maskSize: '100% 100%',
        }}
      >
        {children}
      </motion.span>
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 opacity-70"
        style={{ background: bgSweep }}
      />
    </motion.button>
  );
}
