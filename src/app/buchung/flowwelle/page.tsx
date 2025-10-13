import Header from '../../components/Header';
import Footer from '../../components/Footer';
import BookingForm from '../../components/BookingForm';
import ScrollToTop from '../../components/ScrollToTop';
import CookieBanner from '../../components/CookieBanner';

export default function FlowWelleBookingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <div className="py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 tracking-tight">
                FlowWelle buchen
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto font-light leading-relaxed">
                Der smarte Einstieg in die KI-Automatisierung. Automatisieren Sie Ihre wichtigsten Standardabläufe mit bis zu 5 Workflow-Schritten.
              </p>
            </div>
            
            <div className="bg-card rounded-2xl p-8 border border-border">
              <BookingForm 
                packageType="flowwelle"
                packageName="FlowWelle"
                packageDescription="Der smarte Einstieg in die KI-Automatisierung"
                features={[
                  "Bis zu 5 Workflow-Schritte",
                  "Anfragemanagement & Terminbuchung",
                  "Einfache Datenübertragung",
                  "Support über Web, E-Mail und Chat",
                  "Schnelle, markengerechte Antworten",
                  "Basis-Analysen"
                ]}
                monthlyPrice={99}
                yearlyPrice={990}
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
