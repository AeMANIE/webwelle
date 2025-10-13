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
    zielgruppe: [] as string[],
    regionaleAusrichtung: '',
    
    // Design & Stil
    designStil: '',
    brandingMaterialien: [] as string[],
    
    // Website-Struktur
    wichtigsteSeiten: [] as string[],
    
    // Funktionen
    funktionen: [] as string[],
    
    // Inhalte
    vorhandeneMaterialien: [] as string[],
    
    // Technische Anforderungen
    hosting: '',
    
    // Budget & Zeitplan
    budget: '' as string,
    fertigstellungstermin: '',
    
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

  // Sicherstellen, dass budget immer ein String ist
  useEffect(() => {
    if (typeof formData.budget === 'object' && formData.budget !== null) {
      setFormData(prev => ({ ...prev, budget: '' }));
    }
  }, [formData.budget]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Sicherstellen, dass budget immer ein String ist
  const getBudgetValue = () => {
    const budget = formData.budget;
    if (typeof budget === 'string') {
      return budget;
    }
    if (typeof budget === 'object' && budget !== null && 'value' in budget) {
      return (budget as { value: string }).value;
    }
    return '';
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
              <h4 className="font-semibold text-foreground mb-2">Zahlungsoptionen</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-foreground">Jährlich:</span>
                  <span className="font-semibold text-foreground">{prices.yearly}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-foreground">Monatlich:</span>
                  <span className="font-semibold text-foreground">{prices.monthly}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Gewählter Zahlungsmodus anzeigen */}
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-8">
          <div className="flex items-center justify-center">
            <span className="text-primary font-semibold">
              Gewählter Zahlungsmodus: {isMonthly ? 'Monatlich' : 'Jährlich'}
            </span>
          </div>
        </div>

        {/* Allgemeine Informationen */}
        <div>
          <h4 className="text-lg font-semibold text-foreground mb-4">Allgemeine Informationen</h4>
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
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {['flowwelle', 'powerwelle', 'meisterwelle'].includes(packageType) 
                  ? 'Welche Prozesse möchten Sie automatisieren? *' 
                  : 'Haben Sie bereits eine Website? *'
                }
              </label>
              {['flowwelle', 'powerwelle', 'meisterwelle'].includes(packageType) ? (
                <select
                  required
                  value={formData.bestehendeWebsite}
                  onChange={(e) => handleInputChange('bestehendeWebsite', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Bitte wählen</option>
                  <option value="kundenanfragen">Kundenanfragen & Support</option>
                  <option value="terminbuchung">Terminbuchung & Kalender</option>
                  <option value="datenverarbeitung">Datenverarbeitung & -übertragung</option>
                  <option value="kommunikation">Interne Kommunikation</option>
                  <option value="marketing">Marketing & Lead-Generierung</option>
                  <option value="buchhaltung">Buchhaltung & Rechnungswesen</option>
                  <option value="individuell">Individuelle Prozesse</option>
                </select>
              ) : (
                <select
                  required
                  value={formData.bestehendeWebsite}
                  onChange={(e) => handleInputChange('bestehendeWebsite', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Bitte wählen</option>
                  <option value="nein">Nein, kompletter Neubau</option>
                  <option value="ja">Ja, soll überarbeitet werden</option>
                  <option value="unsicher">Weiß nicht / Unsicher</option>
                </select>
              )}
            </div>
          </div>
        </div>

        {/* Zielgruppe */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Zielgruppe (mehrere Auswahl möglich)
          </label>
          <div className="space-y-2">
            {['Privatkunden (B2C)', 'Unternehmen (B2B)', 'Behörden/Non-Profit'].map((option) => (
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

        {/* Design-Stil */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Welcher Design-Stil passt zu Ihnen? *
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
        </div>

        {/* Funktionen */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            {['flowwelle', 'powerwelle', 'meisterwelle'].includes(packageType) 
              ? 'Welche KI-Funktionen benötigen Sie? (mehrere Auswahl möglich)'
              : 'Welche Funktionen benötigen Sie? (mehrere Auswahl möglich)'
            }
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {['flowwelle', 'powerwelle', 'meisterwelle'].includes(packageType) ? [
              'Automatische E-Mail-Antworten',
              'Chatbot-Integration',
              'Terminbuchung & Kalender',
              'Datenanalyse & Reporting',
              'CRM-Integration',
              'Buchhaltungs-Integration',
              'Marketing-Automatisierung',
              'Kundenservice-Automatisierung',
              'Lead-Generierung',
              'Workflow-Management',
              'API-Integrationen',
              'Individuelle Anpassungen'
            ] : [
              'Responsive Design',
              'SEO-Optimierung',
              'Kontaktformular',
              'Live-Chat',
              'Online-Shop',
              'Warenkorb',
              'Terminbuchung',
              'Mitgliederbereich'
            ].map((option) => (
              <label key={option} className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.funktionen.includes(option)}
                  onChange={(e) => handleCheckboxChange('funktionen', option, e.target.checked)}
                  className="mr-2 text-primary focus:ring-primary"
                />
                <span className="text-foreground">{option}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Budget */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            {['flowwelle', 'powerwelle', 'meisterwelle'].includes(packageType) 
              ? 'Monatliches Budget für KI-Automatisierung'
              : 'Budget-Rahmen'
            }
          </label>
          <select
            value={getBudgetValue()}
            onChange={(e) => handleInputChange('budget', e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">Bitte wählen</option>
            {['flowwelle', 'powerwelle', 'meisterwelle'].includes(packageType) ? 
              [
                { value: "100-200", label: "€100 - €200 pro Monat" },
                { value: "200-500", label: "€200 - €500 pro Monat" },
                { value: "500-1000", label: "€500 - €1.000 pro Monat" },
                { value: "1000-2000", label: "€1.000 - €2.000 pro Monat" },
                { value: "2000+", label: "€2.000+ pro Monat" }
              ].map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              )) : 
              [
                { value: "2000-5000", label: "€2.000 - €5.000" },
                { value: "5000-10000", label: "€5.000 - €10.000" },
                { value: "10000-20000", label: "€10.000 - €20.000" },
                { value: "20000-50000", label: "€20.000 - €50.000" },
                { value: "50000+", label: "€50.000+" }
              ].map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))
            }
          </select>
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
