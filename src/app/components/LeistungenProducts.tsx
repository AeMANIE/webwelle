'use client';

import { Lightbulb } from 'lucide-react';
import type { DottedSurfaceVariant } from '@/components/ui/dotted-surface';
import { LazyDottedSurface } from '@/components/ui/lazy-dotted-surface';
import { useLayoutMode } from '@/hooks/useLayoutMode';
import { LEISTUNGEN_OFFERS } from './leistungen-offers';
import { LEISTUNGEN_FAQS } from './leistungen-faq';
import ProductPackageCard from './ProductPackageCard';
import FAQ from './FAQ';

export default function LeistungenProducts() {
  const layoutMode = useLayoutMode();
  const dotVariant: DottedSurfaceVariant =
    layoutMode === 'desktop' ? 'desktop' : 'mobile';

  return (
    <section id="produkte" className="pt-20 pb-20 lg:pt-28 bg-background overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-tight max-w-4xl mx-auto">
            Wachstum braucht mehr als eine Website
          </h1>
          <div className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto font-light leading-relaxed space-y-4">
            <p>
              Viele Unternehmen haben einen Auftritt – aber kein System. Anfragen kommen zufällig,
              Abläufe hängen an Einzelpersonen und die eigene Positionierung bleibt weit unter ihrem
              Potenzial. Das kostet täglich Zeit, Energie und Aufträge, die nie ankommen.
            </p>
            <p>
              Was es braucht, ist keine neue Seite – sondern eine digitale Infrastruktur, die Ihr
              Geschäftsmodell präzise abbildet, Prozesse abnimmt und die richtigen Kunden zur
              richtigen Zeit überzeugt.
            </p>
          </div>
        </div>

        <div className="relative isolate">
          <div className="pointer-events-none absolute inset-0 left-1/2 -translate-x-1/2 w-screen max-w-[100vw] z-[1] overflow-hidden">
            <LazyDottedSurface variant={dotVariant} className="h-full w-full" />
          </div>

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8">
            {LEISTUNGEN_OFFERS.map((offer) => (
              <ProductPackageCard key={offer.id} offer={offer} />
            ))}
          </div>
        </div>

        <div className="mt-12 text-center">
          <div className="bg-card border border-border rounded-xl p-6 max-w-4xl mx-auto shadow-sm">
            <h2 className="text-lg font-semibold text-foreground mb-2 flex items-center justify-center gap-2">
              <Lightbulb className="w-5 h-5 text-primary" />
              Individuelle Erweiterungen & Projektumfang
            </h2>
            <p className="text-muted-foreground font-light leading-relaxed">
              Jedes Unternehmen hat eigene Anforderungen – an Umfang, Integrationen und
              Prozesstiefe. Was über das Standardpaket hinausgeht, besprechen wir persönlich im
              Erstgespräch. Sie erhalten ein maßgeschneidertes Angebot, das exakt auf Ihr
              Geschäftsmodell und Ihre Ziele abgestimmt ist.
            </p>
          </div>
        </div>

        <FAQ items={LEISTUNGEN_FAQS} embedded />
      </div>
    </section>
  );
}
