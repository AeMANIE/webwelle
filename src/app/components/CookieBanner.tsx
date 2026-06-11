'use client';

import { useState, useEffect } from 'react';
import { Settings, Check } from 'lucide-react';
import Image from 'next/image';
import { UMAMI_CONSENT_EVENT } from '@/lib/umami';

function notifyConsentUpdate() {
  window.dispatchEvent(new CustomEvent(UMAMI_CONSENT_EVENT));
}

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [cookieSettings, setCookieSettings] = useState({
    necessary: true, // Immer aktiv
    preferences: true, // Standardmäßig aktiv
    statistics: true, // Standardmäßig aktiv
    marketing: true // Standardmäßig aktiv
  });

  useEffect(() => {
    // Prüfe ob Cookie-Zustimmung bereits gegeben wurde (4 Wochen Ablauf)
    const cookieConsent = localStorage.getItem('cookieConsent');
    const consentDate = localStorage.getItem('cookieConsentDate');
    
    if (!cookieConsent || !consentDate) {
      setIsVisible(true);
    } else {
      const now = new Date().getTime();
      const consentTime = parseInt(consentDate);
      const fourWeeks = 4 * 7 * 24 * 60 * 60 * 1000; // 4 Wochen in Millisekunden
      
      if (now - consentTime > fourWeeks) {
        // 4 Wochen abgelaufen, Cookie-Banner erneut anzeigen
        localStorage.removeItem('cookieConsent');
        localStorage.removeItem('cookieConsentDate');
        setIsVisible(true);
      }
    }
  }, []);

  const acceptAll = () => {
    const allAccepted = {
      necessary: true,
      preferences: true,
      statistics: true,
      marketing: true
    };
    setCookieSettings(allAccepted);
    localStorage.setItem('cookieConsent', JSON.stringify(allAccepted));
    localStorage.setItem('cookieConsentDate', new Date().getTime().toString());
    notifyConsentUpdate();
    setIsVisible(false);
  };

  const acceptSelected = () => {
    localStorage.setItem('cookieConsent', JSON.stringify(cookieSettings));
    localStorage.setItem('cookieConsentDate', new Date().getTime().toString());
    notifyConsentUpdate();
    setIsVisible(false);
  };


  const toggleCookie = (type: keyof typeof cookieSettings) => {
    if (type === 'necessary') return; // Notwendige Cookies können nicht deaktiviert werden
    setCookieSettings(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-card rounded-xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-y-auto">
        <div className="p-4 md:p-6">
          {/* Header mit Logo */}
          <div className="flex items-center justify-center mb-4">
            <div className="flex items-center space-x-3">
              <Image
                src="/logo75.webp"
                alt="WebWelle Logo"
                width={32}
                height={32}
                className="h-8 w-auto"
                style={{ width: 'auto' }}
              />
              <img
                src="/webwellecom-weissihr.svg"
                alt="WebWelle"
                width={120}
                height={32}
                className="h-6 w-auto"
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>
          
          <h2 className="text-xl font-bold text-foreground tracking-wide mb-4">
            Cookie-Einstellungen
          </h2>

          {/* Einleitung */}
          <div className="mb-6">
            <p className="text-sm text-muted-foreground font-light leading-relaxed mb-3">
              Sie können Ihre Cookie-Präferenzen jederzeit über die unten stehenden Cookie-Einstellungen anpassen oder in Ihrem Browser festlegen.
            </p>
            <p className="text-sm text-muted-foreground font-light leading-relaxed">
              Hier können Sie Ihre Cookie-Einstellungen anpassen. Beachten Sie, dass notwendige Cookies für den Betrieb der Website erforderlich sind und nicht deaktiviert werden können.
            </p>
          </div>

          {/* Aktuelle Einstellungen Zusammenfassung */}
          <div className="bg-card/50 rounded-lg p-4 mb-4 border border-border">
            <h3 className="text-sm font-semibold text-foreground mb-3">Aktuelle Cookie-Einstellungen:</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Notwendige:</span>
                <span className="text-green-600 font-medium">✓ Aktiv</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Präferenzen:</span>
                <span className={cookieSettings.preferences ? "text-green-600 font-medium" : "text-red-500 font-medium"}>
                  {cookieSettings.preferences ? "✓ Aktiv" : "✗ Inaktiv"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Statistik:</span>
                <span className={cookieSettings.statistics ? "text-green-600 font-medium" : "text-red-500 font-medium"}>
                  {cookieSettings.statistics ? "✓ Aktiv" : "✗ Inaktiv"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Marketing:</span>
                <span className={cookieSettings.marketing ? "text-green-600 font-medium" : "text-red-500 font-medium"}>
                  {cookieSettings.marketing ? "✓ Aktiv" : "✗ Inaktiv"}
                </span>
              </div>
            </div>
          </div>

          {/* Cookie-Kategorien */}
          <div className={`space-y-4 mb-6 transition-all duration-300 ${showSettings ? 'block' : 'hidden'}`}>
            {/* Notwendige Cookies */}
            <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-foreground">Notwendige Cookies (erforderlich)</h3>
                <div className="flex items-center">
                  <Check className="w-4 h-4 text-primary mr-2" />
                  <span className="text-xs text-primary font-medium">Immer aktiv</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground font-light leading-relaxed">
                Notwendige Cookies helfen dabei, eine Webseite nutzbar zu machen, indem sie Grundfunktionen wie Seitennavigation und Zugriff auf sichere Bereiche der Webseite ermöglichen. Die Webseite kann ohne diese Cookies nicht richtig funktionieren.
              </p>
            </div>

            {/* Präferenz-Cookies */}
            <div className="bg-card rounded-lg p-4 border border-border">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-foreground">Präferenz-Cookies</h3>
                <button
                  onClick={() => toggleCookie('preferences')}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    cookieSettings.preferences ? 'bg-primary' : 'bg-muted'
                  }`}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-foreground transition-transform ${
                      cookieSettings.preferences ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <p className="text-xs text-muted-foreground font-light leading-relaxed">
                Präferenz-Cookies ermöglichen einer Webseite sich an Informationen zu erinnern, die die Art beeinflussen, wie sich eine Webseite verhält oder aussieht, wie z. B. Ihre bevorzugte Sprache oder die Region in der Sie sich befinden.
              </p>
            </div>

            {/* Statistik-Cookies */}
            <div className="bg-card rounded-lg p-4 border border-border">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-foreground">Statistik-Cookies</h3>
                <button
                  onClick={() => toggleCookie('statistics')}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    cookieSettings.statistics ? 'bg-primary' : 'bg-muted'
                  }`}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-foreground transition-transform ${
                      cookieSettings.statistics ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <p className="text-xs text-muted-foreground font-light leading-relaxed">
                Statistik-Cookies helfen Webseiten-Besitzern zu verstehen, wie Besucher mit Webseiten interagieren, indem Informationen anonym gesammelt und gemeldet werden.
              </p>
            </div>

            {/* Marketing-Cookies */}
            <div className="bg-card rounded-lg p-4 border border-border">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-foreground">Marketing-Cookies</h3>
                <button
                  onClick={() => toggleCookie('marketing')}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    cookieSettings.marketing ? 'bg-primary' : 'bg-muted'
                  }`}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-foreground transition-transform ${
                      cookieSettings.marketing ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <p className="text-xs text-muted-foreground font-light leading-relaxed">
                Marketing-Cookies werden verwendet, um Besuchern auf Webseiten zu folgen. Die Absicht ist, Anzeigen zu zeigen, die relevant und ansprechend für den einzelnen Benutzer sind und daher wertvoller für Publisher und werbetreibende Drittparteien sind.
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center justify-center px-4 py-2 border border-border text-foreground rounded-lg hover:bg-secondary/50 transition-colors font-medium text-sm"
            >
              <Settings className="w-3 h-3 mr-2" />
              {showSettings ? 'Einstellungen ausblenden' : 'Cookie-Einstellungen verwalten'}
            </button>
            <button
              onClick={acceptSelected}
              className="px-6 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors font-semibold text-sm"
            >
              Einstellungen speichern
            </button>
            <button
              onClick={acceptAll}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold text-sm"
            >
              Alle akzeptieren
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
