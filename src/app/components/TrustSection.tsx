'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';

const TRUST_TEXT =
  'WebWelle steht für professionelle Websites mit klarer Linie. Für viele Unternehmen ist es wichtig, online seriös aufzutreten, regional sichtbar zu werden und Anfragen ohne Umwege zu erleichtern. Genau darauf ist unsere Arbeit ausgerichtet: nachvollziehbar, persönlich und sauber umgesetzt.';

export default function TrustSection() {
  const [isMounted, setIsMounted] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!isMounted || !sectionRef.current) return;
    const panel = sectionRef.current.querySelector<HTMLElement>('[data-trust-panel]');
    if (!panel) return;

    let ctx: { revert: () => void } | null = null;

    import('gsap')
      .then(({ default: gsap }) => import('gsap/ScrollTrigger').then(({ ScrollTrigger }) => {
        gsap.registerPlugin(ScrollTrigger);
        ctx = gsap.context(() => {
          gsap.from(panel, {
            opacity: 0,
            y: 24,
            duration: 0.8,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: panel,
              start: 'top 88%',
              toggleActions: 'play none none none',
            },
          });
        }, sectionRef);
      }))
      .catch(() => undefined);

    return () => ctx?.revert();
  }, [isMounted]);

  return (
    <section
      ref={sectionRef}
      aria-label="Vertrauen bei WebWelle"
      className="relative py-16 md:py-20 bg-background overflow-hidden"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_50%,rgba(59,130,246,0.08),transparent)]"
        aria-hidden
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          data-trust-panel
          className="relative mx-auto max-w-4xl rounded-2xl border border-border/80 bg-card/60 backdrop-blur-md px-6 py-10 md:px-12 md:py-14 shadow-lg shadow-black/20"
        >
          <div
            className="absolute -top-px left-8 right-8 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent"
            aria-hidden
          />
          <div
            className="absolute left-6 top-6 text-5xl font-serif leading-none text-primary/20 select-none md:left-10 md:top-8 md:text-6xl"
            aria-hidden
          >
            „
          </div>

          <blockquote className="relative text-center">
            <p className="text-base md:text-lg lg:text-xl text-foreground/95 font-light leading-relaxed md:leading-8 tracking-tight">
              {TRUST_TEXT}
            </p>
          </blockquote>

          <div
            className="mt-8 flex items-center justify-center gap-3"
            aria-hidden
          >
            <span className="h-px w-12 bg-border" />
            <span className="h-1.5 w-1.5 rounded-full bg-primary/80" />
            <span className="h-px w-12 bg-border" />
          </div>
        </div>
      </div>
    </section>
  );
}
