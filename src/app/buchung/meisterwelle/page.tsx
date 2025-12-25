import type { Metadata } from 'next';
import { Suspense } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import KICheckout from '../../components/KICheckout';
import ScrollToTop from '../../components/ScrollToTop';
import CookieBanner from '../../components/CookieBanner';

export const metadata: Metadata = {
  title: "MeisterWelle buchen | Premium KI-Agenten & Integrationen | WebWelle",
  description: "Premium-KI, umfangreiche API-Anbindung, individuelle Workflows & Strategie. MeisterWelle für 249€/Monat buchen.",
  keywords: "MeisterWelle buchen, Premium KI-Agenten, API-Integration, individuelle Workflows, Strategie, WebWelle",
  authors: [{ name: "WebWelle" }],
  creator: "WebWelle",
  publisher: "WebWelle",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'de_DE',
    url: 'https://webwelle.com/buchung/meisterwelle',
    siteName: 'WebWelle',
    title: 'MeisterWelle buchen | Premium KI-Agenten & Integrationen',
    description: 'Premium-KI, umfangreiche API-Anbindung, individuelle Workflows & Strategie.',
    images: [
      {
        url: 'https://webwelle.com/logo.png',
        width: 1200,
        height: 630,
        alt: 'WebWelle MeisterWelle KI-Agent',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MeisterWelle buchen | Premium KI-Agenten & Integrationen',
    description: 'Premium-KI, umfangreiche API-Anbindung, individuelle Workflows & Strategie.',
    images: ['https://webwelle.com/logo.png'],
  },
  alternates: {
    // Canonical ohne Query-Parameter (für SEO)
    canonical: 'https://webwelle.com/buchung/meisterwelle',
  },
  category: 'Technology',
};

export default function MeisterWelleBookingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <div className="py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 tracking-tight">
                MeisterWelle buchen
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto font-light leading-relaxed">
                Für höchste Ansprüche. Unbegrenzt komplexe Workflows mit umfangreicher API-Integration für echte Marktführer.
              </p>
            </div>
            
            <Suspense fallback={<div className="text-center py-8">Lade Buchungsformular...</div>}>
              <KICheckout 
                packageType="meisterwelle"
                packageName="MeisterWelle"
                packageDescription="Für höchste Ansprüche mit unbegrenzt komplexen Workflows"
                features={[
                  "Mehr als 10 Workflow-Schritte",
                  "Großprojekte & intelligente Automation",
                  "Individuelle Anpassungen",
                  "Umfangreiche API- und Systemanbindung",
                  "Vollautomatisierte Premium-Kommunikation",
                  "Monatliche Strategie- und Performance-Auswertung",
                  "Kontinuierliche Optimierung"
                ]}
              />
            </Suspense>
          </div>
        </div>
      </main>
      <Footer />
      <ScrollToTop />
      <CookieBanner />
    </div>
  );
}
