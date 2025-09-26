import { DollarSign, Calendar, Zap, Palette, Wrench, Users, Rocket, TrendingUp } from 'lucide-react';

export default function Benefits() {
  const benefits = [
    {
      icon: DollarSign,
      title: "Transparente Festpreise",
      description: "Keine versteckten Kosten, keine Überraschungen. Sie wissen von Anfang an, was Sie bezahlen."
    },
    {
      icon: Calendar,
      title: "Planungssicherheit",
      description: "Vom ersten Tag an wissen Sie genau, was Sie bekommen und wann Ihr Projekt fertig ist."
    },
    {
      icon: Zap,
      title: "Top-Geschwindigkeit",
      description: "Beste Google-PageSpeed & sichtbar mehr Reichweite durch optimale Performance."
    },
    {
      icon: Palette,
      title: "Modernes Design",
      description: "Einzigartiges Design passend zum Unternehmen - nicht von der Stange."
    },
    {
      icon: Wrench,
      title: "Einfach erweiterbar",
      description: "Mit Automatisierungen & KI-Lösungen können Sie Ihre Website jederzeit ausbauen."
    },
    {
      icon: Users,
      title: "Persönliche Betreuung",
      description: "Klare Ansprechpartner und persönliche Betreuung statt anonyme Support-Hotlines."
    },
    {
      icon: Rocket,
      title: "Schneller Start",
      description: "Einfache Abwicklung und schneller Projektstart - keine langen Wartezeiten."
    },
    {
      icon: TrendingUp,
      title: "Individuell erweiterbar",
      description: "Leistungen jederzeit individuell erweiterbar - wachsen Sie mit Ihren Bedürfnissen."
    }
  ];

  return (
    <section id="vorteile" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 tracking-tight">
            Darum WebWelle
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto font-light leading-relaxed">
            Wir setzen auf Transparenz, Qualität und persönliche Betreuung. 
            Entdecken Sie, was uns von anderen unterscheidet.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit, index) => {
            const IconComponent = benefit.icon;
            return (
              <div key={index} className="bg-gray-50 rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow border border-gray-200">
                <div className="flex justify-center mb-4">
                  <IconComponent className="w-8 h-8 text-gray-700" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 text-center">
                  {benefit.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed font-light">
                  {benefit.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <div className="bg-primary rounded-2xl p-8 text-primary-foreground">
            <h3 className="text-2xl font-bold mb-4">
              Bereit für Ihre Erfolgswelle?
            </h3>
            <p className="text-lg mb-6 opacity-90">
              Lassen Sie uns gemeinsam Ihre digitale Präsenz auf das nächste Level bringen.
            </p>
            <a
              href="#cta"
              className="bg-primary-foreground text-primary px-8 py-3 rounded-lg hover:bg-primary-foreground/90 transition-colors font-semibold text-lg inline-block"
            >
              Kostenloses Erstgespräch sichern
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

