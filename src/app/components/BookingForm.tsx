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

type ZusatzZahlungType = 'oneTime' | 'monthly';

interface BookingFormData {
  // Allgemeine Informationen
  firmenname: string;
  bestehendeWebsite: string;
  aktuelleWebsiteUrl: string;
  wettbewerberWebsite: string;
  zielgruppe: string[];

  // Design & Stil
  designStil: string;
  designVorbild: string;

  // WebWelle Zusatzauswahl
  zusatzfunktionen: string[];
  zusatzzahlung: Record<string, ZusatzZahlungType>;

  // Kontaktdaten
  name: string;
  email: string;
  telefon: string;
  nachricht: string;
}

export default function BookingForm({ packageType, packageName, packageDescription, monthlyPrice, yearlyPrice }: BookingFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isMonthly, setIsMonthly] = useState(true);
  const STORAGE_KEY = `bookingForm:${packageType}`;

  const [formData, setFormData] = useState<BookingFormData>({
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
    // Zahlungsart pro Zusatzfunktion: 'oneTime' | 'monthly'
    zusatzzahlung: {},
    
    // Kontaktdaten
    name: '',
    email: '',
    telefon: '',
    nachricht: ''
  });

  // Persistenz: Laden (mit Ablauf 7 Tage) & URL-Parameter berücksichtigen
  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
      if (raw) {
        const parsed = JSON.parse(raw) as { ts: number; data: BookingFormData; isMonthly: boolean } | null;
        // 7 Tage in ms
        const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
        if (parsed && Date.now() - parsed.ts < oneWeekMs) {
          setFormData(parsed.data);
          setIsMonthly(parsed.isMonthly);
        } else {
          window.localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch {
      // ignorieren – Persistenz ist best-effort
    }

    // URL-Parameter für Zahlungsmodus hat Priorität gegenüber Persistenz
    const billingParam = searchParams.get('billing');
    if (billingParam === 'monthly') {
      setIsMonthly(true);
    } else if (billingParam === 'yearly') {
      setIsMonthly(false);
    }
  }, [searchParams, STORAGE_KEY]);

  // Persistenz: Speichern bei Änderungen
  useEffect(() => {
    try {
      const payload = JSON.stringify({ ts: Date.now(), data: formData, isMonthly });
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, payload);
      }
    } catch {
      // ignorieren
    }
  }, [formData, isMonthly, STORAGE_KEY]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCheckboxChange = (field: string, value: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: checked 
        ? [...prev[field as keyof typeof prev] as string[], value]
        : (prev[field as keyof typeof prev] as string[]).filter(item => item !== value)
    }));
    // Bei Abwahl auch die gewählte Zahlungsart entfernen
    if (!checked && field === 'zusatzfunktionen') {
      setFormData((prev) => {
        const nextZahlung = { ...prev.zusatzzahlung };
        delete nextZahlung[value];
        return { ...prev, zusatzzahlung: nextZahlung };
      });
    }
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
              { value: 'blitz-welle', label: 'Blitz-Welle: Online in 2 Wochen', price: '249,99 €', supportsMonthly: false },
              { value: 'logo-welle', label: 'LogoWelle: Exklusives Logo-Design', price: '299 €', supportsMonthly: false },
              { value: 'terminbuchung', label: 'Terminbuchungs-System: Online-Terminbuchung für Ihre Kunden', price: '1.599 €', monthlyPrice: '145,99 € mtl', supportsMonthly: true },
              { value: 'online-shop', label: 'Online-Shop: Mit integriertem Warenkorb (bis zu 10 Produkte)', price: '2.999 €', monthlyPrice: '274,99 € mtl', supportsMonthly: true },
              { value: 'mitglieder-welle', label: 'MitgliederWelle: Mitgliederbereich inkl. Admin-Funktionen', price: '2.399 €', monthlyPrice: '219,99 € mtl', supportsMonthly: true },
              { value: 'foto-welle-5', label: 'FotoWelle: Profi-Fotopaket (5 Fotos)', price: '575 €', supportsMonthly: false },
              { value: 'foto-welle-10', label: 'FotoWelle: Profi-Fotopaket (10 Fotos)', price: '999 €', supportsMonthly: false },
              { value: 'foto-welle-20', label: 'FotoWelle: Profi-Fotopaket (20 Fotos)', price: '1.750 €', supportsMonthly: false },
              { value: 'lieferdienst', label: 'Lieferdienst: Integration eines eigenen Lieferdienstes', price: '2.999 €', monthlyPrice: '279,99 € mtl', supportsMonthly: true },
              { value: 'google-my-business', label: 'Google My Business Komplettservice: Listung, Pflege und Optimierung', price: '399 €', supportsMonthly: false },
              { value: 'visitenkarten', label: 'Visitenkarten-Paket – Ihr Unternehmen professionell in Szene gesetzt', price: '100 €', supportsMonthly: false }
            ].map((option) => {
              const checked = formData.zusatzfunktionen.includes(option.value);
              const zahlung = formData.zusatzzahlung?.[option.value] as (ZusatzZahlungType | undefined);
              return (
                <div key={option.value} className="p-3 border border-border rounded-lg hover:bg-primary/5 transition-colors">
                  <label className="flex items-start">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => handleCheckboxChange('zusatzfunktionen', option.value, e.target.checked)}
                      className="mr-3 mt-1 text-primary focus:ring-primary"
                    />
                    <div className="flex-1">
                      <span className="text-foreground font-medium">{option.label}</span>
                      <div className="text-primary font-semibold text-sm mt-1">{option.price}{option.supportsMonthly && option.monthlyPrice ? `  oder ${option.monthlyPrice}` : ''}</div>
                    </div>
                  </label>
                  {checked && option.supportsMonthly && (
                    <div className="mt-2 pl-7">
                      <div className="inline-flex items-center gap-4 text-sm">
                        <label className="inline-flex items-center gap-2">
                          <input
                            type="radio"
                            name={`zahlung-${option.value}`}
                            checked={zahlung !== 'monthly'}
                            onChange={() => setFormData((prev) => ({ ...prev, zusatzzahlung: { ...prev.zusatzzahlung, [option.value]: 'oneTime' } }))}
                          />
                          <span className="text-foreground">Einmalig</span>
                        </label>
                        <label className="inline-flex items-center gap-2">
                          <input
                            type="radio"
                            name={`zahlung-${option.value}`}
                            checked={zahlung === 'monthly'}
                            onChange={() => setFormData((prev) => ({ ...prev, zusatzzahlung: { ...prev.zusatzzahlung, [option.value]: 'monthly' } }))}
                          />
                          <span className="text-foreground">Monatlich</span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Alle gewählten Zusatzfunktionen heben Ihr Webprojekt gezielt auf ein neues Level und werden persönlich mit Ihnen abgestimmt.
          </p>
        </div>


        

        {/* Zusammenfassung (professionelles, responsives Design) */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <h3 className="font-semibold text-foreground text-lg">Ausgewähltes Paket</h3>
            <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <span className="inline-block w-2 h-2 rounded-full bg-primary" />
              Zusammenfassung
            </span>
          </div>

          {/* Warenkorb-Layout (einzelne Liste, Text links – Preis rechts) */}
          {(() => {
            const options = [
              { value: 'blitz-welle', label: 'Blitz-Welle: Online in 2 Wochen', price: '249,99 €', supportsMonthly: false as const },
              { value: 'logo-welle', label: 'LogoWelle: Exklusives Logo-Design', price: '299 €', supportsMonthly: false as const },
              { value: 'terminbuchung', label: 'Terminbuchungs-System: Online-Terminbuchung für Ihre Kunden', price: '1.599 €', monthlyPrice: '145,99 € mtl', supportsMonthly: true as const },
              { value: 'online-shop', label: 'Online-Shop: Mit integriertem Warenkorb (bis zu 10 Produkte)', price: '2.999 €', monthlyPrice: '274,99 € mtl', supportsMonthly: true as const },
              { value: 'mitglieder-welle', label: 'MitgliederWelle: Mitgliederbereich inkl. Admin-Funktionen', price: '2.399 €', monthlyPrice: '219,99 € mtl', supportsMonthly: true as const },
              { value: 'foto-welle-5', label: 'FotoWelle: Profi-Fotopaket (5 Fotos)', price: '575 €', supportsMonthly: false as const },
              { value: 'foto-welle-10', label: 'FotoWelle: Profi-Fotopaket (10 Fotos)', price: '999 €', supportsMonthly: false as const },
              { value: 'foto-welle-20', label: 'FotoWelle: Profi-Fotopaket (20 Fotos)', price: '1.750 €', supportsMonthly: false as const },
              { value: 'lieferdienst', label: 'Lieferdienst: Integration eines eigenen Lieferdienstes', price: '2.999 €', monthlyPrice: '279,99 € mtl', supportsMonthly: true as const },
              { value: 'google-my-business', label: 'Google My Business Komplettservice: Listung, Pflege und Optimierung', price: '399 €', supportsMonthly: false as const },
              { value: 'visitenkarten', label: 'Visitenkarten-Paket – Ihr Unternehmen professionell in Szene gesetzt', price: '100 €', supportsMonthly: false as const }
            ];

            // Paket-Zeile vorbereiten
            const cartRows: Array<{ left: React.ReactNode; right: string; section: 'package' | 'addons' }>= [];
            cartRows.push({
              left: (
                <div>
                  <div className="font-semibold text-foreground">{packageName}</div>
                  <div className="text-xs text-muted-foreground mt-1">{packageDescription}</div>
                </div>
              ),
              right: isMonthly ? prices.monthly : prices.yearly,
              section: 'package'
            });

            // Add-on Zeilen
            formData.zusatzfunktionen.forEach((key) => {
              const opt = options.find(o => o.value === key);
              if (!opt) return;
              const zahlung = formData.zusatzzahlung?.[key];
              const chosen = opt.supportsMonthly && zahlung === 'monthly' && opt.monthlyPrice ? opt.monthlyPrice : opt.price;
              cartRows.push({
                left: (<div className="text-foreground">{opt.label}</div>),
                right: chosen || '',
                section: 'addons'
              });
            });

            return (
              <div className="space-y-3">
                {/* Section: Ausgewähltes Paket */}
                <h5 className="font-semibold text-foreground text-sm">Ausgewähltes Paket</h5>
                <div className="grid grid-cols-[1fr_auto] gap-3 items-start border border-border rounded-lg p-3 bg-background">
                  <div>{cartRows[0]?.left}</div>
                  <div className="text-right font-semibold text-primary whitespace-nowrap">{cartRows[0]?.right}</div>
                </div>

                {/* Section: Gewählte Zusatzoptionen */}
                {cartRows.filter(r => r.section === 'addons').length > 0 && (
                  <div className="space-y-2">
                    <h5 className="font-semibold text-foreground text-sm">Gewählte Zusatzoptionen</h5>
                    <ul className="space-y-2">
                      {cartRows.filter(r => r.section === 'addons').map((row, idx) => (
                        <li key={idx} className="grid grid-cols-[1fr_auto] gap-3 items-start border border-border rounded-lg p-3 bg-background">
                          <div className="min-w-0 break-words">{row.left}</div>
                          <div className="text-right font-semibold text-primary whitespace-nowrap">{row.right}</div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* Submit Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-border">
          <StripeCheckout
            packageType={packageType}
            isMonthly={isMonthly}
            customerEmail={formData.email}
            customerName={formData.name}
            formData={formData as unknown as Record<string, unknown>}
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
