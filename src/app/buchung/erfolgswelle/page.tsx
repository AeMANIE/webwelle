'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';
import BookingForm from '@/app/components/BookingForm';
import { Check } from 'lucide-react';

function ErfolgsWelleContent() {
  const searchParams = useSearchParams();
  const [isMonthly, setIsMonthly] = useState(true);

  useEffect(() => {
    const billingParam = searchParams.get('billing');
    if (billingParam === 'yearly') {
      setIsMonthly(false);
    } else {
      setIsMonthly(true); // Default zu monatlich
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="bg-background py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 tracking-tight">
            ErfolgsWelle buchen
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto font-light leading-relaxed mb-8">
            Ihre Premium-Website für echte Marktführer
          </p>
          <p className="text-lg text-muted-foreground max-w-4xl mx-auto mb-12">
            Mit ErfolgsWelle präsentieren Sie Ihre Marke professionell und ambitioniert – individuell entwickelt und technisch perfekt umgesetzt. Nutzen Sie Premium-Features wie tägliche Backups, Performance-Analysen, Bildergalerie und fortschrittliche SEO-Strategien, um Ihre digitale Sichtbarkeit und Ihren Erfolg kontinuierlich zu steigern. Dieses Paket ist für alle, die ihre Ziele nicht nur erreichen, sondern übertreffen wollen.
          </p>
          
          <div className="bg-gradient-to-br from-yellow-400/10 to-orange-500/10 border border-yellow-400/20 rounded-2xl p-8 max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-2 mb-4">
                <h2 className="text-3xl font-bold text-foreground">ErfolgsWelle</h2>
                <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  Premium
                </span>
              </div>
              <p className="text-lg text-primary font-semibold mb-2">Premium-Unternehmenswebsite (bis 5 Seiten)</p>
              <p className="text-muted-foreground text-lg">
                Der nächste Level für Ihren Markenauftritt. Maßgeschneiderte Premium-Website für ambitionierte Unternehmen, die ihr Wachstum beschleunigen möchten.
              </p>
            </div>

            <div className="mb-6">
              <div className="text-3xl font-bold text-foreground mb-2">
                {isMonthly ? '278 € mtl.' : '3.289 € jährlich'}
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {isMonthly ? '24 Monate, Nettopreis' : 'Netto Jährlich, 24 Monate Laufzeit'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="space-y-3">
                <div className="flex items-center">
                  <Check className="w-4 h-4 text-primary mr-3 flex-shrink-0" />
                  <span className="text-foreground text-sm">Individuell konzipierte Premium-Website<br /> (bis zu 5 Seiten)</span>
                </div>
                <div className="flex items-center">
                  <Check className="w-4 h-4 text-primary mr-3 flex-shrink-0" />
                  <span className="text-foreground text-sm">Rechtliches Rundum-Paket </span>
                </div>
                <div className="flex items-center">
                  <Check className="w-4 h-4 text-primary mr-3 flex-shrink-0" />
                  <span className="text-foreground text-sm">Interaktionsformulare</span>
                </div>
                <div className="flex items-center">
                  <Check className="w-4 h-4 text-primary mr-3 flex-shrink-0" />
                  <span className="text-foreground text-sm">Hosting & Premium-Wartung,<br /> inkl. Überwachung & Updates</span>
                </div>
                <div className="flex items-center">
                  <Check className="w-4 h-4 text-primary mr-3 flex-shrink-0" />
                  <span className="text-foreground text-sm">Tägliches Backup</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center">
                  <Check className="w-4 h-4 text-primary mr-3 flex-shrink-0" />
                  <span className="text-foreground text-sm">Domain (.de oder .com) inklusive</span>
                </div>
                <div className="flex items-center">
                  <Check className="w-4 h-4 text-primary mr-3 flex-shrink-0" />
                  <span className="text-foreground text-sm">E-Mail-Postfach (z.B. info@deine-firma.de)</span>
                </div>
                <div className="flex items-center">
                  <Check className="w-4 h-4 text-primary mr-3 flex-shrink-0" />
                  <span className="text-foreground text-sm">Vollständige SEO-Strategie (OnPage & OffPage)</span>
                </div>
                <div className="flex items-center">
                  <Check className="w-4 h-4 text-primary mr-3 flex-shrink-0" />
                  <span className="text-foreground text-sm">Premium-Animationen, Scroll- und Ladeeffekte</span>
                </div>
                <div className="flex items-center">
                  <Check className="w-4 h-4 text-primary mr-3 flex-shrink-0" />
                  <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-1 rounded-full text-sm font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-200">KI-Agenten Fähig</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Suspense fallback={<div className="text-center py-8">Lade Buchungsformular...</div>}>
          <BookingForm 
            packageType="erfolgswelle"
            packageName="ErfolgsWelle"
            packageDescription="Premium-Unternehmenswebsite (bis 5 Seiten) - Der nächste Level für Ihren Markenauftritt"
          />
        </Suspense>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function ErfolgsWelleBooking() {
  return (
    <Suspense fallback={<div className="text-center py-8">Lade Seite...</div>}>
      <ErfolgsWelleContent />
    </Suspense>
  );
}