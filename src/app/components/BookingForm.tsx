'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import StripeCheckout from './StripeCheckout';

interface BookingFormProps {
  packageType: 'starterwelle' | 'businesswelle' | 'erfolgswelle' | 'flowwelle' | 'powerwelle' | 'meisterwelle';
  packageName: string;
  packageDescription: string;
  features?: string[];
  monthlyPrice?: number;
  yearlyPrice?: number;
}

export default function BookingForm({ packageType, packageName, packageDescription, features, monthlyPrice, yearlyPrice }: BookingFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isMonthly, setIsMonthly] = useState(true);

  const [formData, setFormData] = useState({
    // Allgemeine Informationen
    firmenname: '',
    bestehendeWebsite: '',
    aktuelleWebsiteUrl: '',
    wettbewerberWebsite: '',
    zielgruppe: [] as string[],
    
    // Design & Stil
    designStil: '',
    designVorbild: '',
    
    // WebWelle Zusatzauswahl
    zusatzfunktionen: [] as string[],
    
    // Kontaktdaten
    name: '',
    email: '',
    telefon: '',
    nachricht: ''
  });

  // URL-Parameter für Zahlungsmodus lesen
  useEffect(() => {
    const billingParam = searchParams.get('billing');
    if (billingParam === 'monthly') {
      setIsMonthly(true);
    } else if (billingParam === 'yearly') {
      setIsMonthly(false);
    }
    // Wenn kein Parameter vorhanden ist, bleibt der Standard (monatlich)
  }, [searchParams]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCheckboxChange = (field: string, value: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: checked 
        ? [...prev[field as keyof typeof prev] as string[], value]
        : (prev[field as keyof typeof prev] as string[]).filter(item => item !== value)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validierung der Pflichtfelder
    if (!formData.firmenname || !formData.name || !formData.email) {
      alert('Bitte füllen Sie alle Pflichtfelder aus.');
      return;
    }
    
    // Form wird durch StripeCheckout-Komponente verarbeitet
  };

  const getPackagePrices = () => {
    // Wenn Preise als Props übergeben wurden, diese verwenden
    if (monthlyPrice && yearlyPrice) {
      return { 
        monthly: `${monthlyPrice} € mtl.`, 
        yearly: `${yearlyPrice} € jährlich` 
      };
    }
    
    // Fallback für bestehende Webdesign-Pakete
    switch (packageType) {
      case 'starterwelle':
        return { monthly: '77 € mtl.', yearly: '840 € jährlich' };
      case 'businesswelle':
        return { monthly: '139 € mtl.', yearly: '1.520 € jährlich' };
      case 'erfolgswelle':
        return { monthly: '278 € mtl.', yearly: '3.289 € jährlich' };
      case 'flowwelle':
        return { monthly: '99 € mtl.', yearly: '990 € jährlich' };
      case 'powerwelle':
        return { monthly: '179 € mtl.', yearly: '1.790 € jährlich' };
      case 'meisterwelle':
        return { monthly: '249 € mtl.', yearly: '2.490 € jährlich' };
      default:
        return { monthly: '', yearly: '' };
    }
  };

  const prices = getPackagePrices();

  return (
    <div className="bg-card rounded-2xl p-8 border border-border">
      {/* Zurück-Button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Zurück zu den Produkten
      </button>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Paket-Info */}
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-6">
          <h3 className="font-semibold text-primary mb-4 text-lg">Ausgewähltes Paket</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-foreground mb-2">{packageName}</h4>
              <p className="text-muted-foreground text-sm mb-4">{packageDescription}</p>
              
              {/* Features für AI-Agent Pakete */}
              {features && features.length > 0 && (
                <div className="mt-4">
                  <h5 className="font-semibold text-foreground mb-2 text-sm">Paket-Features:</h5>
                  <ul className="space-y-1">
                    {features.map((feature, index) => (
                      <li key={index} className="flex items-center text-sm text-muted-foreground">
                        <span className="w-1.5 h-1.5 bg-primary rounded-full mr-2 flex-shrink-0"></span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-2">Gewählter Zahlungsmodus</h4>
              <div className="bg-gradient-to-r from-primary/20 to-primary/10 border border-primary/30 rounded-lg p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary mb-1">
                    {isMonthly ? prices.monthly : prices.yearly}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {isMonthly ? 'Monatliche Zahlung' : 'Jährliche Zahlung'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>


        {/* Wellenstart – Ihr individuelles Wunschprojekt */}
        <div>
          <h4 className="text-lg font-semibold text-foreground mb-4">Wellenstart – Ihr individuelles Wunschprojekt</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Firmen- oder Projektname *
              </label>
              <input
                type="text"
                required
                value={formData.firmenname}
                onChange={(e) => handleInputChange('firmenname', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Wie soll Ihre digitale Erfolgswelle heißen?"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Haben Sie bereits eine Website? *
              </label>
              <select
                required
                value={formData.bestehendeWebsite}
                onChange={(e) => handleInputChange('bestehendeWebsite', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Bitte wählen</option>
                <option value="nein">Nein – Ich starte völlig neu</option>
                <option value="Ja">Ja – Bitte tragen Sie Ihre aktuelle Website-Adresse ein</option>
              </select>
            </div>
          </div>
          
          {formData.bestehendeWebsite === 'Ja' && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-foreground mb-2">
                Aktuelle Website-Adresse
              </label>
              <input
                type="url"
                value={formData.aktuelleWebsiteUrl}
                onChange={(e) => handleInputChange('aktuelleWebsiteUrl', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="https://ihre-website.de"
              />
            </div>
          )}
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-foreground mb-2">
              Wettbewerber-Website
            </label>
            <input
              type="url"
              value={formData.wettbewerberWebsite}
              onChange={(e) => handleInputChange('wettbewerberWebsite', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Gibt es eine Mitbewerber-Seite, die Sie besonders anspricht?"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Teilen Sie die Webadresse für Inspiration und Strategievorsprung
            </p>
          </div>
        </div>

        {/* Ihre Zielgruppe im Fokus */}
        <div>
          <h4 className="text-lg font-semibold text-foreground mb-4">Ihre Zielgruppe im Fokus</h4>
          <div className="space-y-2">
            {['Privatkunden (B2C)', 'Geschäftskunden (B2B)', 'Behörden oder Non-Profit'].map((option) => (
              <label key={option} className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.zielgruppe.includes(option)}
                  onChange={(e) => handleCheckboxChange('zielgruppe', option, e.target.checked)}
                  className="mr-2 text-primary focus:ring-primary"
                />
                <span className="text-foreground">{option}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Stilrichtung & Inspirationsquelle */}
        <div>
          <h4 className="text-lg font-semibold text-foreground mb-4">Stilrichtung & Inspirationsquelle</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {[
              { value: 'modern', label: 'Modern & minimalistisch' },
              { value: 'creative', label: 'Kreativ & verspielt' },
              { value: 'professional', label: 'Klassisch & seriös' },
              { value: 'tech', label: 'Technisch & futuristisch' }
            ].map((option) => (
              <label key={option.value} className="flex items-center">
                <input
                  type="radio"
                  name="designStil"
                  value={option.value}
                  checked={formData.designStil === option.value}
                  onChange={(e) => handleInputChange('designStil', e.target.value)}
                  className="mr-2 text-primary focus:ring-primary"
                />
                <span className="text-foreground text-sm">{option.label}</span>
              </label>
            ))}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Design-Vorbild (Web-URL)
            </label>
            <input
              type="url"
              value={formData.designVorbild}
              onChange={(e) => handleInputChange('designVorbild', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Kennen Sie eine Website, deren Aussehen Ihnen besonders gefällt?"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Tragen Sie hier den Link ein
            </p>
          </div>
        </div>

        {/* WebWelle Zusatzauswahl */}
        <div>
          <h4 className="text-lg font-semibold text-foreground mb-4">WebWelle Zusatzauswahl: Mehr Leistung für Ihr Projekt</h4>
          <p className="text-muted-foreground mb-4">
            Wählen Sie zusätzliche Wunschfunktionen – alle Preise sind netto und werden transparent im Angebot ausgewiesen:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { value: 'blitz-welle', label: 'Blitz-Welle: Online in 2 Wochen', price: '249,99 €' },
              { value: 'logo-welle', label: 'LogoWelle: Exklusives Logo-Design', price: '299 €' },
              { value: 'terminbuchung', label: 'Terminbuchungs-System: Online-Terminbuchung für Ihre Kunden', price: '1.599 €' },
              { value: 'online-shop', label: 'Online-Shop: Mit integriertem Warenkorb (bis zu 10 Produkte)', price: '2.999 €' },
              { value: 'mitglieder-welle', label: 'MitgliederWelle: Mitgliederbereich inkl. Admin-Funktionen', price: '2.399 €' },
              { value: 'foto-welle-5', label: 'FotoWelle: Profi-Fotopaket (5 Fotos)', price: '575 €' },
              { value: 'foto-welle-10', label: 'FotoWelle: Profi-Fotopaket (10 Fotos)', price: '999 €' },
              { value: 'foto-welle-20', label: 'FotoWelle: Profi-Fotopaket (20 Fotos)', price: '1.750 €' },
              { value: 'lieferdienst', label: 'Lieferdienst: Integration eines eigenen Lieferdienstes', price: '2.999 €' },
              { value: 'google-my-business', label: 'Google My Business Komplettservice: Listung, Pflege und Optimierung', price: '399 €' }
            ].map((option) => (
              <label key={option.value} className="flex items-start p-3 border border-border rounded-lg hover:bg-primary/5 transition-colors">
                <input
                  type="checkbox"
                  checked={formData.zusatzfunktionen.includes(option.value)}
                  onChange={(e) => handleCheckboxChange('zusatzfunktionen', option.value, e.target.checked)}
                  className="mr-3 mt-1 text-primary focus:ring-primary"
                />
                <div className="flex-1">
                  <span className="text-foreground font-medium">{option.label}</span>
                  <div className="text-primary font-semibold text-sm mt-1">{option.price}</div>
                </div>
              </label>
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Alle gewählten Zusatzfunktionen heben Ihr Webprojekt gezielt auf ein neues Level und werden persönlich mit Ihnen abgestimmt.
          </p>
        </div>


        {/* Kontaktdaten */}
        <div>
          <h4 className="text-lg font-semibold text-foreground mb-4">Kontaktdaten</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                E-Mail *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Telefon
              </label>
              <input
                type="tel"
                value={formData.telefon}
                onChange={(e) => handleInputChange('telefon', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-foreground mb-2">
              Weitere Nachrichten oder Anforderungen
            </label>
            <textarea
              value={formData.nachricht}
              onChange={(e) => handleInputChange('nachricht', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Beschreiben Sie hier Ihre speziellen Wünsche oder Anforderungen..."
            />
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-border">
          <StripeCheckout
            packageType={packageType}
            isMonthly={isMonthly}
            customerEmail={formData.email}
            customerName={formData.name}
            formData={formData}
            className="flex-1 bg-primary text-primary-foreground py-3 px-6 rounded-lg hover:bg-primary/90 transition-colors font-semibold"
          >
            {isMonthly ? 'Monatliche Zahlung starten' : 'Jährliche Zahlung starten'}
          </StripeCheckout>
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 bg-secondary text-secondary-foreground py-3 px-6 rounded-lg hover:bg-secondary/90 transition-colors font-semibold"
          >
            Abbrechen
          </button>
        </div>
      </form>
    </div>
  );
}
