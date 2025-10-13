import { Metadata } from 'next';
import { Suspense } from 'react';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';
import BookingForm from '@/app/components/BookingForm';

export const metadata: Metadata = {
  title: 'StarterWelle buchen | WebWelle',
  description: 'Buchen Sie Ihre StarterWelle One-Page Website - 77€ monatlich oder 840€ jährlich. Inkl. Domain, Hosting & Support.',
  keywords: 'StarterWelle buchen, One-Page Website, WebWelle, 77€ monatlich, 840€ jährlich, Domain, Hosting, Support, Allgäu, Kempten',
  authors: [{ name: 'WebWelle' }],
  creator: 'WebWelle',
  publisher: 'WebWelle',
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
    url: 'https://webwelle.com/buchung/starterwelle',
    siteName: 'WebWelle',
    title: 'StarterWelle buchen | WebWelle',
    description: 'Buchen Sie Ihre StarterWelle One-Page Website - 77€ monatlich oder 840€ jährlich. Inkl. Domain, Hosting & Support.',
    images: [
      {
        url: '/logo.png',
        width: 1200,
        height: 630,
        alt: 'WebWelle Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'StarterWelle buchen | WebWelle',
    description: 'Buchen Sie Ihre StarterWelle One-Page Website - 77€ monatlich oder 840€ jährlich. Inkl. Domain, Hosting & Support.',
    images: ['/logo.png'],
  },
};

export default function StarterWelleBooking() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="bg-background py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            StarterWelle buchen
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            One-Page Website - Ihr digitaler Auftritt auf den Punkt gebracht
          </p>
          
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-6 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-primary mb-4">StarterWelle</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <div>
                <h3 className="font-semibold text-foreground mb-2">Preise:</h3>
                <p className="text-foreground">77 € monatlich</p>
                <p className="text-foreground">840 € jährlich</p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Enthalten:</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Individuell gestaltete Onepage-Website</li>
                  <li>• Rechtliches Basispaket</li>
                  <li>• Kontaktformular mit Spamschutz</li>
                  <li>• Hosting & Wartung inklusive</li>
                  <li>• Domain (.de oder .com)</li>
                  <li>• E-Mail-Postfach</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <Suspense fallback={<div className="text-center py-8">Lade Buchungsformular...</div>}>
          <BookingForm 
            packageType="starterwelle"
            packageName="StarterWelle"
            packageDescription="One-Page Website - Ihr digitaler Auftritt auf den Punkt gebracht"
          />
        </Suspense>
        </div>
      </main>
      <Footer />
    </div>
  );
}
