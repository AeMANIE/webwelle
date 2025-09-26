import { Lightbulb } from 'lucide-react';

export default function Products() {
  return (
    <section id="produkte" className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-tight">
            Websites nach Maß – Zwei Modelle, zwei Wege zum Erfolg
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto font-light leading-relaxed">
            Wählen Sie das perfekte Paket für Ihre Bedürfnisse. Alle Preise inkl. Domain, Hosting & Support.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Next.js Premium Package */}
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-8 border-2 border-primary/20 relative">
            <div className="absolute top-4 right-4">
              <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-semibold">
                Premium
              </span>
            </div>
            
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-foreground mb-2 tracking-wide">
                React / Next.js Website
              </h3>
              <p className="text-muted-foreground mb-4 font-light leading-relaxed">
                Für maximale Geschwindigkeit, höchste Individualisierbarkeit und modernstes Nutzererlebnis. 
                Ideal für Unternehmen mit speziellen Anforderungen und maximalen Performance-Zielen.
              </p>
            </div>

            <div className="mb-6">
              <div className="text-3xl font-bold text-primary mb-2">
                Ab 2.490 €
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Einmalzahlung, 24 Monate Laufzeit
              </p>
              <div className="text-lg font-semibold text-foreground">
                Oder 119 € mtl.
              </div>
              <p className="text-sm text-muted-foreground">
                24 Monate, inkl. 20% Aufschlag
              </p>
            </div>

            <div className="space-y-3 mb-8">
              <div className="flex items-center">
                <span className="text-primary mr-3">✓</span>
                <span className="text-foreground">Extreme Geschwindigkeit & Performance</span>
              </div>
              <div className="flex items-center">
                <span className="text-primary mr-3">✓</span>
                <span className="text-foreground">Vollständig individualisierbar</span>
              </div>
              <div className="flex items-center">
                <span className="text-primary mr-3">✓</span>
                <span className="text-foreground">Zukunftssicher & skalierbar</span>
              </div>
              <div className="flex items-center">
                <span className="text-primary mr-3">✓</span>
                <span className="text-foreground">SEO-optimiert</span>
              </div>
              <div className="flex items-center">
                <span className="text-primary mr-3">✓</span>
                <span className="text-foreground">E-Commerce Integration</span>
              </div>
            </div>

            <a
              href="#cta"
              className="w-full bg-primary text-primary-foreground py-3 px-6 rounded-lg hover:bg-primary/90 transition-colors font-semibold text-center block"
            >
              Jetzt buchen
            </a>
          </div>

          {/* WordPress Classic Package */}
          <div className="bg-gradient-to-br from-card to-card/50 rounded-2xl p-8 border-2 border-border">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-foreground mb-2 tracking-wide">
                WordPress Website
              </h3>
              <p className="text-muted-foreground mb-4 font-light leading-relaxed">
                Für preisbewusste Kunden, die schnell und einfach starten wollen. 
                Perfekt für kleine Unternehmen, Praxen oder Dienstleister.
              </p>
            </div>

            <div className="mb-6">
              <div className="text-3xl font-bold text-foreground mb-2">
                Ab 1.290 €
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Einmalzahlung, 24 Monate Laufzeit
              </p>
              <div className="text-lg font-semibold text-foreground">
                Oder 65 € mtl.
              </div>
              <p className="text-sm text-muted-foreground">
                24 Monate, inkl. 20% Aufschlag
              </p>
            </div>

            <div className="space-y-3 mb-8">
              <div className="flex items-center">
                <span className="text-primary mr-3">✓</span>
                <span className="text-foreground">Schneller Start & einfache Bedienung</span>
              </div>
              <div className="flex items-center">
                <span className="text-primary mr-3">✓</span>
                <span className="text-foreground">Responsive Design</span>
              </div>
              <div className="flex items-center">
                <span className="text-primary mr-3">✓</span>
                <span className="text-foreground">SEO-Grundausstattung</span>
              </div>
              <div className="flex items-center">
                <span className="text-primary mr-3">✓</span>
                <span className="text-foreground">Content-Management</span>
              </div>
              <div className="flex items-center">
                <span className="text-primary mr-3">✓</span>
                <span className="text-foreground">Kostengünstig & effizient</span>
              </div>
            </div>

            <a
              href="#cta"
              className="w-full bg-secondary text-secondary-foreground py-3 px-6 rounded-lg hover:bg-secondary/90 transition-colors font-semibold text-center block"
            >
              Jetzt buchen
            </a>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-12 text-center">
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-6 max-w-4xl mx-auto">
            <h3 className="text-lg font-semibold text-primary mb-2 flex items-center justify-center gap-2">
              <Lightbulb className="w-5 h-5" />
              Individuelle Erweiterungen möglich
            </h3>
            <p className="text-muted-foreground">
              Beide Pakete können jederzeit durch Zusatzfunktionen, Automatisierung oder KI-Lösungen erweitert werden. 
              Wir beraten Sie gerne zu Ihren spezifischen Anforderungen.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

