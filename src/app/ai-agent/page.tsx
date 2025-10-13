import Header from '../components/Header';
import Footer from '../components/Footer';
import AIAgentProducts from '../components/AIAgentProducts';
import ScrollToTop from '../components/ScrollToTop';
import CookieBanner from '../components/CookieBanner';

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
