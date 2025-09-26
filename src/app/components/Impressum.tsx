export default function Impressum() {
  return (
    <section className="py-20 bg-background min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold text-foreground mb-6 tracking-tight">
            Impressum
          </h1>
          <p className="text-xl text-muted-foreground font-light leading-relaxed">
            Angaben gemäß § 5 TMG
          </p>
        </div>

        <div className="space-y-12">
          {/* Anbieter */}
          <div className="bg-card rounded-2xl p-8 shadow-lg border border-border">
            <h2 className="text-2xl font-bold text-foreground mb-6 tracking-wide">
              Anbieter
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

          {/* Kontakt */}
          <div className="bg-card rounded-2xl p-8 shadow-lg border border-border">
            <h2 className="text-2xl font-bold text-foreground mb-6 tracking-wide">
              Kontakt
            </h2>
            <div className="space-y-4 text-muted-foreground font-light leading-relaxed">
              <p>
                <span className="font-semibold text-foreground">E-Mail:</span> info@webwelle.com
              </p>
              <p>
                <span className="font-semibold text-foreground">Telefon:</span> +49 (0) 123 456 789
              </p>
              <p>
                <span className="font-semibold text-foreground">Adresse:</span><br />
                Lorem Ipsum Straße 123<br />
                87435 Kempten<br />
                Deutschland
              </p>
            </div>
          </div>

          {/* Verantwortlich für den Inhalt */}
          <div className="bg-card rounded-2xl p-8 shadow-lg border border-border">
            <h2 className="text-2xl font-bold text-foreground mb-6 tracking-wide">
              Verantwortlich für den Inhalt
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

          {/* Haftung für Inhalte */}
          <div className="bg-card rounded-2xl p-8 shadow-lg border border-border">
            <h2 className="text-2xl font-bold text-foreground mb-6 tracking-wide">
              Haftung für Inhalte
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

          {/* Haftung für Links */}
          <div className="bg-card rounded-2xl p-8 shadow-lg border border-border">
            <h2 className="text-2xl font-bold text-foreground mb-6 tracking-wide">
              Haftung für Links
            </h2>
            <div className="space-y-4 text-muted-foreground font-light leading-relaxed">
              <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor 
                incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud 
                exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
              </p>
            </div>
          </div>

          {/* Urheberrecht */}
          <div className="bg-card rounded-2xl p-8 shadow-lg border border-border">
            <h2 className="text-2xl font-bold text-foreground mb-6 tracking-wide">
              Urheberrecht
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
