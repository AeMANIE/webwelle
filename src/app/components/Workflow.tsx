'use client';

import { Package, MessageCircle, FileText, Rocket, Target, Clock, Eye, CheckCircle } from 'lucide-react';
import dynamic from 'next/dynamic';

const CanvaAnimation = dynamic(() => import('./CanvaAnimation'), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-background" />
});

export default function Workflow() {
  const steps = [
    {
      number: "1",
      title: "Wunschpaket wählen",
      description: "Next.js oder WordPress",
      details: "Wählen Sie zwischen unserem Premium Next.js-Paket für maximale Performance oder dem klassischen WordPress-Paket für einen schnellen Start.",
      icon: Package
    },
    {
      number: "2", 
      title: "Kurzes Briefing",
      description: "Wir beraten individuell",
      details: "In einem persönlichen Gespräch erfahren wir mehr über Ihre Ziele, Wünsche und Anforderungen für Ihr Projekt.",
      icon: MessageCircle
    },
    {
      number: "3",
      title: "Vertrag online abschließen",
      description: "Zahlung flexibel wählen",
      details: "Einfacher Online-Checkout mit flexiblen Zahlungsoptionen: Einmalzahlung oder monatliche Raten.",
      icon: FileText
    },
    {
      number: "4",
      title: "Schneller Projektstart",
      description: "Sie sind immer up-to-date",
      details: "Regelmäßige Updates und transparente Kommunikation über den Fortschritt Ihres Projekts.",
      icon: Rocket
    },
    {
      number: "5",
      title: "Launch mit Erfolgskontrolle",
      description: "Nachhaltiger Support",
      details: "Professioneller Launch Ihrer Website mit kontinuierlicher Optimierung und langfristigem Support.",
      icon: Target
    }
  ];

  return (
    <section id="arbeitsweise" className="py-20 bg-background relative overflow-hidden">
      {/* Canva Animation Hintergrund */}
      <CanvaAnimation />
      
      {/* Content mit z-index für Lesbarkeit */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Glassmorphism Window 1 - Einleitung */}
        <div className="mb-8">
          <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-tight">
              Webdesign mit Strategie und messbarer Wirkung
            </h2>
            <p className="text-xl text-foreground max-w-3xl mx-auto font-light leading-relaxed mb-4">
              Webdesign ist bei uns mehr als Ästhetik – es ist Unternehmenspsychologie.
            </p>
            <p className="text-lg text-foreground max-w-4xl mx-auto font-light leading-relaxed">
              Wir entwickeln Websites, die Vertrauen wecken, Emotionen ansprechen und gezielt Handlungsimpulse auslösen.
            </p>
          </div>
        </div>

        {/* Glassmorphism Window 2 - Fokus & Nutzen */}
        <div className="mb-16">
          <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl max-w-4xl mx-auto">
            <p className="text-base text-primary font-semibold mb-4 text-center">
              Unser Fokus liegt auf:
            </p>
            <div className="text-base text-foreground max-w-3xl mx-auto space-y-3">
              <p className="text-center md:text-left">SEO & Performance: Google Core Web Vitals, technische Optimierung und lokale Auffindbarkeit.</p>
              <p className="text-center md:text-left">• Neuromarketing-Effekten: Farb- und Designpsychologie steigern Klickbereitschaft und Anfragen.</p>
              <p className="text-center md:text-left">• Conversion-Design: Jeder Button, jede Headline und jedes Bild folgt einer klaren Nutzerintention.</p>
              <p className="text-primary font-semibold mt-6 text-center md:text-left">Ihr Nutzen: Mehr Sichtbarkeit, mehr Reichweite, mehr Kundenkontakt.</p>
            </div>
          </div>
        </div>

        {/* Desktop Timeline */}
        <div className="hidden xl:block">
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute top-24 left-8 right-8 h-0.5 bg-primary/30"></div>
            
            <div className="grid grid-cols-5 gap-4">
              {steps.map((step, index) => (
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
            {steps.map((step, index) => (
              <div key={index} className="bg-card/60 backdrop-blur-md rounded-xl p-6 border border-white/20 shadow-lg relative z-10">
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
          {steps.map((step, index) => (
            <div key={index} className="bg-card/60 backdrop-blur-md rounded-xl p-6 border border-white/20 shadow-lg relative z-10">
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

        {/* Benefits of our process */}
        <div className="mt-16">
          <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl max-w-5xl mx-auto">
            <h3 className="text-2xl font-bold text-foreground mb-6 text-center">
              Warum unser Prozess funktioniert
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="flex justify-center mb-3">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
                <h4 className="font-semibold text-foreground mb-2">Zeit sparen</h4>
                <p className="text-foreground text-sm">
                  Klare Struktur und bewährte Abläufe sorgen für effiziente Projektabwicklung.
                </p>
              </div>
              <div className="text-center">
                <div className="flex justify-center mb-3">
                  <Eye className="w-6 h-6 text-primary" />
                </div>
                <h4 className="font-semibold text-foreground mb-2">Transparenz</h4>
                <p className="text-foreground text-sm">
                  Sie wissen immer, wo Ihr Projekt steht und was als nächstes passiert.
                </p>
              </div>
              <div className="text-center">
                <div className="flex justify-center mb-3">
                  <CheckCircle className="w-6 h-6 text-primary" />
                </div>
                <h4 className="font-semibold text-foreground mb-2">Qualität</h4>
                <p className="text-foreground text-sm">
                  Jeder Schritt wird sorgfältig geplant und umgesetzt für optimale Ergebnisse.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <p className="text-lg text-muted-foreground mb-6">
            Bereit, Ihren digitalen Erfolg zu starten?
          </p>
          <a
            href="#cta"
            className="bg-primary text-primary-foreground px-8 py-3 rounded-lg hover:bg-primary/90 transition-colors font-semibold text-lg"
          >
            Jetzt Projekt starten
          </a>
        </div>
      </div>
    </section>
  );
}

