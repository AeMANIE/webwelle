import { Metadata } from 'next';
import { Suspense } from 'react';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';
import BookingForm from '@/app/components/BookingForm';

export const metadata: Metadata = {
  title: 'ErfolgsWelle buchen | WebWelle',
  description: 'Buchen Sie Ihre ErfolgsWelle Premium-Unternehmenswebsite - 278€ monatlich oder 3.289€ jährlich. Bis zu 5 Seiten mit Premium-Features.',
  keywords: 'ErfolgsWelle buchen, Premium-Unternehmenswebsite, WebWelle, 278€ monatlich, 3.289€ jährlich, 5 Seiten, Premium-Features, Allgäu, Kempten',
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
    url: 'https://webwelle.com/buchung/erfolgswelle',
    siteName: 'WebWelle',
    title: 'ErfolgsWelle buchen | WebWelle',
    description: 'Buchen Sie Ihre ErfolgsWelle Premium-Unternehmenswebsite - 278€ monatlich oder 3.289€ jährlich. Bis zu 5 Seiten mit Premium-Features.',
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
    title: 'ErfolgsWelle buchen | WebWelle',
    description: 'Buchen Sie Ihre ErfolgsWelle Premium-Unternehmenswebsite - 278€ monatlich oder 3.289€ jährlich. Bis zu 5 Seiten mit Premium-Features.',
    images: ['/logo.png'],
  },
};

export default function ErfolgsWelleBooking() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="bg-background py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            ErfolgsWelle buchen
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Premium-Unternehmenswebsite (bis 5 Seiten) - Der nächste Level für Ihren Markenauftritt
          </p>
          
          <div className="bg-gradient-to-br from-yellow-400/10 to-orange-500/10 border border-yellow-400/20 rounded-lg p-6 max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-4">
              <h2 className="text-2xl font-bold text-foreground">ErfolgsWelle</h2>
              <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                Premium
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <div>
                <h3 className="font-semibold text-foreground mb-2">Preise:</h3>
                <p className="text-foreground">278 € monatlich</p>
                <p className="text-foreground">3.289 € jährlich</p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Enthalten:</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Individuell konzipierte Premium-Website (bis zu 5 Seiten)</li>
                  <li>• Rechtliches Rundum-Paket</li>
                  <li>• Erweiterte Kontakt- & Interaktionsformulare</li>
                  <li>• Hosting & Premium-Wartung</li>
                  <li>• Domain (.de oder .com) inklusive</li>
                  <li>• E-Mail-Postfach</li>
                  <li>• Vollständige SEO-Strategie (OnPage & OffPage)</li>
                  <li>• Premium-Animationen, Scroll- und Ladeeffekte</li>
                  <li>• Professionelle Bildergalerie</li>
                  <li>• Monatliche Performance-Auswertung</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <Suspense fallback={<div className="text-center py-8">Lade Buchungsformular...</div>}>
          <BookingForm 
            packageType="erfolgswelle"
            packageName="ErfolgsWelle"
            packageDescription="Premium-Unternehmenswebsite (bis 5 Seiten) - Der nächste Level für Ihren Markenauftritt"
          />
        </Suspense>
        </div>
      </main>
      <Footer />
    </div>
  );
}
