import type { Metadata } from 'next';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ScrollToTop from '../components/ScrollToTop';
import CookieBanner from '../components/CookieBanner';

export const metadata: Metadata = {
  title: 'Stornierung und Erstattungen | WebWelle – B2B-Regelungen',
  description: 'Stornierung und Erstattungen von WebWelle für B2B-Kunden: Einmalleistungen, Laufzeitprodukte, Mitwirkung und Kulanzregelungen – transparent und verständlich.',
  keywords: 'Stornierung, Erstattungen, B2B, WebWelle, Kündigung, Einmalleistungen, Laufzeitprodukte, Allgäu, Kempten',
  authors: [{ name: 'WebWelle' }],
  creator: 'WebWelle',
  publisher: 'WebWelle',
  alternates: { canonical: 'https://webwelle.com/widerruf' },
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
    url: 'https://webwelle.com/widerruf',
    siteName: 'WebWelle',
    title: 'Stornierung und Erstattungen | WebWelle – B2B-Regelungen',
    description: 'Stornierung und Erstattungen von WebWelle für B2B-Kunden: Einmalleistungen, Laufzeitprodukte, Mitwirkung und Kulanzregelungen – transparent und verständlich.',
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
    title: 'Stornierung und Erstattungen | WebWelle – B2B-Regelungen',
    description: 'Stornierung und Erstattungen von WebWelle für B2B-Kunden: Einmalleistungen, Laufzeitprodukte, Mitwirkung und Kulanzregelungen – transparent und verständlich.',
    images: ['/logo.png'],
  },
};

export default function WiderrufLayout({
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
