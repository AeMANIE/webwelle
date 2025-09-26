import Header from './components/Header';
import Hero from './components/Hero';
import Products from './components/Products';
import Benefits from './components/Benefits';
import Services from './components/Services';
import Workflow from './components/Workflow';
import FAQ from './components/FAQ';
import CTA from './components/CTA';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import CookieBanner from './components/CookieBanner';

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
