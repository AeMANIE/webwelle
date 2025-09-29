'use client';

import { useState } from 'react';
import { Lightbulb, X } from 'lucide-react';
import StripeCheckout from './StripeCheckout';

export default function Products() {
  const [isMonthly, setIsMonthly] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<'nextjs' | 'wordpress' | null>(null);
  return (
    <section id="produkte" className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-tight">
            Websites nach Maß – Zwei Modelle, zwei Wege zum Erfolg
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto font-light leading-relaxed mb-8">
            Wählen Sie das perfekte Paket für Ihre Bedürfnisse. Alle Preise inkl. Domain, Hosting & Support.
          </p>
          
          {/* Preis-Toggle */}
          <div className="flex items-center justify-center space-x-4 mb-8">
            <span className={`text-sm font-medium ${!isMonthly ? 'text-foreground' : 'text-muted-foreground'}`}>
              Einmalzahlung
            </span>
            <button
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
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Next.js Premium Package */}
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-8 border-2 border-primary/20 relative">
            <div className="absolute top-4 right-4">
              <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-semibold">
                Premium
              </span>
            </div>
            
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-foreground mb-2 tracking-wide">
                React / Next.js Website
              </h3>
              <p className="text-muted-foreground mb-4 font-light leading-relaxed">
                Für maximale Geschwindigkeit, höchste Individualisierbarkeit und modernstes Nutzererlebnis. 
                Ideal für Unternehmen mit speziellen Anforderungen und maximalen Performance-Zielen.
              </p>
            </div>

            <div className="mb-6">
              <div className="text-3xl font-bold text-primary mb-2">
                {isMonthly ? '119 € mtl.' : 'Ab 2.490 €'}
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {isMonthly ? '24 Monate, inkl. 20% Aufschlag' : 'Einmalzahlung, 24 Monate Laufzeit'}
              </p>
              {!isMonthly && (
                <div className="text-lg font-semibold text-foreground">
                  Oder 119 € mtl.
                </div>
              )}
              {isMonthly && (
                <div className="text-lg font-semibold text-foreground">
                  Oder 2.490 € einmalig
                </div>
              )}
            </div>

            <div className="space-y-3 mb-8">
              <div className="flex items-center">
                <span className="text-primary mr-3">✓</span>
                <span className="text-foreground">Extreme Geschwindigkeit & Performance</span>
              </div>
              <div className="flex items-center">
                <span className="text-primary mr-3">✓</span>
                <span className="text-foreground">Vollständig individualisierbar</span>
              </div>
              <div className="flex items-center">
                <span className="text-primary mr-3">✓</span>
                <span className="text-foreground">Zukunftssicher & skalierbar</span>
              </div>
              <div className="flex items-center">
                <span className="text-primary mr-3">✓</span>
                <span className="text-foreground">SEO-optimiert</span>
              </div>
              <div className="flex items-center">
                <span className="text-primary mr-3">✓</span>
                <span className="text-foreground">E-Commerce Integration</span>
              </div>
            </div>

            <button
              onClick={() => {
                setSelectedPackage('nextjs');
                setShowBookingForm(true);
              }}
              className="w-full bg-primary text-primary-foreground py-3 px-6 rounded-lg hover:bg-primary/90 transition-colors font-semibold text-center"
            >
              Jetzt buchen
            </button>
          </div>

          {/* WordPress Classic Package */}
          <div className="bg-gradient-to-br from-card to-card/50 rounded-2xl p-8 border-2 border-border">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-foreground mb-2 tracking-wide">
                WordPress Website
              </h3>
              <p className="text-muted-foreground mb-4 font-light leading-relaxed">
                Für preisbewusste Kunden, die schnell und einfach starten wollen. 
                Perfekt für kleine Unternehmen, Praxen oder Dienstleister.
              </p>
            </div>

            <div className="mb-6">
              <div className="text-3xl font-bold text-foreground mb-2">
                {isMonthly ? '65 € mtl.' : 'Ab 1.290 €'}
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {isMonthly ? '24 Monate, inkl. 20% Aufschlag' : 'Einmalzahlung, 24 Monate Laufzeit'}
              </p>
              {!isMonthly && (
                <div className="text-lg font-semibold text-foreground">
                  Oder 65 € mtl.
                </div>
              )}
              {isMonthly && (
                <div className="text-lg font-semibold text-foreground">
                  Oder 1.290 € einmalig
                </div>
              )}
            </div>

            <div className="space-y-3 mb-8">
              <div className="flex items-center">
                <span className="text-primary mr-3">✓</span>
                <span className="text-foreground">Schneller Start & einfache Bedienung</span>
              </div>
              <div className="flex items-center">
                <span className="text-primary mr-3">✓</span>
                <span className="text-foreground">Responsive Design</span>
              </div>
              <div className="flex items-center">
                <span className="text-primary mr-3">✓</span>
                <span className="text-foreground">SEO-Grundausstattung</span>
              </div>
              <div className="flex items-center">
                <span className="text-primary mr-3">✓</span>
                <span className="text-foreground">Content-Management</span>
              </div>
              <div className="flex items-center">
                <span className="text-primary mr-3">✓</span>
                <span className="text-foreground">Kostengünstig & effizient</span>
              </div>
            </div>

            <button
              onClick={() => {
                alert('WordPress-Paket ist derzeit in Vorbereitung. Bitte wählen Sie das React/Next.js Paket oder kontaktieren Sie uns direkt.');
              }}
              className="w-full bg-secondary text-secondary-foreground py-3 px-6 rounded-lg hover:bg-secondary/90 transition-colors font-semibold text-center opacity-75"
            >
              Bald verfügbar
            </button>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-12 text-center">
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-6 max-w-4xl mx-auto">
            <h3 className="text-lg font-semibold text-primary mb-2 flex items-center justify-center gap-2">
              <Lightbulb className="w-5 h-5" />
              Individuelle Erweiterungen möglich
            </h3>
            <p className="text-muted-foreground">
              Beide Pakete können jederzeit durch Zusatzfunktionen, Automatisierung oder KI-Lösungen erweitert werden. 
              Wir beraten Sie gerne zu Ihren spezifischen Anforderungen.
            </p>
          </div>
        </div>
      </div>

      {/* Buchungsformular Modal */}
      {showBookingForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold text-foreground">
                  Buchungsformular - {selectedPackage === 'nextjs' ? 'React/Next.js Website' : 'WordPress Website'}
                </h3>
                <button
                  onClick={() => setShowBookingForm(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <BookingForm 
                packageType={selectedPackage!} 
                isMonthly={isMonthly}
                onClose={() => setShowBookingForm(false)}
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

// Buchungsformular Komponente
function BookingForm({ packageType, isMonthly, onClose }: { 
  packageType: 'nextjs' | 'wordpress', 
  isMonthly: boolean, 
  onClose: () => void 
}) {
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

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Paket-Info */}
      <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
        <h4 className="font-semibold text-primary mb-2">Ausgewähltes Paket</h4>
        <p className="text-foreground">
          {packageType === 'nextjs' ? 'React/Next.js Website' : 'WordPress Website'} - 
          {isMonthly ? ' Monatliche Zahlung' : ' Einmalzahlung'}
        </p>
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
              className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
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
              className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
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
          className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
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
              className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
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
              className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
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
              className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
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
            className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
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
          {isMonthly ? 'Monatliche Zahlung starten' : 'Einmalzahlung starten'}
        </StripeCheckout>
        <button
          type="button"
          onClick={onClose}
          className="flex-1 bg-secondary text-secondary-foreground py-3 px-6 rounded-lg hover:bg-secondary/90 transition-colors font-semibold"
        >
          Abbrechen
        </button>
      </div>
    </form>
  );
}

