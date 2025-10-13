import type { Metadata } from 'next';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ScrollToTop from '../components/ScrollToTop';
import CookieBanner from '../components/CookieBanner';

export const metadata: Metadata = {
  title: 'AGB | WebWelle – Rechtliche Grundlagen & Vertragsbedingungen',
  description: 'Allgemeine Geschäftsbedingungen (AGB) von WebWelle: Leistungen, Vertragsbedingungen, Gewährleistung und Zahlungsmodalitäten – transparent und verständlich.',
  robots: { index: true, follow: true },
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
