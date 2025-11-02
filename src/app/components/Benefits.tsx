"use client";

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { DollarSign, Calendar, Zap, Palette, Wrench, Users } from 'lucide-react';

// Lazy load GSAP - wird nur für Animationen benötigt (spart ~180KB initial)
let gsapLoaded = false;
let gsap: typeof import('gsap').default;
let ScrollTrigger: typeof import('gsap/ScrollTrigger').ScrollTrigger;

async function loadGSAP() {
  if (gsapLoaded) return;
  
  const [{ default: gsapLib }, { ScrollTrigger: ScrollTriggerLib }] = await Promise.all([
    import('gsap'),
    import('gsap/ScrollTrigger')
  ]);
  
  gsap = gsapLib;
  ScrollTrigger = ScrollTriggerLib;
  gsap.registerPlugin(ScrollTrigger);
  gsapLoaded = true;
}

export default function Benefits() {
  const [isMounted, setIsMounted] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const performanceRef = useRef<HTMLDivElement>(null);
  const accessibilityRef = useRef<HTMLDivElement>(null);
  const bestPracticesRef = useRef<HTMLDivElement>(null);
  const seoRef = useRef<HTMLDivElement>(null);
  const performanceScoreRef = useRef<HTMLDivElement>(null);
  const accessibilityScoreRef = useRef<HTMLDivElement>(null);
  const bestPracticesScoreRef = useRef<HTMLDivElement>(null);
  const seoScoreRef = useRef<HTMLDivElement>(null);
  const hasAnimatedRef = useRef(false);

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

  useEffect(() => {
    setIsMounted(true);
    
    // Reset Animation State wenn Seite verlassen wird
    const handleBeforeUnload = () => {
      hasAnimatedRef.current = false;
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Auto-Scroll Marquee mit GSAP und ScrollTrigger Pause bei Hover/Sichtbarkeit
  useLayoutEffect(() => {
    if (!trackRef.current || !isMounted) return;
    const track = trackRef.current;

    // Lade GSAP asynchron (spart initial bundle size)
    loadGSAP().then(() => {
      // Dupliziere Slides für nahtlose Schleife
      const slides = Array.from(track.querySelectorAll<HTMLElement>('[data-slide]'));
      if (slides.length === 0) return;

      // Verwende requestAnimationFrame um Forced Reflow zu vermeiden
      // Batch alle DOM reads zusammen
      let ctx: ReturnType<typeof gsap.context> | null = null;
      
      requestAnimationFrame(() => {
        const totalWidth = slides.reduce((acc, el) => {
          // getBoundingClientRect() ist besser als offsetWidth für Reflow-Performance
          return acc + el.getBoundingClientRect().width;
        }, 0);
        const containerWidth = containerRef.current?.getBoundingClientRect().width || 0;
        
        // Falls Inhalt schmaler als Viewport, nicht animieren
        if (totalWidth <= containerWidth) return;

        if (!gsap) return;

        ctx = gsap.context(() => {
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
      // Debounce resize handler um Forced Reflows zu reduzieren
      let resizeTimeout: NodeJS.Timeout;
      const handleResize = () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          if (window.innerWidth < 768) {
            // Auf Mobile nach 3 Sekunden automatisch fortsetzen
            setTimeout(() => {
              if (tween.paused()) {
                tween.resume();
              }
            }, 3000);
          }
        }, 150); // Debounce 150ms
      };

      window.addEventListener('resize', handleResize, { passive: true });
      
      // Cleanup innerhalb von gsap.context
      return () => {
        window.removeEventListener('resize', handleResize);
        if (resizeTimeout) {
          clearTimeout(resizeTimeout);
        }
      };
      }, trackRef);
      }); // Ende requestAnimationFrame
      
      // Cleanup für GSAP Context (wird nach Promise ausgeführt)
      return () => {
        if (ctx) {
          ctx.revert();
        }
      };
    }); // Ende loadGSAP

    return () => {
      // Cleanup wird in loadGSAP Promise gemacht
    };
  }, [isMounted]);

  // Performance Bars Animation - Optimiert für bessere Performance
  useLayoutEffect(() => {
    if (!isMounted || hasAnimatedRef.current) return;

    let ctx: ReturnType<typeof gsap.context> | null = null;

    // Lade GSAP und animiere dann
    loadGSAP().then(() => {
      if (!gsap || hasAnimatedRef.current) return;

      // Verwende requestAnimationFrame für bessere Performance
      ctx = gsap.context(() => {
        // Performance Bar Animation - mit will-change für GPU-Beschleunigung
        if (performanceRef.current && performanceScoreRef.current) {
          performanceRef.current.style.willChange = 'width';
          performanceScoreRef.current.style.willChange = 'contents';
          
          gsap.fromTo(performanceRef.current,
            { width: '0%' },
            {
              width: '92%',
              duration: 2.5,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: performanceRef.current,
                start: 'top 80%',
                end: 'bottom 20%',
                toggleActions: 'play none none none',
                onRefresh: () => {
                  // Verhindere Reflows während der Animation
                  performanceRef.current!.style.transform = 'translateZ(0)';
                }
              },
              onComplete: () => {
                hasAnimatedRef.current = true;
                performanceRef.current!.style.willChange = 'auto';
              }
            }
          );

          // Performance Score Animation
          gsap.fromTo(performanceScoreRef.current,
            { innerText: 0 },
            {
              innerText: 92,
              duration: 2.5,
              ease: 'power2.out',
              snap: { innerText: 1 },
              scrollTrigger: {
                trigger: performanceRef.current,
                start: 'top 80%',
                end: 'bottom 20%',
                toggleActions: 'play none none none'
              },
              onComplete: () => {
                performanceScoreRef.current!.style.willChange = 'auto';
              }
            }
          );
        }

        // Accessibility Bar Animation
        if (accessibilityRef.current && accessibilityScoreRef.current) {
          accessibilityRef.current.style.willChange = 'width';
          accessibilityScoreRef.current.style.willChange = 'contents';
          
          gsap.fromTo(accessibilityRef.current,
            { width: '0%' },
            {
              width: '95%',
              duration: 2.5,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: accessibilityRef.current,
                start: 'top 80%',
                end: 'bottom 20%',
                toggleActions: 'play none none none',
                onRefresh: () => {
                  accessibilityRef.current!.style.transform = 'translateZ(0)';
                }
              },
              onComplete: () => {
                accessibilityRef.current!.style.willChange = 'auto';
              }
            }
          );

          gsap.fromTo(accessibilityScoreRef.current,
            { innerText: 0 },
            {
              innerText: 95,
              duration: 2.5,
              ease: 'power2.out',
              snap: { innerText: 1 },
              scrollTrigger: {
                trigger: accessibilityRef.current,
                start: 'top 80%',
                end: 'bottom 20%',
                toggleActions: 'play none none none'
              },
              onComplete: () => {
                accessibilityScoreRef.current!.style.willChange = 'auto';
              }
            }
          );
        }

        // Best Practices Bar Animation
        if (bestPracticesRef.current && bestPracticesScoreRef.current) {
          bestPracticesRef.current.style.willChange = 'width';
          bestPracticesScoreRef.current.style.willChange = 'contents';
          
          gsap.fromTo(bestPracticesRef.current,
            { width: '0%' },
            {
              width: '100%',
              duration: 2.5,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: bestPracticesRef.current,
                start: 'top 80%',
                end: 'bottom 20%',
                toggleActions: 'play none none none',
                onRefresh: () => {
                  bestPracticesRef.current!.style.transform = 'translateZ(0)';
                }
              },
              onComplete: () => {
                bestPracticesRef.current!.style.willChange = 'auto';
              }
            }
          );

          gsap.fromTo(bestPracticesScoreRef.current,
            { innerText: 0 },
            {
              innerText: 100,
              duration: 2.5,
              ease: 'power2.out',
              snap: { innerText: 1 },
              scrollTrigger: {
                trigger: bestPracticesRef.current,
                start: 'top 80%',
                end: 'bottom 20%',
                toggleActions: 'play none none none'
              },
              onComplete: () => {
                bestPracticesScoreRef.current!.style.willChange = 'auto';
              }
            }
          );
        }

        // SEO Bar Animation
        if (seoRef.current && seoScoreRef.current) {
          seoRef.current.style.willChange = 'width';
          seoScoreRef.current.style.willChange = 'contents';
          
          gsap.fromTo(seoRef.current,
            { width: '0%' },
            {
              width: '100%',
              duration: 2.5,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: seoRef.current,
                start: 'top 80%',
                end: 'bottom 20%',
                toggleActions: 'play none none none',
                onRefresh: () => {
                  seoRef.current!.style.transform = 'translateZ(0)';
                }
              },
              onComplete: () => {
                seoRef.current!.style.willChange = 'auto';
              }
            }
          );

          gsap.fromTo(seoScoreRef.current,
            { innerText: 0 },
            {
              innerText: 100,
              duration: 2.5,
              ease: 'power2.out',
              snap: { innerText: 1 },
              scrollTrigger: {
                trigger: seoRef.current,
                start: 'top 80%',
                end: 'bottom 20%',
                toggleActions: 'play none none none'
              },
              onComplete: () => {
                seoScoreRef.current!.style.willChange = 'auto';
              }
            }
          );
        }
      });
    });

    // Cleanup
    return () => {
      if (ctx) {
        ctx.revert();
      }
    };
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

        {/* Performance Monitoring Dashboard */}
        <div className="mt-14 md:mt-16">
          <div className="text-center mb-8">
            <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-1 text-xs font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-200">
              <Zap className="h-3.5 w-3.5 text-white" /> Performance Monitoring
            </span>
            <h3 className="mt-4 text-2xl md:text-3xl font-bold text-gray-900">
              Optimale Performance garantiert
            </h3>
            <p className="mt-2 text-base text-gray-600">
              Unsere Websites erreichen Bestwerte bei Google PageSpeed Insights
            </p>
          </div>

          {/* Performance Scores */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {/* Performance Score */}
            <div className="relative">
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-700">Performance</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600" ref={performanceScoreRef}>0</div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div ref={performanceRef} className="bg-green-500 h-2 rounded-full"></div>
                </div>
                <p className="text-xs text-gray-600 mt-2">Excellent</p>
              </div>
            </div>

            {/* Accessibility Score */}
            <div className="relative">
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-700">Accessibility</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600" ref={accessibilityScoreRef}>0</div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div ref={accessibilityRef} className="bg-green-500 h-2 rounded-full"></div>
                </div>
                <p className="text-xs text-gray-600 mt-2">Perfect</p>
              </div>
            </div>

            {/* Best Practices Score */}
            <div className="relative">
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-700">Best Practices</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600" ref={bestPracticesScoreRef}>0</div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div ref={bestPracticesRef} className="bg-green-500 h-2 rounded-full"></div>
                </div>
                <p className="text-xs text-gray-600 mt-2">Perfect</p>
              </div>
            </div>

            {/* SEO Score */}
            <div className="relative">
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-700">SEO</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600" ref={seoScoreRef}>0</div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div ref={seoRef} className="bg-green-500 h-2 rounded-full"></div>
                </div>
                <p className="text-xs text-gray-600 mt-2">Perfect</p>
              </div>
            </div>
          </div>

          {/* Performance Details */}
          <div className="mt-8 max-w-3xl mx-auto">
            <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">Performance Monitoring</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold text-gray-900">1.2s</div>
                  <div className="text-xs text-gray-600">First Contentful Paint</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-gray-900">2.1s</div>
                  <div className="text-xs text-gray-600">Largest Contentful Paint</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-gray-900">0.05s</div>
                  <div className="text-xs text-gray-600">Total Blocking Time</div>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-4 text-center">
                Alle Werte werden kontinuierlich überwacht und optimiert
              </p>
            </div>
            <div className="mt-6 flex justify-center">
              <Link
                href="/blog/pageinsight"
                className="inline-flex items-center gap-2 rounded-xl border border-orange-500 bg-white/80 px-5 py-2.5 text-sm md:text-base font-semibold text-gray-900 shadow-sm transition-all hover:bg-white hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                Zum Artikel: PageSpeed-Score {'>'} 90 – warum er zählt
              </Link>
            </div>
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
