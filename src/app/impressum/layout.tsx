import type { Metadata } from 'next';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ScrollToTop from '../components/ScrollToTop';
import CookieBanner from '../components/CookieBanner';

export const metadata: Metadata = {
  title: 'Impressum | WebWelle – Anbieterkennzeichnung & Kontakt',
  description: 'Impressum von WebWelle: Verantwortliche, Kontaktinformationen und rechtliche Angaben gemäß § 5 TMG – transparent und korrekt.',
  keywords: 'Impressum, WebWelle, Anbieterkennzeichnung, TMG, Kontakt, rechtliche Angaben, Allgäu, Kempten',
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
    url: 'https://webwelle.com/impressum',
    siteName: 'WebWelle',
    title: 'Impressum | WebWelle – Anbieterkennzeichnung & Kontakt',
    description: 'Impressum von WebWelle: Verantwortliche, Kontaktinformationen und rechtliche Angaben gemäß § 5 TMG – transparent und korrekt.',
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
    title: 'Impressum | WebWelle – Anbieterkennzeichnung & Kontakt',
    description: 'Impressum von WebWelle: Verantwortliche, Kontaktinformationen und rechtliche Angaben gemäß § 5 TMG – transparent und korrekt.',
    images: ['/logo.png'],
  },
};

export default function ImpressumLayout({
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
