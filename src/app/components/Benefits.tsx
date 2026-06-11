"use client";

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Search, Users, DollarSign } from 'lucide-react';
import type gsap from 'gsap';
import type { ScrollTrigger as ScrollTriggerType } from 'gsap/ScrollTrigger';

const TRUST_COPIES = 3;

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

function initMarquee(
  track: HTMLDivElement,
  container: HTMLDivElement | null,
  gsapLib: typeof gsap,
  ScrollTrigger: typeof ScrollTriggerType
): (() => void) | undefined {
  const loopWidth = measureTrackSetWidth(track, TRUST_COPIES);
  if (loopWidth <= 0) return undefined;

  let touchTimeout: ReturnType<typeof setTimeout> | null = null;

  const ctx = gsapLib.context(() => {
    gsapLib.set(track, { x: 0, force3D: true });

    const tween = gsapLib.to(track, {
      x: -loopWidth,
      duration: Math.max(18, loopWidth / 70),
      ease: 'none',
      repeat: -1,
      force3D: true,
    });

    const handleMouseEnter = () => {
      if (window.innerWidth >= 768) tween.pause();
    };
    const handleMouseLeave = () => {
      if (window.innerWidth >= 768) tween.play();
    };

    let touchStartX = 0;
    let currentX = 0;
    let isDragging = false;

    const handleTouchStart = (e: TouchEvent) => {
      tween.pause();
      touchStartX = e.touches[0].clientX;
      currentX = (gsapLib.getProperty(track, 'x') as number) || 0;
      isDragging = true;
      if (touchTimeout) clearTimeout(touchTimeout);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      gsapLib.set(track, { x: currentX + (e.touches[0].clientX - touchStartX) });
    };

    const handleTouchEnd = () => {
      isDragging = false;
      touchTimeout = setTimeout(() => {
        if (tween.paused()) tween.play();
      }, 3000);
    };

    track.addEventListener('mouseenter', handleMouseEnter);
    track.addEventListener('mouseleave', handleMouseLeave);
    track.addEventListener('touchstart', handleTouchStart, { passive: true });
    track.addEventListener('touchmove', handleTouchMove, { passive: true });
    track.addEventListener('touchend', handleTouchEnd);

    if (container) {
      ScrollTrigger.create({
        trigger: container,
        start: 'top bottom',
        end: 'bottom top',
        onEnter: () => tween.play(),
        onEnterBack: () => tween.play(),
        onLeave: () => tween.pause(),
        onLeaveBack: () => tween.pause(),
      });
    }

    tween.play();
    ScrollTrigger.refresh();
  }, track);

  return () => ctx.revert();
}

const trustItems = [
  'Persönlicher Ansprechpartner',
  'Transparente Abläufe',
  'Klare Preise',
  'Festpreis statt Überraschungen',
  'Auf Anfragen ausgerichtete Umsetzung',
];

const trustSlides = Array.from({ length: TRUST_COPIES }, () => trustItems).flat();

const benefits = [
  {
    icon: Search,
    step: '01',
    title: 'Mehr Sichtbarkeit vor Ort',
    description:
      'Wenn Sie mit Ihrer Website regional besser gefunden werden möchten, braucht es mehr als nur ein schönes Design. Wir erstellen Websites mit klarer Struktur und solider SEO-Basis, damit Sie bei Suchanfragen wie Webdesign Kempten, Webdesign Allgäu oder lokale SEO besser aufgestellt sind.',
  },
  {
    icon: Users,
    step: '02',
    title: 'Mehr Anfragen statt nur Besucher',
    description:
      'Eine professionelle Website sollte nicht nur gut aussehen, sondern gezielt zur Kontaktaufnahme führen. Deshalb richten wir Inhalte, Aufbau und Nutzerführung so aus, dass Vertrauen entsteht und Interessenten schneller den nächsten Schritt gehen.',
  },
  {
    icon: DollarSign,
    step: '03',
    title: 'Klar kalkulierbar und persönlich betreut',
    description:
      'Sie erhalten keine unübersichtlichen Prozesse und keine unnötige Komplexität. Stattdessen arbeiten wir mit klaren Abläufen, festen Ansprechpartnern und transparenten Preisen, damit Ihr Website-Projekt planbar und stressfreier wird.',
  },
];

export default function Benefits() {
  const sectionRef = useRef<HTMLElement>(null);
  const trustTrackRef = useRef<HTMLDivElement>(null);
  const trustContainerRef = useRef<HTMLDivElement>(null);
  const benefitsRef = useRef<HTMLDivElement>(null);
  const [gsapReady, setGsapReady] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setGsapReady(true);
          observer.disconnect();
        }
      },
      { rootMargin: '150px' }
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    if (!gsapReady) return;

    const track = trustTrackRef.current;
    const container = trustContainerRef.current;
    const scope = benefitsRef.current;
    if (!track) return;

    let marqueeCleanup: (() => void) | undefined;
    let cardsCleanup: (() => void) | undefined;
    let cancelled = false;

    const setup = async () => {
      const [{ default: gsapLib }, { ScrollTrigger }] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ]);

      if (cancelled) return;

      gsapLib.registerPlugin(ScrollTrigger);

      const startMarquee = () => {
        if (cancelled) return;
        marqueeCleanup = initMarquee(track, container, gsapLib, ScrollTrigger);
        ScrollTrigger.refresh();
      };

      if (document.fonts?.ready) {
        document.fonts.ready.then(startMarquee);
      } else {
        requestAnimationFrame(startMarquee);
      }

      if (!scope) return;

      const cards = scope.querySelectorAll<HTMLElement>('[data-benefit-card]');
      if (cards.length === 0) return;

      const ctx = gsapLib.context(() => {
        gsapLib.from(cards, {
          opacity: 0,
          y: 28,
          duration: 0.7,
          ease: 'power2.out',
          stagger: 0.15,
          immediateRender: false,
          force3D: true,
          scrollTrigger: {
            trigger: scope,
            start: 'top 85%',
            toggleActions: 'play none none none',
            once: true,
          },
        });

        cards.forEach((card) => {
          ScrollTrigger.create({
            trigger: card,
            start: 'top 80%',
            end: 'bottom 20%',
            onEnter: () => card.classList.add('is-in-view'),
            onEnterBack: () => card.classList.add('is-in-view'),
            onLeave: () => card.classList.remove('is-in-view'),
            onLeaveBack: () => card.classList.remove('is-in-view'),
          });
        });
      }, scope);

      ScrollTrigger.refresh();
      cardsCleanup = () => ctx.revert();
    };

    void setup();

    return () => {
      cancelled = true;
      marqueeCleanup?.();
      cardsCleanup?.();
    };
  }, [gsapReady]);

  return (
    <section ref={sectionRef} id="vorteile" className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div ref={trustContainerRef} className="relative overflow-hidden mb-10 md:mb-14">
          <div className="pointer-events-none absolute inset-y-0 left-0 w-16 md:w-24 bg-gradient-to-r from-background to-transparent z-10" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-16 md:w-24 bg-gradient-to-l from-background to-transparent z-10" />

          <div
            ref={trustTrackRef}
            className="flex w-max gap-2 md:gap-3 will-change-transform"
            aria-label="WebWelle Vertrauensleiste"
          >
            {trustSlides.map((item, index) => (
              <span
                key={`${item}-${index}`}
                data-slide
                className="inline-flex shrink-0 items-center rounded-full border border-border bg-card px-3 py-1.5 text-xs md:text-sm font-medium text-foreground whitespace-nowrap"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        <div ref={benefitsRef} className="max-w-4xl mx-auto space-y-5 md:space-y-6">
          {benefits.map((benefit, index) => {
            const IconComponent = benefit.icon;
            const isAccent = index === 1;

            return (
              <article
                key={benefit.title}
                data-benefit-card
                className="group relative"
              >
                <div
                  className={[
                    'relative overflow-hidden rounded-2xl border bg-card/90 backdrop-blur-sm',
                    'transition-all duration-300',
                    'max-md:group-[.is-in-view]:border-primary/40 max-md:group-[.is-in-view]:shadow-lg max-md:group-[.is-in-view]:shadow-primary/5',
                    'md:hover:border-primary/40 md:hover:shadow-lg md:hover:shadow-primary/5',
                    isAccent
                      ? 'border-primary/25 bg-gradient-to-br from-card via-card to-primary/10'
                      : 'border-border',
                  ].join(' ')}
                >
                  <div
                    className="absolute left-0 top-0 h-full w-1 bg-primary/80 transition-all duration-300 max-md:group-[.is-in-view]:w-1.5 max-md:group-[.is-in-view]:bg-primary md:group-hover:w-1.5 md:group-hover:bg-primary"
                    aria-hidden
                  />

                  <div className="flex flex-col gap-5 p-6 md:flex-row md:items-start md:gap-8 md:p-8 lg:p-10">
                    <div className="flex shrink-0 items-center gap-4 md:flex-col md:items-start md:gap-3">
                      <span className="text-xs font-semibold tracking-[0.2em] text-primary/70">
                        {benefit.step}
                      </span>
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 transition-transform duration-300 max-md:group-[.is-in-view]:scale-105 md:group-hover:scale-105 md:h-14 md:w-14">
                        <IconComponent className="h-6 w-6 text-primary md:h-7 md:w-7" />
                      </div>
                    </div>

                    <div className="min-w-0 flex-1 border-t border-border/60 pt-5 md:border-t-0 md:border-l md:pl-8 md:pt-0">
                      <h2 className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">
                        {benefit.title}
                      </h2>
                      <p className="mt-3 text-sm leading-relaxed text-muted-foreground font-light md:text-base md:leading-7">
                        {benefit.description}
                      </p>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
