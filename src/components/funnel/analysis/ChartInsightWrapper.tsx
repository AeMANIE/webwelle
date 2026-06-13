'use client';

import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import type { AnalysisViewMode } from './useAnalysisViewMode';
import { SectionHeading } from './SectionHeading';

type ChartInsightWrapperProps = {
  title: string;
  intro: string;
  insight?: string;
  chart: ReactNode;
  details?: ReactNode;
  mode: AnalysisViewMode;
  adminTitle?: string;
  icon?: LucideIcon;
};

export function ChartInsightWrapper({
  title,
  intro,
  insight,
  chart,
  details,
  mode,
  adminTitle,
  icon,
}: ChartInsightWrapperProps) {
  const heading = mode === 'admin' && adminTitle ? adminTitle : title;

  return (
    <div className="space-y-3 rounded-xl border border-border bg-background/60 p-4">
      <div>
        {icon && mode === 'customer' ? (
          <SectionHeading icon={icon}>{heading}</SectionHeading>
        ) : (
          <h3 className="text-sm font-semibold text-foreground">{heading}</h3>
        )}
        {mode === 'customer' && (
          <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{intro}</p>
        )}
        {insight && mode === 'customer' && (
          <p className="mt-2 text-sm text-foreground/90">{insight}</p>
        )}
      </div>
      {chart}
      {details && mode === 'customer' ? (
        <ExpandableDetails label="Technische Details anzeigen">{details}</ExpandableDetails>
      ) : (
        details
      )}
    </div>
  );
}

export function ExpandableDetails({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <details className="group rounded-lg border border-border/80 bg-card/50">
      <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-primary">
        {label}
      </summary>
      <div className="border-t border-border px-4 py-3 text-sm text-muted-foreground">{children}</div>
    </details>
  );
}
