"use client";

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { DollarSign, Calendar, Zap, Palette, Wrench, Users, Rocket, TrendingUp } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function Benefits() {
  const [isMounted, setIsMounted] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const benefits = [
    {
      icon: DollarSign,
      title: "Webdesign aus Kempten (Allgäu)",
      description: "Lokal verwurzelt, bundesweit erfolgreich – profitieren Sie von unserer Erfahrung in regionalem SEO und modernem Design."
    },
    {
      icon: Calendar,
      title: "Festpreis-Garantie",
      description: "Volle Kostentransparenz von Anfang an. Keine versteckten Gebühren, keine Überraschungen."
    },
    {
      icon: Zap,
      title: "Sichtbar auf Google",
      description: "Jede Website ist technisch SEO-optimiert, blitzschnell und mobil perfekt anpassbar."
    },
    {
      icon: Palette,
      title: "Individuelles Design",
      description: "Wir gestalten keine Standardseiten – Ihre Website ist ein Unikat, das Ihre Marke widerspiegelt."
    },
    {
      icon: Wrench,
      title: "KI & Automatisierung",
      description: "Nutzen Sie moderne Tools, um Anfragen, Buchungen und Abläufe intelligent zu automatisieren."
    },
    {
      icon: Users,
      title: "Persönliche Betreuung",
      description: "Direkter Ansprechpartner statt Hotline – transparente Kommunikation auf Augenhöhe."
    }
  ];

  useEffect(() => setIsMounted(true), []);

  // Auto-Scroll Marquee mit GSAP und ScrollTrigger Pause bei Hover/Sichtbarkeit
  useLayoutEffect(() => {
    if (!trackRef.current) return;
    const track = trackRef.current;

    // Dupliziere Slides für nahtlose Schleife
    const slides = Array.from(track.querySelectorAll<HTMLElement>('[data-slide]'));
    if (slides.length === 0) return;

    const totalWidth = slides.reduce((acc, el) => acc + el.offsetWidth, 0);
    // Falls Inhalt schmaler als Viewport, nicht animieren
    if (totalWidth <= (containerRef.current?.offsetWidth || 0)) return;

    const ctx = gsap.context(() => {
      const tween = gsap.to(track, {
        x: () => `-=${totalWidth}`,
        duration: Math.max(15, totalWidth / 100), // Schneller und kürzere Pause
        ease: 'none',
        repeat: -1,
        repeatDelay: 0, // Keine Pause zwischen Wiederholungen
      });

      // Pause bei Hover (nur auf Desktop)
      const handleMouseEnter = () => {
        if (window.innerWidth >= 768) { // Nur auf Desktop pausieren
          tween.pause();
        }
      };
      
      const handleMouseLeave = () => {
        if (window.innerWidth >= 768) { // Nur auf Desktop fortsetzen
          tween.resume();
        }
      };

      // Touch-Events für Mobile mit Swipe-Funktionalität
      let touchTimeout: NodeJS.Timeout | null = null;
      let touchStartX = 0;
      let currentX = 0;
      let isDragging = false;
      
      const handleTouchStart = (e: TouchEvent) => {
        tween.pause();
        touchStartX = e.touches[0].clientX;
        currentX = gsap.getProperty(track, "x") as number || 0;
        isDragging = true;
        
        // Clear existing timeout if any
        if (touchTimeout) {
          clearTimeout(touchTimeout);
        }
      };

      const handleTouchMove = (e: TouchEvent) => {
        if (!isDragging) return;
        
        const touchCurrentX = e.touches[0].clientX;
        const diff = touchCurrentX - touchStartX;
        
        // Update position
        gsap.set(track, { x: currentX + diff });
      };

      const handleTouchEnd = () => {
        isDragging = false;
        
        // Automatisch nach 3 Sekunden wieder starten
        touchTimeout = setTimeout(() => {
          if (tween.paused()) {
            tween.resume();
          }
        }, 3000);
      };

      track.addEventListener('mouseenter', handleMouseEnter);
      track.addEventListener('mouseleave', handleMouseLeave);
      track.addEventListener('touchstart', handleTouchStart);
      track.addEventListener('touchmove', handleTouchMove);
      track.addEventListener('touchend', handleTouchEnd);

      // Pause, wenn Bereich nicht im Viewport
      ScrollTrigger.create({
        trigger: containerRef.current,
        start: 'top bottom',
        end: 'bottom top',
        onEnter: () => tween.resume(),
        onEnterBack: () => tween.resume(),
        onLeave: () => tween.pause(),
        onLeaveBack: () => tween.pause(),
      });

      // Auf Mobile: Automatisch fortsetzen nach kurzer Pause
      const handleResize = () => {
        if (window.innerWidth < 768) {
          // Auf Mobile nach 3 Sekunden automatisch fortsetzen
          setTimeout(() => {
            if (tween.paused()) {
              tween.resume();
            }
          }, 3000);
        }
      };

      window.addEventListener('resize', handleResize);
      
      // Cleanup
      return () => {
        track.removeEventListener('mouseenter', handleMouseEnter);
        track.removeEventListener('mouseleave', handleMouseLeave);
        track.removeEventListener('touchstart', handleTouchStart);
        track.removeEventListener('touchmove', handleTouchMove);
        track.removeEventListener('touchend', handleTouchEnd);
        window.removeEventListener('resize', handleResize);
        if (touchTimeout) {
          clearTimeout(touchTimeout);
        }
      };
    }, trackRef);

    return () => ctx.revert();
  }, [isMounted]);

  // shadcn-ähnlicher Stil: Karte, Badge, Button
  return (
    <section id="vorteile" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 md:mb-12">
          <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700">
            <Zap className="h-3.5 w-3.5 text-yellow-500" /> Unsere Vorteile
          </span>
          <h2 className="mt-4 text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
            Webdesign, das Mehrwert bringt – sichtbar, schnell und bezahlbar
          </h2>
          <p className="mt-3 text-base md:text-lg text-gray-600 max-w-3xl mx-auto font-light leading-relaxed">
            Ihre Vorteile mit WebWelle
          </p>
        </div>

        {/* Horizontaler Slider */}
        <div ref={containerRef} className="relative overflow-hidden">
          {/* Soft Gradients links/rechts */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-white to-transparent" />

          {/* Track */}
          <div
            ref={trackRef}
            className="flex gap-4 md:gap-6 will-change-transform"
            aria-label="WebWelle Vorteile Slider"
          >
            {[...benefits, ...benefits].map((benefit, index) => {
              const IconComponent = benefit.icon;
              return (
                <article
                  key={`${benefit.title}-${index}`}
                  data-slide
                  className="shrink-0 w-[88%] sm:w-[60%] md:w-[45%] lg:w-[32%]"
                >
                  <div className="group h-full rounded-2xl border border-gray-200 bg-gray-50 p-5 md:p-6 shadow-sm transition-shadow hover:shadow-md">
                    <div className="flex items-start gap-4">
                      <div className="rounded-xl bg-white border border-gray-200 p-3 shadow-sm">
                        <IconComponent className="h-6 w-6 text-gray-800" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-base md:text-lg font-semibold text-gray-900 leading-snug">
                          {benefit.title}
                        </h3>
                        <p className="mt-1 text-sm md:text-base text-gray-600 font-light leading-relaxed">
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

        {/* Call to Action */}
        <div className="mt-14 md:mt-16 text-center">
          <div className="relative isolate inline-flex items-center justify-center rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white px-6 py-8 md:px-10 md:py-10">
            <div className="absolute -z-10 inset-0 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/0" />
            <div className="max-w-2xl">
              <h3 className="text-xl md:text-2xl font-bold text-gray-900">
                Bereit für Ihre Erfolgswelle?
              </h3>
              <p className="mt-2 md:mt-3 text-base md:text-lg text-gray-600">
                Lassen Sie uns gemeinsam Ihre digitale Präsenz auf das nächste Level bringen.
              </p>
              <a
                href="#cta"
                className="mt-5 inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm md:text-base font-semibold text-gray-900 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                Kostenloses Erstgespräch sichern
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
