import { Metadata } from 'next';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';
import BookingForm from '@/app/components/BookingForm';

export const metadata: Metadata = {
  title: 'BusinessWelle buchen | WebWelle',
  description: 'Buchen Sie Ihre BusinessWelle Unternehmenswebsite - 139€ monatlich oder 1.520€ jährlich. Bis zu 3 Seiten inkl. SEO & Support.',
  keywords: 'BusinessWelle buchen, Unternehmenswebsite, WebWelle, 139€ monatlich, 1.520€ jährlich, 3 Seiten, SEO, Support, Allgäu, Kempten',
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
    url: 'https://webwelle.com/buchung/businesswelle',
    siteName: 'WebWelle',
    title: 'BusinessWelle buchen | WebWelle',
    description: 'Buchen Sie Ihre BusinessWelle Unternehmenswebsite - 139€ monatlich oder 1.520€ jährlich. Bis zu 3 Seiten inkl. SEO & Support.',
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
    title: 'BusinessWelle buchen | WebWelle',
    description: 'Buchen Sie Ihre BusinessWelle Unternehmenswebsite - 139€ monatlich oder 1.520€ jährlich. Bis zu 3 Seiten inkl. SEO & Support.',
    images: ['/logo.png'],
  },
};

export default function BusinessWelleBooking() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="bg-background py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            BusinessWelle buchen
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Unternehmenswebsite (bis 3 Seiten) - Ihr professioneller Online-Auftritt
          </p>
          
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-6 max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-4">
              <h2 className="text-2xl font-bold text-primary">BusinessWelle</h2>
              <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-semibold">
                Beliebt
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <div>
                <h3 className="font-semibold text-foreground mb-2">Preise:</h3>
                <p className="text-foreground">139 € monatlich</p>
                <p className="text-foreground">1.520 € jährlich</p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Enthalten:</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Komplett individuell erstellte Website (bis zu 3 Seiten)</li>
                  <li>• Rechtliches Komplettpaket</li>
                  <li>• Kontaktformular mit cleverem Spamschutz</li>
                  <li>• Hosting & technische Wartung</li>
                  <li>• Domain (.de oder .com) inklusive</li>
                  <li>• E-Mail-Postfach</li>
                  <li>• SEO-freundliche Grundoptimierung</li>
                  <li>• Dezente Animationen und visuelle Highlights</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <BookingForm 
          packageType="businesswelle"
          packageName="BusinessWelle"
          packageDescription="Unternehmenswebsite (bis 3 Seiten) - Ihr professioneller Online-Auftritt"
        />
        </div>
      </main>
      <Footer />
    </div>
  );
}
