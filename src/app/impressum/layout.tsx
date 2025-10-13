import type { Metadata } from 'next';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ScrollToTop from '../components/ScrollToTop';
import CookieBanner from '../components/CookieBanner';

export const metadata: Metadata = {
  title: 'Impressum | WebWelle – Anbieterkennzeichnung & Kontakt',
  description: 'Impressum von WebWelle: Verantwortliche, Kontaktinformationen und rechtliche Angaben gemäß § 5 TMG – transparent und korrekt.',
  robots: { index: true, follow: true },
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
