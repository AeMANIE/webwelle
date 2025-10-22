'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
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
  ShoppingCart, 
  Calendar,
  ArrowRight,
  Star,
  Target,
  Rocket
} from 'lucide-react';

// GSAP Plugin registrieren
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function AppEntwicklungPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const solutionsRef = useRef<HTMLDivElement>(null);
  const processRef = useRef<HTMLDivElement>(null);
  const faqRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Hero Animation
    if (heroRef.current) {
      gsap.fromTo(heroRef.current.children, 
        { y: 50, opacity: 0 },
        { 
          y: 0, 
          opacity: 1, 
          duration: 1,
          stagger: 0.2,
          ease: "power3.out"
        }
      );
    }

    // Features Animation
    if (featuresRef.current) {
      gsap.fromTo(featuresRef.current.children,
        { y: 100, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.15,
          ease: "power2.out",
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
        { scale: 0.8, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.6,
          stagger: 0.1,
          ease: "back.out(1.7)",
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
        { x: -100, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.2,
          ease: "power2.out",
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
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.1,
          ease: "power2.out",
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
      icon: <Smartphone className="h-6 w-6 text-gray-800" />,
      title: "iOS & Android Apps",
      description: "Maßgeschneiderte Apps für beide Plattformen – genau passend zu Ihrem Geschäftsmodell"
    },
    {
      icon: <Zap className="h-6 w-6 text-gray-800" />,
      title: "Hohe Performance",
      description: "Beeindruckende User Experience und ansprechendes Design mit maximaler Stabilität"
    },
    {
      icon: <Shield className="h-6 w-6 text-gray-800" />,
      title: "Datensicherheit",
      description: "Absolute Datensicherheit und Skalierbarkeit für langfristiges Wachstum"
    },
    {
      icon: <Users className="h-6 w-6 text-gray-800" />,
      title: "Persönlicher Support",
      description: "Keine versteckten Kosten – persönlicher Ansprechpartner von der Idee bis zur App-Veröffentlichung"
    }
  ];

  const solutions = [
    {
      icon: <Target className="h-6 w-6" />,
      title: "Business-Apps",
      description: "Für Ihre Prozesse"
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Kunden-Apps",
      description: "Direkter Service & Kundenbindung"
    },
    {
      icon: <ShoppingCart className="h-6 w-6" />,
      title: "E-Commerce-Apps",
      description: "Maximale Umsatzchancen"
    },
    {
      icon: <Calendar className="h-6 w-6" />,
      title: "Community-Apps",
      description: "Interaktion und Engagement"
    },
    {
      icon: <Star className="h-6 w-6" />,
      title: "Branchenlösungen",
      description: "Von Tourismus bis Gesundheit"
    }
  ];

  const processSteps = [
    {
      number: "01",
      title: "Unverbindliche Beratung",
      description: "Klärung Ihrer Ziele und Anforderungen"
    },
    {
      number: "02",
      title: "Individuelles Angebot ab 20.000 €",
      description: "Transparenz von Anfang an"
    },
    {
      number: "03",
      title: "Konzept & Design",
      description: "Maßgeschneidert für Ihre Marke und Zielgruppe"
    },
    {
      number: "04",
      title: "Entwicklung & Testing",
      description: "Agil, effizient, mit Fokus auf Qualität"
    },
    {
      number: "05",
      title: "Deployment & Support",
      description: "App-Launch in den Stores, nachhaltige Betreuung"
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
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6">
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
      <section ref={featuresRef} className="py-20 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 tracking-tight">
              Warum WebWelle App-Entwicklung?
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto font-light leading-relaxed">
              Wir setzen auf Transparenz, Qualität und persönliche Betreuung. Entdecken Sie, was uns unterscheidet.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="group h-full rounded-2xl border border-border bg-card p-5 md:p-6 shadow-sm transition-shadow hover:shadow-md">
                <div className="flex items-start gap-4">
                  <div className="rounded-xl bg-background border border-border p-3 shadow-sm">
                    {feature.icon}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base md:text-lg font-semibold text-foreground leading-snug">
                      {feature.title}
                    </h3>
                    <p className="mt-1 text-sm md:text-base text-muted-foreground font-light leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solutions Section */}
      <section ref={solutionsRef} className="py-20 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 tracking-tight">
              Unsere App-Lösungen auf einen Blick
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto font-light leading-relaxed">
              Von Business-Apps bis hin zu E-Commerce-Lösungen – wir entwickeln die perfekte App für Ihr Unternehmen.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {solutions.map((solution, index) => (
              <div key={index} className="text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-1 rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="flex justify-center mb-4">
                  <div className="rounded-xl bg-background border border-border p-3 shadow-sm">
                    {solution.icon}
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{solution.title}</h3>
                <p className="text-sm text-muted-foreground font-light leading-relaxed">
                  {solution.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section ref={processRef} className="py-20 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 tracking-tight">
              So läuft Ihr App-Projekt ab
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto font-light leading-relaxed">
              Von der ersten Idee bis zum erfolgreichen Launch - unser bewährter Prozess für App-Entwicklung.
            </p>
          </div>

          <div className="space-y-8">
            {processSteps.map((step, index) => (
              <div key={index} className="flex items-center space-x-8">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-xl">
                    {step.number}
                  </div>
                </div>
                <div className="flex-grow">
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground font-light leading-relaxed">
                    {step.description}
                  </p>
                </div>
                {index < processSteps.length - 1 && (
                  <div className="hidden lg:block">
                    <ArrowRight className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section ref={faqRef} className="py-20 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="max-w-4xl mx-auto">
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
                <div className="px-6 py-4">
                  <h3 className="font-semibold text-foreground pr-4 tracking-wide text-lg">
                    {faq.question}
                  </h3>
                  <p className="mt-3 text-muted-foreground leading-relaxed font-light">
                    {faq.answer}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-primary">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-primary-foreground mb-6">
            Jetzt App-Erfolg starten!
          </h2>
          <p className="text-xl text-primary-foreground/90 mb-8">
            Lassen Sie Ihre digitale Vision Wirklichkeit werden:
          </p>
          <p className="text-lg text-primary-foreground/80 mb-12">
            Jetzt unverbindlich Anfrage stellen und gemeinsam App-Geschichte schreiben.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="bg-background text-foreground hover:bg-background/90">
              Unverbindliche Anfrage stellen
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
              Kostenlose Beratung
            </Button>
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
