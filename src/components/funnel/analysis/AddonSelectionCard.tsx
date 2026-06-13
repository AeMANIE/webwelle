'use client';

import { Check } from 'lucide-react';
import { formatEuro } from '@/lib/funnel/packages';

export function AddonSelectionCard({
  title,
  description,
  priceCents,
  selected,
  included,
  onToggle,
  disabled,
}: {
  title: string;
  description: string;
  priceCents: number;
  selected: boolean;
  included?: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  const isActive = selected || included;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onToggle}
      className={
        `w-full rounded-xl border p-4 text-left transition-all disabled:opacity-60 ` +
        (isActive
          ? 'border-primary bg-primary/15 ring-1 ring-primary/40 shadow-[0_0_20px_rgba(102,153,255,0.12)]'
          : 'border-border bg-background/40 hover:border-primary/30 hover:bg-background/55')
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-2.5">
          <span
            className={
              `mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ` +
              (isActive
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-background/80')
            }
            aria-hidden
          >
            {isActive && <Check className="h-3 w-3" strokeWidth={3} />}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-sm">{title}</p>
              {included && (
                <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                  Inklusive
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{description}</p>
          </div>
        </div>
        <span className="shrink-0 text-sm font-bold text-primary">{formatEuro(priceCents)}</span>
      </div>
    </button>
  );
}
