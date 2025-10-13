import type { Metadata } from 'next';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ScrollToTop from '../components/ScrollToTop';
import CookieBanner from '../components/CookieBanner';

export const metadata: Metadata = {
  title: 'Widerrufsbelehrung | WebWelle – Rechte & Fristen',
  description: 'Widerrufsbelehrung von WebWelle: Informationen zu Widerrufsrecht, Fristen, Ausnahmen und Ablauf – einfach erklärt und rechtssicher.',
  robots: { index: true, follow: true },
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
