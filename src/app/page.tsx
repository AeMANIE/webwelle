import dynamic from 'next/dynamic';
import Header from './components/Header';
import Hero from './components/Hero';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import CookieBanner from './components/CookieBanner';

// Lazy load nicht-kritische Komponenten für bessere Performance
// Diese werden erst nach dem initial render geladen
const Benefits = dynamic(() => import('./components/Benefits'), {
  loading: () => <div className="min-h-[400px] bg-gray-50" />,
});

const Services = dynamic(() => import('./components/Services'), {
  loading: () => <div className="min-h-[400px] bg-white" />,
});

const Workflow = dynamic(() => import('./components/Workflow'), {
  loading: () => <div className="min-h-[400px] bg-gray-50" />,
});

const Products = dynamic(() => import('./components/Products'), {
  loading: () => <div className="min-h-[400px] bg-white" />,
});

const FAQ = dynamic(() => import('./components/FAQ'), {
  loading: () => <div className="min-h-[400px] bg-gray-50" />,
});

const CTA = dynamic(() => import('./components/CTA'), {
  loading: () => <div className="min-h-[200px] bg-white" />,
});

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
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
