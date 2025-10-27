'use client';

import { MapPin, Award, Users, Shield, Zap, TrendingUp } from 'lucide-react';

export default function AIAgentWhy() {
  const advantages = [
    {
      icon: MapPin,
      title: "Regionale Kompetenz aus Kempten (Allgäu)",
      description: "Wir verstehen die Bedürfnisse regionaler Unternehmen und kennen den lokalen Markt."
    },
    {
      icon: Award,
      title: "Über 10 Jahre Erfahrung in Webdesign & Automation",
      description: "Erprobtes Know-how in moderner Technologie und bewährten Erfolgsstrategien."
    },
    {
      icon: Users,
      title: "Persönliche Beratung – keine Blackbox-KI",
      description: "Sie wissen, was passiert. Transparente Kommunikation und klare Prozesse."
    },
    {
      icon: Shield,
      title: "Transparente Preise & klare Ergebnisse",
      description: "Keine versteckten Kosten. Was Sie sehen, ist was Sie bekommen."
    },
    {
      icon: Zap,
      title: "Zukunftssicher dank neuester Technologie-Stacks",
      description: "Next.js, OpenAI, API-first – Ihr System wächst mit Ihrem Business."
    },
    {
      icon: TrendingUp,
      title: "DSGVO-konform & Hosting in Deutschland",
      description: "Ihre Daten sind sicher. Garantierte Rechtssicherheit und Datenschutz."
    }
  ];

  return (
    <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-b from-background to-primary/5 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6 tracking-tight">
            Warum WebWelle?
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto font-light leading-relaxed">
            Regionale Expertise, transparente Preise und nachhaltige Technologie für Ihr Business.
          </p>
        </div>

        {/* Advantages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {advantages.map((advantage, index) => (
            <div 
              key={index}
              className="bg-card rounded-2xl p-8 border-2 border-border hover:border-primary/50 transition-all duration-300 hover:shadow-xl group"
            >
              {/* Icon */}
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <advantage.icon className="w-8 h-8 text-primary" />
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-foreground mb-4">
                {advantage.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed font-light">
                {advantage.description}
              </p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <div className="bg-primary/10 border border-primary/20 rounded-2xl p-8 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-foreground mb-4">
              Starten Sie Ihre KI-Offensive
            </h3>
            <div className="space-y-4 mb-8 text-left max-w-2xl mx-auto">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">
                  1
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-2">Beratung & Analyse</p>
                  <p className="text-muted-foreground">
                    Wir zeigen, welche Prozesse sich für Automatisierung eignen.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">
                  2
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-2">Individuelle Umsetzung</p>
                  <p className="text-muted-foreground">
                    Ihr Agent wird exakt auf Ihre Anforderungen trainiert.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">
                  3
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-2">Launch & Betreuung</p>
                  <p className="text-muted-foreground">
                    Wir begleiten den Betrieb, liefern monatliche Auswertungen & Optimierungen.
                  </p>
                </div>
              </div>
            </div>
            <p className="text-lg font-semibold text-primary mb-6">
              Ihr KI-Agent arbeitet – Sie wachsen.
            </p>
            <a
              href="#cta"
              className="inline-block bg-primary text-primary-foreground px-8 py-3 rounded-lg hover:bg-primary/90 transition-colors font-semibold"
            >
              Jetzt kostenlosen Beratungstermin sichern
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

