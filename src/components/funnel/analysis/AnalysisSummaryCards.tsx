'use client';

import type { AnalysisTabKey, CustomerAnalysisViewModel } from '@/lib/funnel/analysis/analysis-types';

export function AnalysisSummaryCards({
  vm,
  activeTab,
  onOpenTab,
}: {
  vm: CustomerAnalysisViewModel;
  activeTab: AnalysisTabKey;
  onOpenTab: (tab: AnalysisTabKey) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {vm.summaryCards.map((card) => {
        const isActive = activeTab === card.tab;

        return (
        <div
          key={card.id}
          className={
            'rounded-2xl border bg-card p-5 shadow-sm flex flex-col transition-colors ' +
            (isActive ? 'border-primary ring-1 ring-primary/20' : 'border-border')
          }
        >
          <h2 className="text-base font-semibold">{card.title}</h2>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed flex-1">{card.summary}</p>
          {card.highlights.length > 0 && (
            <ul className="mt-3 space-y-1 text-sm text-foreground">
              {card.highlights.map((h) => (
                <li key={h} className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            onClick={() => onOpenTab(card.tab)}
            className="mt-4 text-left text-sm font-medium text-primary hover:underline"
          >
            {card.ctaLabel}
          </button>
        </div>
        );
      })}
    </div>
  );
}
