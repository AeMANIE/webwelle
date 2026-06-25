import type { Metadata } from 'next';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ScrollToTop from '../components/ScrollToTop';
import CookieBanner from '../components/CookieBanner';
import { ROBOTS_NOINDEX } from '@/lib/seo-index';

export const metadata: Metadata = {
  title: 'Funnel | WebWelle',
  robots: ROBOTS_NOINDEX,
};

export default function FunnelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <div className="flex-1">{children}</div>
      <Footer />
      <ScrollToTop />
      <CookieBanner />
    </div>
  );
}
