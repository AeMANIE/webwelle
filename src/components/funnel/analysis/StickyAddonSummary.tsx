'use client';

import { useMemo } from 'react';
import { Check } from 'lucide-react';
import { ShinyButton } from '@/components/ui/shiny-button';
import {
  calculateFunnelOfferTotal,
  formatEuro,
  listSelectedPackageLabels,
  type FunnelAddonSelection,
} from '@/lib/funnel/packages';

export function StickyAddonSummary({
  selection,
  saving,
  onContinue,
  showContinue,
  continueLoading = false,
  continueError = null,
  continueLabel = 'Jetzt bezahlen',
}: {
  selection: FunnelAddonSelection;
  saving?: boolean;
  onContinue?: () => void | Promise<void>;
  showContinue?: boolean;
  continueLoading?: boolean;
  continueError?: string | null;
  continueLabel?: string;
}) {
  const labels = useMemo(() => listSelectedPackageLabels(selection), [selection]);
  const totalCents = useMemo(() => calculateFunnelOfferTotal(selection).subtotalCents, [selection]);
  const hasAddons = labels.length > 1;
  const busy = saving || continueLoading;

  if (!showContinue && !hasAddons) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-card/95 backdrop-blur-md px-4 py-3 md:static md:mt-6 md:rounded-xl md:border md:bg-card">
      <div className="max-w-4xl mx-auto flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-sm text-muted-foreground">
            Diese Leistungen wurden bisher für Ihr Angebot vorgemerkt.
          </p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {labels.map((label, index) => (
              <li
                key={`${index}-${label}`}
                className="flex items-center gap-2.5 rounded-lg border border-primary/15 bg-primary/5 px-3 py-2 text-sm"
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15">
                  <Check className="h-3 w-3 text-primary" aria-hidden />
                </span>
                <span className="font-medium text-foreground leading-snug">{label}</span>
              </li>
            ))}
          </ul>
          <p className="text-sm font-semibold text-foreground">
            Gesamt: {formatEuro(totalCents)}{' '}
            <span className="text-xs font-normal text-muted-foreground">zzgl. MwSt.</span>
          </p>
          {saving && (
            <p className="text-xs text-muted-foreground">Auswahl wird gespeichert…</p>
          )}
          {continueError && (
            <p className="text-xs text-amber-400" role="alert">
              {continueError}
            </p>
          )}
        </div>
        {showContinue && onContinue && (
          <ShinyButton
            type="button"
            onClick={() => void onContinue()}
            disabled={busy}
            className="w-full sm:w-auto shrink-0"
          >
            {continueLoading ? 'Weiterleitung…' : continueLabel}
          </ShinyButton>
        )}
      </div>
    </div>
  );
}
