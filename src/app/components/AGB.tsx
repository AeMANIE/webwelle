export default function AGB() {
  return (
    <section className="py-20 bg-background min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold text-foreground mb-6 tracking-tight">
            Allgemeine Geschäftsbedingungen
          </h1>
          <p className="text-xl text-muted-foreground font-light leading-relaxed">
            Unsere AGB für Webdesign-Services
          </p>
        </div>

        <div className="space-y-12">
          {/* Geltungsbereich */}
          <div className="bg-card rounded-2xl p-8 shadow-lg border border-border">
            <h2 className="text-2xl font-bold text-foreground mb-6 tracking-wide">
              § 1 Geltungsbereich
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

          {/* Leistungen */}
          <div className="bg-card rounded-2xl p-8 shadow-lg border border-border">
            <h2 className="text-2xl font-bold text-foreground mb-6 tracking-wide">
              § 2 Leistungen
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

          {/* Preise und Zahlung */}
          <div className="bg-card rounded-2xl p-8 shadow-lg border border-border">
            <h2 className="text-2xl font-bold text-foreground mb-6 tracking-wide">
              § 3 Preise und Zahlung
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

          {/* Lieferung und Leistungserbringung */}
          <div className="bg-card rounded-2xl p-8 shadow-lg border border-border">
            <h2 className="text-2xl font-bold text-foreground mb-6 tracking-wide">
              § 4 Lieferung und Leistungserbringung
            </h2>
            <div className="space-y-4 text-muted-foreground font-light leading-relaxed">
              <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor 
                incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud 
                exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
              </p>
            </div>
          </div>

          {/* Gewährleistung */}
          <div className="bg-card rounded-2xl p-8 shadow-lg border border-border">
            <h2 className="text-2xl font-bold text-foreground mb-6 tracking-wide">
              § 5 Gewährleistung
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

          {/* Haftung */}
          <div className="bg-card rounded-2xl p-8 shadow-lg border border-border">
            <h2 className="text-2xl font-bold text-foreground mb-6 tracking-wide">
              § 6 Haftung
            </h2>
            <div className="space-y-4 text-muted-foreground font-light leading-relaxed">
              <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor 
                incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud 
                exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
              </p>
            </div>
          </div>

          {/* Schlussbestimmungen */}
          <div className="bg-primary/10 rounded-2xl p-8 border border-primary/20">
            <h2 className="text-2xl font-bold text-primary mb-6 tracking-wide">
              § 7 Schlussbestimmungen
            </h2>
            <div className="space-y-4 text-muted-foreground font-light leading-relaxed">
              <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor 
                incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud 
                exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
              </p>
              <p>
                <span className="font-semibold text-foreground">Stand:</span> Januar 2025
              </p>
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
