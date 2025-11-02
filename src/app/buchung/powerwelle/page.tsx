import type { Metadata } from 'next';
import { Suspense } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import KICheckout from '../../components/KICheckout';
import ScrollToTop from '../../components/ScrollToTop';
import CookieBanner from '../../components/CookieBanner';

export const metadata: Metadata = {
  title: "PowerWelle buchen | KI-Agent für wachsende Unternehmen | WebWelle",
  description: "6–10 Workflows, Multichannel-Support, CRM-Integration – ideal für Wachstum. PowerWelle für 179€/Monat buchen.",
  keywords: "PowerWelle buchen, KI-Agent wachsende Unternehmen, Workflow-Automatisierung, CRM-Integration, Multichannel-Support, WebWelle",
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
    url: 'https://webwelle.com/buchung/powerwelle',
    siteName: 'WebWelle',
    title: 'PowerWelle buchen | KI-Agent für wachsende Unternehmen',
    description: '6–10 Workflows, Multichannel-Support, CRM-Integration – ideal für Wachstum.',
    images: [
      {
        url: 'https://webwelle.com/logo.png',
        width: 1200,
        height: 630,
        alt: 'WebWelle PowerWelle KI-Agent',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PowerWelle buchen | KI-Agent für wachsende Unternehmen',
    description: '6–10 Workflows, Multichannel-Support, CRM-Integration – ideal für Wachstum.',
    images: ['https://webwelle.com/logo.png'],
  },
  alternates: {
    canonical: 'https://webwelle.com/buchung/powerwelle',
  },
  category: 'Technology',
};

export default function PowerWelleBookingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <div className="py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 tracking-tight">
                PowerWelle buchen
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto font-light leading-relaxed">
                Für wachsende Unternehmen. Umfasst komplexere Workflows mit bis zu 10 Automatisierungsschritten und erweiterten Integrationen.
              </p>
            </div>
            
            <Suspense fallback={<div className="text-center py-8">Lade Buchungsformular...</div>}>
              <KICheckout 
                packageType="powerwelle"
                packageName="PowerWelle"
                packageDescription="Für wachsende Unternehmen mit komplexeren Workflows"
                features={[
                  "6 bis 10 Workflow-Schritte",
                  "Mehrstufige Kommunikation & Eskalationen",
                  "Multichannel-Support",
                  "Erweiterte Integrationen (CRM, Buchhaltung)",
                  "Detaillierte Analyse- und Reporting-Funktionen",
                  "Perfekte Integration in Ihre Prozesse"
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
