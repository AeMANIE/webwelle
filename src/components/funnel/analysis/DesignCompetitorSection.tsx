'use client';

import { useEffect, useState } from 'react';
import { Globe } from 'lucide-react';
import type { CompetitorRow } from '@/lib/funnel/analysis/analysis-types';
import { SectionHeading } from './SectionHeading';

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function competitorKey(c: CompetitorRow, i: number) {
  return `${c.websiteUrl || c.url || c.domain || 'competitor'}-${i}`;
}

function designScoreStyles(score: number) {
  if (score >= 4) {
    return { bg: 'rgba(16,185,129,0.15)', color: '#10b981' };
  }
  if (score >= 3) {
    return { bg: 'rgba(220,164,65,0.15)', color: '#DCA441' };
  }
  return { bg: 'rgba(239,68,68,0.15)', color: '#ef4444' };
}

function DesignScoreBadge({ score }: { score: number }) {
  const styles = designScoreStyles(score);
  return (
    <span
      className="shrink-0 rounded-full px-3 py-1 text-sm font-semibold"
      style={{ backgroundColor: styles.bg, color: styles.color }}
    >
      {score}/5
    </span>
  );
}

function CompetitorDetailPanel({ competitor }: { competitor: CompetitorRow }) {
  const palette = asArray<string>(competitor.palette);
  const strengths = asArray<string>(competitor.strengths);
  const weaknesses = asArray<string>(competitor.weaknesses);

  return (
    <div className="rounded-2xl border border-primary/30 bg-background/60 p-5 space-y-4 animate-in fade-in duration-200">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-base">
            {competitor.name || competitor.domain || 'Wettbewerber'}
          </p>
          {(competitor.websiteUrl || competitor.url || competitor.domain) && (
            <a
              href={competitor.websiteUrl || competitor.url || competitor.domain}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline truncate block mt-0.5"
            >
              {competitor.websiteUrl || competitor.url || competitor.domain}
            </a>
          )}
        </div>
        {competitor.designScore != null && <DesignScoreBadge score={competitor.designScore} />}
      </div>

      {palette.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">Farbpalette</p>
          <div className="flex flex-wrap gap-2">
            {palette.slice(0, 6).map((color) => (
              <div key={color} className="flex flex-col items-center gap-0.5">
                <div
                  className="h-10 w-10 rounded-lg border border-white/10 shadow-sm"
                  style={{ backgroundColor: color }}
                  title={color}
                />
                <span className="font-mono text-[9px] text-muted-foreground">{color}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-2 text-sm md:grid-cols-2">
        <p>
          <span className="text-muted-foreground">Layout: </span>
          {competitor.layoutPattern || 'nicht erkannt'}
        </p>
        <p>
          <span className="text-muted-foreground">Typografie: </span>
          {competitor.typography || 'nicht erkannt'}
        </p>
      </div>

      {(strengths.length > 0 || weaknesses.length > 0) && (
        <div className="grid gap-3 md:grid-cols-2">
          {strengths.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold text-emerald-500">Stärken</p>
              <div className="flex flex-wrap gap-1.5">
                {strengths.slice(0, 5).map((item) => (
                  <span
                    key={item}
                    className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-400"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}
          {weaknesses.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold text-amber-500">Chancen für Sie</p>
              <div className="flex flex-wrap gap-1.5">
                {weaknesses.slice(0, 5).map((item) => (
                  <span
                    key={item}
                    className="rounded-md bg-amber-500/10 px-2 py-0.5 text-xs text-amber-400"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

type DesignCompetitorSectionProps = {
  competitors: CompetitorRow[];
  existingWebsiteUrl?: string | null;
};

function isOwnSiteCompetitor(competitor: CompetitorRow, existingWebsiteUrl?: string | null): boolean {
  if (competitor.isOwnSite) return true;
  if (!existingWebsiteUrl) return false;
  const siteUrl = competitor.websiteUrl || competitor.url || competitor.domain || '';
  if (!siteUrl) return false;
  try {
    const own = new URL(
      existingWebsiteUrl.startsWith('http') ? existingWebsiteUrl : `https://${existingWebsiteUrl}`
    );
    const site = new URL(siteUrl.startsWith('http') ? siteUrl : `https://${siteUrl}`);
    return own.hostname.replace(/^www\./, '') === site.hostname.replace(/^www\./, '');
  } catch {
    return false;
  }
}

export function DesignCompetitorSection({
  competitors,
  existingWebsiteUrl,
}: DesignCompetitorSectionProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    setSelectedIndex(null);
  }, [competitors]);

  if (!competitors.length) {
    return (
      <p className="text-sm text-muted-foreground">Design-Analyse der Wettbewerber wird geladen…</p>
    );
  }

  const selected = selectedIndex != null ? competitors[selectedIndex] : null;

  return (
    <div className="space-y-4">
      <div>
        <SectionHeading icon={Globe}>Websites in Ihrer Branche</SectionHeading>
        <p className="mt-1 text-xs text-muted-foreground">
          Tippen Sie auf eine Website, um Farben, Layout und Stärken im Detail zu sehen.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {competitors.map((c, i) => {
          const isSelected = selectedIndex === i;
          const isOwnSite = isOwnSiteCompetitor(c, existingWebsiteUrl);
          const preview = c.strengths?.[0] || c.weaknesses?.[0] || c.layoutPattern;
          return (
            <button
              key={competitorKey(c, i)}
              type="button"
              onClick={() => setSelectedIndex(isSelected ? null : i)}
              className={
                'rounded-xl border p-4 text-left transition-colors min-h-[44px] ' +
                (isSelected
                  ? 'border-primary bg-primary/5 ring-1 ring-primary/40'
                  : isOwnSite
                    ? 'border-brand/40 bg-brand/5 hover:border-brand/60'
                    : 'border-border bg-background/40 hover:border-primary/40 hover:bg-background/60')
              }
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm truncate">
                    {c.name || c.domain || `Wettbewerber ${i + 1}`}
                  </p>
                  {isOwnSite && (
                    <span className="mt-1 inline-flex rounded-full bg-brand/15 px-2 py-0.5 text-[10px] font-semibold text-brand">
                      Ihre Website
                    </span>
                  )}
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {c.websiteUrl || c.url || c.domain}
                  </p>
                </div>
                {c.designScore != null && (
                  <span
                    className="shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold"
                    style={{
                      backgroundColor: designScoreStyles(c.designScore).bg,
                      color: designScoreStyles(c.designScore).color,
                    }}
                  >
                    {c.designScore}/5
                  </span>
                )}
              </div>
              {preview && (
                <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{preview}</p>
              )}
              <p className="mt-2 text-xs font-medium text-primary">
                {isSelected ? 'Details schließen' : 'Details anzeigen →'}
              </p>
            </button>
          );
        })}
      </div>

      {selected && <CompetitorDetailPanel competitor={selected} />}
    </div>
  );
}
