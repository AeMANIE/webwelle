'use client';

import { useState, useEffect } from 'react';
import { Lightbulb, Check } from 'lucide-react';
import Link from 'next/link';

export default function Products() {
  const [isMonthly, setIsMonthly] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);


  return (
    <section id="produkte" className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-tight">
            Webdesign-Pakete mit Festwert
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto font-light leading-relaxed mb-4">
            Ihre Website wird zu Ihrem zuverlässigsten Verkäufer
          </p>
          <p className="text-lg text-primary font-semibold mb-8">
            „Webdesign ist Unternehmenspsychologie" → Expert Authority.
          </p>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto font-light leading-relaxed mb-8">
            Drei Erfolgspakete – maßgeschneidert für jedes Unternehmensstadium.
          </p>
          
          {/* Preis-Toggle */}
          <div className="flex items-center justify-center space-x-4 mb-8">
            <span className={`text-sm font-medium ${!isMonthly ? 'text-foreground' : 'text-muted-foreground'}`}>
              Jährlich
            </span>
            <button
              onClick={() => setIsMonthly(!isMonthly)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                isMonthly ? 'bg-primary' : 'bg-muted'
              }`}
              aria-label={`Preisanzeige umschalten auf ${isMonthly ? 'Jährlich' : 'Monatlich'}`}
              aria-pressed={isMonthly}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-foreground transition-transform ${
                  isMonthly ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${isMonthly ? 'text-foreground' : 'text-muted-foreground'}`}>
              Monatlich
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {/* StarterWelle */}
          <div className="bg-gradient-to-br from-card to-card/50 rounded-2xl p-8 border-2 border-border relative">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-foreground mb-2 tracking-wide">
                StarterWelle
              </h3>
              <p className="text-sm text-primary font-semibold mb-2">– Ihr schneller Online‑Start.</p>
              <p className="text-muted-foreground mb-4 font-light leading-relaxed">
                Ideal für kleine Unternehmen, Gründer oder Kampagnen.
              </p>
            </div>

            <div className="mb-6">
              <div className="text-3xl font-bold text-foreground mb-2">
                {isMounted ? (isMonthly ? '77 € mtl.' : '840 € jährlich') : '77 € mtl.'}
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {isMounted ? (isMonthly ? '24 Monate, Nettopreis' : 'Netto Jährlich,  24 Monate Laufzeit') : '24 Monate, Nettopreis'}
              </p>
            </div>

            <div className="space-y-3 mb-8">
              <div className="flex items-center">
                <Check className="w-4 h-4 text-primary mr-3 flex-shrink-0" />
                <span className="text-foreground text-sm">Individuell gestaltete Onepage-Website</span>
              </div>
              <div className="flex items-center">
                <Check className="w-4 h-4 text-primary mr-3 flex-shrink-0" />
                <span className="text-foreground text-sm">Rechtliches Basispaket (Impressum, Datenschutz, Cookie-Banner)</span>
              </div>
              <div className="flex items-center">
                <Check className="w-4 h-4 text-primary mr-3 flex-shrink-0" />
                <span className="text-foreground text-sm">Kontaktformular</span>
              </div>
              <div className="flex items-center">
                <Check className="w-4 h-4 text-primary mr-3 flex-shrink-0" />
                <span className="text-foreground text-sm">Hosting & Wartung inklusive</span>
              </div>
              <div className="flex items-center">
                <Check className="w-4 h-4 text-primary mr-3 flex-shrink-0" />
                <span className="text-foreground text-sm">Backup alle 2 Wochen</span>
              </div>
              <div className="flex items-center">
                <Check className="w-4 h-4 text-primary mr-3 flex-shrink-0" />
                <span className="text-foreground text-sm">Domain (.de oder .com)</span>
              </div>
              <div className="flex items-center">
                <Check className="w-4 h-4 text-primary mr-3 flex-shrink-0" />
                <span className="text-foreground text-sm">E-Mail-Postfach (z.B. info@deine-firma.de)</span>
              </div>
            </div>

            <Link
              href={`/buchung/starterwelle?billing=${isMonthly ? 'monthly' : 'yearly'}`}
              className="w-full bg-secondary text-secondary-foreground py-3 px-6 rounded-lg hover:bg-secondary/90 transition-colors font-semibold text-center block"
            >
              Wellenstart 
            </Link>
          </div>

          {/* BusinessWelle */}
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-8 border-2 border-primary/20 relative">
            <div className="absolute top-4 right-4">
              <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-semibold">
                Beliebt
              </span>
            </div>
            
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-foreground mb-2 tracking-wide">
                BusinessWelle
              </h3>
              <p className="text-sm text-primary font-semibold mb-2">– Beliebt bei Wachstumsunternehmen.</p>
              <p className="text-muted-foreground mb-4 font-light leading-relaxed">
                Perfekt für wachsende Unternehmen – SEO-Basis, modernes Branding und Animationen.
              </p>
            </div>

            <div className="mb-6">
              <div className="text-3xl font-bold text-primary mb-2">
                {isMounted ? (isMonthly ? '139 € mtl.' : '1.520 € jährlich') : '139 € mtl.'}
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {isMounted ? (isMonthly ? '24 Monate, Nettopreis' : 'Netto Jährlich,  24 Monate Laufzeit') : '24 Monate, Nettopreis'}
              </p>
            </div>

            <div className="space-y-3 mb-8">
              <div className="flex items-center">
                <Check className="w-4 h-4 text-primary mr-3 flex-shrink-0" />
                <span className="text-foreground text-sm">Komplett individuell erstellte Website (bis zu 3 Seiten)</span>
              </div>
              <div className="flex items-center">
                <Check className="w-4 h-4 text-primary mr-3 flex-shrink-0" />
                <span className="text-foreground text-sm">Rechtliches Komplettpaket (Impressum, Datenschutz & Cookie-Banner)</span>
              </div>
              <div className="flex items-center">
                <Check className="w-4 h-4 text-primary mr-3 flex-shrink-0" />
                <span className="text-foreground text-sm">Kontaktformular</span>
              </div>
              <div className="flex items-center">
                <Check className="w-4 h-4 text-primary mr-3 flex-shrink-0" />
                <span className="text-foreground text-sm">Hosting & technische Wartung</span>
              </div>
              <div className="flex items-center">
                <Check className="w-4 h-4 text-primary mr-3 flex-shrink-0" />
                <span className="text-foreground text-sm">Backup alle 2 Wochen</span>
              </div>
              <div className="flex items-center">
                <Check className="w-4 h-4 text-primary mr-3 flex-shrink-0" />
                <span className="text-foreground text-sm">Domain (.de oder .com) inklusive</span>
              </div>
              <div className="flex items-center">
                <Check className="w-4 h-4 text-primary mr-3 flex-shrink-0" />
                <span className="text-foreground text-sm">E-Mail-Postfach (z.B. info@deine-firma.de)</span>
              </div>
              <div className="flex items-center">
                <Check className="w-4 h-4 text-primary mr-3 flex-shrink-0" />
                <span className="text-foreground text-sm">SEO-freundliche Grundoptimierung</span>
              </div>
              <div className="flex items-center">
                <Check className="w-4 h-4 text-primary mr-3 flex-shrink-0" />
                <span className="text-foreground text-sm">Dezente Animationen und visuelle Highlights</span>
              </div>
              <div className="flex items-center">
                <Check className="w-4 h-4 text-primary mr-3 flex-shrink-0" />
                <Link 
                  href="/ai-agent"
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-1 rounded-full text-sm font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
                >
                  KI-Agenten Fähig
                </Link>
              </div>
            </div>

            <Link
              href={`/buchung/businesswelle?billing=${isMonthly ? 'monthly' : 'yearly'}`}
              className="w-full bg-primary text-primary-foreground py-3 px-6 rounded-lg hover:bg-primary/90 transition-colors font-semibold text-center block"
            >
              Wellenstart
            </Link>
          </div>

          {/* ErfolgsWelle */}
          <div className="bg-gradient-to-br from-card to-card/50 rounded-2xl p-8 border-2 border-border relative">
            <div className="absolute top-4 right-4">
              <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                Premium
              </span>
            </div>
            
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-foreground mb-2 tracking-wide">
                ErfolgsWelle
              </h3>
              <p className="text-sm text-primary font-semibold mb-2">– Digitale Exzellenz für Marktführer.</p>
              <p className="text-muted-foreground mb-4 font-light leading-relaxed">
                Für ambitionierte Unternehmer, die digital skalieren wollen – volle SEO-Strategie, KI-Integration & Performance-Auswertung.
              </p>
            </div>

            <div className="mb-6">
              <div className="text-3xl font-bold text-foreground mb-2">
                {isMounted ? (isMonthly ? '278 € mtl.' : '3.289 € jährlich') : '278 € mtl.'}
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {isMounted ? (isMonthly ? '24 Monate, Nettopreis' : 'Netto Jährlich,  24 Monate Laufzeit') : '24 Monate, Nettopreis'}
              </p>
            </div>

            <div className="space-y-3 mb-8">
              <div className="flex items-center">
                <Check className="w-4 h-4 text-primary mr-3 flex-shrink-0" />
                <span className="text-foreground text-sm">Individuell konzipierte Premium-Website (bis zu 5 Seiten)</span>
              </div>
              <div className="flex items-center">
                <Check className="w-4 h-4 text-primary mr-3 flex-shrink-0" />
                <span className="text-foreground text-sm">Rechtliches Rundum-Paket (Impressum, Datenschutz, Cookie-Management)</span>
              </div>
              <div className="flex items-center">
                <Check className="w-4 h-4 text-primary mr-3 flex-shrink-0" />
                <span className="text-foreground text-sm">Interaktionsformulare</span>
              </div>
              <div className="flex items-center">
                <Check className="w-4 h-4 text-primary mr-3 flex-shrink-0" />
                <span className="text-foreground text-sm">Hosting & Premium-Wartung, inkl. Überwachung & Updates</span>
              </div>
              <div className="flex items-center">
                <Check className="w-4 h-4 text-primary mr-3 flex-shrink-0" />
                <span className="text-foreground text-sm">Tägliches Backup</span>
              </div>
              <div className="flex items-center">
                <Check className="w-4 h-4 text-primary mr-3 flex-shrink-0" />
                <span className="text-foreground text-sm">Domain (.de oder .com) inklusive</span>
              </div>
              <div className="flex items-center">
                <Check className="w-4 h-4 text-primary mr-3 flex-shrink-0" />
                <span className="text-foreground text-sm">E-Mail-Postfach (z.B. info@deine-firma.de)</span>
              </div>
              <div className="flex items-center">
                <Check className="w-4 h-4 text-primary mr-3 flex-shrink-0" />
                <span className="text-foreground text-sm">Vollständige SEO-Strategie (OnPage & OffPage)</span>
              </div>
              <div className="flex items-center">
                <Check className="w-4 h-4 text-primary mr-3 flex-shrink-0" />
                <span className="text-foreground text-sm">Premium-Animationen, Scroll- und Ladeeffekte</span>
              </div>
              <div className="flex items-center">
                <Check className="w-4 h-4 text-primary mr-3 flex-shrink-0" />
                <span className="text-foreground text-sm">Professionelle Bildergalerie</span>
              </div>
              <div className="flex items-center">
                <Check className="w-4 h-4 text-primary mr-3 flex-shrink-0" />
                <span className="text-foreground text-sm">Monatliche Performance-Auswertung & kontinuierliche Optimierung</span>
              </div>
              <div className="flex items-center">
                <Check className="w-4 h-4 text-primary mr-3 flex-shrink-0" />
                <Link 
                  href="/ai-agent"
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-1 rounded-full text-sm font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
                >
                  KI-Agenten Fähig
                </Link>
              </div>
            </div>

            <Link
              href={`/buchung/erfolgswelle?billing=${isMonthly ? 'monthly' : 'yearly'}`}
              className="w-full bg-secondary text-secondary-foreground py-3 px-6 rounded-lg hover:bg-secondary/90 transition-colors font-semibold text-center block"
            >
              Wellenstart
            </Link>
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
              Alle Pakete können jederzeit durch Zusatzfunktionen, Automatisierung oder KI-Lösungen erweitert werden. 
              Wir beraten Sie gerne zu Ihren spezifischen Anforderungen.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}