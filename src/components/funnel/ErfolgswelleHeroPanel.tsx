'use client';

import { Zap, DollarSign, Palette } from 'lucide-react';

/**
 * Erfolgswelle-Promo (ehemals zweiter Hero-Block) – wiederverwendbar in Benefits o.ä.
 */
export default function ErfolgswelleHeroPanel() {
  return (
    <div className="space-y-6 md:space-y-8">
      <div className="bg-card backdrop-blur-md rounded-xl md:rounded-2xl shadow-xl p-4 md:p-8 max-w-2xl mx-auto border border-border">
        <h2
          className="text-lg md:text-2xl font-semibold text-primary mb-3 md:mb-4 tracking-wide"
          style={{ color: 'rgba(59, 130, 246, 1)' }}
        >
          WebWelle – Ihre Erfolgswelle
        </h2>
        <p className="text-sm md:text-lg text-muted-foreground mb-4 md:mb-6 font-medium">
          WebWelle entwickelt leistungsstarke, suchmaschinenoptimierte Websites für
          Selbstständige und Unternehmen aus dem Allgäu – mit Festpreis, garantierter
          Performance und persönlicher Betreuung.
        </p>
        <p className="text-sm md:text-base text-muted-foreground mb-4 md:mb-6 font-light">
          Ihre Website wird zu Ihrem zuverlässigsten Verkäufer – 24 Stunden am Tag.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
          <a
            href="#cta"
            className="bg-primary text-primary-foreground px-6 md:px-8 py-3 md:py-4 rounded-lg hover:bg-primary/90 transition-colors font-semibold text-sm md:text-lg text-center"
          >
            Jetzt Erfolgswelle starten
          </a>
          <a
            href="#produkte"
            className="border-2 border-primary text-primary px-6 md:px-8 py-3 md:py-4 rounded-lg hover:bg-primary/10 transition-colors font-semibold text-sm md:text-lg text-center"
          >
            Webdesign-Pakete entdecken
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 max-w-4xl mx-auto">
        <div className="bg-card backdrop-blur-md rounded-lg p-4 md:p-6 shadow-xl border border-border">
          <div className="flex justify-center mb-2 md:mb-3">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h3 className="font-semibold text-foreground mb-2 text-sm md:text-base text-center">
            Top-Geschwindigkeit
          </h3>
          <p className="text-muted-foreground text-xs md:text-sm font-light text-center">
            Beste Google-PageSpeed & sichtbar mehr Reichweite
          </p>
        </div>
        <div className="bg-card backdrop-blur-md rounded-lg p-4 md:p-6 shadow-xl border border-border">
          <div className="flex justify-center mb-2 md:mb-3">
            <DollarSign className="w-8 h-8 text-white" />
          </div>
          <h3 className="font-semibold text-foreground mb-2 text-sm md:text-base text-center">
            Transparente Preise
          </h3>
          <p className="text-muted-foreground text-xs md:text-sm font-light text-center">
            Keine versteckten Kosten, Planungssicherheit vom ersten Tag
          </p>
        </div>
        <div className="bg-card backdrop-blur-md rounded-lg p-4 md:p-6 shadow-xl border border-border">
          <div className="flex justify-center mb-2 md:mb-3">
            <Palette className="w-8 h-8 text-white" />
          </div>
          <h3 className="font-semibold text-foreground mb-2 text-sm md:text-base text-center">
            Modernes Design
          </h3>
          <p className="text-muted-foreground text-xs md:text-sm font-light text-center">
            Einzigartiges Design passend zum Unternehmen
          </p>
        </div>
      </div>
    </div>
  );
}
