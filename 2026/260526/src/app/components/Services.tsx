import { Palette, Smartphone, Search, ShoppingCart, Bot, Target, Server, FileText } from 'lucide-react';

export default function Services() {
  const services = [
    {
      icon: Palette,
      title: "Individuelles Webdesign",
      description: "Maßgeschneiderte Website, die Ihr Unternehmen authentisch präsentiert – keine Baukastenlösung."
    },
    {
      icon: Smartphone,
      title: "Responsive Design",
      description: "Optimiert für Smartphone, Tablet und Desktop – modernes, barrierearmes UI für alle Geräte."
    },
    {
      icon: Search,
      title: "SEO & Performance-Optimierung",
      description: "Schnelle Ladezeiten und hohe Google-Bewertung durch strukturierte, keywordbasierte Inhalte."
    },
    {
      icon: ShoppingCart,
      title: "E-Commerce & Online-Shops",
      description: "Individuelle Online-Shop-Lösungen mit intuitiver Benutzerführung, klarer Kaufpsychologie und sicheren Zahlungen."
    },
    {
      icon: Bot,
      title: "Automatisierte Workflows & KI-Lösungen",
      description: "Von Terminbuchung bis Lead-Mail – digitale Prozesse, die Zeit sparen und Umsatz steigern."
    },
    {
      icon: Target,
      title: "Branding & Corporate Design",
      description: "Logoentwicklung, Farb- und Typografie-Systeme, CI-Handbuch und digitales Brand Management."
    },
    {
      icon: Server,
      title: "Hosting & Wartung",
      description: "Sichere, DSGVO-konforme Server in Deutschland mit Monitoring, Updates und regelmäßigen Backups."
    },
    {
      icon: FileText,
      title: "Content & Werbetexte",
      description: "Professionelle Texte, die verkaufen – emotional, SEO-stark und psychologisch fundiert."
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
            Als erfahrene Webdesign-Agentur in Kempten entwickeln wir Websites, die nicht nur gut aussehen, sondern auf Google sichtbar sind.  
            Mit Fokus auf Ladezeit, Nutzererlebnis und lokale Auffindbarkeit bringen wir Ihr Unternehmen im Allgäu digital nach vorne.
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
              Unser Prozess – zuverlässig bis zur Live-Schaltung
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-primary text-primary-foreground w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  1
                </div>
                <h4 className="font-semibold text-foreground mb-2">Analyse & Strategie</h4>
                <p className="text-muted-foreground text-sm">
                  Wir identifizieren Chancen in Ihrer Branche und definieren konkrete Ziele.
                </p>
              </div>
              <div className="text-center">
                <div className="bg-primary text-primary-foreground w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  2
                </div>
                <h4 className="font-semibold text-foreground mb-2">Design & Entwicklung</h4>
                <p className="text-muted-foreground text-sm">
                  Ihr Design wird individuell umgesetzt, technisch optimiert und SEO-konform strukturiert.
                </p>
              </div>
              <div className="text-center">
                <div className="bg-primary text-primary-foreground w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  3
                </div>
                <h4 className="font-semibold text-foreground mb-2">Launch & Betreuung</h4>
                <p className="text-muted-foreground text-sm">
                  Nach dem Go-Live optimieren wir Ihre Website kontinuierlich – für Performance und Ranking.
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
            Jetzt Erfolgswelle starten
          </a>
        </div>
      </div>
    </section>
  );
}

