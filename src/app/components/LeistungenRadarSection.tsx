'use client';

import { useMemo } from 'react';
import {
  BrainCircuit,
  MessageSquareCode,
  BookMarked,
  Cpu,
  Server,
} from 'lucide-react';
import { useLayoutMode } from '@/hooks/useLayoutMode';
import { Radar, IconContainer } from '@/components/ui/radar-effect';

const ICON_BLUE = 'text-[#2c4f7c]';

/** Staggered delays spread over ~2s (SSR-safe). */
const ICON_ENTRANCE_DELAYS = [0.15, 0.55, 0.95, 1.28, 1.62];

const RADAR_ITEMS = [
  {
    text: 'RAG',
    icon: BrainCircuit,
    wideLabel: false,
    className:
      'left-[4%] top-[32%] max-sm:left-[5%] max-sm:top-[28%] sm:left-[2%] sm:top-[34%]',
  },
  {
    text: 'Prompt Engineering',
    icon: MessageSquareCode,
    wideLabel: true,
    className: 'left-1/2 top-[16%] -translate-x-1/2 max-sm:top-[4%] sm:top-[16%]',
  },
  {
    text: 'Knowledge Base',
    icon: BookMarked,
    wideLabel: true,
    className:
      'right-[4%] top-[32%] max-sm:right-[5%] max-sm:top-[28%] sm:right-[2%] sm:top-[34%]',
  },
  {
    text: 'LLM-Integration',
    icon: Cpu,
    wideLabel: true,
    className:
      'left-[22%] top-[50%] max-sm:left-[8%] max-sm:top-[54%] sm:left-[26%] sm:top-[48%]',
  },
  {
    text: 'Server Management',
    icon: Server,
    wideLabel: true,
    className:
      'right-[22%] top-[50%] max-sm:right-[8%] max-sm:top-[54%] sm:right-[26%] sm:top-[48%]',
  },
] as const;

export default function LeistungenRadarSection() {
  const delays = useMemo(() => ICON_ENTRANCE_DELAYS, []);
  const layoutMode = useLayoutMode();
  const compactFloat = layoutMode === 'mobile';

  return (
    <section className="relative z-0 overflow-hidden bg-background pt-20 lg:pt-28">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative mx-auto h-[28rem] w-full max-w-3xl max-sm:h-[30rem] sm:h-[26rem]">
          {RADAR_ITEMS.map((item, index) => {
            const Icon = item.icon;
            return (
              <IconContainer
                key={item.text}
                text={item.text}
                delay={delays[index]}
                floatPhase={index}
                compactFloat={compactFloat}
                wideLabel={item.wideLabel}
                className={item.className}
                icon={<Icon className={`h-6 w-6 sm:h-8 sm:w-8 ${ICON_BLUE}`} />}
              />
            );
          })}

          {/* Clip radar at baseline – no sweep visible below */}
          <div className="absolute inset-x-0 bottom-0 z-10 h-[72%] overflow-hidden">
            <Radar className="bottom-0" />
          </div>

          <div className="absolute bottom-0 z-20 h-px w-full bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
        </div>
      </div>

      {/* Solid overlap into next section – hides any radar bleed at bottom */}
      <div className="pointer-events-none relative z-20 -mb-px h-8 bg-background sm:h-10" aria-hidden />
    </section>
  );
}
