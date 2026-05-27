'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';
import {
  Globe,
  Search,
  LayoutDashboard,
  ShoppingCart,
  Zap,
  FileText,
  TrendingUp,
  CheckCircle2,
  ArrowUpRight,
  Users,
  Lightbulb,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

type ResearchItem = {
  workflow_key: string;
  status: string;
  payload: Record<string, unknown> | null;
  updated_at: string;
};

type TabKey = 'seo' | 'design' | 'performance' | 'recommendation';

type KeywordRow = {
  keyword?: string;
  cluster?: string;
  volume?: number | string | null;
};

type CompetitorRow = {
  name?: string;
  title?: string;
  domain?: string;
  websiteUrl?: string;
  url?: string;
  palette?: string[];
  layoutPattern?: string;
  typography?: string;
  designScore?: number;
  strengths?: string[];
  weaknesses?: string[];
  mobileScore?: number | null;
  desktopScore?: number | null;
  performanceScore?: number | null;
  accessibilityScore?: number | null;
  bestPracticesScore?: number | null;
  lighthouseSeoScore?: number | null;
  narrative?: string;
  psiNote?: string;
};

type Recommendation = {
  label?: string;
  title?: string;
  description?: string;
  text?: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const TARGET_WEBSITES = 5;

const CHART_COLORS = ['#DCA441', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

const TOOLTIP_STYLE = {
  backgroundColor: '#111827',
  border: '1px solid #1e293b',
  borderRadius: '8px',
  color: '#f8fafc',
  fontSize: '12px',
};

const MODULES = [
  {
    icon: Globe,
    label: 'Website StarterWelle',
    desc: 'Der schnelle Einstieg: klare Struktur, lokale Sichtbarkeit und ein professioneller erster Eindruck.',
    color: '#DCA441',
  },
  {
    icon: Search,
    label: 'SEO-Landingpages',
    desc: 'Gezielte Seiten für Leistungen und Orte, damit Google und Kunden Ihr Angebot besser verstehen.',
    color: '#3b82f6',
  },
  {
    icon: LayoutDashboard,
    label: 'Admin-Dashboard / Backend',
    desc: 'Inhalte, Anfragen und Abläufe selbst verwalten – kein Entwickler-Einsatz für Änderungen nötig.',
    color: '#8b5cf6',
  },
  {
    icon: ShoppingCart,
    label: 'Online-Shop oder Terminbuchung',
    desc: 'Direkte Buchungen oder Verkäufe reduzieren Rückfragen und bringen mehr Umsatz aus Besuchern.',
    color: '#10b981',
  },
  {
    icon: Zap,
    label: 'Social-Media & KI-Automatisierung',
    desc: 'Regelmäßige Inhalte und smarte Automationen sparen Zeit und halten Kundenkontakte warm.',
    color: '#f59e0b',
  },
  {
    icon: FileText,
    label: 'Blog-Paket 5 oder 10 Artikel',
    desc: 'Blogartikel beantworten echte Kundenfragen und bauen langfristig Google-Reichweite auf.',
    color: '#ef4444',
  },
];

// ─── Helper functions ─────────────────────────────────────────────────────────

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function normalizeSites(value: unknown): CompetitorRow[] {
  if (Array.isArray(value)) return value as CompetitorRow[];
  if (value && typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).filter(
      (s): s is CompetitorRow => Boolean(s && typeof s === 'object')
    );
  }
  return [];
}

function scoreColor(score?: number | null) {
  if (score == null) return '#475569';
  if (score >= 90) return '#10b981';
  if (score >= 70) return '#f59e0b';
  return '#ef4444';
}

function siteKey(site: CompetitorRow, idx: number) {
  return site.domain || `site_${idx}`;
}

// Tries all known field names n8n might use for upsell/recommendation data
function extractRecommendations(payload: Record<string, unknown>): Recommendation[] {
  const keys = [
    'upsell_opportunities',
    'recommendations',
    'opportunities',
    'industry_opportunities',
    'upsell',
    'suggested_services',
    'services',
  ];
  for (const key of keys) {
    const arr = asArray<Recommendation>(payload[key]);
    if (arr.length > 0) return arr;
  }
  return [];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

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

function ChartSkeleton({ height = 200 }: { height?: number }) {
  return <div className="rounded-xl bg-muted/20 animate-pulse" style={{ height }} />;
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function LiveAnalysisDashboard({
  lead,
  research,
  token,
  onRefresh,
}: {
  lead: {
    industry_normalized?: string;
    industry_raw?: string;
    postal_code?: string;
    city?: string;
    market?: string;
    design_reference_urls?: string[];
  };
  research: ResearchItem[];
  token: string;
  onRefresh: () => void;
}) {
  const [tab, setTab] = useState<TabKey>('seo');
  const [mounted, setMounted] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [designUrls, setDesignUrls] = useState<string[]>(['', '', '']);
  const [designSaving, setDesignSaving] = useState(false);
  const [designMessage, setDesignMessage] = useState<string | null>(null);

  // recharts uses browser APIs – only render after hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  const byKey = useMemo(() => {
    const map: Record<string, ResearchItem> = {};
    for (const r of research) map[r.workflow_key] = r;
    return map;
  }, [research]);

  const designPayload = byKey.competitor_design?.payload ?? {};
  const seoPayload = byKey.seo_keywords?.payload ?? {};
  const perfPayload = byKey.site_performance?.payload ?? {};
  const questionsPayload = byKey.industry_questions?.payload ?? {};

  const competitors = (
    asArray<CompetitorRow>(designPayload.competitors).length
      ? asArray<CompetitorRow>(designPayload.competitors)
      : asArray<CompetitorRow>(questionsPayload.discoveredCompetitors).length
        ? asArray<CompetitorRow>(questionsPayload.discoveredCompetitors)
        : asArray<CompetitorRow>(questionsPayload.competitors)
  ).slice(0, TARGET_WEBSITES);

  const performanceSites = normalizeSites(perfPayload.sites).slice(0, TARGET_WEBSITES);
  const receivedSites = Math.min(
    TARGET_WEBSITES,
    Number(perfPayload.receivedSites || performanceSites.length || competitors.length || 0)
  );
  const progress = Math.min(100, Math.round((receivedSites / TARGET_WEBSITES) * 100));

  const keywords = asArray<KeywordRow>(seoPayload.keywords).length
    ? asArray<KeywordRow>(seoPayload.keywords)
    : asArray<KeywordRow>(seoPayload.clusters);

  const gaps = (
    asArray<string>(seoPayload.gaps).length
      ? asArray<string>(seoPayload.gaps)
      : asArray<string>(seoPayload.opportunities)
  ).slice(0, 8);

  const recommendations = extractRecommendations(questionsPayload);

  const discoveredCount =
    asArray(questionsPayload.discoveredCompetitors).length ||
    asArray(questionsPayload.competitors).length ||
    competitors.length;

  const industryQuestionsLoaded =
    Boolean(byKey.industry_questions) && byKey.industry_questions.status !== 'pending';

  const lastUpdate = research.reduce((max, r) => {
    const t = new Date(r.updated_at).getTime();
    return t > max ? t : max;
  }, 0);

  // ── Chart data ──────────────────────────────────────────────────────────────

  const keywordChartData = useMemo(
    () =>
      keywords
        .filter((k) => k.volume != null && Number(k.volume) > 0)
        .slice(0, 10)
        .map((k) => ({
          keyword: (k.keyword || 'Keyword').slice(0, 22),
          volume: Number(k.volume),
        })),
    [keywords]
  );

  const clusterChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const k of keywords) {
      const c = k.cluster || 'Sonstige';
      counts[c] = (counts[c] || 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value]) => ({ name: name.slice(0, 20), value }));
  }, [keywords]);

  const designScoreData = useMemo(
    () =>
      competitors
        .filter((c) => c.designScore != null)
        .map((c) => ({
          name: (c.name || c.domain || 'Wettbewerber').slice(0, 16),
          score: c.designScore ?? 0,
        })),
    [competitors]
  );

  const radarData = useMemo(() => {
    if (performanceSites.length < 2) return [];
    const metrics: Array<{
      label: string;
      getter: (s: CompetitorRow) => number;
    }> = [
      { label: 'Mobile', getter: (s) => s.mobileScore ?? s.performanceScore ?? 0 },
      { label: 'Desktop', getter: (s) => s.desktopScore ?? 0 },
      { label: 'SEO', getter: (s) => s.lighthouseSeoScore ?? 0 },
      { label: 'A11y', getter: (s) => s.accessibilityScore ?? 0 },
      { label: 'Best Pr.', getter: (s) => s.bestPracticesScore ?? 0 },
    ];
    return metrics.map(({ label, getter }) => {
      const row: Record<string, unknown> = { metric: label };
      performanceSites.forEach((site, i) => {
        row[siteKey(site, i)] = getter(site);
      });
      return row;
    });
  }, [performanceSites]);

  // ── Effects ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    const urls = (lead.design_reference_urls || []).slice(0, 3);
    setDesignUrls([urls[0] || '', urls[1] || '', urls[2] || '']);
  }, [lead.design_reference_urls]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  async function saveResume() {
    setSaving(true);
    setSaveMessage(null);
    try {
      window.localStorage.setItem(
        'webwelle:funnel-resume',
        JSON.stringify({ token, savedAt: new Date().toISOString() })
      );
      const res = await fetch(`/api/funnel/leads/${token}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intent: 'save-resume' }),
      });
      const data = await res.json().catch(() => ({}));
      setSaveMessage(data.message || 'Analyse wurde gespeichert.');
    } catch {
      setSaveMessage('Analyse wurde lokal gespeichert. E-Mail konnte nicht gesendet werden.');
    } finally {
      setSaving(false);
    }
  }

  async function saveDesignReferences() {
    setDesignSaving(true);
    setDesignMessage(null);
    const urls = designUrls
      .map((u) => u.trim())
      .filter(Boolean)
      .slice(0, 3);
    try {
      const res = await fetch(`/api/funnel/leads/${token}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intent: 'design-preferences', urls }),
      });
      const data = await res.json();
      if (!res.ok) {
        setDesignMessage(data.message || 'Lieblings-Webseiten konnten nicht gespeichert werden.');
        return;
      }
      setDesignMessage('Lieblings-Webseiten gespeichert.');
      onRefresh();
    } catch {
      setDesignMessage('Verbindungsfehler beim Speichern.');
    } finally {
      setDesignSaving(false);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <header className="rounded-2xl border border-border bg-card p-6 shadow-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">Live-Analyse</p>
            <h1 className="text-2xl font-bold">Top {TARGET_WEBSITES} Wettbewerber</h1>
            <p className="mt-1 text-muted-foreground">
              {lead.industry_normalized || lead.industry_raw} · PLZ {lead.postal_code} ·{' '}
              {lead.market || 'DE'}
              {lead.city ? ` · ${lead.city}` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={saveResume}
            disabled={saving}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
          >
            {saving ? 'Speichert...' : 'Analyse speichern und später fortsetzen'}
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
          <span>
            {receivedSites} / {TARGET_WEBSITES} Websites
          </span>
          <span className="text-muted-foreground">
            Stand: {lastUpdate ? new Date(lastUpdate).toLocaleString('de-DE') : 'wird geladen...'}
          </span>
          <div className="min-w-[120px] flex-1 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <button type="button" onClick={onRefresh} className="text-primary underline text-sm">
            Aktualisieren
          </button>
        </div>

        {saveMessage && (
          <p className="mt-3 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary">
            {saveMessage}
          </p>
        )}
      </header>

      {/* ── Competitor mini-cards ── */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {competitors.map((c, i) => (
          <div
            key={`${c.domain}-${i}`}
            className="rounded-xl border border-border bg-card p-4"
          >
            <p className="font-semibold text-sm truncate">
              {c.name || c.title || `Wettbewerber ${i + 1}`}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {c.domain || c.websiteUrl || c.url || ''}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Analyseplatz {i + 1} von {TARGET_WEBSITES}
            </p>
          </div>
        ))}
        {competitors.length === 0 && (
          <p className="col-span-full py-8 text-center text-sm text-muted-foreground">
            Analyse läuft… Ergebnisse erscheinen in Kürze.
          </p>
        )}
      </div>

      {/* ── Tab bar ── */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-2">
        {(
          [
            ['seo', 'SEO'],
            ['design', 'Design'],
            ['performance', 'Performance'],
            ['recommendation', 'Empfehlung'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={
              `relative px-4 py-2 rounded-lg text-sm font-medium ` +
              (tab === key ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80')
            }
          >
            {label}
            {key === 'recommendation' && recommendations.length > 0 && (
              <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-background" />
            )}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SEO TAB
      ══════════════════════════════════════════════════════════════════════ */}
      {tab === 'seo' && (
        <div className="rounded-2xl border border-border bg-card p-6 space-y-6">
          <div>
            <h2 className="text-xl font-semibold">SEO-Signale</h2>
            <p className="text-sm text-muted-foreground">
              Diese Begriffe zeigen, wonach Kunden suchen und wo Ihre neue Website sichtbar werden
              kann.
            </p>
          </div>

          {keywords.length === 0 && (
            <p className="text-sm text-muted-foreground">Keywords werden geladen…</p>
          )}

          {/* Keyword-Volumen BarChart (wenn Volumen vorhanden) */}
          {keywordChartData.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Suchvolumen Top-Keywords
              </h3>
              <div className="rounded-xl border border-border bg-background/60 p-4">
                {mounted ? (
                  <ResponsiveContainer
                    width="100%"
                    height={Math.max(160, keywordChartData.length * 32)}
                  >
                    <BarChart
                      data={keywordChartData}
                      layout="vertical"
                      margin={{ left: 8, right: 24, top: 4, bottom: 4 }}
                    >
                      <XAxis type="number" hide />
                      <YAxis
                        type="category"
                        dataKey="keyword"
                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                        width={140}
                      />
                      <Tooltip
                        formatter={(v) => [Number(v).toLocaleString('de-DE'), 'Suchvolumen']}
                        contentStyle={TOOLTIP_STYLE}
                        cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                      />
                      <Bar dataKey="volume" fill="#DCA441" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <ChartSkeleton height={Math.max(160, keywordChartData.length * 32)} />
                )}
              </div>
            </div>
          )}

          {/* Keyword-Cluster PieChart (wenn mehrere Cluster vorhanden) */}
          {clusterChartData.length > 1 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Keyword-Cluster
              </h3>
              <div className="rounded-xl border border-border bg-background/60 p-4">
                {mounted ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie
                        data={clusterChartData}
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        innerRadius={42}
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${name} (${Math.round((percent as number) * 100)}%)`
                        }
                      >
                        {clusterChartData.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={TOOLTIP_STYLE}
                        formatter={(v) => [Number(v), 'Keywords']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <ChartSkeleton height={240} />
                )}
              </div>
            </div>
          )}

          {/* Keyword-Karten (Fallback / Ergänzung wenn kein Volumen-Chart) */}
          {keywords.length > 0 && keywordChartData.length === 0 && (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {keywords.slice(0, 12).map((kw, i) => (
                <div
                  key={`${kw.keyword}-${i}`}
                  className="rounded-xl border border-border bg-background/60 p-4"
                >
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Keyword</p>
                  <p className="mt-1 font-semibold">{kw.keyword || 'wird ausgewertet'}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-primary/10 px-2 py-1 text-primary">
                      {kw.cluster || 'Cluster offen'}
                    </span>
                    <span className="rounded-full bg-muted px-2 py-1">
                      Volumen {kw.volume ?? 'offen'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Lücken / Chancen */}
          {gaps.length > 0 && (
            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5">
              <div className="mb-3 flex items-center gap-2">
                <ArrowUpRight className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-bold">Sichtbarkeitslücken</h3>
              </div>
              <p className="mb-4 text-sm text-muted-foreground">
                Diese Themen sollten wir sichtbar besetzen, damit Wettbewerber nicht allein davon
                profitieren.
              </p>
              <div className="flex flex-wrap gap-2">
                {gaps.map((gap) => (
                  <span
                    key={gap}
                    className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-3 py-1.5 text-sm font-medium"
                  >
                    <ArrowUpRight className="h-3.5 w-3.5" />
                    {gap}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Upsell */}
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5">
            <p className="text-sm font-semibold text-amber-500">
              SEO Profi Zusatzpaket · zzgl. 69 EUR
            </p>
            <h3 className="mt-1 text-lg font-bold">
              Tiefere Keyword-Recherche für echte Wettbewerbsfähigkeit
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Wir prüfen stärkere Hauptkeywords, profitable Nischenbegriffe und Blog-Themen. Diese
              Begriffe können später direkt in Ihre Website, Landingpages und Blogartikel einfließen.
            </p>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          DESIGN TAB
      ══════════════════════════════════════════════════════════════════════ */}
      {tab === 'design' && (
        <div className="rounded-2xl border border-border bg-card p-6 space-y-6">
          <div>
            <h2 className="text-xl font-semibold">Design-Analyse</h2>
            <p className="text-sm text-muted-foreground">
              Welche visuellen Muster in Ihrer Branche funktionieren – und wo Ihre Website besser
              werden kann.
            </p>
          </div>

          {/* Design-Score Vergleichs-BarChart */}
          {designScoreData.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Design-Score Vergleich (Skala 1–5)
              </h3>
              <div className="rounded-xl border border-border bg-background/60 p-4">
                {mounted ? (
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart
                      data={designScoreData}
                      margin={{ left: 0, right: 12, top: 10, bottom: 0 }}
                    >
                      <XAxis
                        dataKey="name"
                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                        interval={0}
                      />
                      <YAxis
                        domain={[0, 5]}
                        ticks={[1, 2, 3, 4, 5]}
                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                      />
                      <Tooltip
                        contentStyle={TOOLTIP_STYLE}
                        formatter={(v) => [`${Number(v)}/5`, 'Design-Score']}
                        cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                      />
                      <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                        {designScoreData.map((entry, i) => (
                          <Cell
                            key={i}
                            fill={
                              entry.score >= 4
                                ? '#10b981'
                                : entry.score >= 3
                                  ? '#DCA441'
                                  : '#ef4444'
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <ChartSkeleton height={180} />
                )}
              </div>
            </div>
          )}

          {/* Wettbewerber-Karten */}
          <div className="grid gap-4 lg:grid-cols-2">
            {competitors.map((c, i) => (
              <div
                key={`${c.websiteUrl}-${i}`}
                className="rounded-2xl border border-border bg-background/60 p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold truncate">
                      {c.name || c.domain || `Wettbewerber ${i + 1}`}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {c.websiteUrl || c.url || c.domain}
                    </p>
                  </div>
                  {c.designScore != null && (
                    <span
                      className="shrink-0 rounded-full px-3 py-1 text-sm font-semibold"
                      style={{
                        backgroundColor:
                          c.designScore >= 4
                            ? 'rgba(16,185,129,0.15)'
                            : c.designScore >= 3
                              ? 'rgba(220,164,65,0.15)'
                              : 'rgba(239,68,68,0.15)',
                        color:
                          c.designScore >= 4
                            ? '#10b981'
                            : c.designScore >= 3
                              ? '#DCA441'
                              : '#ef4444',
                      }}
                    >
                      {c.designScore}/5
                    </span>
                  )}
                </div>

                {/* Farbpalette */}
                {asArray<string>(c.palette).length > 0 && (
                  <div className="mt-4">
                    <p className="mb-2 text-xs text-muted-foreground">Farbpalette</p>
                    <div className="flex flex-wrap gap-2">
                      {asArray<string>(c.palette)
                        .slice(0, 6)
                        .map((color) => (
                          <div key={color} className="flex flex-col items-center gap-0.5">
                            <div
                              className="h-10 w-10 rounded-lg border border-white/10 shadow-sm"
                              style={{ backgroundColor: color }}
                              title={color}
                            />
                            <span className="font-mono text-[9px] text-muted-foreground">
                              {color}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                <div className="mt-4 grid gap-2 text-sm md:grid-cols-2">
                  <p>
                    <span className="text-muted-foreground">Layout: </span>
                    {c.layoutPattern || 'nicht erkannt'}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Typografie: </span>
                    {c.typography || 'nicht erkannt'}
                  </p>
                </div>

                {/* Stärken / Chancen als farbige Chips */}
                {(asArray<string>(c.strengths).length > 0 ||
                  asArray<string>(c.weaknesses).length > 0) && (
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {asArray<string>(c.strengths).length > 0 && (
                      <div>
                        <p className="mb-2 text-xs font-semibold text-emerald-500">Stärken</p>
                        <div className="flex flex-wrap gap-1.5">
                          {asArray<string>(c.strengths)
                            .slice(0, 3)
                            .map((item) => (
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
                    {asArray<string>(c.weaknesses).length > 0 && (
                      <div>
                        <p className="mb-2 text-xs font-semibold text-amber-500">Chancen für Sie</p>
                        <div className="flex flex-wrap gap-1.5">
                          {asArray<string>(c.weaknesses)
                            .slice(0, 3)
                            .map((item) => (
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
            ))}
          </div>

          {/* Lieblings-Webseiten */}
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5">
            <h3 className="font-semibold">Ihre Lieblings-Webseiten</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Speichern Sie bis zu 3 Design-Beispiele. Wir nutzen sie als Stilrichtung im Angebot.
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {designUrls.map((url, i) => (
                <input
                  key={i}
                  value={url}
                  onChange={(e) => {
                    const next = [...designUrls];
                    next[i] = e.target.value;
                    setDesignUrls(next);
                  }}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  placeholder={`https://beispiel-${i + 1}.de`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={saveDesignReferences}
              disabled={designSaving}
              className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              {designSaving ? 'Speichert…' : 'Lieblings-Webseiten speichern'}
            </button>
            {designMessage && (
              <p className="mt-2 text-sm text-primary">{designMessage}</p>
            )}
          </div>

          {typeof designPayload.recommendation === 'string' && designPayload.recommendation && (
            <div className="rounded-2xl border border-border bg-background/60 p-5">
              <p className="text-sm font-semibold">Design-Empfehlung</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {designPayload.recommendation as string}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          PERFORMANCE TAB
      ══════════════════════════════════════════════════════════════════════ */}
      {tab === 'performance' && (
        <div className="rounded-2xl border border-border bg-card p-6 space-y-6">
          <div>
            <h2 className="text-xl font-semibold">Performance & Google PageSpeed</h2>
            <p className="text-sm text-muted-foreground">
              Schnelle Seiten führen häufiger zu Anfragen. Unser Ziel: Ihre WebWelle-Seite
              technisch auf Scores über 90 bringen.
            </p>
          </div>

          {performanceSites.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Performance-Daten werden geladen…
            </p>
          )}

          {/* Gauge-Karten pro Site */}
          {performanceSites.length > 0 && (
            <div className="grid gap-4 lg:grid-cols-2">
              {performanceSites.map((site, i) => {
                const mainScore = site.mobileScore ?? site.performanceScore;
                return (
                  <div
                    key={`${siteKey(site, i)}-card`}
                    className="rounded-2xl border border-border bg-background/60 p-5"
                  >
                    <p className="font-semibold">
                      {(site as { name?: string }).name || site.domain || `Website ${i + 1}`}
                    </p>
                    <p className="mb-4 text-xs text-muted-foreground">
                      {site.websiteUrl || site.url}
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                      <CircleGauge score={mainScore} label="Mobile" size={78} />
                      <CircleGauge score={site.desktopScore} label="Desktop" size={78} />
                      <CircleGauge score={site.lighthouseSeoScore} label="SEO" size={64} />
                      <CircleGauge score={site.accessibilityScore} label="A11y" size={64} />
                      <CircleGauge score={site.bestPracticesScore} label="Best Pr." size={64} />
                    </div>
                    {(site.narrative || site.psiNote) && (
                      <p className="mt-3 text-sm text-muted-foreground">
                        {site.narrative || site.psiNote}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Radar-Vergleich (ab 2 Sites) */}
          {radarData.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Wettbewerber-Vergleich
              </h3>
              <div className="rounded-xl border border-border bg-background/60 p-4">
                {mounted ? (
                  <ResponsiveContainer width="100%" height={290}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="#1e293b" />
                      <PolarAngleAxis
                        dataKey="metric"
                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                      />
                      <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                      {performanceSites.map((site, i) => (
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
                      <Legend
                        formatter={(value: string) => (
                          <span style={{ color: '#94a3b8', fontSize: 11 }}>{value}</span>
                        )}
                      />
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <ChartSkeleton height={290} />
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          EMPFEHLUNG TAB
      ══════════════════════════════════════════════════════════════════════ */}
      {tab === 'recommendation' && (
        <div className="rounded-2xl border border-border bg-card p-6 space-y-6">
          <div>
            <h2 className="text-xl font-semibold">Empfehlung & Paket-Module</h2>
            <p className="text-sm text-muted-foreground">
              Basierend auf Ihrer Branche und den Ergebnissen der Analyse.
            </p>
          </div>

          {/* Branchenanalyse – Loading-Skeleton */}
          {!industryQuestionsLoaded ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="h-4 w-4 rounded-full bg-primary/30 animate-pulse" />
                Branchenanalyse wird ausgewertet…
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-28 rounded-2xl bg-muted/20 animate-pulse" />
                ))}
              </div>
            </div>
          ) : (
            /* Branchenanalyse – Ergebnisse */
            <div className="space-y-4">
              {/* Stats-Karten */}
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 flex items-start gap-3">
                  <div className="rounded-xl bg-emerald-500/10 p-2.5">
                    <Users className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{discoveredCount}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">Wettbewerber analysiert</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5 flex items-start gap-3">
                  <div className="rounded-xl bg-primary/10 p-2.5">
                    <Lightbulb className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{recommendations.length}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Branchen-Chancen erkannt
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-blue-500/30 bg-blue-500/5 p-5 flex items-start gap-3">
                  <div className="rounded-xl bg-blue-500/10 p-2.5">
                    <TrendingUp className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm leading-snug">
                      {lead.industry_normalized || lead.industry_raw || 'Ihre Branche'}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">Analysierter Markt</p>
                  </div>
                </div>
              </div>

              {/* Branchenspezifische Empfehlungen von n8n */}
              {recommendations.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Branchenspezifische Chancen
                  </h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    {recommendations.slice(0, 6).map((rec, i) => {
                      const label = rec.label || rec.title || `Empfehlung ${i + 1}`;
                      const desc = rec.description || rec.text || '';
                      return (
                        <div
                          key={`${label}-${i}`}
                          className="flex gap-3 rounded-2xl border border-border bg-background/60 p-5"
                        >
                          <div
                            className="shrink-0 rounded-xl p-2.5"
                            style={{
                              backgroundColor: `${CHART_COLORS[i % CHART_COLORS.length]}20`,
                            }}
                          >
                            <CheckCircle2
                              className="h-5 w-5"
                              style={{ color: CHART_COLORS[i % CHART_COLORS.length] }}
                            />
                          </div>
                          <div>
                            <p className="text-sm font-semibold">{label}</p>
                            {desc && (
                              <p className="mt-1 text-xs text-muted-foreground">{desc}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {recommendations.length === 0 && (
                <div className="rounded-xl border border-border bg-background/60 p-4 text-sm text-muted-foreground">
                  Die Branchenanalyse wurde abgeschlossen. Ihre Paket-Empfehlungen finden Sie
                  unten.
                </div>
              )}
            </div>
          )}

          {/* WebWelle Standardmodule mit Icons */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              WebWelle Paket-Module
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              {MODULES.map(({ icon: Icon, label, desc, color }) => (
                <div
                  key={label}
                  className="flex gap-4 rounded-2xl border border-border bg-background/60 p-5"
                >
                  <div
                    className="shrink-0 rounded-xl p-2.5 h-fit"
                    style={{ backgroundColor: `${color}20` }}
                  >
                    <Icon className="h-5 w-5" style={{ color }} />
                  </div>
                  <div>
                    <p className="font-semibold">{label}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
