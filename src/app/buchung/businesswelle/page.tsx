'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Check } from 'lucide-react';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';
import BookingForm from '@/app/components/BookingForm';

function BusinessWelleContent() {
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
            BusinessWelle buchen
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto font-light leading-relaxed mb-8">
            Bringen Sie Ihr Unternehmen auf das nächste Level
          </p>
          <p className="text-lg text-muted-foreground max-w-4xl mx-auto mb-12">
            BusinessWelle ist Ihr Wachstumsmotor für mehr Sichtbarkeit, Kunden und Umsatz. Setzen Sie auf eine individuell gestaltete Website mit klarer Struktur, SEO-Optimierung und dezenten Animationen – alles aus einer Hand und inklusive technischer Wartung und Backups. Profitieren Sie von modernster Technik und exklusiven KI-Agenten-Funktionen, die Ihr Unternehmen digital nach vorne bringen.
          </p>
          
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-8 border-2 border-primary/20 relative max-w-4xl mx-auto">
            <div className="absolute top-4 right-4">
              <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-semibold">
                Beliebt
              </span>
            </div>
            
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-foreground mb-2 tracking-wide">
                BusinessWelle
              </h3>
              <p className="text-sm text-primary font-semibold mb-2">Unternehmenswebsite (bis 3 Seiten)</p>
              <p className="text-muted-foreground mb-4 font-light leading-relaxed">
                Ihr professioneller Online-Auftritt für wachsende Unternehmen. Drei optimal strukturierte Seiten sorgen für klare Botschaften und maximale Sichtbarkeit.
              </p>
            </div>

            <div className="mb-6">
              <div className="text-3xl font-bold text-primary mb-2">
                {isMonthly ? '139 € mtl.' : '1.520 € jährlich'}
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {isMonthly ? '24 Monate, Nettopreis' : 'Netto Jährlich, 24 Monate Laufzeit'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="space-y-3">
                <div className="flex items-center">
                  <Check className="w-4 h-4 text-primary mr-3 flex-shrink-0" />
                  <span className="text-foreground text-sm">Komplett individuell erstellte Website </span>
                </div>
                <div className="flex items-center">
                  <Check className="w-4 h-4 text-primary mr-3 flex-shrink-0" />
                  <span className="text-foreground text-sm">Rechtliches Komplettpaket </span>
                </div>
                <div className="flex items-center">
                  <Check className="w-4 h-4 text-primary mr-3 flex-shrink-0" />
                  <span className="text-foreground text-sm">Kontaktformular</span>
                </div>
                <div className="flex items-center">
                  <Check className="w-4 h-4 text-primary mr-3 flex-shrink-0" />
                  <span className="text-foreground text-sm">Hosting & technische Wartung</span>
                </div>
                <div className="flex items-center">
                  <Check className="w-4 h-4 text-primary mr-3 flex-shrink-0" />
                  <span className="text-foreground text-sm">Backup alle 2 Wochen</span>
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
                  <span className="text-foreground text-sm">SEO-freundliche Grundoptimierung</span>
                </div>
                <div className="flex items-center">
                  <Check className="w-4 h-4 text-primary mr-3 flex-shrink-0" />
                  <span className="text-foreground text-sm">Dezente Animationen und visuelle Highlights</span>
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
            packageType="businesswelle"
            packageName="BusinessWelle"
            packageDescription="Unternehmenswebsite (bis 3 Seiten) - Ihr professioneller Online-Auftritt"
          />
        </Suspense>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function BusinessWelleBooking() {
  return (
    <Suspense fallback={<div className="text-center py-8">Lade Seite...</div>}>
      <BusinessWelleContent />
    </Suspense>
  );
}