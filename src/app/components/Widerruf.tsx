export default function Widerruf() {
  return (
    <section className="py-20 bg-background min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold text-foreground mb-6 tracking-tight">
            Widerrufsrecht
          </h1>
          <p className="text-xl text-muted-foreground font-light leading-relaxed">
            Ihre Rechte bei Vertragswiderruf
          </p>
        </div>

        <div className="space-y-12">
          {/* Widerrufsrecht */}
          <div className="bg-card rounded-2xl p-8 shadow-lg border border-border">
            <h2 className="text-2xl font-bold text-foreground mb-6 tracking-wide">
              Widerrufsrecht
            </h2>
            <div className="space-y-4 text-muted-foreground font-light leading-relaxed">
              <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor 
                incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud 
                exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
              </p>
              <p>
                Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu 
                fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in 
                culpa qui officia deserunt mollit anim id est laborum.
              </p>
            </div>
          </div>

          {/* Widerrufsfrist */}
          <div className="bg-card rounded-2xl p-8 shadow-lg border border-border">
            <h2 className="text-2xl font-bold text-foreground mb-6 tracking-wide">
              Widerrufsfrist
            </h2>
            <div className="space-y-4 text-muted-foreground font-light leading-relaxed">
              <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor 
                incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud 
                exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
              </p>
              <p>
                <span className="font-semibold text-foreground">Frist:</span> 14 Tage ab Vertragsschluss
              </p>
            </div>
          </div>

          {/* Widerrufsfolgen */}
          <div className="bg-card rounded-2xl p-8 shadow-lg border border-border">
            <h2 className="text-2xl font-bold text-foreground mb-6 tracking-wide">
              Widerrufsfolgen
            </h2>
            <div className="space-y-4 text-muted-foreground font-light leading-relaxed">
              <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor 
                incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud 
                exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Lorem ipsum dolor sit amet</li>
                <li>Consectetur adipiscing elit</li>
                <li>Sed do eiusmod tempor incididunt</li>
                <li>Ut labore et dolore magna aliqua</li>
              </ul>
            </div>
          </div>

          {/* Ausschluss des Widerrufsrechts */}
          <div className="bg-card rounded-2xl p-8 shadow-lg border border-border">
            <h2 className="text-2xl font-bold text-foreground mb-6 tracking-wide">
              Ausschluss des Widerrufsrechts
            </h2>
            <div className="space-y-4 text-muted-foreground font-light leading-relaxed">
              <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor 
                incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud 
                exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
              </p>
              <p>
                Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu 
                fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident.
              </p>
            </div>
          </div>

          {/* Muster-Widerrufsformular */}
          <div className="bg-primary/10 rounded-2xl p-8 border border-primary/20">
            <h2 className="text-2xl font-bold text-primary mb-6 tracking-wide">
              Muster-Widerrufsformular
            </h2>
            <div className="space-y-4 text-muted-foreground font-light leading-relaxed">
              <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor 
                incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud 
                exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
              </p>
              <div className="bg-card rounded-lg p-6 border border-border">
                <p className="font-medium text-foreground mb-2">An:</p>
                <p className="mb-4">WebWelle<br />info@webwelle.com</p>
                <p className="font-medium text-foreground mb-2">Hiermit widerrufe(n) ich/wir den von mir/uns abgeschlossenen Vertrag über den Kauf der folgenden Waren/die Erbringung der folgenden Dienstleistung:</p>
                <p className="mb-4">Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Zurück Button */}
        <div className="text-center mt-12">
          <a
            href="/"
            className="inline-flex items-center bg-primary text-primary-foreground px-8 py-4 rounded-lg hover:bg-primary/90 transition-colors font-semibold text-lg"
          >
            Zurück zur Startseite
          </a>
        </div>
      </div>
    </section>
  );
}
