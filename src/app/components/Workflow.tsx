'use client';

import { Search, MessageCircle, Rocket, Target } from 'lucide-react';

export default function Workflow() {
  const steps = [
    {
      number: '1',
      title: 'Branchenanalyse starten',
      description: '',
      details:
        'Wir schauen uns Ihre Branche, Ihre Region und Ihre aktuelle Ausgangslage an.',
      icon: Search,
    },
    {
      number: '2',
      title: 'Klare Empfehlung erhalten',
      description: '',
      details:
        'Sie bekommen eine nachvollziehbare Einschätzung, welche Website-Struktur und welche Maßnahmen für Ihr Unternehmen sinnvoll sind.',
      icon: MessageCircle,
    },
    {
      number: '3',
      title: 'Saubere Umsetzung',
      description: '',
      details:
        'Ihre neue Website wird klar aufgebaut, professionell gestaltet und auf Anfragen ausgerichtet umgesetzt.',
      icon: Rocket,
    },
    {
      number: '4',
      title: 'Sichtbar weiterentwickeln',
      description: '',
      details:
        'Auf Wunsch unterstützen wir Sie zusätzlich bei SEO, Inhalten und weiteren Optimierungen für mehr Sichtbarkeit.',
      icon: Target,
    },
  ];

  return (
    <section id="arbeitsweise" className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
            So läuft es ab
          </h2>
        </div>

        {/* Desktop Timeline */}
        <div className="hidden xl:block">
          <div className="relative">
            <div className="absolute top-24 left-8 right-8 h-0.5 bg-primary/30" />

            <div className="grid grid-cols-4 gap-4">
              {steps.map((step, index) => (
                <div key={index} className="relative">
                  <div className="absolute top-20 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-primary rounded-full border-4 border-background shadow-lg flex items-center justify-center">
                    <span className="text-primary-foreground text-sm font-bold">{step.number}</span>
                  </div>

                  <div className="text-center pt-16">
                    <div className="flex justify-center mb-4">
                      <step.icon className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-3 leading-tight">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed font-light">
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
              <div
                key={index}
                className="bg-card/60 backdrop-blur-md rounded-xl p-6 border border-white/20 shadow-lg relative z-10"
              >
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
                    <h3 className="text-lg font-semibold text-foreground mb-2">{step.title}</h3>
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
            <div
              key={index}
              className="bg-card/60 backdrop-blur-md rounded-xl p-6 border border-white/20 shadow-lg relative z-10"
            >
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
                  <h3 className="text-lg font-semibold text-foreground mb-2">{step.title}</h3>
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
  );
}
