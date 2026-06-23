'use client';

import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { CompetitorRow, KeywordRow } from '@/lib/funnel/analysis/analysis-types';
import {
  buildKeywordDetailsChartData,
  buildKeywordVolumeChartData,
  type KeywordDetailChartRow,
} from '@/lib/funnel/analysis/keyword-clusters';

const CHART_COLORS = ['#DCA441', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

const TOOLTIP_STYLE = {
  backgroundColor: '#111827',
  border: '1px solid #1e293b',
  borderRadius: '8px',
  color: '#f8fafc',
  fontSize: '12px',
};

const TOOLTIP_LABEL_STYLE = {
  color: '#f8fafc',
  fontWeight: 600,
  fontSize: '13px',
  marginBottom: 4,
};

const TOOLTIP_ITEM_STYLE = {
  color: '#e2e8f0',
  fontSize: '12px',
};

const CURSOR_STYLE = { fill: 'rgba(255,255,255,0.06)' };

function yAxisWidth(labels: string[]): number {
  const maxLen = labels.reduce((max, label) => Math.max(max, label.length), 0);
  return Math.min(220, Math.max(130, Math.ceil(maxLen * 6.2)));
}

function siteKey(site: CompetitorRow, idx: number) {
  return site.domain || `site_${idx}`;
}

export function KeywordVolumeChart({ keywords, mounted }: { keywords: KeywordRow[]; mounted: boolean }) {
  const { rows: data, usesRelevanceFallback } = useMemo(
    () => buildKeywordVolumeChartData(keywords),
    [keywords]
  );

  const axisWidth = useMemo(() => yAxisWidth(data.map((d) => d.keyword)), [data]);
  const valueLabel = usesRelevanceFallback ? 'Relevanz' : 'Suchvolumen';

  if (!data.length) return null;
  if (!mounted) return <div className="h-40 rounded-xl bg-muted/20 animate-pulse" />;

  return (
    <div className="space-y-2">
      {usesRelevanceFallback && (
        <p className="text-xs text-muted-foreground">
          Suchvolumen liegt derzeit nicht vor – die Balken zeigen die wichtigsten Suchbegriffe nach
          Relevanz.
        </p>
      )}
      <ResponsiveContainer width="100%" height={Math.max(180, data.length * 36)}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ left: 4, right: 20, top: 4, bottom: 4 }}
        >
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="keyword"
            width={axisWidth}
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            formatter={(v) => [
              usesRelevanceFallback ? Number(v) : Number(v).toLocaleString('de-DE'),
              valueLabel,
            ]}
            contentStyle={TOOLTIP_STYLE}
            labelStyle={TOOLTIP_LABEL_STYLE}
            itemStyle={TOOLTIP_ITEM_STYLE}
            cursor={CURSOR_STYLE}
          />
          <Bar dataKey="volume" radius={[0, 6, 6, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function KeywordDetailTooltip({
  active,
  payload,
  usesRelevanceFallback,
}: {
  active?: boolean;
  payload?: Array<{ payload?: KeywordDetailChartRow }>;
  usesRelevanceFallback: boolean;
}) {
  if (!active || !payload?.[0]?.payload) return null;
  const row = payload[0].payload;
  const valueLabel = usesRelevanceFallback ? 'Relevanz' : 'Suchvolumen';
  const value = usesRelevanceFallback
    ? row.volume
    : row.volume.toLocaleString('de-DE');

  return (
    <div style={TOOLTIP_STYLE}>
      <p style={TOOLTIP_LABEL_STYLE}>{row.keyword}</p>
      {row.cluster && (
        <p style={{ ...TOOLTIP_ITEM_STYLE, marginTop: 4 }}>Thema: {row.cluster}</p>
      )}
      <p style={{ ...TOOLTIP_ITEM_STYLE, marginTop: 4 }}>
        {valueLabel}: {value}
      </p>
    </div>
  );
}

/** All researched keywords for the expandable technical-details section. */
export function KeywordDetailsChart({
  keywords,
  mounted,
}: {
  keywords: KeywordRow[];
  mounted: boolean;
}) {
  const { rows: data, usesRelevanceFallback } = useMemo(
    () => buildKeywordDetailsChartData(keywords, { limit: 30 }),
    [keywords]
  );

  const axisWidth = useMemo(() => yAxisWidth(data.map((d) => d.keyword)), [data]);

  if (!data.length) return null;
  if (!mounted) return <div className="h-60 rounded-xl bg-muted/20 animate-pulse" />;

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        {usesRelevanceFallback
          ? 'Einzelne Suchbegriffe mit zugehörigem Thema – Suchvolumen liegt derzeit nicht vor.'
          : 'Einzelne Suchbegriffe mit Suchvolumen und Themenzuordnung.'}
      </p>
      <ResponsiveContainer width="100%" height={Math.max(220, data.length * 32)}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ left: 4, right: 20, top: 4, bottom: 4 }}
        >
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="keyword"
            width={axisWidth}
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            cursor={CURSOR_STYLE}
            content={({ active, payload }) => (
              <KeywordDetailTooltip
                active={active}
                payload={
                  payload as unknown as Array<{ payload?: KeywordDetailChartRow }> | undefined
                }
                usesRelevanceFallback={usesRelevanceFallback}
              />
            )}
          />
          <Bar dataKey="volume" radius={[0, 6, 6, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DesignScoreChart({
  competitors,
  mounted,
}: {
  competitors: CompetitorRow[];
  mounted: boolean;
}) {
  const data = useMemo(
    () =>
      competitors
        .filter((c) => c.designScore != null)
        .map((c) => ({
          name: (c.name || c.domain || 'Wettbewerber').trim(),
          score: c.designScore ?? 0,
        })),
    [competitors]
  );

  if (!data.length) return null;
  if (!mounted) return <div className="h-44 rounded-xl bg-muted/20 animate-pulse" />;

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ left: 0, right: 12, top: 10, bottom: 4 }}>
        <XAxis
          dataKey="name"
          tick={{ fill: '#94a3b8', fontSize: 11 }}
          interval={0}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          domain={[0, 5]}
          ticks={[1, 2, 3, 4, 5]}
          tick={{ fill: '#94a3b8', fontSize: 11 }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          labelStyle={TOOLTIP_LABEL_STYLE}
          itemStyle={TOOLTIP_ITEM_STYLE}
          cursor={CURSOR_STYLE}
          formatter={(v) => [`${Number(v)}/5`, 'Eindruck']}
        />
        <Bar dataKey="score" radius={[6, 6, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function PerformanceRadarChart({
  sites,
  mounted,
}: {
  sites: CompetitorRow[];
  mounted: boolean;
}) {
  const radarData = useMemo(() => {
    if (sites.length < 2) return [];
    const metrics: Array<{ label: string; getter: (s: CompetitorRow) => number }> = [
      { label: 'Mobile', getter: (s) => s.mobileScore ?? s.performanceScore ?? 0 },
      { label: 'Desktop', getter: (s) => s.desktopScore ?? 0 },
      { label: 'SEO', getter: (s) => s.lighthouseSeoScore ?? 0 },
    ];
    return metrics.map(({ label, getter }) => {
      const row: Record<string, unknown> = { metric: label };
      sites.forEach((site, i) => {
        row[siteKey(site, i)] = getter(site);
      });
      return row;
    });
  }, [sites]);

  if (!radarData.length) return null;
  if (!mounted) return <div className="h-72 rounded-xl bg-muted/20 animate-pulse" />;

  return (
    <ResponsiveContainer width="100%" height={280}>
      <RadarChart data={radarData}>
        <PolarGrid stroke="#334155" />
        <PolarAngleAxis dataKey="metric" tick={{ fill: '#94a3b8', fontSize: 12 }} />
        <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
        {sites.map((site, i) => (
          <Radar
            key={siteKey(site, i)}
            name={site.name || site.domain || `Site ${i + 1}`}
            dataKey={siteKey(site, i)}
            fill={CHART_COLORS[i % CHART_COLORS.length]}
            fillOpacity={0.18}
            stroke={CHART_COLORS[i % CHART_COLORS.length]}
            strokeWidth={2}
          />
        ))}
        <Legend formatter={(v) => <span style={{ color: '#94a3b8', fontSize: 11 }}>{v}</span>} />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          labelStyle={TOOLTIP_LABEL_STYLE}
          itemStyle={TOOLTIP_ITEM_STYLE}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}

export function performanceBadgeLabel(badge: string): string {
  switch (badge) {
    case 'strong':
      return 'Stark';
    case 'solid':
      return 'Solide';
    case 'needs-work':
      return 'Ausbaufähig';
    default:
      return 'Wird ausgewertet';
  }
}
