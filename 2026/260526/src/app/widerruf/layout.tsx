import type { Metadata } from 'next';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ScrollToTop from '../components/ScrollToTop';
import CookieBanner from '../components/CookieBanner';

export const metadata: Metadata = {
  title: 'Widerrufsbelehrung | WebWelle – Rechte & Fristen',
  description: 'Widerrufsbelehrung von WebWelle: Informationen zu Widerrufsrecht, Fristen, Ausnahmen und Ablauf – einfach erklärt und rechtssicher.',
  keywords: 'Widerrufsbelehrung, Widerrufsrecht, WebWelle, Fristen, Ausnahmen, rechtssicher, Verbraucherschutz, Allgäu, Kempten',
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
    url: 'https://webwelle.com/widerruf',
    siteName: 'WebWelle',
    title: 'Widerrufsbelehrung | WebWelle – Rechte & Fristen',
    description: 'Widerrufsbelehrung von WebWelle: Informationen zu Widerrufsrecht, Fristen, Ausnahmen und Ablauf – einfach erklärt und rechtssicher.',
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
    title: 'Widerrufsbelehrung | WebWelle – Rechte & Fristen',
    description: 'Widerrufsbelehrung von WebWelle: Informationen zu Widerrufsrecht, Fristen, Ausnahmen und Ablauf – einfach erklärt und rechtssicher.',
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
