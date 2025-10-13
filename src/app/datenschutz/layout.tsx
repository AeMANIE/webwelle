import type { Metadata } from 'next';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ScrollToTop from '../components/ScrollToTop';
import CookieBanner from '../components/CookieBanner';

export const metadata: Metadata = {
  title: 'Datenschutzerklärung | WebWelle – Transparenz & Sicherheit',
  description: 'Datenschutzerklärung von WebWelle: Informationen zu Erhebung, Verarbeitung und Nutzung von personenbezogenen Daten gemäß DSGVO – sicher, transparent, nachvollziehbar.',
  robots: { index: true, follow: true },
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
