'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
      icon: <Smartphone className="h-8 w-8 text-blue-600" />,
      title: "iOS & Android Apps",
      description: "Maßgeschneiderte Apps für beide Plattformen – genau passend zu Ihrem Geschäftsmodell"
    },
    {
      icon: <Zap className="h-8 w-8 text-yellow-500" />,
      title: "Hohe Performance",
      description: "Beeindruckende User Experience und ansprechendes Design mit maximaler Stabilität"
    },
    {
      icon: <Shield className="h-8 w-8 text-green-600" />,
      title: "Datensicherheit",
      description: "Absolute Datensicherheit und Skalierbarkeit für langfristiges Wachstum"
    },
    {
      icon: <Users className="h-8 w-8 text-purple-600" />,
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <section ref={heroRef} className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <Badge variant="secondary" className="mb-6 text-sm font-medium">
            <Rocket className="h-4 w-4 mr-2" />
            Mobile App-Entwicklung
          </Badge>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            Ihre Plattform für{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Wachstum
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Ihr Unternehmen. Ihre App. Ihre Möglichkeiten.
          </p>
          
          <p className="text-lg text-gray-700 mb-12 max-w-4xl mx-auto leading-relaxed">
            WebWelle entwickelt individuelle Apps für Android & iOS, die Ihre Zielgruppe begeistern und digitales Wachstum ermöglichen. Von der ersten Idee bis zum Launch steht Ihr Erfolg im Mittelpunkt – maßgeschneiderte Lösungen, die wirklich performen.
          </p>

          {/* Rotating Slogans */}
          <div className="mb-12">
            <div className="inline-block">
              {slogans.map((slogan, index) => (
                <div
                  key={index}
                  className="text-lg font-semibold text-gray-800 italic mb-2"
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
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
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
      <section ref={featuresRef} className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Warum WebWelle App-Entwicklung?
            </h2>
            <Separator className="w-24 mx-auto" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow duration-300 border-0 shadow-md">
                <CardHeader>
                  <div className="flex justify-center mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Solutions Section */}
      <section ref={solutionsRef} className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Unsere App-Lösungen auf einen Blick
            </h2>
            <Separator className="w-24 mx-auto" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {solutions.map((solution, index) => (
              <Card key={index} className="text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0 shadow-lg bg-white">
                <CardHeader>
                  <div className="flex justify-center mb-4">
                    <div className="p-3 rounded-full bg-gradient-to-r from-blue-100 to-purple-100">
                      {solution.icon}
                    </div>
                  </div>
                  <CardTitle className="text-lg">{solution.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600">
                    {solution.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section ref={processRef} className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              So läuft Ihr App-Projekt ab
            </h2>
            <Separator className="w-24 mx-auto" />
          </div>

          <div className="space-y-8">
            {processSteps.map((step, index) => (
              <div key={index} className="flex items-center space-x-8">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    {step.number}
                  </div>
                </div>
                <div className="flex-grow">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-gray-600">
                    {step.description}
                  </p>
                </div>
                {index < processSteps.length - 1 && (
                  <div className="hidden lg:block">
                    <ArrowRight className="h-6 w-6 text-gray-400" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section ref={faqRef} className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-gray-50 to-blue-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              FAQ: Häufige Fragen zur App-Entwicklung
            </h2>
            <Separator className="w-24 mx-auto" />
          </div>

          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <Card key={index} className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg text-gray-900">
                    {faq.question}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 text-base">
                    {faq.answer}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Jetzt App-Erfolg starten!
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Lassen Sie Ihre digitale Vision Wirklichkeit werden:
          </p>
          <p className="text-lg text-blue-200 mb-12">
            Jetzt unverbindlich Anfrage stellen und gemeinsam App-Geschichte schreiben.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="bg-white text-blue-600 hover:bg-gray-100">
              Unverbindliche Anfrage stellen
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
              Kostenlose Beratung
            </Button>
          </div>
        </div>
      </section>

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
