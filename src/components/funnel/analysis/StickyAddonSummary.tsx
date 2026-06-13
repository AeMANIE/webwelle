'use client';

import { useMemo } from 'react';
import { ShinyButton } from '@/components/ui/shiny-button';
import {
  listSelectedPackageLabels,
  type FunnelAddonSelection,
} from '@/lib/funnel/packages';

export function StickyAddonSummary({
  selection,
  saving,
  onContinue,
  showContinue,
}: {
  selection: FunnelAddonSelection;
  saving?: boolean;
  onContinue?: () => void;
  showContinue?: boolean;
}) {
  const labels = useMemo(() => listSelectedPackageLabels(selection), [selection]);
  const hasAddons = labels.length > 1;

  if (!showContinue && !hasAddons) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-card/95 backdrop-blur-md px-4 py-3 md:static md:mt-6 md:rounded-xl md:border md:bg-card">
      <div className="max-w-4xl mx-auto flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Ihre Auswahl
          </p>
          <ul className="flex flex-wrap gap-2">
            {labels.map((label, index) => (
              <li
                key={`${index}-${label}`}
                className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary"
              >
                {label}
              </li>
            ))}
          </ul>
          {saving && (
            <p className="text-xs text-muted-foreground">Auswahl wird gespeichert…</p>
          )}
        </div>
        {showContinue && onContinue && (
          <ShinyButton type="button" onClick={onContinue} className="w-full sm:w-auto shrink-0">
            Weiter zur Paketauswahl
          </ShinyButton>
        )}
      </div>
    </div>
  );
}
