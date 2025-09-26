import { Package, MessageCircle, FileText, Rocket, Target, Clock, Eye, CheckCircle } from 'lucide-react';

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
    <section id="arbeitsweise" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 tracking-tight">
            So einfach geht's
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto font-light leading-relaxed">
            Von der ersten Idee bis zum erfolgreichen Launch - unser bewährter Prozess 
            macht die Zusammenarbeit einfach und transparent.
          </p>
        </div>

        {/* Desktop Timeline */}
        <div className="hidden lg:block">
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-primary/30 transform -translate-y-1/2"></div>
            
            <div className="grid grid-cols-5 gap-8">
              {steps.map((step, index) => (
                <div key={index} className="relative">
                  {/* Timeline Dot */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-primary rounded-full border-4 border-background shadow-lg"></div>
                  
                  {/* Step Content */}
                  <div className="text-center mt-8">
                    <div className="flex justify-center mb-4">
                      <step.icon className="w-8 h-8 text-gray-700" />
                    </div>
                    <div className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mx-auto mb-4">
                      {step.number}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {step.title}
                    </h3>
                    <p className="text-primary font-medium text-sm mb-2">
                      {step.description}
                    </p>
                    <p className="text-gray-600 text-xs leading-relaxed font-light">
                      {step.details}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile Timeline */}
        <div className="lg:hidden space-y-8">
          {steps.map((step, index) => (
            <div key={index} className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="bg-primary text-primary-foreground w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold">
                  {step.number}
                </div>
              </div>
              <div className="flex-1">
                <div className="flex justify-center mb-3">
                  <step.icon className="w-6 h-6 text-gray-700" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-primary font-medium text-sm mb-2">
                  {step.description}
                </p>
                <p className="text-gray-600 text-sm leading-relaxed font-light">
                  {step.details}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Benefits of our process */}
        <div className="mt-16">
          <div className="bg-gray-50 rounded-2xl p-8 shadow-lg border border-gray-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Warum unser Prozess funktioniert
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="flex justify-center mb-3">
                  <Clock className="w-6 h-6 text-gray-700" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Zeit sparen</h4>
                <p className="text-gray-600 text-sm">
                  Klare Struktur und bewährte Abläufe sorgen für effiziente Projektabwicklung.
                </p>
              </div>
              <div className="text-center">
                <div className="flex justify-center mb-3">
                  <Eye className="w-6 h-6 text-gray-700" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Transparenz</h4>
                <p className="text-gray-600 text-sm">
                  Sie wissen immer, wo Ihr Projekt steht und was als nächstes passiert.
                </p>
              </div>
              <div className="text-center">
                <div className="flex justify-center mb-3">
                  <CheckCircle className="w-6 h-6 text-gray-700" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Qualität</h4>
                <p className="text-gray-600 text-sm">
                  Jeder Schritt wird sorgfältig geplant und umgesetzt für optimale Ergebnisse.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <p className="text-lg text-gray-600 mb-6">
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

