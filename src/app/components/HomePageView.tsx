'use client';

import Header from './Header';
import Hero from './Hero';
import Footer from './Footer';
import ScrollToTop from './ScrollToTop';
import CookieBanner from './CookieBanner';
import Benefits from './Benefits';
import TrustSection from './TrustSection';
import Services from './Services';
import Workflow from './Workflow';
import Products from './Products';
import FAQ from './FAQ';

function HomePageView() {
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

export default HomePageView;
