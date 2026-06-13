'use client';

import { useEffect, useState } from 'react';
import { Gauge } from 'lucide-react';
import type { CompetitorRow } from '@/lib/funnel/analysis/analysis-types';
import { SectionHeading } from './SectionHeading';

function siteKey(site: CompetitorRow, i: number) {
  return `${site.websiteUrl || site.url || site.domain || 'site'}-${i}`;
}

function isOwnPerformanceSite(site: CompetitorRow, ownUrl?: string | null): boolean {
  if (!ownUrl) return false;
  try {
    const own = new URL(ownUrl.startsWith('http') ? ownUrl : `https://${ownUrl}`);
    const siteUrl = site.websiteUrl || site.url || site.domain || '';
    if (!siteUrl) return false;
    const parsed = new URL(siteUrl.startsWith('http') ? siteUrl : `https://${siteUrl}`);
    return parsed.hostname.replace(/^www\./, '') === own.hostname.replace(/^www\./, '');
  } catch {
    return false;
  }
}

function scoreColor(score?: number | null) {
  if (score == null) return '#475569';
  if (score >= 90) return '#10b981';
  if (score >= 70) return '#f59e0b';
  return '#ef4444';
}

function scoreBadgeStyles(score?: number | null) {
  const color = scoreColor(score);
  return {
    color,
    backgroundColor:
      score == null
        ? 'rgba(71,85,105,0.15)'
        : score >= 90
          ? 'rgba(16,185,129,0.15)'
          : score >= 70
            ? 'rgba(245,158,11,0.15)'
            : 'rgba(239,68,68,0.15)',
  };
}

function CircleGauge({
  score,
  label,
  size = 80,
}: {
  score: number | null | undefined;
  label: string;
  size?: number;
}) {
  const r = size * 0.37;
  const circ = 2 * Math.PI * r;
  const val = score ?? 0;
  const dash = `${(val / 100) * circ} ${circ}`;
  const color = scoreColor(score);

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1e293b" strokeWidth={7} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={7}
          strokeDasharray={dash}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
        <text
          x="50%"
          y="52%"
          textAnchor="middle"
          dominantBaseline="middle"
          fill={score == null ? '#475569' : color}
          fontSize={size * 0.22}
          fontWeight={700}
        >
          {score == null ? '–' : Math.round(score)}
        </text>
      </svg>
      <p className="text-xs text-muted-foreground text-center">{label}</p>
    </div>
  );
}

function PerformanceSiteDetailPanel({
  site,
  isOwnSite,
}: {
  site: CompetitorRow;
  isOwnSite: boolean;
}) {
  const mainScore = site.mobileScore ?? site.performanceScore;

  return (
    <div
      className={
        'rounded-2xl border bg-background/60 p-5 space-y-4 animate-in fade-in duration-200 ' +
        (isOwnSite ? 'border-primary/50 ring-1 ring-primary/20' : 'border-primary/30')
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-semibold text-base">
          {site.name || site.domain || 'Website'}
        </p>
        {isOwnSite && (
          <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs text-primary">
            Eigene Website
          </span>
        )}
      </div>
      {(site.websiteUrl || site.url || site.domain) && (
        <a
          href={site.websiteUrl || site.url || site.domain}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary hover:underline truncate block"
        >
          {site.websiteUrl || site.url || site.domain}
        </a>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Mobil
          </p>
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-3 justify-center">
            <CircleGauge score={mainScore} label="Leistung" size={72} />
            <CircleGauge score={site.accessibilityScore} label="Barrierefreiheit" size={72} />
            <CircleGauge score={site.bestPracticesScore} label="Best Practices" size={72} />
            <CircleGauge score={site.lighthouseSeoScore} label="SEO" size={72} />
          </div>
        </div>
        <div className="space-y-3 border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Desktop
          </p>
          <div className="flex justify-center">
            <CircleGauge score={site.desktopScore} label="Leistung" size={72} />
          </div>
          {site.desktopScore == null && (
            <p className="text-xs text-center text-muted-foreground">
              Desktop-Score wird ermittelt…
            </p>
          )}
        </div>
      </div>

      {(site.narrative || site.psiNote) && (
        <p className="text-sm text-muted-foreground leading-relaxed">
          {site.narrative || site.psiNote}
        </p>
      )}
    </div>
  );
}

type PerformanceSiteSectionProps = {
  sites: CompetitorRow[];
  existingWebsiteUrl?: string | null;
};

export function PerformanceSiteSection({ sites, existingWebsiteUrl }: PerformanceSiteSectionProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    setSelectedIndex(null);
  }, [sites]);

  if (!sites.length) {
    return (
      <p className="text-sm text-muted-foreground">Performance-Daten werden geladen…</p>
    );
  }

  const selected = selectedIndex != null ? sites[selectedIndex] : null;

  return (
    <div className="space-y-4">
      <div>
        <SectionHeading icon={Gauge}>Recherchierte Websites</SectionHeading>
        <p className="mt-1 text-xs text-muted-foreground">
          Tippen Sie auf eine Website, um PageSpeed-Scores und Details zu sehen.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sites.map((site, i) => {
          const isSelected = selectedIndex === i;
          const isOwnSite = isOwnPerformanceSite(site, existingWebsiteUrl);
          const mainScore = site.mobileScore ?? site.performanceScore;
          const preview = site.narrative || site.psiNote;

          return (
            <button
              key={siteKey(site, i)}
              type="button"
              onClick={() => setSelectedIndex(isSelected ? null : i)}
              className={
                'rounded-xl border p-4 text-left transition-colors min-h-[44px] ' +
                (isSelected
                  ? 'border-primary bg-primary/5 ring-1 ring-primary/40'
                  : isOwnSite
                    ? 'border-primary/40 bg-primary/5 hover:border-primary/60'
                    : 'border-border bg-background/40 hover:border-primary/40 hover:bg-background/60')
              }
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="font-semibold text-sm truncate">
                      {site.name || site.domain || `Website ${i + 1}`}
                    </p>
                    {isOwnSite && (
                      <span className="shrink-0 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] text-primary">
                        Eigene
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {site.websiteUrl || site.url || site.domain}
                  </p>
                </div>
                <span
                  className="shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold"
                  style={scoreBadgeStyles(mainScore)}
                >
                  {mainScore != null ? `${Math.round(mainScore)} Mobil` : '–'}
                </span>
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

      {selected && (
        <PerformanceSiteDetailPanel
          site={selected}
          isOwnSite={isOwnPerformanceSite(selected, existingWebsiteUrl)}
        />
      )}
    </div>
  );
}
