import type { Metadata } from 'next';
import Header from '../components/Header';
import Footer from '../components/Footer';
import LeistungenProducts from '../components/LeistungenProducts';
import ScrollToTop from '../components/ScrollToTop';
import CookieBanner from '../components/CookieBanner';

export const metadata: Metadata = {
  title: 'Leistungen & Webdesign-Pakete | Festpreis-Websites | WebWelle',
  description:
    'Professionelle Websites zum Festpreis: StarterWelle und weitere Pakete für Selbstständige und Unternehmen im Allgäu. Klar kalkulierbar, SEO-bereit und auf Anfragen ausgerichtet.',
  keywords:
    'Webdesign Leistungen, Website Pakete, Festpreis Webdesign, StarterWelle, WebWelle Kempten, Allgäu',
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
    url: 'https://webwelle.com/leistungen',
    siteName: 'WebWelle',
    title: 'Leistungen & Webdesign-Pakete | Festpreis-Websites',
    description:
      'Professionelle Websites zum Festpreis für Selbstständige und Unternehmen. Klar kalkulierbar, SEO-bereit und auf Anfragen ausgerichtet.',
    images: [
      {
        url: 'https://webwelle.com/logo.png',
        width: 1200,
        height: 630,
        alt: 'WebWelle Leistungen',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Leistungen & Webdesign-Pakete | Festpreis-Websites',
    description:
      'Professionelle Websites zum Festpreis für Selbstständige und Unternehmen im Allgäu.',
    images: ['https://webwelle.com/logo.png'],
  },
  alternates: {
    canonical: 'https://webwelle.com/leistungen',
  },
  category: 'Business',
};

export default function LeistungenPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <LeistungenProducts />
      </main>
      <Footer />
      <ScrollToTop />
      <CookieBanner />
    </div>
  );
}
