import type { Metadata } from 'next';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ScrollToTop from '../components/ScrollToTop';
import CookieBanner from '../components/CookieBanner';

export const metadata: Metadata = {
  title: 'AGB | WebWelle – Rechtliche Grundlagen & Vertragsbedingungen',
  description: 'Allgemeine Geschäftsbedingungen (AGB) von WebWelle: Leistungen, Vertragsbedingungen, Gewährleistung und Zahlungsmodalitäten – transparent und verständlich.',
  keywords: 'AGB, Allgemeine Geschäftsbedingungen, WebWelle, Vertragsbedingungen, Gewährleistung, Zahlungsmodalitäten, rechtliche Grundlagen, Allgäu, Kempten',
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
    url: 'https://webwelle.com/agb',
    siteName: 'WebWelle',
    title: 'AGB | WebWelle – Rechtliche Grundlagen & Vertragsbedingungen',
    description: 'Allgemeine Geschäftsbedingungen (AGB) von WebWelle: Leistungen, Vertragsbedingungen, Gewährleistung und Zahlungsmodalitäten – transparent und verständlich.',
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
    title: 'AGB | WebWelle – Rechtliche Grundlagen & Vertragsbedingungen',
    description: 'Allgemeine Geschäftsbedingungen (AGB) von WebWelle: Leistungen, Vertragsbedingungen, Gewährleistung und Zahlungsmodalitäten – transparent und verständlich.',
    images: ['/logo.png'],
  },
};

export default function AGBLayout({
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
