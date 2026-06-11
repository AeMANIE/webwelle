import { HeroCta, HeroPanel, HeroSparkles, HeroVideo } from './HeroClient';

const HERO_TITLE =
  'Professionelles Webdesign in Kempten für mehr Anfragen und bessere Sichtbarkeit';

const HERO_DESCRIPTION =
  'WebWelle entwickelt professionelle Websites für Selbstständige, lokale Dienstleister und kleine bis mittlere Unternehmen im Allgäu. Klar aufgebaut, auf Vertrauen ausgerichtet und so gestaltet, dass Besucher schneller zu Anfragen werden.';

export default function Hero() {
  return (
    <section className="relative py-16 md:py-32 min-h-screen flex items-center overflow-x-hidden">
      <HeroVideo />

      <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/50 to-background/70 z-10 pointer-events-none" />

      <div className="relative z-20 w-full max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        <div className="text-center">
          <HeroPanel>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-extrabold text-foreground leading-tight tracking-tight mb-6 md:mb-8">
              {HERO_TITLE}
            </h1>

            <div className="relative z-10 mb-6 md:mb-8">
              <HeroSparkles>
                <div className="pt-8 md:pt-12">
                  <p className="text-sm sm:text-base md:text-xl lg:text-2xl text-muted-foreground leading-relaxed font-light">
                    {HERO_DESCRIPTION}
                  </p>
                </div>
              </HeroSparkles>
            </div>

            <HeroCta />
          </HeroPanel>
        </div>
      </div>
    </section>
  );
}
