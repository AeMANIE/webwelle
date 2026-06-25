import type { Metadata } from 'next';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ScrollToTop from '../components/ScrollToTop';
import CookieBanner from '../components/CookieBanner';
import { Check, Phone, Clock, Shield, Zap } from 'lucide-react';
import { ROBOTS_NOINDEX } from '@/lib/seo-index';

// Lazy load nicht-kritische Komponenten für bessere Performance (nach initial render)
const AIVoiceCheckout = dynamic(() => import('../components/AIVoiceCheckout'), {
  loading: () => <div className="text-center py-4 text-muted-foreground">Lade Checkout...</div>,
});

const AIVoiceFAQ = dynamic(() => import('../components/AIVoiceFAQ'), {
  loading: () => <div className="text-center py-4 text-muted-foreground">Lade FAQ...</div>,
});

const AIVoiceSoundwaveWrapper = dynamic(() => import('../components/AIVoiceSoundwaveWrapper'), {
  loading: () => null,
});

export const metadata: Metadata = {
  title: "Voice AI Telefonassistent | 24/7 digitaler Mitarbeiter | WebWelle",
  description: "Voice-AI für Unternehmen – Ihr digitaler Telefon-Mitarbeiter. Effizient. Skalierbar. Immer erreichbar. Terminbuchung, Angebotsnachfrage, Lead-Qualifizierung – inbound wie outbound.",
  keywords: "Voice AI, Telefonassistent, KI am Telefon, digitaler Mitarbeiter, Automatisierung, Terminbuchung, 24/7 erreichbar, DSGVO-konform, WebWelle, AI Voice Assistant, Telefon-Automatisierung",
  authors: [{ name: "WebWelle" }],
  creator: "WebWelle",
  publisher: "WebWelle",
  robots: ROBOTS_NOINDEX,
  openGraph: {
    type: 'website',
    locale: 'de_DE',
    url: 'https://webwelle.com/ai-voice',
    siteName: 'WebWelle',
    title: 'Voice-AI für Unternehmen – Ihr digitaler Telefon-Mitarbeiter',
    description: 'Effizient. Skalierbar. Immer erreichbar. Ihr Voice-AI übernimmt zuverlässig alle Anrufe und erledigt proaktiv Aufgaben.',
    images: [
      {
        url: 'https://webwelle.com/logo.png',
        width: 1200,
        height: 630,
        alt: 'WebWelle Voice-AI',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Voice-AI für Unternehmen – Ihr digitaler Telefon-Mitarbeiter',
    description: 'Effizient. Skalierbar. Immer erreichbar. Ihr Voice-AI übernimmt zuverlässig alle Anrufe.',
    images: ['https://webwelle.com/logo.png'],
  },
  alternates: {
    canonical: 'https://webwelle.com/ai-voice',
  },
  category: 'Technology',
};

export default function AIVoicePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Structured Data (Schema.org) für SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "Service",
              "serviceType": "Voice AI Telefonassistent",
              "name": "Voice AI Telefonassistent von WebWelle",
              "description": "Ihr digitaler Telefon-Mitarbeiter erledigt Anrufe & Aufgaben, 24/7 erreichbar. Skalierbar, DSGVO-konform, minutengenau.",
              "url": "https://webwelle.com/ai-voice",
              "provider": {
                "@type": "Organization",
                "name": "WebWelle",
                "url": "https://webwelle.com",
                "logo": "https://webwelle.com/logo.png",
                "address": {
                  "@type": "PostalAddress",
                  "addressCountry": "DE",
                  "addressLocality": "Kempten",
                  "addressRegion": "Allgäu"
                }
              },
              "areaServed": {
                "@type": "Country",
                "name": "Deutschland"
              },
              "hasOfferCatalog": {
                "@type": "OfferCatalog",
                "name": "Voice AI Pakete",
                "itemListElement": [
                  {
                    "@type": "Offer",
                    "itemOffered": {
                      "@type": "Service",
                      "name": "Mini Job AI-Assistent",
                      "description": "399 Minuten/Monat für Einsteiger und Einzelunternehmen"
                    },
                    "price": "399",
                    "priceCurrency": "EUR",
                    "priceSpecification": {
                      "@type": "UnitPriceSpecification",
                      "price": "399",
                      "priceCurrency": "EUR",
                      "billingIncrement": "P1M"
                    }
                  },
                  {
                    "@type": "Offer",
                    "itemOffered": {
                      "@type": "Service",
                      "name": "Midi Job AI-Assistenz",
                      "description": "999 Minuten/Monat für wachsende Unternehmen und Teams"
                    },
                    "price": "999",
                    "priceCurrency": "EUR",
                    "priceSpecification": {
                      "@type": "UnitPriceSpecification",
                      "price": "999",
                      "priceCurrency": "EUR",
                      "billingIncrement": "P1M"
                    }
                  },
                  {
                    "@type": "Offer",
                    "itemOffered": {
                      "@type": "Service",
                      "name": "Festangestellt AI-Agent",
                      "description": "1.999 Minuten/Monat für Vieltelefonierer und Servicezentren"
                    },
                    "price": "1999",
                    "priceCurrency": "EUR",
                    "priceSpecification": {
                      "@type": "UnitPriceSpecification",
                      "price": "1999",
                      "priceCurrency": "EUR",
                      "billingIncrement": "P1M"
                    }
                  }
                ]
              },
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.9",
                "bestRating": "5",
                "worstRating": "1",
                "reviewCount": "25"
              }
            },
            {
              "@context": "https://schema.org",
              "@type": "Review",
              "itemReviewed": {
                "@type": "Service",
                "name": "Voice AI Telefonassistent von WebWelle",
                "url": "https://webwelle.com/ai-voice"
              },
              "reviewRating": {
                "@type": "Rating",
                "ratingValue": "4.9",
                "bestRating": "5",
                "worstRating": "1"
              },
              "author": {
                "@type": "Organization",
                "name": "WebWelle Kunden"
              },
              "reviewBody": "Professioneller Voice-AI Service mit exzellenter Qualität und zuverlässigem Support."
            }
          ])
        }}
      />
      <Header />
      <main>
        {/* Hero Section */}
        <section className="py-32 md:py-48 bg-gradient-to-b from-primary/10 via-background to-background relative min-h-screen flex items-center justify-center overflow-hidden">
          {/* Canva im Hintergrund - opacity 100, viel größer, zentriert */}
          <div className="absolute inset-0 overflow-hidden z-0">
            <AIVoiceSoundwaveWrapper />
          </div>
          
          {/* Text komplett zentral in der Mitte der Canva */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-foreground mb-3 sm:mb-4 md:mb-6 tracking-tight">
                Voice-AI bei WebWelle
              </h1>
              <p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-xl text-muted-foreground mb-2 sm:mb-3 md:mb-4 font-light">
                Ihr digitaler Mitarbeiter am Telefon
              </p>
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-2xl font-semibold text-primary mb-4 sm:mb-6 md:mb-8">
                Effizient. Skalierbar. Immer erreichbar.
              </p>
              <div className="flex flex-wrap justify-center gap-2 sm:gap-4 text-xs sm:text-sm md:text-base lg:text-base xl:text-base text-muted-foreground px-2">
                <span>Die Stimme, die für Sie arbeitet – digital. effizient. menschlich.</span>
              </div>
            </div>
          </div>
        </section>

        {/* Value Proposition */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                Ihre Stimme am Telefon – KI, die Aufgaben für Sie erledigt
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Stellen Sie sich einen Mitarbeiter vor, der nie schläft, nie Urlaub nimmt und jedes Gespräch nach Ihren Vorgaben führt.  
                Mit Voice-AI von WebWelle gewinnt Ihr Unternehmen genau das:  
                Ihr digitaler Telefon-Assistent übernimmt zuverlässig alle Anrufe, kann selbstständig Kunden anrufen und erledigt proaktiv Aufgaben wie Terminbuchung, Angebotsnachfrage oder Informationsabgleich – inbound wie outbound. Sie bestimmen, ob Ihre KI kontaktiert wird oder für Sie aktiv wird.
              </p>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 bg-card">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-12">
              Was kann Ihr Voice-AI-Mitarbeiter für Sie tun?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-background p-6 rounded-xl border border-border">
                <Phone className="w-10 h-10 text-primary mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  Telefonanrufe entgegennehmen und führen
                </h3>
                <p className="text-muted-foreground">
                  Begrüßt, beantwortet Fragen, nimmt Bestellungen auf, bucht Termine, gibt Auskünfte, qualifiziert Leads oder leitet weiter.
                </p>
              </div>
              
              <div className="bg-background p-6 rounded-xl border border-border">
                <Zap className="w-10 h-10 text-primary mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  Proaktive Aufgaben-Erledigung
                </h3>
                <p className="text-muted-foreground">
                  Führt selbstständig Rückrufe, Terminvereinbarungen, Nachfragen oder Umfragen aus – ganz nach Ihrem Workflow.
                </p>
              </div>
              
              <div className="bg-background p-6 rounded-xl border border-border">
                <Clock className="w-10 h-10 text-primary mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  24/7 Erreichbarkeit
                </h3>
                <p className="text-muted-foreground">
                  Kein verpasster Anruf, volle Auslastung auch bei Engpässen.
                </p>
              </div>
              
              <div className="bg-background p-6 rounded-xl border border-border">
                <Zap className="w-10 h-10 text-primary mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  Intelligente Gesprächsführung
                </h3>
                <p className="text-muted-foreground">
                  Erkennt Anliegen und steuert auch komplexe Dialogszenarien.
                </p>
              </div>
              
              <div className="bg-background p-6 rounded-xl border border-border">
                <Shield className="w-10 h-10 text-primary mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  Integration in Ihre Prozesse
                </h3>
                <p className="text-muted-foreground">
                  Anbindung an CRM, Mail, Kalender, Shop möglich – ohne IT-Hürden.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pakete */}
        <section id="pakete" className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                Unsere Voice-AI-Pakete – flexibel und minutengenau
              </h2>
              <p className="text-lg text-muted-foreground mb-4">
                <strong>Unterschied: Nur die enthaltenen Gesprächsminuten pro Monat. Funktionen immer voll!</strong>
              </p>
              <p className="text-muted-foreground">
                Alle Preise netto, pro AI-Mitarbeiter und Monat. Zusätzlich gebuchte Minuten werden flexibel und transparent abgerechnet; Staffelpreise für Vielnutzer auf Anfrage.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              {/* Mini Job */}
              <div className="bg-card rounded-2xl p-8 border border-border hover:shadow-lg transition-shadow">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-foreground mb-2">Mini Job AI-Assistent</h3>
                  <p className="text-muted-foreground mb-4">Einsteiger, Einzelunternehmen</p>
                  <div className="text-3xl font-bold text-primary mb-2">399 €</div>
                  <div className="text-sm text-muted-foreground">pro Monat</div>
                  <div className="mt-4 text-sm text-foreground">
                    <strong>399 Minuten/Monat</strong>
                  </div>
                </div>
                <AIVoiceCheckout
                  packageType="minijob"
                  packageName="Mini Job AI-Assistent"
                  packageDescription="Perfekt für Einsteiger und Einzelunternehmen"
                  price={399}
                  minutes={399}
                  showEinrichtungspaket={true}
                />
              </div>

              {/* Midi Job */}
              <div className="bg-card rounded-2xl p-8 border-2 border-primary hover:shadow-lg transition-shadow">
                <div className="text-center mb-2">
                  <span className="inline-block bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full mb-4">
                    Beliebt
                  </span>
                </div>
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-foreground mb-2">Midi Job AI-Assistenz</h3>
                  <p className="text-muted-foreground mb-4">Wachsende Unternehmen, Teams</p>
                  <div className="text-3xl font-bold text-primary mb-2">999 €</div>
                  <div className="text-sm text-muted-foreground">pro Monat</div>
                  <div className="mt-4 text-sm text-foreground">
                    <strong>1750 Minuten/Monat</strong>
                  </div>
                </div>
                <AIVoiceCheckout
                  packageType="midijob"
                  packageName="Midi Job AI-Assistenz"
                  packageDescription="Ideal für wachsende Unternehmen und Teams"
                  price={999}
                  minutes={1750}
                  showEinrichtungspaket={true}
                />
              </div>

              {/* Festangestellt */}
              <div className="bg-card rounded-2xl p-8 border border-border hover:shadow-lg transition-shadow">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-foreground mb-2">Festangestellt AI-Agent</h3>
                  <p className="text-muted-foreground mb-4">Vieltelefonierer, Servicezentren</p>
                  <div className="text-3xl font-bold text-primary mb-2">1.999 €</div>
                  <div className="text-sm text-muted-foreground">pro Monat</div>
                  <div className="mt-4 text-sm text-foreground">
                    <strong>4.000 Minuten/Monat</strong>
                  </div>
                </div>
                <AIVoiceCheckout
                  packageType="festangestellt"
                  packageName="Festangestellt AI-Agent"
                  packageDescription="Für Vieltelefonierer und Servicezentren"
                  price={1999}
                  minutes={4000}
                  showEinrichtungspaket={true}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Einrichtungspaket */}
        <section className="py-16 bg-card">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-background rounded-2xl p-8 border border-border">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-foreground mb-4">
                  Einrichtungspaket Voice-AI – Alles aus einer Hand
                </h2>
                <p className="text-lg text-muted-foreground mb-6">
                  Für einen perfekten Start empfehlen wir unser Einrichtungspaket
                </p>
              </div>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-primary mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">Professionelle Analyse und Konfiguration passend zu Ihrem Prozess</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-primary mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">Individuelle Gestaltung aller Dialogmodelle</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-primary mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">Anbindung an Ihre Systeme (Kalender, CRM, E-Mail usw.)</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-primary mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">Aufsetzen von Rufnummern, Weiterleitungen und Voicemail</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-primary mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">Definition von Aufgaben & Workflows, Begrüßung, Lead-Qualifizierung etc.</span>
                </li>
              </ul>

              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-4">Einmalig: 1.499 € (zzgl. MwSt.)</div>
                <p className="text-muted-foreground mb-6">
                  <strong>Ihr Vorteil:</strong> Kein technischer Aufwand, direkt startklar.<br />
                  Jetzt Einrichtungspaket sichern – in 7 Tagen live und leistungsstark!
                </p>
                <AIVoiceCheckout
                  packageType="einrichtungspaket"
                  packageName="Einrichtungspaket Voice-AI"
                  packageDescription="Alles aus einer Hand für einen perfekten Start"
                  price={1499}
                  isOneTime={true}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Wettbewerbsvorteil */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-foreground text-center mb-12">
              Ihr Wettbewerbsvorteil mit Voice-AI
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start">
                <Check className="w-6 h-6 text-primary mr-3 flex-shrink-0 mt-1" />
                <span className="text-foreground">Entlastet Ihr Team sofort von Routine-Telefonie – Fokus auf das Wesentliche</span>
              </div>
              <div className="flex items-start">
                <Check className="w-6 h-6 text-primary mr-3 flex-shrink-0 mt-1" />
                <span className="text-foreground">Maximale Erreichbarkeit und kurze Reaktionszeiten, auch bei Spitzenlast</span>
              </div>
              <div className="flex items-start">
                <Check className="w-6 h-6 text-primary mr-3 flex-shrink-0 mt-1" />
                <span className="text-foreground">Automatisches Reporting und Dokumentation an Ihr Team</span>
              </div>
              <div className="flex items-start">
                <Check className="w-6 h-6 text-primary mr-3 flex-shrink-0 mt-1" />
                <span className="text-foreground">Klar kalkulierbare Kosten, sofort einsatzbereit</span>
              </div>
              <div className="flex items-start md:col-span-2">
                <Check className="w-6 h-6 text-primary mr-3 flex-shrink-0 mt-1" />
                <span className="text-foreground">Ihre Daten bleiben sicher – DSGVO-konform, gehostet in der EU</span>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <AIVoiceFAQ />

        {/* CTA */}
        <section className="py-20 bg-gradient-to-b from-background to-primary/10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              Jetzt individuelles Paket anfragen und die Zukunft der Telefonkommunikation live erleben!
            </h2>
            <Link
              href="#pakete"
              className="inline-block bg-primary text-primary-foreground px-8 py-4 rounded-lg text-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              Pakete ansehen
            </Link>
          </div>
        </section>
      </main>
      <Footer />
      <ScrollToTop />
      <CookieBanner />
    </div>
  );
}

