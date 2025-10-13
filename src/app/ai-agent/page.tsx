import type { Metadata } from 'next';
import Header from '../components/Header';
import Footer from '../components/Footer';
import AIAgentProducts from '../components/AIAgentProducts';
import ScrollToTop from '../components/ScrollToTop';
import CookieBanner from '../components/CookieBanner';

export const metadata: Metadata = {
  title: 'KI-Agenten für Unternehmen | Automatisierung, Leads & Support | WebWelle',
  description: 'Gewinnen Sie Zeit und Kunden mit smarten KI-Agenten: Automatisierung, Lead-Qualifizierung, Terminbuchung und Support – rund um die Uhr. Perfekt integriert in Ihre Prozesse.',
  keywords: 'KI-Agenten, Automatisierung, Leadgenerierung, Kundensupport, Chatbot, Terminbuchung, CRM, WebWelle',
  robots: { index: true, follow: true },
  openGraph: {
    title: 'KI-Agenten für Unternehmen | WebWelle',
    description: 'Automatisieren Sie Wachstum und Support mit KI-Agenten – intelligent, integriert, skalierbar.',
    url: 'https://webwelle.com/ai-agent',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KI-Agenten für Unternehmen | WebWelle',
    description: 'Automatisierung, Lead-Qualifizierung und Support – powered by KI.',
  },
};

export default function AIAgentPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <AIAgentProducts />
      </main>
      <Footer />
      <ScrollToTop />
      <CookieBanner />
    </div>
  );
}
