'use client';

import dynamic from 'next/dynamic';
import Header from './Header';
import Hero from './Hero';
import Footer from './Footer';
import ScrollToTop from './ScrollToTop';
import CookieBanner from './CookieBanner';
import Benefits from './Benefits';
import TrustSection from './TrustSection';
import Services from './Services';
import Workflow from './Workflow';
import { WavePath } from '@/components/ui/wave-path';
import FAQ from './FAQ';

const Products = dynamic(() => import('./Products'), { ssr: false });

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
        <div className="hidden lg:block bg-background py-20 lg:py-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-center">
            <WavePath orientation="horizontal" className="w-full max-w-5xl" />
          </div>
        </div>
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
