'use client';

import { CUSTOMER_COPY } from '@/lib/funnel/analysis/analysis-copy';
import type { CustomerAnalysisViewModel } from '@/lib/funnel/analysis/analysis-types';

export function AnalysisHeader({ vm }: { vm: CustomerAnalysisViewModel }) {
  const { header } = vm;

  return (
    <header className="rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4">
      <div>
        <p className="text-sm font-medium text-primary">Live-Analyse</p>
        <h1 className="text-2xl font-bold">{CUSTOMER_COPY.headerTitle}</h1>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          {CUSTOMER_COPY.headerSubline}
        </p>
      </div>
      <p className="text-sm text-muted-foreground">
        {header.industry} · PLZ {header.postalCode}
        {header.city ? ` · ${header.city}` : ''} · {header.market}
      </p>
      {header.existingWebsite === true && header.existingWebsiteUrl ? (
        <p className="text-sm text-muted-foreground">{CUSTOMER_COPY.existingWebsiteNote}</p>
      ) : header.existingWebsite === false ? (
        <p className="text-sm text-muted-foreground">{CUSTOMER_COPY.newWebsiteNote}</p>
      ) : null}
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <span>
          {header.receivedSites} / {header.targetSites} Wettbewerber ausgewertet
        </span>
        <span className="text-muted-foreground">Stand: {header.lastUpdateLabel}</span>
        <div className="min-w-[120px] flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${vm.parsed.progress}%` }}
          />
        </div>
      </div>
      {vm.state === 'polling' || vm.state === 'loading' ? (
        <p className="text-sm text-primary">Analyse wird vorbereitet…</p>
      ) : null}
      {vm.state === 'timeout' ? (
        <p className="text-sm text-amber-400">
          Die Analyse dauert länger als üblich – bereits verfügbare Ergebnisse werden angezeigt.
        </p>
      ) : null}
    </header>
  );
}
