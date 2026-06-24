import type { Metadata } from 'next';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ScrollToTop from '../components/ScrollToTop';
import CookieBanner from '../components/CookieBanner';

export const metadata: Metadata = {
  title: 'Datenschutzerklärung | WebWelle – Transparenz & Sicherheit',
  description: 'Datenschutzerklärung von WebWelle: Informationen zu Erhebung, Verarbeitung und Nutzung von personenbezogenen Daten gemäß DSGVO – sicher, transparent, nachvollziehbar.',
  keywords: 'Datenschutzerklärung, DSGVO, Datenschutz, WebWelle, personenbezogene Daten, Datensicherheit, Transparenz, Allgäu, Kempten',
  authors: [{ name: 'WebWelle' }],
  creator: 'WebWelle',
  publisher: 'WebWelle',
  alternates: { canonical: 'https://webwelle.com/datenschutz' },
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
    url: 'https://webwelle.com/datenschutz',
    siteName: 'WebWelle',
    title: 'Datenschutzerklärung | WebWelle – Transparenz & Sicherheit',
    description: 'Datenschutzerklärung von WebWelle: Informationen zu Erhebung, Verarbeitung und Nutzung von personenbezogenen Daten gemäß DSGVO – sicher, transparent, nachvollziehbar.',
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
    title: 'Datenschutzerklärung | WebWelle – Transparenz & Sicherheit',
    description: 'Datenschutzerklärung von WebWelle: Informationen zu Erhebung, Verarbeitung und Nutzung von personenbezogenen Daten gemäß DSGVO – sicher, transparent, nachvollziehbar.',
    images: ['/logo.png'],
  },
};

export default function DatenschutzLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      {children}
      <Footer />
      <ScrollToTop />
      <CookieBanner />
    </>
  );
}
