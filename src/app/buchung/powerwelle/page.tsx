import type { Metadata } from 'next';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import BookingForm from '../../components/BookingForm';
import ScrollToTop from '../../components/ScrollToTop';
import CookieBanner from '../../components/CookieBanner';

export const metadata: Metadata = {
  title: 'PowerWelle buchen | KI-Agent für wachsende Unternehmen | WebWelle',
  description: 'PowerWelle: KI-Automatisierung mit 6–10 Workflow-Schritten, Multichannel-Support und CRM-Integration. Ideal für wachsende Unternehmen – jetzt buchen.',
  robots: { index: true, follow: true },
};

export default function PowerWelleBookingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <div className="py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 tracking-tight">
                PowerWelle buchen
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto font-light leading-relaxed">
                Für wachsende Unternehmen. Umfasst komplexere Workflows mit bis zu 10 Automatisierungsschritten und erweiterten Integrationen.
              </p>
            </div>
            
            <div className="bg-card rounded-2xl p-8 border border-border">
              <BookingForm 
                packageType="powerwelle"
                packageName="PowerWelle"
                packageDescription="Für wachsende Unternehmen mit komplexeren Workflows"
                features={[
                  "6 bis 10 Workflow-Schritte",
                  "Mehrstufige Kommunikation & Eskalationen",
                  "Multichannel-Support",
                  "Erweiterte Integrationen (CRM, Buchhaltung)",
                  "Detaillierte Analyse- und Reporting-Funktionen",
                  "Perfekte Integration in Ihre Prozesse"
                ]}
                monthlyPrice={179}
                yearlyPrice={1790}
              />
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <ScrollToTop />
      <CookieBanner />
    </div>
  );
}
