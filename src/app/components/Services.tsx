import { Palette, Smartphone, Search, ShoppingCart, Bot, Target, Server, FileText } from 'lucide-react';

export default function Services() {
  const services = [
    {
      icon: Palette,
      title: "Individuelles Webdesign",
      description: "Maßgeschneiderte Designs, die Ihre Marke perfekt repräsentieren und Ihre Zielgruppe ansprechen."
    },
    {
      icon: Smartphone,
      title: "Responsive Design",
      description: "Optimiert für alle Geräte - von Desktop bis Smartphone. Perfekte Darstellung überall."
    },
    {
      icon: Search,
      title: "Performance-Optimierung & SEO",
      description: "Höchste Geschwindigkeit und beste Suchmaschinenoptimierung für maximale Sichtbarkeit."
    },
    {
      icon: ShoppingCart,
      title: "E-Commerce & Online-Shops",
      description: "Professionelle Online-Shops mit sicheren Zahlungssystemen und benutzerfreundlicher Bedienung."
    },
    {
      icon: Bot,
      title: "Automatisierte Workflows & KI",
      description: "Intelligente Automatisierungen und KI-Anwendungen für effizientere Geschäftsprozesse."
    },
    {
      icon: Target,
      title: "Branding & Logoentwicklung",
      description: "Komplette Markenentwicklung inklusive Logo, Corporate Design und Markenidentität."
    },
    {
      icon: Server,
      title: "Hosting, Wartung & Support",
      description: "Zuverlässiges Hosting, regelmäßige Updates und persönlicher Support für Ihre Website."
    },
    {
      icon: FileText,
      title: "Content-Erstellung & Marketing",
      description: "Professionelle Texte, Bilder und Marketing-Inhalte für Ihre digitale Präsenz."
    }
  ];

  return (
    <section id="leistungen" className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-tight">
            Leistungen im Überblick
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto font-light leading-relaxed">
            Von der ersten Idee bis zum erfolgreichen Launch - wir begleiten Sie durch 
            den gesamten Prozess der digitalen Transformation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map((service, index) => {
            const IconComponent = service.icon;
            return (
              <div key={index} className="group">
                <div className="bg-card rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-border hover:border-primary/50">
                  <div className="flex justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <IconComponent className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-3 text-center">
                    {service.title}
                  </h3>
                <p className="text-muted-foreground text-sm leading-relaxed font-light">
                  {service.description}
                </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Process Overview */}
        <div className="mt-16">
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl p-8 border border-primary/20">
            <h3 className="text-2xl font-bold text-foreground mb-6 text-center">
              Unser ganzheitlicher Ansatz
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-primary text-primary-foreground w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  1
                </div>
                <h4 className="font-semibold text-foreground mb-2">Analyse & Strategie</h4>
                <p className="text-muted-foreground text-sm">
                  Wir analysieren Ihre Ziele und entwickeln eine maßgeschneiderte Strategie.
                </p>
              </div>
              <div className="text-center">
                <div className="bg-primary text-primary-foreground w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  2
                </div>
                <h4 className="font-semibold text-foreground mb-2">Design & Entwicklung</h4>
                <p className="text-muted-foreground text-sm">
                  Professionelle Umsetzung mit modernsten Technologien und höchster Qualität.
                </p>
              </div>
              <div className="text-center">
                <div className="bg-primary text-primary-foreground w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  3
                </div>
                <h4 className="font-semibold text-foreground mb-2">Launch & Optimierung</h4>
                <p className="text-muted-foreground text-sm">
                  Erfolgreicher Start mit kontinuierlicher Optimierung und Support.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <p className="text-lg text-muted-foreground mb-6">
            Haben Sie spezielle Anforderungen oder Fragen zu unseren Leistungen?
          </p>
          <a
            href="#cta"
            className="bg-primary text-primary-foreground px-8 py-3 rounded-lg hover:bg-primary/90 transition-colors font-semibold text-lg"
          >
            Kostenlose Beratung anfragen
          </a>
        </div>
      </div>
    </section>
  );
}

