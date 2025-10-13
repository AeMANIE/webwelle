import Header from '../../components/Header';
import Footer from '../../components/Footer';
import BookingForm from '../../components/BookingForm';
import ScrollToTop from '../../components/ScrollToTop';
import CookieBanner from '../../components/CookieBanner';

export default function MeisterWelleBookingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <div className="py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 tracking-tight">
                MeisterWelle buchen
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto font-light leading-relaxed">
                Für höchste Ansprüche. Unbegrenzt komplexe Workflows mit umfangreicher API-Integration für echte Marktführer.
              </p>
            </div>
            
            <div className="bg-card rounded-2xl p-8 border border-border">
              <BookingForm 
                packageType="meisterwelle"
                packageName="MeisterWelle"
                packageDescription="Für höchste Ansprüche mit unbegrenzt komplexen Workflows"
                features={[
                  "Mehr als 10 Workflow-Schritte",
                  "Großprojekte & intelligente Automation",
                  "Individuelle Anpassungen",
                  "Umfangreiche API- und Systemanbindung",
                  "Vollautomatisierte Premium-Kommunikation",
                  "Monatliche Strategie- und Performance-Auswertung",
                  "Kontinuierliche Optimierung"
                ]}
                monthlyPrice={249}
                yearlyPrice={2490}
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
