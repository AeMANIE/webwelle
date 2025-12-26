import { MessageCircle, ClipboardList, Lock, Zap, CheckCircle, Mail, MapPin } from 'lucide-react';

export default function CTA() {
  return (
    <section id="cta" className="py-20 bg-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl md:text-5xl font-extrabold text-primary-foreground mb-6 tracking-tight">
            Lokal stark, bundesweit sichtbar
          </h2>
          <p className="text-xl md:text-2xl text-primary-foreground/90 mb-4 max-w-4xl mx-auto leading-relaxed font-light">
            WebWelle – Ihre Webdesign-Agentur aus Kempten (Allgäu).
          </p>
          <p className="text-lg md:text-xl text-primary-foreground/90 mb-4 max-w-4xl mx-auto leading-relaxed font-light">
            Unsere Websites sind technisch, psychologisch und visuell auf Ergebniserfolg ausgelegt.
          </p>
          <p className="text-base md:text-lg text-primary-foreground/90 mb-4 max-w-4xl mx-auto leading-relaxed font-light">
            Wir verbinden Designästhetik, Verkaufspsychologie und SEO-Intelligenz, damit Sie online gefunden und gebucht werden.
          </p>
          <p className="text-lg md:text-xl text-primary-foreground font-semibold mb-12 max-w-4xl mx-auto">
            Ihr Unternehmen verdient Online-Sichtbarkeit.
          </p>
          <p className="text-lg md:text-xl text-primary-foreground/90 mb-12 max-w-4xl mx-auto leading-relaxed font-light">
            Jetzt kostenloses Erstgespräch sichern und erleben, wie aus Besuchern neue Kunden werden.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
            {/* Free Consultation */}
            <div className="bg-card rounded-2xl p-8 shadow-xl border border-border">
              <div className="flex justify-center mb-4">
                <MessageCircle className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4 tracking-wide">
                Kostenloses Erstgespräch
              </h3>
              <p className="text-muted-foreground mb-6 font-light leading-relaxed">
                Lassen Sie uns in einem unverbindlichen Gespräch Ihre Ziele und Wünsche besprechen. 
                Wir beraten Sie gerne zu den besten Lösungen für Ihr Unternehmen.
              </p>
              <ul className="text-left text-muted-foreground space-y-2 mb-6">
                <li className="flex items-center">
                  <span className="text-primary mr-2">✓</span>
                  Unverbindlich & kostenlos
                </li>
                <li className="flex items-center">
                  <span className="text-primary mr-2">✓</span>
                  Individuelle Beratung
                </li>
                <li className="flex items-center">
                  <span className="text-primary mr-2">✓</span>
                  Sofort verfügbar
                </li>
              </ul>
              <a
                href="mailto:info@webwelle.com?subject=Kostenloses Erstgespräch"
                className="w-full bg-primary text-primary-foreground py-3 px-6 rounded-lg hover:bg-primary/90 transition-colors font-semibold text-lg text-center block"
              >
                Gespräch vereinbaren
              </a>
            </div>

            {/* Direct Quote */}
            <div className="bg-card rounded-2xl p-8 shadow-xl border border-border">
              <div className="flex justify-center mb-4">
                <ClipboardList className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4 tracking-wide">
                Direktes Angebot
              </h3>
              <p className="text-muted-foreground mb-6 font-light leading-relaxed">
                Fordern Sie direkt ein individuelles Festpreis-Angebot an. 
                Schnell, transparent und ohne versteckte Kosten.
              </p>
              <ul className="text-left text-muted-foreground space-y-2 mb-6">
                <li className="flex items-center">
                  <span className="text-primary mr-2">✓</span>
                  Transparente Preise
                </li>
                <li className="flex items-center">
                  <span className="text-primary mr-2">✓</span>
                  Individuell kalkuliert
                </li>
                <li className="flex items-center">
                  <span className="text-primary mr-2">✓</span>
                  Schnelle Antwort
                </li>
              </ul>
              <a
                href="mailto:info@webwelle.com?subject=Festpreis-Angebot anfordern"
                className="w-full bg-secondary text-secondary-foreground py-3 px-6 rounded-lg hover:bg-secondary/90 transition-colors font-semibold text-lg text-center block"
              >
                Angebot anfordern
              </a>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-2xl p-4 sm:p-6 md:p-8 max-w-2xl mx-auto border border-primary-foreground/20">
            <h3 className="text-xl sm:text-2xl font-bold text-primary-foreground mb-3 sm:mb-4">
              Kontakt & Standort
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 text-primary-foreground place-items-center text-center">
              <div className="w-full">
                <h4 className="text-sm sm:text-base font-semibold mb-1.5 sm:mb-2 flex items-center justify-center gap-2">
                  <Mail className="w-4 h-4 shrink-0" />
                  E-Mail
                </h4>
                <a 
                  href="mailto:info@webwelle.com" 
                  className="text-primary-foreground/80 hover:text-primary-foreground transition-colors break-all sm:break-normal"
                >
                  info@webwelle.com
                </a>
              </div>
              <div className="w-full">
                <h4 className="text-sm sm:text-base font-semibold mb-1.5 sm:mb-2 flex items-center justify-center gap-2">
                  <MapPin className="w-4 h-4 shrink-0" />
                  Standort
                </h4>
                <p className="text-primary-foreground/80 leading-snug">Allgäu | Kempten | Bayern</p>
                <p className="text-primary-foreground/80 text-xs sm:text-sm leading-snug">Bundesweit aktiv</p>
              </div>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="mt-12 flex flex-wrap justify-center items-center gap-8 text-primary-foreground/90">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              <span className="text-sm">SSL-verschlüsselt</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              <span className="text-sm">Schnelle Antwort</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm">Garantiert sicher</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

