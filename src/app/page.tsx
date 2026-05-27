import dynamic from 'next/dynamic';
import Header from './components/Header';
import Hero from './components/Hero';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import CookieBanner from './components/CookieBanner';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Webdesign Kempten (Allgäu) | WebWelle – Sichtbar. Modern. Erfolgreich.",
  description: "Webdesign aus Kempten im Allgäu. SEO-optimierte Websites mit Festpreis, garantierter Performance & persönlicher Betreuung. Jetzt kostenloses Erstgespräch sichern!",
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
    title: "Webdesign Kempten (Allgäu) | WebWelle – Websites, die Kunden gewinnen",
    description: "Professionelles Webdesign mit SEO, Performance & Festpreis. WebWelle – Ihre Agentur aus Kempten für digitalen Erfolg.",
    type: "website",
    locale: "de_DE",
    url: "https://webwelle.com",
  },
};

// Lazy load nicht-kritische Komponenten für bessere Performance
// Diese werden erst nach dem initial render geladen
const Benefits = dynamic(() => import('./components/Benefits'), {
  loading: () => <div className="min-h-[400px] bg-background" />,
});

const Services = dynamic(() => import('./components/Services'), {
  loading: () => <div className="min-h-[400px] bg-background" />,
});

const Workflow = dynamic(() => import('./components/Workflow'), {
  loading: () => <div className="min-h-[400px] bg-background" />,
});

const Products = dynamic(() => import('./components/Products'), {
  loading: () => <div className="min-h-[400px] bg-background" />,
});

const FAQ = dynamic(() => import('./components/FAQ'), {
  loading: () => <div className="min-h-[400px] bg-background" />,
});

const CTA = dynamic(() => import('./components/CTA'), {
  loading: () => <div className="min-h-[200px] bg-background" />,
});

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <Benefits />
        <Services />
        <Workflow />
        <Products />
        
        <FAQ />
        <CTA />
      </main>
      <Footer />
      <ScrollToTop />
      <CookieBanner />
    </div>
  );
}
