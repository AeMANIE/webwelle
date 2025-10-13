'use client';

import { useState, useEffect } from 'react';
import { Lightbulb, Check, Bot, Zap, Crown } from 'lucide-react';
import Link from 'next/link';

export default function AIAgentProducts() {
  const [isMonthly, setIsMonthly] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Verhindere Hydration-Fehler durch Client-Side-Rendering
  if (!isClient) {
    return (
      <section id="ai-agent-produkte" className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 tracking-tight">
              Automatisieren Sie Ihr Wachstum – mit WebWelle KI-Agenten!
            </h1>
            <p className="text-xl text-muted-foreground max-w-4xl mx-auto font-light leading-relaxed mb-8">
              <strong className="text-primary">WebWelle – Ihre Erfolgswelle im Netz</strong><br />
              Festpreis-Webdesign und smarte KI-Agenten für digitale Marktführer in Deutschland. Individuell. Transparent. Modern.
            </p>
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-6 max-w-3xl mx-auto mb-8">
              <h2 className="text-2xl font-semibold text-primary mb-3 flex items-center justify-center gap-2">
                <Bot className="w-6 h-6" />
                Ihr KI-Agent von WebWelle
              </h2>
              <p className="text-lg text-foreground mb-2 font-medium">— Zeit gewinnen. Kunden begeistern. Vorsprung sichern.</p>
              <p className="text-muted-foreground">
                Nutzen Sie den entscheidenden Vorsprung: Automatisieren Sie Ihr Business – rund um die Uhr, ohne Zusatzaufwand, perfekt abgestimmt auf Ihre Prozesse und Wachstumsziele.
              </p>
            </div>
            <div className="flex items-center justify-center space-x-4 mb-8">
              <span className="text-sm font-medium text-foreground">Jährlich</span>
              <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200">
                <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-1" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">Monatlich</span>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {/* Loading state für Produkte */}
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gradient-to-br from-card to-card/50 rounded-2xl p-8 border-2 border-border animate-pulse">
                <div className="h-8 bg-gray-300 rounded mb-4"></div>
                <div className="h-4 bg-gray-300 rounded mb-2"></div>
                <div className="h-4 bg-gray-300 rounded mb-6"></div>
                <div className="h-6 bg-gray-300 rounded mb-4"></div>
                <div className="space-y-3 mb-8">
                  {[1, 2, 3, 4, 5].map((j) => (
                    <div key={j} className="h-4 bg-gray-300 rounded"></div>
                  ))}
                </div>
                <div className="h-10 bg-gray-300 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="ai-agent-produkte" className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 tracking-tight">
            Automatisieren Sie Ihr Wachstum – mit WebWelle KI-Agenten!
          </h1>
          <p className="text-xl text-muted-foreground max-w-4xl mx-auto font-light leading-relaxed mb-8">
            <strong className="text-primary">WebWelle – Ihre Erfolgswelle im Netz</strong><br />
            Festpreis-Webdesign und smarte KI-Agenten für digitale Marktführer in Deutschland. Individuell. Transparent. Modern.
          </p>
          
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-6 max-w-3xl mx-auto mb-8">
            <h2 className="text-2xl font-semibold text-primary mb-3 flex items-center justify-center gap-2">
              <Bot className="w-6 h-6" />
              Ihr KI-Agent von WebWelle
            </h2>
            <p className="text-lg text-foreground mb-2 font-medium">— Zeit gewinnen. Kunden begeistern. Vorsprung sichern.</p>
            <p className="text-muted-foreground">
              Nutzen Sie den entscheidenden Vorsprung: Automatisieren Sie Ihr Business – rund um die Uhr, ohne Zusatzaufwand, perfekt abgestimmt auf Ihre Prozesse und Wachstumsziele.
            </p>
          </div>
          
          {/* Preis-Toggle */}
          <div className="flex items-center justify-center space-x-4 mb-8">
            <span className={`text-sm font-medium ${!isMonthly ? 'text-foreground' : 'text-muted-foreground'}`}>
              Jährlich
            </span>
            <button
              onClick={() => setIsMonthly(!isMonthly)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                isMonthly ? 'bg-primary' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
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
          {/* FlowWelle */}
          <div className="bg-gradient-to-br from-card to-card/50 rounded-2xl p-8 border-2 border-border relative">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-6 h-6 text-primary" />
                <h3 className="text-2xl font-bold text-foreground tracking-wide">
                  FlowWelle
                </h3>
              </div>
              <p className="text-sm text-primary font-semibold mb-2">Der smarte Einstieg</p>
              <p className="text-muted-foreground mb-4 font-light leading-relaxed">
                Automatisiert die wichtigsten Standardabläufe. Ideal für den Einstieg in die KI-Automatisierung.
              </p>
            </div>

            <div className="mb-6">
              <div className="text-3xl font-bold text-foreground mb-2">
                {isMonthly ? '99 € mtl.' : '990 € jährlich'}
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {isMonthly ? 'Monatlich kündbar' : 'Einmalzahlung, 12 Monate Laufzeit'}
              </p>
              {!isMonthly && (
                <div className="text-lg font-semibold text-foreground">
                  Oder 99 € mtl.
                </div>
              )}
              {isMonthly && (
                <div className="text-lg font-semibold text-foreground">
                  Oder 990 € jährlich
                </div>
              )}
            </div>

            <div className="space-y-3 mb-8">
              <div className="flex items-center">
                <Check className="w-4 h-4 text-primary mr-3 flex-shrink-0" />
                <span className="text-foreground text-sm">Bis zu 5 Workflow-Schritte</span>
              </div>
              <div className="flex items-center">
                <Check className="w-4 h-4 text-primary mr-3 flex-shrink-0" />
                <span className="text-foreground text-sm">Anfragemanagement & Terminbuchung</span>
              </div>
              <div className="flex items-center">
                <Check className="w-4 h-4 text-primary mr-3 flex-shrink-0" />
                <span className="text-foreground text-sm">Einfache Datenübertragung</span>
              </div>
              <div className="flex items-center">
                <Check className="w-4 h-4 text-primary mr-3 flex-shrink-0" />
                <span className="text-foreground text-sm">Support über Web, E-Mail und Chat</span>
              </div>
              <div className="flex items-center">
                <Check className="w-4 h-4 text-primary mr-3 flex-shrink-0" />
                <span className="text-foreground text-sm">Schnelle, markengerechte Antworten</span>
              </div>
              <div className="flex items-center">
                <Check className="w-4 h-4 text-primary mr-3 flex-shrink-0" />
                <span className="text-foreground text-sm">Basis-Analysen</span>
              </div>
            </div>

            <Link
              href="/buchung/flowwelle"
              className="w-full bg-secondary text-secondary-foreground py-3 px-6 rounded-lg hover:bg-secondary/90 transition-colors font-semibold text-center block"
            >
              Jetzt buchen
            </Link>
          </div>

          {/* PowerWelle */}
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-8 border-2 border-primary/20 relative">
            <div className="absolute top-4 right-4">
              <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-semibold">
                Beliebt
              </span>
            </div>
            
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Bot className="w-6 h-6 text-primary" />
                <h3 className="text-2xl font-bold text-foreground tracking-wide">
                  PowerWelle
                </h3>
              </div>
              <p className="text-sm text-primary font-semibold mb-2">Für wachsende Unternehmen</p>
              <p className="text-muted-foreground mb-4 font-light leading-relaxed">
                Umfasst komplexere Workflows mit erweiterten Integrationen. Perfekt für Unternehmen im Wachstum.
              </p>
            </div>

            <div className="mb-6">
              <div className="text-3xl font-bold text-primary mb-2">
                {isMonthly ? '179 € mtl.' : '1.790 € jährlich'}
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {isMonthly ? 'Monatlich kündbar' : 'Einmalzahlung, 12 Monate Laufzeit'}
              </p>
              {!isMonthly && (
                <div className="text-lg font-semibold text-foreground">
                  Oder 179 € mtl.
                </div>
              )}
              {isMonthly && (
                <div className="text-lg font-semibold text-foreground">
                  Oder 1.790 € jährlich
                </div>
              )}
            </div>

            <div className="space-y-3 mb-8">
              <div className="flex items-center">
                <Check className="w-4 h-4 text-primary mr-3 flex-shrink-0" />
                <span className="text-foreground text-sm">6 bis 10 Workflow-Schritte</span>
              </div>
              <div className="flex items-center">
                <Check className="w-4 h-4 text-primary mr-3 flex-shrink-0" />
                <span className="text-foreground text-sm">Mehrstufige Kommunikation & Eskalationen</span>
              </div>
              <div className="flex items-center">
                <Check className="w-4 h-4 text-primary mr-3 flex-shrink-0" />
                <span className="text-foreground text-sm">Multichannel-Support</span>
              </div>
              <div className="flex items-center">
                <Check className="w-4 h-4 text-primary mr-3 flex-shrink-0" />
                <span className="text-foreground text-sm">Erweiterte Integrationen (CRM, Buchhaltung)</span>
              </div>
              <div className="flex items-center">
                <Check className="w-4 h-4 text-primary mr-3 flex-shrink-0" />
                <span className="text-foreground text-sm">Detaillierte Analyse- und Reporting-Funktionen</span>
              </div>
              <div className="flex items-center">
                <Check className="w-4 h-4 text-primary mr-3 flex-shrink-0" />
                <span className="text-foreground text-sm">Perfekte Integration in Ihre Prozesse</span>
              </div>
            </div>

            <Link
              href="/buchung/powerwelle"
              className="w-full bg-primary text-primary-foreground py-3 px-6 rounded-lg hover:bg-primary/90 transition-colors font-semibold text-center block"
            >
              Jetzt buchen
            </Link>
          </div>

          {/* MeisterWelle */}
          <div className="bg-gradient-to-br from-card to-card/50 rounded-2xl p-8 border-2 border-border relative">
            <div className="absolute top-4 right-4">
              <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                Premium
              </span>
            </div>
            
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Crown className="w-6 h-6 text-primary" />
                <h3 className="text-2xl font-bold text-foreground tracking-wide">
                  MeisterWelle
                </h3>
              </div>
              <p className="text-sm text-primary font-semibold mb-2">Für höchste Ansprüche</p>
              <p className="text-muted-foreground mb-4 font-light leading-relaxed">
                Unbegrenzt komplexe Workflows mit umfangreicher API-Integration. Für echte Marktführer.
              </p>
            </div>

            <div className="mb-6">
              <div className="text-3xl font-bold text-foreground mb-2">
                {isMonthly ? '249 € mtl.' : '2.490 € jährlich'}
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {isMonthly ? 'Monatlich kündbar' : 'Einmalzahlung, 12 Monate Laufzeit'}
              </p>
              {!isMonthly && (
                <div className="text-lg font-semibold text-foreground">
                  Oder 249 € mtl.
                </div>
              )}
              {isMonthly && (
                <div className="text-lg font-semibold text-foreground">
                  Oder 2.490 € jährlich
                </div>
              )}
            </div>

            <div className="space-y-3 mb-8">
              <div className="flex items-center">
                <Check className="w-4 h-4 text-primary mr-3 flex-shrink-0" />
                <span className="text-foreground text-sm">Mehr als 10 Workflow-Schritte</span>
              </div>
              <div className="flex items-center">
                <Check className="w-4 h-4 text-primary mr-3 flex-shrink-0" />
                <span className="text-foreground text-sm">Großprojekte & intelligente Automation</span>
              </div>
              <div className="flex items-center">
                <Check className="w-4 h-4 text-primary mr-3 flex-shrink-0" />
                <span className="text-foreground text-sm">Individuelle Anpassungen</span>
              </div>
              <div className="flex items-center">
                <Check className="w-4 h-4 text-primary mr-3 flex-shrink-0" />
                <span className="text-foreground text-sm">Umfangreiche API- und Systemanbindung</span>
              </div>
              <div className="flex items-center">
                <Check className="w-4 h-4 text-primary mr-3 flex-shrink-0" />
                <span className="text-foreground text-sm">Vollautomatisierte Premium-Kommunikation</span>
              </div>
              <div className="flex items-center">
                <Check className="w-4 h-4 text-primary mr-3 flex-shrink-0" />
                <span className="text-foreground text-sm">Monatliche Strategie- und Performance-Auswertung</span>
              </div>
              <div className="flex items-center">
                <Check className="w-4 h-4 text-primary mr-3 flex-shrink-0" />
                <span className="text-foreground text-sm">Kontinuierliche Optimierung</span>
              </div>
            </div>

            <Link
              href="/buchung/meisterwelle"
              className="w-full bg-secondary text-secondary-foreground py-3 px-6 rounded-lg hover:bg-secondary/90 transition-colors font-semibold text-center block"
            >
              Jetzt buchen
            </Link>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="mt-16 text-center">
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-8 max-w-5xl mx-auto">
            <h3 className="text-2xl font-semibold text-primary mb-6 flex items-center justify-center gap-2">
              <Lightbulb className="w-6 h-6" />
              Warum einen KI-Agenten von WebWelle wählen?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              <div className="space-y-3">
                <div className="flex items-center">
                  <Check className="w-5 h-5 text-primary mr-3 flex-shrink-0" />
                  <span className="text-foreground">Kundengewinnung und -service automatisiert – Tag und Nacht</span>
                </div>
                <div className="flex items-center">
                  <Check className="w-5 h-5 text-primary mr-3 flex-shrink-0" />
                  <span className="text-foreground">Mehr Zeit für die echten Wachstumsaufgaben</span>
                </div>
                <div className="flex items-center">
                  <Check className="w-5 h-5 text-primary mr-3 flex-shrink-0" />
                  <span className="text-foreground">Personalisierte Beratung & proaktive Angebote</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center">
                  <Check className="w-5 h-5 text-primary mr-3 flex-shrink-0" />
                  <span className="text-foreground">Skalierbar und lernfähig – jeder Agent wächst mit Ihrem Unternehmen</span>
                </div>
                <div className="flex items-center">
                  <Check className="w-5 h-5 text-primary mr-3 flex-shrink-0" />
                  <span className="text-foreground">Modernste Technologien, transparente Konditionen</span>
                </div>
                <div className="flex items-center">
                  <Check className="w-5 h-5 text-primary mr-3 flex-shrink-0" />
                  <span className="text-foreground">Regionale Expertise aus dem Allgäu</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-12 text-center">
          <div className="bg-gradient-to-r from-primary/20 to-primary/10 border border-primary/30 rounded-lg p-8 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-foreground mb-4">
              Starten Sie Ihre erfolgreiche KI-Offensive!
            </h3>
            <p className="text-lg text-muted-foreground mb-6">
              Buchen Sie Ihr Wunschpaket und erleben Sie, wie Ihr Business neue Kundengruppen erreicht und nachhaltig Umsatz steigert!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/buchung/flowwelle"
                className="bg-primary text-primary-foreground py-3 px-8 rounded-lg hover:bg-primary/90 transition-colors font-semibold"
              >
                FlowWelle buchen
              </Link>
              <Link
                href="/buchung/powerwelle"
                className="bg-secondary text-secondary-foreground py-3 px-8 rounded-lg hover:bg-secondary/90 transition-colors font-semibold"
              >
                PowerWelle buchen
              </Link>
              <Link
                href="/buchung/meisterwelle"
                className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-3 px-8 rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-colors font-semibold"
              >
                MeisterWelle buchen
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
