import Header from './components/Header';
import Hero from './components/Hero';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import CookieBanner from './components/CookieBanner';
import Benefits from './components/Benefits';
import TrustSection from './components/TrustSection';
import Services from './components/Services';
import Workflow from './components/Workflow';
import Products from './components/Products';
import FAQ from './components/FAQ';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Webdesign Kempten (Allgäu) | WebWelle – Professionelle Websites für mehr Anfragen",
  description:
    "WebWelle entwickelt professionelle Websites für Selbstständige und Unternehmen im Allgäu – klar aufgebaut, auf Vertrauen ausgerichtet, für mehr Anfragen.",
  keywords: "Webdesign Kempten, Webdesign Allgäu, Website erstellen Kempten, SEO Agentur Allgäu, Festpreis Webdesign, Webdesign Bayern",
  authors: [{ name: "WebWelle" }],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  alternates: {
    canonical: 'https://webwelle.com',
  },
  openGraph: {
    title: "Webdesign Kempten (Allgäu) | WebWelle – Professionelle Websites für mehr Anfragen",
    description:
      "WebWelle entwickelt professionelle Websites für Selbstständige und Unternehmen im Allgäu – klar aufgebaut, auf Vertrauen ausgerichtet, für mehr Anfragen.",
    type: "website",
    locale: "de_DE",
    url: "https://webwelle.com",
  },
};

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <Benefits />
        <TrustSection />
        <Services />
        <Workflow />
        <Products />
        
        <FAQ />
      </main>
      <Footer />
      <ScrollToTop />
      <CookieBanner />
    </div>
  );
}
