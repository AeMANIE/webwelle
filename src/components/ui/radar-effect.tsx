'use client';

import { motion, type HTMLMotionProps } from 'framer-motion';
import { twMerge } from 'tailwind-merge';
import type { ReactNode } from 'react';

const RADAR_CURVE_COLOR = '71, 85, 105';
const RADAR_CURVE_COUNT = 6;

export function curveOpacity(idx: number): number {
  if (idx === RADAR_CURVE_COUNT - 1) return 0.2;
  return 0.9 - idx * 0.12;
}

const RADAR_VIEW_WIDTH = 800;
const RADAR_VIEW_HEIGHT = 360;
const RADAR_CENTER_X = RADAR_VIEW_WIDTH / 2;
const RADAR_CENTER_Y = RADAR_VIEW_HEIGHT;
const RADAR_RADII = [55, 100, 145, 190, 235, 280];
/** Outer arc radius as share of viewBox width – sweep length must match. */
const RADAR_SWEEP_WIDTH_PERCENT = (RADAR_RADII[RADAR_RADII.length - 1] / RADAR_VIEW_WIDTH) * 100;

type RadarProps = {
  className?: string;
};

export function Radar({ className }: RadarProps) {
  return (
    <div
      className={twMerge(
        'pointer-events-none absolute inset-x-0 bottom-0 z-10 mx-auto w-full max-w-3xl',
        className
      )}
    >
      <style>{`
        @keyframes radar-spin {
          from { transform: rotate(180deg); }
          to   { transform: rotate(540deg); }
        }
        .animate-radar-spin {
          animation: radar-spin 10s linear infinite;
        }
      `}</style>

      <svg
        viewBox={`0 0 ${RADAR_VIEW_WIDTH} ${RADAR_VIEW_HEIGHT}`}
        className="h-auto w-full"
        preserveAspectRatio="xMidYMax meet"
        aria-hidden
      >
        {RADAR_RADII.map((radius, idx) => (
          <motion.path
            key={`arc-${idx}`}
            d={`M ${RADAR_CENTER_X - radius} ${RADAR_CENTER_Y} A ${radius} ${radius} 0 0 1 ${RADAR_CENTER_X + radius} ${RADAR_CENTER_Y}`}
            fill="none"
            stroke={`rgba(${RADAR_CURVE_COLOR}, ${curveOpacity(idx)})`}
            strokeWidth={idx === RADAR_CURVE_COUNT - 1 ? 1 : 1.25}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: idx * 0.08, duration: 0.35 }}
          />
        ))}
      </svg>

      <div
        className="animate-radar-spin absolute bottom-0 left-1/2 z-20 flex h-[3px] origin-left items-center"
        style={{ width: `${RADAR_SWEEP_WIDTH_PERCENT}%` }}
      >
        <div
          className="relative h-[1px] w-full rounded-full"
          style={{
            background:
              'linear-gradient(to right, transparent, rgba(102, 153, 255, 0.55), rgba(102, 153, 255, 0.75))',
            boxShadow:
              '0 0 5px 1px rgba(102, 153, 255, 0.3), 0 0 10px 2px rgba(102, 153, 255, 0.12)',
          }}
        />
      </div>
    </div>
  );
}

type IconContainerProps = {
  icon?: ReactNode;
  text?: string;
  delay?: number;
  className?: string;
  floatPhase?: number;
  compactFloat?: boolean;
  wideLabel?: boolean;
};

export function IconContainer({
  icon,
  text,
  delay = 0,
  className,
  floatPhase = 0,
  compactFloat = false,
  wideLabel = false,
}: IconContainerProps) {
  const floatDuration = 4.8 + floatPhase * 0.35;
  const floatDelay = delay + 0.85 + floatPhase * 0.18;
  const floatX = compactFloat ? 0 : 2;
  const floatY = compactFloat ? 4 : 5;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.82, y: 10, filter: 'blur(6px)' }}
      animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
      transition={{
        duration: 0.7,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={twMerge(
        'absolute z-30 flex flex-col items-center justify-center space-y-2',
        className
      )}
    >
      <motion.div
        className="flex flex-col items-center justify-center space-y-2"
        animate={{ y: [0, -floatY, 0, floatY - 1, 0], x: [0, floatX, 0, -floatX, 0] }}
        transition={{
          duration: floatDuration,
          delay: floatDelay,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-700 bg-slate-800 shadow-inner sm:h-12 sm:w-12">
          {icon ?? (
            <svg className="h-8 w-8 text-[#2c4f7c]" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>
        <div className="rounded-md px-1 py-0.5 sm:px-2 sm:py-1">
          <div
            className={twMerge(
              'text-center text-[10px] font-bold leading-tight text-white sm:whitespace-nowrap sm:text-xs',
              wideLabel ? 'max-w-[6.5rem] sm:max-w-none' : 'max-w-[4.75rem] sm:max-w-none'
            )}
          >
            {text}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/** @deprecated Kept for compatibility – radar now uses SVG arcs. */
export function Circle({ className, children, idx = 0, ...rest }: HTMLMotionProps<'div'> & { idx?: number }) {
  return (
    <motion.div
      {...rest}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: idx * 0.08, duration: 0.35 }}
      className={twMerge('pointer-events-none absolute rounded-full', className)}
    >
      {children}
    </motion.div>
  );
}
