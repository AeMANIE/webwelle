'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import StripeCheckout from './StripeCheckout';

interface BookingFormProps {
  packageType: 'starterwelle' | 'businesswelle' | 'erfolgswelle';
  packageName: string;
  packageDescription: string;
}

export default function BookingForm({ packageType, packageName, packageDescription }: BookingFormProps) {
  const router = useRouter();
  const [isMonthly, setIsMonthly] = useState(false);
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
    budget: '',
    fertigstellungstermin: '',
    
    // Kontaktdaten
    name: '',
    email: '',
    telefon: '',
    nachricht: ''
  });

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
    switch (packageType) {
      case 'starterwelle':
        return { monthly: '77 € mtl.', yearly: '840 € jährlich' };
      case 'businesswelle':
        return { monthly: '139 € mtl.', yearly: '1.520 € jährlich' };
      case 'erfolgswelle':
        return { monthly: '278 € mtl.', yearly: '3.289 € jährlich' };
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

        {/* Preis-Toggle */}
        <div className="flex items-center justify-center space-x-4 mb-8">
          <span className={`text-sm font-medium ${!isMonthly ? 'text-foreground' : 'text-muted-foreground'}`}>
            Jährlich
          </span>
          <button
            type="button"
            onClick={() => setIsMonthly(!isMonthly)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
              isMonthly ? 'bg-primary' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isMonthly ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <span className={`text-sm font-medium ${isMonthly ? 'text-foreground' : 'text-muted-foreground'}`}>
            Monatlich
          </span>
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
                Haben Sie bereits eine Website? *
              </label>
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
            Welche Funktionen benötigen Sie? (mehrere Auswahl möglich)
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
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
            Budget-Rahmen
          </label>
          <select
            value={formData.budget}
            onChange={(e) => handleInputChange('budget', e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">Bitte wählen</option>
            <option value="2000-5000">€2.000 - €5.000</option>
            <option value="5000-10000">€5.000 - €10.000</option>
            <option value="10000-20000">€10.000 - €20.000</option>
            <option value="20000-50000">€20.000 - €50.000</option>
            <option value="50000+">€50.000+</option>
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
