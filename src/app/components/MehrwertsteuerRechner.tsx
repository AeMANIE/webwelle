'use client';

import { useState, useEffect } from 'react';
import { Calculator, Copy, Check } from 'lucide-react';

interface CalculationResult {
  netto: number;
  brutto: number;
  mwst: number;
  mwstBetrag: number;
}

export default function MehrwertsteuerRechner() {
  const [steuersatz, setSteuersatz] = useState<number>(19);
  const [customSteuersatz, setCustomSteuersatz] = useState<string>('');
  const [netto, setNetto] = useState<string>('100');
  const [brutto, setBrutto] = useState<string>('');
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [calculationType, setCalculationType] = useState<'netto' | 'brutto'>('netto');

  // Funktion zur Formatierung von Zahlen im deutschen Format (mit Komma)
  const formatGermanNumber = (value: number): string => {
    return value.toFixed(2).replace('.', ',');
  };

  const calculateFromNetto = (nettoValue: number, steuersatz: number): CalculationResult => {
    const mwstBetrag = nettoValue * (steuersatz / 100);
    const brutto = nettoValue + mwstBetrag;
    return {
      netto: nettoValue,
      brutto: Math.round(brutto * 100) / 100,
      mwst: steuersatz,
      mwstBetrag: Math.round(mwstBetrag * 100) / 100
    };
  };

  const calculateFromBrutto = (bruttoValue: number, steuersatz: number): CalculationResult => {
    const netto = bruttoValue / (1 + steuersatz / 100);
    const mwstBetrag = bruttoValue - netto;
    return {
      netto: Math.round(netto * 100) / 100,
      brutto: bruttoValue,
      mwst: steuersatz,
      mwstBetrag: Math.round(mwstBetrag * 100) / 100
    };
  };


  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  // Automatische Berechnung bei Änderungen
  useEffect(() => {
    if (calculationType === 'netto') {
      // Konvertiere deutsches Format (Komma) zu englischem Format (Punkt) für Berechnung
      const nettoValue = parseFloat(netto.replace(',', '.'));
      if (!isNaN(nettoValue) && nettoValue > 0) {
        setResult(calculateFromNetto(nettoValue, steuersatz));
      } else {
        setResult(null);
      }
    } else {
      // Konvertiere deutsches Format (Komma) zu englischem Format (Punkt) für Berechnung
      const bruttoValue = parseFloat(brutto.replace(',', '.'));
      if (!isNaN(bruttoValue) && bruttoValue > 0) {
        setResult(calculateFromBrutto(bruttoValue, steuersatz));
      } else {
        setResult(null);
      }
    }
  }, [netto, brutto, steuersatz, calculationType]);

  const handleSteuersatzChange = (newSteuersatz: number) => {
    setSteuersatz(newSteuersatz);
    setCustomSteuersatz('');
  };

  const handleCustomSteuersatzChange = (value: string) => {
    setCustomSteuersatz(value);
    const customValue = parseFloat(value);
    if (!isNaN(customValue) && customValue > 0) {
      setSteuersatz(customValue);
    } else if (value === '') {
      // Wenn das Feld leer ist, zurücksetzen auf Standard
      setSteuersatz(19);
    }
  };

  const clearAll = () => {
    setNetto('100');
    setBrutto('');
    setResult(null);
    setCalculationType('netto');
  };

  return (
    <>
      {/* Structured Data für SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "Mehrwertsteuer-Rechner",
            "description": "Kostenloser Mehrwertsteuer-Rechner für Deutschland, Österreich und Schweiz. Berechnen Sie Brutto, Netto und MwSt mit verschiedenen Steuersätzen.",
            "url": "https://webwelle.com/mehrwertsteuer",
            "applicationCategory": "FinanceApplication",
            "operatingSystem": "Web Browser",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "EUR"
            },
            "creator": {
              "@type": "Organization",
              "name": "WebWelle",
              "url": "https://webwelle.com"
            },
            "featureList": [
              "Mehrwertsteuer berechnen",
              "Brutto zu Netto Umrechnung",
              "Netto zu Brutto Umrechnung",
              "Deutschland 19% und 7% Steuersatz",
              "Österreich 20% und 10% Steuersatz",
              "Schweiz 8.1%, 3.8% und 2.6% Steuersatz",
              "Eigener Steuersatz eingeben",
              "Copy-to-Clipboard Funktion"
            ],
            "screenshot": "https://webwelle.com/logo.png"
          })
        }}
      />
      
      <div className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <Calculator className="w-16 h-16 text-primary" aria-hidden="true" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
            Mehrwertsteuer Rechner
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto font-light leading-relaxed">
            Einfach Brutto, Netto und Mehrwertsteuer berechnen. Kostenloser MwSt-Rechner mit verschiedenen Steuersätzen für Deutschland, Österreich und Schweiz.
          </p>

          {/* CTA-Bereich */}
          <div className="mt-12 max-w-2xl mx-auto">
            <div className="bg-card rounded-2xl shadow-xl p-8 border border-border">
              <h2 className="text-2xl font-semibold text-primary mb-4 tracking-wide text-center">
                WebWelle – Ihre Erfolgswelle
              </h2>
              <p className="text-lg text-muted-foreground mb-6 font-medium text-center">
                Festpreis-Webdesign, das messbar wirkt. Individuell. Transparent. Modern.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="/#cta"
                  className="bg-primary text-primary-foreground px-8 py-4 rounded-lg hover:bg-primary/90 transition-colors font-semibold text-lg text-center"
                >
                  Jetzt Festpreis-Angebot sichern!
                </a>
                <a
                  href="/#produkte"
                  className="border-2 border-primary text-primary px-8 py-4 rounded-lg hover:bg-primary/10 transition-colors font-semibold text-lg text-center"
                >
                  Produkte entdecken
                </a>
              </div>
            </div>
          </div>

          <p className="text-lg text-gray-700 max-w-4xl mx-auto mt-12 leading-relaxed">
            Mit dem kostenlosen Mehrwertsteuer-Rechner von WebWelle lässt sich die Mehrwertsteuer für beliebige Beträge blitzschnell berechnen – ob für Netto, Brutto oder nur den Mehrwertsteuer-Betrag. Der Rechner unterstützt die üblichen deutschen Steuersätze von 19% und 7%, egal ob Einkauf (Netto) oder Verkauf (Brutto). Einfach Betrag und Mehrwertsteuersatz wählen: Sofort sehen Sie Netto-, Brutto- und Mehrwertsteuerwert inklusive verständlichem Rechenweg und Formel.
          </p>
        </header>

            {/* Rechner */}
            <main className="bg-gray-50 rounded-2xl p-8 shadow-lg border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                MwSt-Rechner: Einfach die Mehrwertsteuer berechnen
              </h2>
              <p className="text-center text-gray-600 mb-8">
                Geben Sie Ihre Zahlen ein, alle anderen Werte berechnen sich von selbst.
              </p>

          {/* Steuersatz Auswahl */}
          <section className="mb-8" aria-label="Mehrwertsteuersatz auswählen">
            <label className="block text-sm font-semibold text-gray-900 mb-4">
              Mehrwertsteuer für:
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              <button
                onClick={() => handleSteuersatzChange(19)}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors text-sm ${
                  steuersatz === 19 && !customSteuersatz
                    ? 'bg-primary text-white border-2 border-primary shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                Deutschland (19%)
              </button>
              <button
                onClick={() => handleSteuersatzChange(7)}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors text-sm ${
                  steuersatz === 7 && !customSteuersatz
                    ? 'bg-primary text-white border-2 border-primary shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                Deutschland (7%)
              </button>
              <button
                onClick={() => handleSteuersatzChange(20)}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors text-sm ${
                  steuersatz === 20 && !customSteuersatz
                    ? 'bg-primary text-white border-2 border-primary shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                Österreich (20%)
              </button>
              <button
                onClick={() => handleSteuersatzChange(10)}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors text-sm ${
                  steuersatz === 10 && !customSteuersatz
                    ? 'bg-primary text-white border-2 border-primary shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                Österreich (10%)
              </button>
              <button
                onClick={() => handleSteuersatzChange(8.1)}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors text-sm ${
                  steuersatz === 8.1 && !customSteuersatz
                    ? 'bg-primary text-white border-2 border-primary shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                Schweiz (8,1%)
              </button>
              <button
                onClick={() => handleSteuersatzChange(3.8)}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors text-sm ${
                  steuersatz === 3.8 && !customSteuersatz
                    ? 'bg-primary text-white border-2 border-primary shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                Schweiz (3,8%)
              </button>
              <button
                onClick={() => handleSteuersatzChange(2.6)}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors text-sm ${
                  steuersatz === 2.6 && !customSteuersatz
                    ? 'bg-primary text-white border-2 border-primary shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                Schweiz (2,6%)
              </button>
            </div>
            
            {/* Custom Steuersatz */}
            <div className="flex items-center space-x-2">
              <input
                type="number"
                step="0.1"
                value={customSteuersatz}
                onChange={(e) => handleCustomSteuersatzChange(e.target.value)}
                onFocus={(e) => {
                  e.target.select();
                }}
                placeholder="Eigener Steuersatz (%)"
                className={`px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                  customSteuersatz && customSteuersatz !== ''
                    ? 'border-primary bg-primary/5 text-gray-900 font-semibold'
                    : 'border-gray-300 text-gray-900'
                }`}
              />
              <span className="text-sm text-gray-600">%</span>
            </div>
          </section>

          {/* Berechnung */}
          <section className="bg-white rounded-xl p-8 border border-gray-200" aria-label="Mehrwertsteuer berechnen">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Netto */}
              <div className="text-center">
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Netto (ohne Mwst):
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={calculationType === 'netto' ? netto : (result ? formatGermanNumber(result.netto) : '')}
                    onChange={(e) => {
                      // Erlaube nur Zahlen, Komma und Punkt
                      const value = e.target.value.replace(/[^0-9,.]/g, '');
                      // Ersetze Punkt durch Komma für deutsches Format
                      const germanValue = value.replace('.', ',');
                      setNetto(germanValue);
                      setCalculationType('netto');
                      setBrutto('');
                    }}
                    onFocus={(e) => {
                      e.target.select();
                    }}
                    className="w-full px-4 py-3 text-center text-2xl font-bold border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="100"
                    aria-label="Nettobetrag eingeben"
                  />
                  <button
                    onClick={() => copyToClipboard(result ? formatGermanNumber(result.netto) : '0,00', 'netto')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
                    title="Kopieren"
                  >
                    {copied === 'netto' ? (
                      <Check className="w-4 h-4 text-primary" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                </div>
              </div>

              {/* MwSt-Betrag */}
              <div className="text-center">
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  + Mwst-Betrag ({steuersatz}%):
                </label>
                <div className="relative">
                  <div className="w-full px-4 py-3 text-center text-2xl font-bold border border-gray-300 rounded-lg bg-gray-50 text-gray-900">
                    {result ? formatGermanNumber(result.mwstBetrag) : '0,00'}
                  </div>
                  <button
                    onClick={() => copyToClipboard(result ? formatGermanNumber(result.mwstBetrag) : '0,00', 'mwst')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
                    title="Kopieren"
                  >
                    {copied === 'mwst' ? (
                      <Check className="w-4 h-4 text-primary" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                </div>
              </div>

              {/* Brutto */}
              <div className="text-center">
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  = Brutto (mit Mwst):
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={calculationType === 'brutto' ? brutto : (result ? formatGermanNumber(result.brutto) : '')}
                    onChange={(e) => {
                      // Erlaube nur Zahlen, Komma und Punkt
                      const value = e.target.value.replace(/[^0-9,.]/g, '');
                      // Ersetze Punkt durch Komma für deutsches Format
                      const germanValue = value.replace('.', ',');
                      setBrutto(germanValue);
                      setCalculationType('brutto');
                      setNetto('');
                    }}
                    onFocus={(e) => {
                      e.target.select();
                    }}
                    className="w-full px-4 py-3 text-center text-2xl font-bold border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="119"
                    aria-label="Bruttobetrag eingeben"
                  />
                  <button
                    onClick={() => copyToClipboard(result ? formatGermanNumber(result.brutto) : '0,00', 'brutto')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
                    title="Kopieren"
                  >
                    {copied === 'brutto' ? (
                      <Check className="w-4 h-4 text-primary" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                </div>
              </div>
            </div>

              {/* Werte löschen Button */}
              <div className="text-center mt-6">
                <button
                  onClick={clearAll}
                  className="text-gray-500 hover:text-gray-700 transition-colors text-sm underline"
                >
                  Werte löschen
                </button>
              </div>

              {/* Zusammenfassung */}
              {result && (
                <div className="mt-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                    Berechnungsergebnis
                  </h3>
                  <div className="bg-white rounded-xl p-6 border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                      <div className="text-center">
                        <div className="text-sm font-semibold text-gray-600 mb-2">Netto (ohne MwSt)</div>
                        <div className="text-2xl font-bold text-gray-900 select-none cursor-default">
                          {formatGermanNumber(result.netto)} €
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-semibold text-gray-600 mb-2">MwSt-Betrag ({result.mwst}%)</div>
                        <div className="text-2xl font-bold text-gray-900 select-none cursor-default">
                          {formatGermanNumber(result.mwstBetrag)} €
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-semibold text-gray-600 mb-2">Brutto (mit MwSt)</div>
                        <div className="text-2xl font-bold text-gray-900 select-none cursor-default">
                          {formatGermanNumber(result.brutto)} €
                        </div>
                      </div>
                    </div>
                    
                    {/* Komplette Zusammenfassung zum Kopieren */}
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-300">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-3">
                        <span className="text-sm font-semibold text-gray-700">Komplette Berechnung:</span>
                        <button
                          onClick={() => copyToClipboard(
                            `Mehrwertsteuer-Berechnung (${result.mwst}%):\n` +
                            `Netto (ohne MwSt): ${formatGermanNumber(result.netto)} €\n` +
                            `MwSt-Betrag: ${formatGermanNumber(result.mwstBetrag)} €\n` +
                            `Brutto (mit MwSt): ${formatGermanNumber(result.brutto)} €`,
                            'summary'
                          )}
                          className="flex items-center justify-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium w-full sm:w-auto"
                        >
                          {copied === 'summary' ? (
                            <>
                              <Check className="w-4 h-4" />
                              <span>Kopiert!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              <span>Alles kopieren</span>
                            </>
                          )}
                        </button>
                      </div>
                      <div className="font-mono text-xs sm:text-sm text-gray-800 bg-gray-100 p-3 rounded border select-none cursor-default overflow-x-auto">
                        <div>Mehrwertsteuer-Berechnung ({result.mwst}%):</div>
                        <div>Netto (ohne MwSt): {formatGermanNumber(result.netto)} €</div>
                        <div>MwSt-Betrag: {formatGermanNumber(result.mwstBetrag)} €</div>
                        <div>Brutto (mit MwSt): {formatGermanNumber(result.brutto)} €</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </main>

          {/* Informationsbereich */}
          <section className="mt-16 max-w-4xl mx-auto" aria-label="Informationen zur Mehrwertsteuer">
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                Was ist die Mehrwertsteuer?
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed mb-8">
                Die Mehrwertsteuer, auch Umsatzsteuer genannt, ist die wichtigste Verbrauchssteuer in Deutschland. Sie wird auf fast alle Waren und Dienstleistungen erhoben. Die Standard-Mehrwertsteuer beträgt 19%. Für bestimmte Produkte, wie Lebensmittel und öffentliche Verkehrsmittel, gilt der reduzierte Satz von 7%. Mit dem WebWelle-Rechner ermitteln Sie schnell und sicher Ihre Steuerbeträge für Rechnungen, Angebote oder Preisvergleiche.
              </p>
              
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                So funktioniert der Rechner:
              </h3>
              <ul className="space-y-3 text-lg text-gray-700">
                <li className="flex items-start">
                  <span className="text-primary font-bold mr-3">•</span>
                  <span><strong>Vom Netto zum Brutto:</strong> Nettobetrag einfach mit 1,19 oder 1,07 multiplizieren.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary font-bold mr-3">•</span>
                  <span><strong>Vom Brutto zum Netto:</strong> Bruttobetrag durch 1,19 oder 1,07 teilen.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary font-bold mr-3">•</span>
                  <span><strong>Die Mehrwertsteuer „herausrechnen" oder „draufschlagen" in Sekunden.</strong></span>
                </li>
              </ul>
            </div>
          </section>


        </div>
      </div>
    </>
  );
}
