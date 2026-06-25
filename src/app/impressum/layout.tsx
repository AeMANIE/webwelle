import type { Metadata } from 'next';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ScrollToTop from '../components/ScrollToTop';
import CookieBanner from '../components/CookieBanner';
import { ROBOTS_NOINDEX } from '@/lib/seo-index';

export const metadata: Metadata = {
  title: 'Impressum | WebWelle – Anbieterkennzeichnung & Kontakt',
  description: 'Impressum von WebWelle: Verantwortliche, Kontaktinformationen und rechtliche Angaben gemäß § 5 TMG – transparent und korrekt.',
  keywords: 'Impressum, WebWelle, Anbieterkennzeichnung, TMG, Kontakt, rechtliche Angaben, Allgäu, Kempten',
  authors: [{ name: 'WebWelle' }],
  creator: 'WebWelle',
  publisher: 'WebWelle',
  alternates: { canonical: 'https://webwelle.com/impressum' },
  robots: ROBOTS_NOINDEX,
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
