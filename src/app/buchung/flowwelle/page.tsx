import type { Metadata } from 'next';
import { Suspense } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import BookingForm from '../../components/BookingForm';
import ScrollToTop from '../../components/ScrollToTop';
import CookieBanner from '../../components/CookieBanner';

export const metadata: Metadata = {
  title: "FlowWelle buchen | KI-Agent Einstieg | WebWelle",
  description: "Einstieg in KI-Automatisierung: bis 5 Workflow-Schritte, Anfragen, Terminbuchung, Support. FlowWelle für 99€/Monat buchen.",
  keywords: "FlowWelle buchen, KI-Agent Einstieg, Workflow-Automatisierung, Terminbuchung, Leadgenerierung, WebWelle",
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
    url: 'https://webwelle.com/buchung/flowwelle',
    siteName: 'WebWelle',
    title: 'FlowWelle buchen | KI-Agent Einstieg',
    description: 'Einstieg in KI-Automatisierung: bis 5 Workflow-Schritte, Anfragen, Terminbuchung, Support.',
    images: [
      {
        url: 'https://webwelle.com/logo.png',
        width: 1200,
        height: 630,
        alt: 'WebWelle FlowWelle KI-Agent',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FlowWelle buchen | KI-Agent Einstieg',
    description: 'Einstieg in KI-Automatisierung: bis 5 Workflow-Schritte, Anfragen, Terminbuchung, Support.',
    images: ['https://webwelle.com/logo.png'],
  },
  alternates: {
    canonical: 'https://webwelle.com/buchung/flowwelle',
  },
  category: 'Technology',
};

export default function FlowWelleBookingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <div className="py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 tracking-tight">
                FlowWelle buchen
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto font-light leading-relaxed">
                Der smarte Einstieg in die KI-Automatisierung. Automatisieren Sie Ihre wichtigsten Standardabläufe mit bis zu 5 Workflow-Schritten.
              </p>
            </div>
            
            <div className="bg-card rounded-2xl p-8 border border-border">
              <Suspense fallback={<div className="text-center py-8">Lade Buchungsformular...</div>}>
                <BookingForm 
                  packageType="flowwelle"
                  packageName="FlowWelle"
                  packageDescription="Der smarte Einstieg in die KI-Automatisierung"
                  features={[
                    "Bis zu 5 Workflow-Schritte",
                    "Anfragemanagement & Terminbuchung",
                    "Einfache Datenübertragung",
                    "Support über Web, E-Mail und Chat",
                    "Schnelle, markengerechte Antworten",
                    "Basis-Analysen"
                  ]}
                  monthlyPrice={99}
                  yearlyPrice={990}
                />
              </Suspense>
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <ScrollToTop />
      <CookieBanner />
    </div>
  );
}
