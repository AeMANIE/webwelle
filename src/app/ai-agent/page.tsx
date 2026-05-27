import type { Metadata } from 'next';
import Header from '../components/Header';
import Footer from '../components/Footer';
import AIAgentHero from '../components/AIAgentHero';
import AIAgentExplanation from '../components/AIAgentExplanation';
import AIAgentDemo from '../components/AIAgentDemo';
import AIAgentProducts from '../components/AIAgentProducts';
import AIAgentWhy from '../components/AIAgentWhy';
import AIAgentFAQ from '../components/AIAgentFAQ';
import ScrollToTop from '../components/ScrollToTop';
import CookieBanner from '../components/CookieBanner';

export const metadata: Metadata = {
  title: "KI-Agenten für Unternehmen | Automatisierung, Leads & Support | WebWelle",
  description: "Zeitgewinn, Lead-Qualifizierung, Terminbuchung, Support – integriert in Prozesse. Professionelle KI-Agenten für Ihr Unternehmen.",
  keywords: "KI-Agenten, Automatisierung, Leadgenerierung, Kundensupport, Chatbot, Terminbuchung, CRM, WebWelle",
  authors: [{ name: "WebWelle" }],
  creator: "WebWelle",
  publisher: "WebWelle",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'de_DE',
    url: 'https://webwelle.com/ai-agent',
    siteName: 'WebWelle',
    title: 'KI-Agenten für Unternehmen | Automatisierung, Leads & Support',
    description: 'Zeitgewinn, Lead-Qualifizierung, Terminbuchung, Support – integriert in Prozesse. Professionelle KI-Agenten für Ihr Unternehmen.',
    images: [
      {
        url: 'https://webwelle.com/logo.png',
        width: 1200,
        height: 630,
        alt: 'WebWelle KI-Agenten',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KI-Agenten für Unternehmen | Automatisierung, Leads & Support',
    description: 'Zeitgewinn, Lead-Qualifizierung, Terminbuchung, Support – integriert in Prozesse.',
    images: ['https://webwelle.com/logo.png'],
  },
  alternates: {
    canonical: 'https://webwelle.com/ai-agent',
  },
  category: 'Technology',
};

export default function AIAgentPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="relative">
        <AIAgentHero />
        <div id="ai-explanation">
          <AIAgentExplanation />
        </div>
        <AIAgentDemo />
        <div id="ai-agent-produkte">
          <AIAgentProducts />
        </div>
        <AIAgentWhy />
        <AIAgentFAQ />
      </main>
      <Footer />
      <ScrollToTop />
      <CookieBanner />
    </div>
  );
}
