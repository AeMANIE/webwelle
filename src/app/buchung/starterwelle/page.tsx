'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';
import BookingForm from '@/app/components/BookingForm';
import { Check } from 'lucide-react';

function StarterWelleContent() {
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
            StarterWelle buchen
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto font-light leading-relaxed mb-8">
            Sichern Sie sich Ihren perfekten Online-Start
          </p>
          <p className="text-lg text-muted-foreground max-w-4xl mx-auto mb-12">
            Erleben Sie, wie Ihre Marke sichtbar wird – ganz ohne Kompromisse. Mit StarterWelle erhalten Sie eine moderne One-Pager-Website, die Ihre Botschaft auf den Punkt bringt und nachhaltig Eindruck hinterlässt. Überzeugen Sie Ihre Kunden von Beginn an und starten Sie Ihre digitale Erfolgsgeschichte mit persönlicher Betreuung, rechtlicher Sicherheit und regelmäßigen Backups.
          </p>
          
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-8 max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-primary mb-4">StarterWelle</h2>
              <p className="text-lg text-primary font-semibold mb-2">One-Page Website</p>
              <p className="text-muted-foreground text-lg">
                Ihr digitaler Auftritt auf den Punkt gebracht. Ideal als Landingpage für Kampagnen oder als professionelles Unternehmensprofil.
              </p>
            </div>

            <div className="mb-6">
              <div className="text-3xl font-bold text-foreground mb-2">
                {isMonthly ? '77 € mtl.' : '840 € jährlich'}
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {isMonthly ? '24 Monate, Nettopreis' : 'Netto Jährlich, 24 Monate Laufzeit'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="space-y-3">
                <div className="flex items-center">
                  <Check className="w-4 h-4 text-primary mr-3 flex-shrink-0" />
                  <span className="text-foreground text-sm">Individuell gestaltete Onepage-Website</span>
                </div>
                <div className="flex items-center">
                  <Check className="w-4 h-4 text-primary mr-3 flex-shrink-0" />
                  <span className="text-foreground text-sm">Rechtliches Basispaket </span>
                </div>
                <div className="flex items-center">
                  <Check className="w-4 h-4 text-primary mr-3 flex-shrink-0" />
                  <span className="text-foreground text-sm">Kontaktformular</span>
                </div>
                <div className="flex items-center">
                  <Check className="w-4 h-4 text-primary mr-3 flex-shrink-0" />
                  <span className="text-foreground text-sm">Hosting & Wartung inklusive</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center">
                  <Check className="w-4 h-4 text-primary mr-3 flex-shrink-0" />
                  <span className="text-foreground text-sm">Backup alle 2 Wochen</span>
                </div>
                <div className="flex items-center">
                  <Check className="w-4 h-4 text-primary mr-3 flex-shrink-0" />
                  <span className="text-foreground text-sm">Domain (.de oder .com)</span>
                </div>
                <div className="flex items-center">
                  <Check className="w-4 h-4 text-primary mr-3 flex-shrink-0" />
                  <span className="text-foreground text-sm">E-Mail-Postfach (z.B. info@deine-firma.de)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Suspense fallback={<div className="text-center py-8">Lade Buchungsformular...</div>}>
          <BookingForm 
            packageType="starterwelle"
            packageName="StarterWelle"
            packageDescription="One-Page Website - Ihr digitaler Auftritt auf den Punkt gebracht"
          />
        </Suspense>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function StarterWelleBooking() {
  return (
    <Suspense fallback={<div className="text-center py-8">Lade Seite...</div>}>
      <StarterWelleContent />
    </Suspense>
  );
}