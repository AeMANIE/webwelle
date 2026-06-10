'use client';

import { Search, MessageCircle, Rocket, Target } from 'lucide-react';
import { WavePath } from '@/components/ui/wave-path';

const FLOAT_DELAYS = ['0s', '0.8s', '1.6s', '2.4s'];

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
    <section id="arbeitsweise" className="pt-20 pb-20 lg:pb-28 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
            So läuft es ab
          </h2>
        </div>

        {/* Desktop Timeline – ab lg (1024px), nicht erst ab xl */}
        <div className="hidden lg:block">
          <div className="relative">
            <div className="absolute top-24 left-8 right-8 h-0.5 bg-primary/30" />

            <div className="grid grid-cols-4 gap-4">
              {steps.map((step, index) => (
                <div key={index} className="relative">
                  <div className="absolute top-20 left-1/2 -translate-x-1/2 w-8 h-8 bg-primary rounded-full border-4 border-background shadow-lg flex items-center justify-center z-10">
                    <span className="text-primary-foreground text-sm font-bold">{step.number}</span>
                  </div>

                  {/* Bewegendes Icon: rechts neben Zahl, 6px höher als top-20 */}
                  <div
                    className="absolute top-20 left-1/2 z-0 flex h-8 w-8 items-center justify-center pointer-events-none"
                    style={{ transform: 'translate(1.5rem, -6px)' }}
                  >
                    <div
                      className="animate-gentle-float"
                      style={{ animationDelay: FLOAT_DELAYS[index] }}
                    >
                      <step.icon className="w-8 h-8 text-primary" />
                    </div>
                  </div>

                  <div className="text-center pt-16">
                    <div className="mb-4 h-8" aria-hidden="true" />
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

        {/* Mobile Timeline */}
        <div className="lg:hidden space-y-6">
          {steps.map((step, index) => (
            <div
              key={index}
              className="bg-card/60 backdrop-blur-md rounded-xl p-6 border border-white/20 shadow-lg relative z-10"
            >
              <div className="relative flex items-stretch gap-4">
                <div className="flex w-12 flex-shrink-0 flex-col items-center">
                  <div className="relative z-10 flex-shrink-0 bg-primary text-primary-foreground w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold">
                    {step.number}
                  </div>
                  <div className="relative mt-2 w-px min-h-[4rem] flex-1">
                    <WavePath orientation="vertical" className="h-full w-px" />
                  </div>
                </div>

                <div className="flex-1">
                  <div className="flex justify-center mb-3">
                    <div
                      className="animate-gentle-float"
                      style={{ animationDelay: FLOAT_DELAYS[index] }}
                    >
                      <step.icon className="w-6 h-6 text-primary" />
                    </div>
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
