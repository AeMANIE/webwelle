'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, Mail, Phone } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

function SuccessPageContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionId) {
      // Hier könnten Sie die Session-Daten von Ihrem Backend abrufen
      // Für jetzt zeigen wir eine einfache Erfolgsmeldung
      setLoading(false);
    }
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground">Zahlung wird verarbeitet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <CheckCircle className="w-20 h-20 text-primary mx-auto mb-6" />
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Zahlung erfolgreich!
          </h1>
          <p className="text-xl text-muted-foreground">
            Vielen Dank für Ihre Buchung. Wir freuen uns, mit Ihnen zusammenzuarbeiten!
          </p>
        </div>

        <div className="bg-card rounded-2xl p-8 border border-border">
          <h2 className="text-2xl font-semibold text-foreground mb-6">
            Was passiert als nächstes?
          </h2>
          
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-primary-foreground font-semibold">1</span>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Bestätigungs-E-Mail</h3>
                <p className="text-muted-foreground">
                  Sie erhalten in Kürze eine Bestätigungs-E-Mail mit allen Details zu Ihrer Buchung.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-primary-foreground font-semibold">2</span>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Projektstart</h3>
                <p className="text-muted-foreground">
                  Unser Team meldet sich innerhalb von 24 Stunden bei Ihnen, um den Projektstart zu besprechen.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-primary-foreground font-semibold">3</span>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Entwicklungsphase</h3>
                <p className="text-muted-foreground">
                  Wir beginnen mit der Entwicklung Ihrer Website und halten Sie über den Fortschritt auf dem Laufenden.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 bg-primary/10 border border-primary/20 rounded-2xl p-8">
          <h3 className="text-xl font-semibold text-primary mb-4 flex items-center">
            <Mail className="w-5 h-5 mr-2" />
            Haben Sie Fragen?
          </h3>
          <p className="text-muted-foreground mb-4">
            Unser Support-Team steht Ihnen gerne zur Verfügung. Kontaktieren Sie uns jederzeit!
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href="mailto:info@webwelle.com"
              className="flex items-center justify-center bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors font-semibold"
            >
              <Mail className="w-4 h-4 mr-2" />
              E-Mail senden
            </a>
            <a
              href="tel:+49123456789"
              className="flex items-center justify-center border border-primary text-primary px-6 py-3 rounded-lg hover:bg-primary/10 transition-colors font-semibold"
            >
              <Phone className="w-4 h-4 mr-2" />
              Anrufen
            </a>
          </div>
        </div>

        <div className="mt-8 text-center">
          <a
            href="/"
            className="text-primary hover:text-primary/80 font-medium"
          >
            ← Zurück zur Startseite
          </a>
        </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background">
        <Header />
        <main className="py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-card rounded-2xl p-8 border border-border text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Lädt...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    }>
      <SuccessPageContent />
    </Suspense>
  );
}
