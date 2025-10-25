'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { gsapConfig } from '@/lib/gsap-config';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ScrollToTop from '../components/ScrollToTop';
import CookieBanner from '../components/CookieBanner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Smartphone, 
  Zap, 
  Shield, 
  Users, 
  Calendar,
  ArrowRight,
  Star,
  Target,
  Rocket,
  MessageCircle,
  FileText,
  Palette
} from 'lucide-react';

// GSAP Plugin registrieren
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function AppEntwicklungClient() {
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const featuresTrackRef = useRef<HTMLDivElement>(null);
  const featuresContainerRef = useRef<HTMLDivElement>(null);
  const solutionsRef = useRef<HTMLDivElement>(null);
  const processRef = useRef<HTMLDivElement>(null);
  const faqRef = useRef<HTMLDivElement>(null);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  useEffect(() => setIsMounted(true), []);

  // Auto-Scroll Marquee mit GSAP und ScrollTrigger Pause bei Hover/Sichtbarkeit
  useEffect(() => {
    if (!isMounted || !featuresTrackRef.current) return;
    const track = featuresTrackRef.current;

    // Dupliziere Slides für nahtlose Schleife
    const slides = Array.from(track.querySelectorAll<HTMLElement>('[data-slide]'));
    if (slides.length === 0) return;

    const totalWidth = slides.reduce((acc, el) => acc + el.offsetWidth, 0);
    // Falls Inhalt schmaler als Viewport, nicht animieren
    if (totalWidth <= (featuresContainerRef.current?.offsetWidth || 0)) return;

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

      track.addEventListener('mouseenter', handleMouseEnter);
      track.addEventListener('mouseleave', handleMouseLeave);

      // Pause, wenn Bereich nicht im Viewport
      ScrollTrigger.create({
        trigger: featuresContainerRef.current,
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
        window.removeEventListener('resize', handleResize);
      };
    }, featuresTrackRef);

    return () => ctx.revert();
  }, [isMounted]);

  useEffect(() => {
    // Hero Animation
    if (heroRef.current) {
      gsap.fromTo(heroRef.current.children, 
        gsapConfig.fadeIn.from,
        { 
          ...gsapConfig.fadeIn.to,
          stagger: gsapConfig.stagger.duration,
        }
      );
    }

    // Features Animation
    if (featuresRef.current) {
      gsap.fromTo(featuresRef.current.children,
        gsapConfig.fadeIn.from,
        {
          ...gsapConfig.fadeIn.to,
          stagger: gsapConfig.stagger.duration,
          scrollTrigger: {
            trigger: featuresRef.current,
            start: "top 80%",
            end: "bottom 20%",
            toggleActions: "play none none reverse"
          }
        }
      );
    }

    // Solutions Animation
    if (solutionsRef.current) {
      gsap.fromTo(solutionsRef.current.children,
        gsapConfig.scaleIn.from,
        {
          ...gsapConfig.scaleIn.to,
          stagger: gsapConfig.stagger.duration,
          scrollTrigger: {
            trigger: solutionsRef.current,
            start: "top 70%",
            end: "bottom 30%",
            toggleActions: "play none none reverse"
          }
        }
      );
    }

    // Process Animation
    if (processRef.current) {
      gsap.fromTo(processRef.current.children,
        gsapConfig.fadeIn.from,
        {
          ...gsapConfig.fadeIn.to,
          stagger: gsapConfig.stagger.duration,
          scrollTrigger: {
            trigger: processRef.current,
            start: "top 75%",
            end: "bottom 25%",
            toggleActions: "play none none reverse"
          }
        }
      );
    }

    // FAQ Animation
    if (faqRef.current) {
      gsap.fromTo(faqRef.current.children,
        gsapConfig.fadeIn.from,
        {
          ...gsapConfig.fadeIn.to,
          stagger: gsapConfig.stagger.duration,
          scrollTrigger: {
            trigger: faqRef.current,
            start: "top 80%",
            end: "bottom 20%",
            toggleActions: "play none none reverse"
          }
        }
      );
    }

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  const slogans = [
    "Ihre App. Ihr Vorsprung.",
    "Erfolg zum Anfassen – mit Ihrer individuellen App.",
    "Mobiles Wachstum, das inspiriert.",
    "Digitale Lösungen. Greifbare Ergebnisse.",
    "Ihre Vision als App – einzigartig, leistungsstark, sichtbar."
  ];

  const features = [
    {
      icon: Smartphone,
      title: "iOS & Android Apps",
      description: "Maßgeschneiderte Apps für beide Plattformen – genau passend zu Ihrem Geschäftsmodell"
    },
    {
      icon: Zap,
      title: "Hohe Performance",
      description: "Beeindruckende User Experience und ansprechendes Design mit maximaler Stabilität"
    },
    {
      icon: Shield,
      title: "Datensicherheit",
      description: "Absolute Datensicherheit und Skalierbarkeit für langfristiges Wachstum"
    },
    {
      icon: Users,
      title: "Persönlicher Support",
      description: "Keine versteckten Kosten – persönlicher Ansprechpartner von der Idee bis zur App-Veröffentlichung"
    }
  ];

  const solutions = [
    {
      icon: Target,
      title: "Business-Apps",
      description: "Für Ihre Prozesse"
    },
    {
      icon: Users,
      title: "Kunden-Apps",
      description: "Direkter Service & Kundenbindung"
    },
    {
      icon: Calendar,
      title: "Community-Apps",
      description: "Interaktion und Engagement"
    },
    {
      icon: Star,
      title: "Branchenlösungen",
      description: "Von Tourismus bis Gesundheit"
    }
  ];

  const processSteps = [
    {
      number: 1,
      title: "Unverbindliche Beratung",
      description: "Klärung Ihrer Ziele und Anforderungen",
      details: "In einem persönlichen Gespräch erfahren wir mehr über Ihre Ziele, Wünsche und Anforderungen für Ihr App-Projekt.",
      icon: MessageCircle
    },
    {
      number: 2,
      title: "Individuelles Angebot ab 20.000€",
      description: "Transparenz von Anfang an",
      details: "Einfacher Online-Checkout mit flexiblen Zahlungsoptionen: Einmalzahlung oder monatliche Raten.",
      icon: FileText
    },
    {
      number: 3,
      title: "Konzept & Design",
      description: "Maßgeschneidert für Ihre Marke und Zielgruppe",
      details: "Regelmäßige Updates und transparente Kommunikation über den Fortschritt Ihres App-Projekts.",
      icon: Palette
    },
    {
      number: 4,
      title: "Entwicklung & Testing",
      description: "Agil, effizient, mit Fokus auf Qualität",
      details: "Professionelle Umsetzung mit modernsten Technologien und höchster Qualität für Ihre App.",
      icon: Rocket
    },
    {
      number: 5,
      title: "Deployment & Support",
      description: "App-Launch in den Stores, nachhaltige Betreuung",
      details: "Professioneller Launch Ihrer App mit kontinuierlicher Optimierung und langfristigem Support.",
      icon: Target
    }
  ];

  const faqs = [
    {
      question: "Wie viel kostet eine App bei WebWelle?",
      answer: "Jedes Projekt ist einzigartig, der Startpreis liegt bei 20.000 €. Sie erhalten ein faires, transparentes Angebot nach Ihrer Anfrage."
    },
    {
      question: "Ich habe schon ein Konzept – kann ich direkt starten?",
      answer: "Ja! Wir setzen Ihre Vorstellungen passgenau um oder beraten zur optimalen Weiterentwicklung."
    },
    {
      question: "Wird meine App in den Stores veröffentlicht?",
      answer: "Wir begleiten Sie von der ersten Idee bis zur Veröffentlichung in App Store & Google Play."
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        {/* Hero Section */}
        <section ref={heroRef} className="relative py-20 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-7xl mx-auto text-center">
            <Badge variant="secondary" className="mb-6 text-sm font-medium bg-primary/10 text-primary">
              <Rocket className="h-4 w-4 mr-2" />
              Mobile App-Entwicklung
            </Badge>
            
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
                      Ihre Plattform für{' '}
                      <span className="text-primary">
                        Wachstum
                      </span>
                    </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Ihr Unternehmen. Ihre App. Ihre Möglichkeiten.
          </p>
          
          <p className="text-lg text-muted-foreground mb-12 max-w-4xl mx-auto leading-relaxed font-light">
            WebWelle entwickelt individuelle Apps für Android & iOS, die Ihre Zielgruppe begeistern und digitales Wachstum ermöglichen. Von der ersten Idee bis zum Launch steht Ihr Erfolg im Mittelpunkt – maßgeschneiderte Lösungen, die wirklich performen.
          </p>

          {/* Rotating Slogans */}
          <div className="mb-12">
            <div className="inline-block">
              {slogans.map((slogan, index) => (
                <div
                  key={index}
                  className="text-lg font-semibold text-foreground italic mb-2"
                  style={{
                    animation: `fadeInOut 10s infinite ${index * 2}s`
                  }}
                >
                  „{slogan}"
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-primary hover:bg-primary/90">
              Jetzt App-Erfolg starten
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button variant="outline" size="lg">
              Unverbindliche Beratung
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section ref={featuresRef} className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 md:mb-12">
            <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700">
              <Zap className="h-3.5 w-3.5 text-yellow-500" /> App-Entwicklung
            </span>
            <h2 className="mt-4 text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
              Warum WebWelle App-Entwicklung?
            </h2>
            <p className="mt-3 text-base md:text-lg text-gray-600 max-w-3xl mx-auto font-light leading-relaxed">
              Wir setzen auf Transparenz, Qualität und persönliche Betreuung. Entdecken Sie, was uns unterscheidet.
            </p>
          </div>

          {/* Horizontaler Slider */}
          <div ref={featuresContainerRef} className="relative overflow-hidden">
            {/* Soft Gradients links/rechts */}
            <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-white to-transparent" />

            {/* Track */}
            <div
              ref={featuresTrackRef}
              className="flex gap-4 md:gap-6 will-change-transform"
              aria-label="WebWelle App-Entwicklung Features Slider"
            >
              {[...features, ...features].map((feature, index) => {
                const IconComponent = feature.icon;
                return (
                  <article
                    key={`${feature.title}-${index}`}
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
                            {feature.title}
                          </h3>
                          <p className="mt-1 text-sm md:text-base text-gray-600 font-light leading-relaxed">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Solutions Section */}
      <section ref={solutionsRef} className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-tight">
              Unsere App-Lösungen auf einen Blick
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto font-light leading-relaxed">
              Von Business-Apps bis hin zu E-Commerce-Lösungen – wir entwickeln die perfekte App für Ihr Unternehmen.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {solutions.map((solution, index) => {
              const IconComponent = solution.icon;
              return (
                <div key={index} className="group">
                  <div className="bg-card rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-border hover:border-primary/50">
                    <div className="flex justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                      <IconComponent className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-3 text-center">
                      {solution.title}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed font-light">
                      {solution.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section ref={processRef} className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-tight">
              So läuft Ihr App-Projekt ab
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto font-light leading-relaxed">
              Von der ersten Idee bis zum erfolgreichen Launch - unser bewährter Prozess für App-Entwicklung.
            </p>
          </div>

          {/* Desktop Timeline */}
          <div className="hidden xl:block">
            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute top-24 left-8 right-8 h-0.5 bg-primary/30"></div>
              
              <div className="grid grid-cols-5 gap-4">
                {processSteps.map((step, index) => (
                  <div key={index} className="relative">
                    {/* Timeline Dot */}
                    <div className="absolute top-20 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-primary rounded-full border-4 border-background shadow-lg flex items-center justify-center">
                      <span className="text-primary-foreground text-sm font-bold">{step.number}</span>
                    </div>
                    
                    {/* Step Content */}
                    <div className="text-center pt-16">
                      <div className="flex justify-center mb-4">
                        <step.icon className="w-8 h-8 text-primary" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-2 leading-tight">
                        {step.title}
                      </h3>
                      <p className="text-primary font-medium text-sm mb-3">
                        {step.description}
                      </p>
                      <p className="text-muted-foreground text-xs leading-relaxed font-light">
                        {step.details}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tablet Timeline */}
          <div className="hidden lg:block xl:hidden">
            <div className="grid grid-cols-2 gap-8">
              {processSteps.map((step, index) => (
                <div key={index} className="bg-card rounded-xl p-6 border border-border">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="bg-primary text-primary-foreground w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold">
                        {step.number}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-center mb-3">
                        <step.icon className="w-6 h-6 text-primary" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        {step.title}
                      </h3>
                      <p className="text-primary font-medium text-sm mb-2">
                        {step.description}
                      </p>
                      <p className="text-muted-foreground text-sm leading-relaxed font-light">
                        {step.details}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile Timeline */}
          <div className="lg:hidden space-y-6">
            {processSteps.map((step, index) => (
              <div key={index} className="bg-card rounded-xl p-6 border border-border">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="bg-primary text-primary-foreground w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold">
                      {step.number}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-center mb-3">
                      <step.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {step.title}
                    </h3>
                    <p className="text-primary font-medium text-sm mb-2">
                      {step.description}
                    </p>
                    <p className="text-muted-foreground text-sm leading-relaxed font-light">
                      {step.details}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section ref={faqRef} className="py-20 bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-tight">
              FAQ: Häufige Fragen zur App-Entwicklung
            </h2>
            <p className="text-xl text-muted-foreground font-light leading-relaxed">
              Hier finden Sie Antworten auf die wichtigsten Fragen zu unserer App-Entwicklung.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-card rounded-lg overflow-hidden border border-border">
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-secondary/50 transition-colors"
                >
                  <span className="font-semibold text-foreground pr-4 tracking-wide">
                    {faq.question}
                  </span>
                  <div className="flex-shrink-0">
                    <svg
                      className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${
                        openIndex === index ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </button>
                
                {openIndex === index && (
                  <div className="px-6 pb-4">
                    <p className="text-muted-foreground leading-relaxed font-light">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Contact CTA */}
          <div className="mt-12 text-center">
            <div className="bg-primary/10 rounded-2xl p-6 sm:p-8 md:p-10 border border-primary/20">
              <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-4 sm:mb-6">
                Haben Sie weitere Fragen?
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8 px-2 leading-relaxed">
                Wir beantworten gerne alle Ihre Fragen in einem kostenlosen Erstgespräch.
              </p>
              <a
                href="#cta"
                className="inline-block bg-primary text-primary-foreground px-6 sm:px-8 md:px-10 py-3 sm:py-4 rounded-lg hover:bg-primary/90 transition-colors font-semibold text-sm sm:text-base md:text-lg whitespace-nowrap"
              >
                Kostenloses Gespräch vereinbaren
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary to-primary/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl md:text-5xl font-extrabold text-primary-foreground mb-6 tracking-tight">
              Jetzt App-Erfolg starten!
            </h2>
            <p className="text-xl md:text-2xl text-primary-foreground/90 mb-12 max-w-4xl mx-auto leading-relaxed font-light">
              Kostenloses Erstgespräch sichern oder direkt individuelles Festpreis-Angebot anfordern – 
              einfach, digital und garantiert sicher.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
              {/* Free Consultation */}
              <div className="bg-card rounded-2xl p-8 shadow-xl border border-border">
                <div className="flex justify-center mb-4">
                  <MessageCircle className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4 tracking-wide">
                  Kostenloses Erstgespräch
                </h3>
                <p className="text-muted-foreground mb-6 font-light leading-relaxed">
                  Lassen Sie uns in einem unverbindlichen Gespräch Ihre Ziele und Wünsche besprechen. 
                  Wir beraten Sie gerne zu den besten Lösungen für Ihr Unternehmen.
                </p>
                <ul className="text-left text-muted-foreground space-y-2 mb-6">
                  <li className="flex items-center">
                    <span className="text-primary mr-2">✓</span>
                    Unverbindlich & kostenlos
                  </li>
                  <li className="flex items-center">
                    <span className="text-primary mr-2">✓</span>
                    Individuelle Beratung
                  </li>
                  <li className="flex items-center">
                    <span className="text-primary mr-2">✓</span>
                    Sofort verfügbar
                  </li>
                </ul>
                <a
                  href="mailto:info@webwelle.com?subject=Kostenloses Erstgespräch"
                  className="w-full bg-primary text-primary-foreground py-3 px-6 rounded-lg hover:bg-primary/90 transition-colors font-semibold text-lg text-center block"
                >
                  Gespräch vereinbaren
                </a>
              </div>

              {/* Direct Quote */}
              <div className="bg-card rounded-2xl p-8 shadow-xl border border-border">
                <div className="flex justify-center mb-4">
                  <FileText className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4 tracking-wide">
                  Individuelles Angebot
                </h3>
                <p className="text-muted-foreground mb-6 font-light leading-relaxed">
                  Erhalten Sie ein detailliertes, transparentes Angebot für Ihre App-Entwicklung. 
                  Keine versteckten Kosten, faire Preise ab 20.000€.
                </p>
                <ul className="text-left text-muted-foreground space-y-2 mb-6">
                  <li className="flex items-center">
                    <span className="text-primary mr-2">✓</span>
                    Transparente Preise
                  </li>
                  <li className="flex items-center">
                    <span className="text-primary mr-2">✓</span>
                    Detaillierte Aufstellung
                  </li>
                  <li className="flex items-center">
                    <span className="text-primary mr-2">✓</span>
                    Schnelle Bearbeitung
                  </li>
                </ul>
                <a
                  href="mailto:info@webwelle.com?subject=App-Entwicklung Angebot"
                  className="w-full bg-primary text-primary-foreground py-3 px-6 rounded-lg hover:bg-primary/90 transition-colors font-semibold text-lg text-center block"
                >
                  Angebot anfordern
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
      </main>
      <Footer />
      <ScrollToTop />
      <CookieBanner />

      <style jsx>{`
        @keyframes fadeInOut {
          0%, 20% { opacity: 0; transform: translateY(20px); }
          25%, 75% { opacity: 1; transform: translateY(0); }
          80%, 100% { opacity: 0; transform: translateY(-20px); }
        }
      `}</style>
    </div>
  );
}
