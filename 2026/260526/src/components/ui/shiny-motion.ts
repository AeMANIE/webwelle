'use client';

import { useEffect } from 'react';
import {
  useMotionTemplate,
  useMotionValue,
  animate,
  type MotionValue,
} from 'framer-motion';

export interface ShinySweep {
  x: MotionValue<string>;
  textMask: ReturnType<typeof useMotionTemplate>;
  borderGradient: ReturnType<typeof useMotionTemplate>;
  bgSweep: ReturnType<typeof useMotionTemplate>;
}

export interface ShinySweepConfig {
  paused?: boolean;
  /** 0–1: Startposition im Zyklus (Licht versetzt auf der Fläche) */
  phase?: number;
  /** Sekunden vor dem ersten Sweep */
  delay?: number;
  duration?: number;
  repeatDelay?: number;
}

/** Voreinstellungen für entkoppelte Hero-Elemente (Panel, Input, Button) */
export const SHINY_SWEEP_PRESETS = {
  panel: { phase: 0, delay: 0, duration: 2.2, repeatDelay: 1.3 },
  input: { phase: 0.32, delay: 0.35, duration: 1.45, repeatDelay: 0.85 },
  button: { phase: 0.68, delay: 0.7, duration: 1.25, repeatDelay: 1.05 },
} as const satisfies Record<string, ShinySweepConfig>;

function resolveShinySweepConfig(
  config: boolean | ShinySweepConfig | undefined
): Required<ShinySweepConfig> {
  const base =
    typeof config === 'boolean'
      ? { paused: config }
      : config ?? {};
  return {
    paused: base.paused ?? false,
    phase: base.phase ?? 0,
    delay: base.delay ?? 0,
    duration: base.duration ?? 1.4,
    repeatDelay: base.repeatDelay ?? 0.8,
  };
}

/** Wandernde Licht-Animation – pro Instanz eigene Timeline (phase/delay/duration) */
export function useShinySweep(
  config: boolean | ShinySweepConfig = false
): ShinySweep {
  const { paused, phase, delay, duration, repeatDelay } =
    resolveShinySweepConfig(config);
  const startX = 100 - phase * 200;
  const x = useMotionValue(`${startX}%`);

  useEffect(() => {
    if (paused) return;

    let controls: ReturnType<typeof animate> | undefined;
    const timer = window.setTimeout(() => {
      x.set(`${startX}%`);
      controls = animate(x, '-100%', {
        repeat: Infinity,
        repeatType: 'loop',
        repeatDelay,
        duration,
        ease: [0.4, 0, 0.2, 1],
      });
    }, delay * 1000);

    return () => {
      window.clearTimeout(timer);
      controls?.stop();
    };
  }, [x, paused, startX, delay, duration, repeatDelay]);

  const textMask = useMotionTemplate`linear-gradient(
    -75deg,
    #ffffff calc(${x} + 20%),
    rgba(255,255,255,0.12) calc(${x} + 28%),
    #93c5fd calc(${x} + 100%)
  )`;

  const borderGradient = useMotionTemplate`linear-gradient(
    -75deg,
    rgba(147,197,253,0.2) calc(${x} + 20%),
    rgba(255,255,255,0.9) calc(${x} + 25%),
    rgba(59,130,246,0.25) calc(${x} + 100%)
  )`;

  const bgSweep = useMotionTemplate`linear-gradient(
    105deg,
    transparent 40%,
    rgba(255,255,255,0.12) calc(${x}),
    transparent 60%
  )`;

  return { x, textMask, borderGradient, bgSweep };
}

export const shinySurfaceClass =
  'relative isolate overflow-hidden rounded-lg backdrop-blur-md ' +
  'bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.28)_0%,rgba(30,58,138,0.4)_45%,rgba(15,23,42,0.85)_100%)] ' +
  'border border-primary/35 shadow-[0_0_20px_rgba(59,130,246,0.2)]';

/** Dunkleres Feld für Texteingaben (Placeholder gut lesbar) */
export const shinyInputSurfaceClass =
  'relative isolate overflow-hidden rounded-lg ' +
  'bg-[#0a0e14] ' +
  'bg-[linear-gradient(180deg,rgba(14,20,31,0.97)_0%,rgba(8,11,18,1)_55%,rgba(6,9,15,1)_100%)] ' +
  'border border-primary/25 ' +
  'shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_0_16px_rgba(59,130,246,0.12)]';
