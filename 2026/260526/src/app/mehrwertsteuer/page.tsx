import Header from '../components/Header';
import Footer from '../components/Footer';
import MehrwertsteuerRechner from '../components/MehrwertsteuerRechner';

export default function MehrwertsteuerPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <MehrwertsteuerRechner />
      </main>
      <Footer />
    </div>
  );
}
