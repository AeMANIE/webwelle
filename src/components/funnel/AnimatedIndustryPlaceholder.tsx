'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';

export const INDUSTRY_PLACEHOLDER_EXAMPLES = [
  'Handwerksbetriebe',
  'Gebäudereinigung',
  'Hausmeisterservices',
  'Maler, Elektriker, Installateure',
  'Rechtsanwälte und Kanzleien',
  'Steuerberater und Buchhaltungsbüros',
  'Immobilienmakler',
  'Pflegedienste und Betreuung',
  'Arztpraxen und Heilberufe',
  'Fahrschulen',
  'Sicherheitsdienste',
  'Unternehmensberatungen',
  'Event- und Veranstaltungsfirmen',
  'Transporteure, Umzugsfirmen und Logistikdienste',
] as const;

const MARQUEE_COPIES = 2;

function measureTrackSetWidth(track: HTMLDivElement, copies: number): number {
  const slides = Array.from(track.querySelectorAll<HTMLElement>('[data-slide]'));
  if (slides.length === 0) return 0;

  const style = getComputedStyle(track);
  const gap = parseFloat(style.columnGap || style.gap || '0') || 0;
  const perSet = slides.length / copies;

  let width = 0;
  for (let i = 0; i < perSet; i += 1) {
    width += slides[i].getBoundingClientRect().width;
    if (i < perSet - 1) width += gap;
  }
  return width;
}

const marqueeSlides = Array.from({ length: MARQUEE_COPIES }, () =>
  [...INDUSTRY_PLACEHOLDER_EXAMPLES]
).flat();

export default function AnimatedIndustryPlaceholder() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [reduceMotion, setReduceMotion] = useState(false);

  useLayoutEffect(() => {
    setReduceMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  useLayoutEffect(() => {
    if (reduceMotion) return;

    const track = trackRef.current;
    if (!track) return;

    let cleanup: (() => void) | undefined;
    let cancelled = false;

    const setup = () => {
      if (cancelled) return;

      const loopWidth = measureTrackSetWidth(track, MARQUEE_COPIES);
      if (loopWidth <= 0) return;

      const ctx = gsap.context(() => {
        gsap.set(track, { x: 0, force3D: true });

        gsap.to(track, {
          x: -loopWidth,
          duration: Math.max(14, loopWidth / 55),
          ease: 'none',
          repeat: -1,
          force3D: true,
        });
      }, track);

      cleanup = () => ctx.revert();
    };

    if (document.fonts?.ready) {
      document.fonts.ready.then(setup);
    } else {
      requestAnimationFrame(setup);
    }

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [reduceMotion]);

  return (
    <span
      className="flex min-w-0 w-full items-center gap-1.5 text-sm text-muted-foreground"
      aria-hidden
    >
      <span className="shrink-0">Ihre Branche:</span>
      <span className="relative min-w-0 flex-1 overflow-hidden">
        <span className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-[#0a0e14] to-transparent" />
        {reduceMotion ? (
          <span className="block truncate pr-2">
            {INDUSTRY_PLACEHOLDER_EXAMPLES.slice(0, 3).join(' · ')} …
          </span>
        ) : (
          <div
            ref={trackRef}
            className="flex w-max items-center gap-3 will-change-transform pr-4"
          >
            {marqueeSlides.map((item, index) => (
              <span
                key={`${item}-${index}`}
                data-slide
                className="inline-flex shrink-0 items-center gap-3 whitespace-nowrap"
              >
                <span>{item}</span>
                <span className="text-muted-foreground/35" aria-hidden>
                  ·
                </span>
              </span>
            ))}
          </div>
        )}
      </span>
    </span>
  );
}
