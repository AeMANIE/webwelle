'use client';

import dynamic from 'next/dynamic';
import { Lightbulb, Check } from 'lucide-react';
import HeroIndustrySearch from '@/components/funnel/HeroIndustrySearch';
import type { DottedSurfaceVariant } from '@/components/ui/dotted-surface';
import { useLayoutMode } from '@/hooks/useLayoutMode';
import { STARTERWELLE } from '@/lib/funnel/packages';

const DottedSurface = dynamic(
  () => import('@/components/ui/dotted-surface').then((m) => m.DottedSurface),
  { ssr: false }
);

export default function Products() {
  const layoutMode = useLayoutMode();
  const dotVariant: DottedSurfaceVariant =
    layoutMode === 'desktop' ? 'desktop' : 'mobile';

  return (
    <section id="produkte" className="pt-20 pb-20 lg:pt-28 bg-background overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-tight max-w-4xl mx-auto">
            Professionelle Website erstellen lassen und online klarer auftreten
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto font-light leading-relaxed">
            Wenn Sie eine Website möchten, die seriös wirkt, regional besser gefunden wird und mehr Anfragen unterstützt, ist jetzt der richtige Zeitpunkt für den nächsten Schritt.
          </p>
        </div>

        <div className="relative isolate">
          <div className="pointer-events-none absolute inset-0 left-1/2 -translate-x-1/2 w-screen max-w-[100vw] z-[1] overflow-hidden">
            <DottedSurface variant={dotVariant} className="h-full w-full" />
          </div>

          <div className="relative z-10 max-w-2xl mx-auto">
            <div
              id="starterwelle"
              className="scroll-mt-28 bg-card rounded-xl p-8 border border-border shadow-md hover:shadow-xl transition-all duration-300 overflow-visible"
            >
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-foreground mb-2 tracking-wide">
                {STARTERWELLE.name}
              </h3>
              <p className="text-sm text-primary font-semibold mb-2">
                Ihre professionelle Firmenwebsite zum Festpreis.
              </p>
            </div>

            <div className="mb-6 pb-6 border-b border-border">
              <p className="text-4xl font-bold text-foreground mb-2">
                {STARTERWELLE.priceCents / 100} €
              </p>
              <p className="text-sm text-muted-foreground">
                netto für {STARTERWELLE.termLabel}
              </p>
            </div>

            <div className="space-y-3 mb-8">
              {STARTERWELLE.features.map((feature) => (
                <div key={feature} className="flex items-start">
                  <Check className="w-4 h-4 text-primary mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-foreground text-sm leading-relaxed">{feature}</span>
                </div>
              ))}
            </div>

            <HeroIndustrySearch
              variant="card"
              inputId="starterwelle-industry"
              source="products_starterwelle"
              submitLabel="ANALYSE STARTEN"
              className="pb-2"
            />
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <div className="bg-card border border-border rounded-xl p-6 max-w-4xl mx-auto shadow-sm">
            <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center justify-center gap-2">
              <Lightbulb className="w-5 h-5 text-primary" />
              Individuelle Erweiterungen im Analyse-Funnel
            </h3>
            <p className="text-muted-foreground font-light leading-relaxed">
              SEO Profi Zusatzpaket, Blog-Artikel und Design-Präferenzen wählen Sie nach Ihrer
              kostenlosen Branchenanalyse. Größere Projekte erhalten Sie als individuelles Angebot
              von unserem Team.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
