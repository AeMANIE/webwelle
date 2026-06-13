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
  Zap,
  FileText,
  TrendingUp,
  CheckCircle2,
  ArrowUpRight,
  Users,
  Lightbulb,
  Sparkles,
  PenLine,
} from 'lucide-react';
import { StarterWellePriceInline } from '@/components/funnel/StarterWellePrice';
import {
  BLOG_BUNDLE_10,
  BLOG_MIN_COUNT,
  BLOG_UNIT_PRICE_CENTS,
  calculateFunnelOfferTotal,
  formatEuro,
  normalizeAddonSelection,
  normalizeDesignPreferences,
  SEO_PROFI_ADDON,
  STARTERWELLE,
  type BlogMode,
  type FunnelAddonSelection,
} from '@/lib/funnel/packages';
import {
  resolveDesignWishes,
  type DesignWishItem,
} from '@/lib/funnel/design-wishes';

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
  // industry-questions-v2 featuresNeeded fields
  feature?: string;
  reason?: string;
  priority?: 'must' | 'should' | 'nice' | string;
  frequencyInCompetitors?: number;
};

type N8nQuestion = {
  q?: string;
  why?: string;
  packageHint?: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const TARGET_WEBSITES = 5;

function isOwnPerformanceSite(site: CompetitorRow, ownUrl?: unknown): boolean {
  if (!ownUrl) return false;
  try {
    const own = new URL(
      String(ownUrl).startsWith('http') ? String(ownUrl) : `https://${String(ownUrl)}`
    );
    const siteUrl = site.websiteUrl || site.url || site.domain || '';
    if (!siteUrl) return false;
    const parsed = new URL(
      siteUrl.startsWith('http') ? siteUrl : `https://${siteUrl}`
    );
    return parsed.hostname.replace(/^www\./, '') === own.hostname.replace(/^www\./, '');
  } catch {
    return false;
  }
}

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

const PACKAGE_LABELS: Record<string, string> = {
  individual_offer: 'Individual-Angebot',
  individual: 'Individual-Lösung',
  fixed: 'Festpreis-Paket',
  starter: 'Starter-Paket',
};

const PRIORITY_CHIP: Record<string, { label: string; bg: string; text: string }> = {
  must: { label: 'Pflicht', bg: 'bg-red-500/10', text: 'text-red-400' },
  should: { label: 'Empfohlen', bg: 'bg-amber-500/10', text: 'text-amber-400' },
  nice: { label: 'Optional', bg: 'bg-blue-500/10', text: 'text-blue-400' },
};

const STARTERWELLE_MODULES = [
  {
    icon: Globe,
    label: 'StarterWelle Onepage',
    desc: 'Individuell gestaltete Onepage mit Header, Footer und 3 Inhaltsbereichen – optional mit Kontaktformular.',
    color: '#DCA441',
  },
  {
    icon: FileText,
    label: 'Rechtliches Basispaket',
    desc: 'Impressum, Datenschutz und Cookie-Banner – rechtssicher von Anfang an.',
    color: '#3b82f6',
  },
  {
    icon: Zap,
    label: 'Hosting & Wartung',
    desc: '2 Jahre Hosting, Wartung, Backup alle 2 Wochen und Domain (.de/.com) inklusive.',
    color: '#10b981',
  },
  {
    icon: Search,
    label: 'SEO Profi & Blog',
    desc: 'Optional im SEO-Tab: SEO Profi Zusatzpaket oder Blog-Pakete für mehr Reichweite bei Google.',
    color: '#f59e0b',
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

function renderMarkdownish(raw: string): React.ReactNode {
  const lines = raw.split('\n').filter((l) => l.trim());
  return (
    <div className="space-y-2">
      {lines.map((line, i) => {
        const isBullet = /^\s*\*\s+/.test(line);
        const text = line.replace(/^\s*\*\s+/, '');
        const parts = text.split(/\*\*(.*?)\*\*/g);
        const nodes: React.ReactNode[] = parts.map((p, j) =>
          j % 2 === 1 ? <strong key={j}>{p}</strong> : p
        );
        if (isBullet) {
          return (
            <div key={i} className="flex gap-2">
              <span className="text-primary shrink-0 mt-0.5">•</span>
              <span>{nodes}</span>
            </div>
          );
        }
        return <p key={i}>{nodes}</p>;
      })}
    </div>
  );
}

// Tries all known field names n8n might use for upsell/recommendation data
function extractRecommendations(payload: Record<string, unknown>): Recommendation[] {
  const keys = [
    'featuresNeeded',          // industry-questions-v2 primary field
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

function DesignWishOptionalPicker({
  items,
  selectedIds,
  onToggle,
}: {
  items: DesignWishItem[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Keine zusätzlichen Design-Optionen aus der KI-Analyse erkannt.
      </p>
    );
  }

  return (
    <div className="grid gap-2 md:grid-cols-2">
      {items.map((item) => {
        const selected = selectedIds.includes(item.id);
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onToggle(item.id)}
            className={
              `rounded-xl border p-4 text-left transition-all ` +
              (selected
                ? 'border-primary bg-primary/15 ring-1 ring-primary/30'
                : 'border-border bg-background/60 hover:border-primary/40')
            }
          >
            <div className="flex items-start gap-2">
              <span
                className={
                  `mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ` +
                  (selected ? 'border-primary bg-primary text-primary-foreground' : 'border-border')
                }
              >
                {selected ? '✓' : ''}
              </span>
              <div className="min-w-0">
                <p className="font-medium text-sm">{item.label}</p>
                {item.description && (
                  <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
                )}
                {item.sourceSnippet && (
                  <p className="mt-2 text-xs italic text-muted-foreground/80">
                    „{item.sourceSnippet}"
                  </p>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AdminAnalysisView({
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
    addon_selection?: FunnelAddonSelection | null;
    design_preferences?: {
      interactiveElements?: string;
      informationDensity?: string;
      visualStyle?: string;
    } | null;
    existing_website?: boolean | null;
    existing_website_url?: string | null;
  };
  research: ResearchItem[];
  token: string;
  onRefresh: () => void;
}) {
  const [tab, setTab] = useState<TabKey>('seo');
  const [mounted, setMounted] = useState(false);
  const [designUrls, setDesignUrls] = useState<string[]>(['', '', '']);
  const [designSaving, setDesignSaving] = useState(false);
  const [designMessage, setDesignMessage] = useState<string | null>(null);
  const [addonSelection, setAddonSelection] = useState<FunnelAddonSelection>({
    seoProfi: false,
    blogMode: 'none',
    blogCount: BLOG_MIN_COUNT,
    brandingSelected: false,
    animationSelected: false,
  });
  const [addonSaving, setAddonSaving] = useState(false);
  const [addonMessage, setAddonMessage] = useState<string | null>(null);
  const [selectedOptionalIds, setSelectedOptionalIds] = useState<string[]>([]);
  const [styleSaving, setStyleSaving] = useState(false);
  const [styleMessage, setStyleMessage] = useState<string | null>(null);

  // recharts uses browser APIs – only render after hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  const byKey = useMemo(() => {
    const map: Record<string, ResearchItem> = {};
    for (const r of research) map[r.workflow_key] = r;
    return map;
  }, [research]);

  const designPayload = useMemo(
    () => byKey.competitor_design?.payload ?? {},
    [byKey.competitor_design?.payload]
  );
  const designResearchPending =
    !byKey.competitor_design || byKey.competitor_design.status === 'pending';
  const liveDesignWishes = useMemo(
    () => resolveDesignWishes(designPayload),
    [designPayload]
  );
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
  const complexityScore =
    typeof questionsPayload.complexityScore === 'number' ? questionsPayload.complexityScore : null;
  const packageLabel =
    PACKAGE_LABELS[String(questionsPayload.recommendation || '')] ||
    (questionsPayload.recommendation ? String(questionsPayload.recommendation) : null);
  const reasoning =
    typeof questionsPayload.reasoning === 'string' ? questionsPayload.reasoning : null;
  const n8nQuestions = asArray<N8nQuestion>(questionsPayload.questions);

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
          keyword: (k.keyword || 'Keyword').slice(0, 18),
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

  useEffect(() => {
    if (lead.addon_selection) {
      setAddonSelection(normalizeAddonSelection(lead.addon_selection));
    }
  }, [lead.addon_selection]);

  const savedDesignPrefs = useMemo(
    () => normalizeDesignPreferences(lead.design_preferences),
    [lead.design_preferences]
  );

  const displayDesignWishes = useMemo(() => {
    if (savedDesignPrefs.includedItems.length > 0 || savedDesignPrefs.optionalItems.length > 0) {
      return {
        included: savedDesignPrefs.includedItems,
        optional: savedDesignPrefs.optionalItems,
        fromStructuredPayload: liveDesignWishes.fromStructuredPayload,
      };
    }
    return liveDesignWishes;
  }, [savedDesignPrefs, liveDesignWishes]);

  useEffect(() => {
    setSelectedOptionalIds(savedDesignPrefs.selectedOptionalIds);
  }, [lead.design_preferences]);

  const addonBreakdown = useMemo(
    () => calculateFunnelOfferTotal(addonSelection),
    [addonSelection]
  );

  // ── Handlers ────────────────────────────────────────────────────────────────

  async function saveAddonSelection() {
    setAddonSaving(true);
    setAddonMessage(null);
    try {
      const res = await fetch(`/api/funnel/leads/${token}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intent: 'addon-selection',
          seoProfi: addonSelection.seoProfi,
          blogMode: addonSelection.blogMode,
          blogCount: addonSelection.blogCount,
          brandingSelected: addonSelection.brandingSelected,
          animationSelected: addonSelection.animationSelected,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAddonMessage(data.message || 'Zusatzpakete konnten nicht gespeichert werden.');
        return;
      }
      setAddonMessage('Zusatzpakete gespeichert – sie erscheinen in Ihrem Angebot.');
      onRefresh();
    } catch {
      setAddonMessage('Verbindungsfehler beim Speichern.');
    } finally {
      setAddonSaving(false);
    }
  }

  function toggleOptionalDesignWish(id: string) {
    setSelectedOptionalIds((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  }

  async function saveDesignStylePreferences() {
    setStyleSaving(true);
    setStyleMessage(null);
    try {
      const res = await fetch(`/api/funnel/leads/${token}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intent: 'design-style-preferences',
          selectedOptionalIds,
          includedItems: displayDesignWishes.included,
          optionalItems: displayDesignWishes.optional,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStyleMessage(data.message || 'Design-Präferenzen konnten nicht gespeichert werden.');
        return;
      }
      setStyleMessage('Design-Wünsche gespeichert – sie erscheinen in Ihrem Angebot.');
      onRefresh();
    } catch {
      setStyleMessage('Verbindungsfehler beim Speichern.');
    } finally {
      setStyleSaving(false);
    }
  }

  function setBlogMode(mode: BlogMode) {
    setAddonSelection((prev) => ({ ...prev, blogMode: mode }));
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
        <div>
          <p className="text-sm font-medium text-primary">Live-Analyse</p>
          <h1 className="text-2xl font-bold">Top {TARGET_WEBSITES} Wettbewerber</h1>
          <p className="mt-1 text-muted-foreground">
            {lead.industry_normalized || lead.industry_raw} · PLZ {lead.postal_code} ·{' '}
            {lead.market || 'DE'}
            {lead.city ? ` · ${lead.city}` : ''}
          </p>
          {lead.existing_website === true && lead.existing_website_url ? (
            <p className="mt-2 text-sm">
              <span className="text-muted-foreground">Ihre Website: </span>
              <a
                href={String(lead.existing_website_url)}
                target="_blank"
                rel="noreferrer"
                className="text-primary underline break-all"
              >
                {String(lead.existing_website_url)}
              </a>
              <span className="ml-2 rounded-full bg-primary/15 px-2 py-0.5 text-xs text-primary">
                Performance-Analyse läuft
              </span>
            </p>
          ) : lead.existing_website === false ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Ziel: neue Website von Grund auf
            </p>
          ) : null}
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
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 border-b border-border pb-2">
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
              `relative px-4 py-2.5 rounded-lg text-sm font-medium min-h-[44px] ` +
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
                        width={110}
                      />
                      <Tooltip
                        formatter={(v) => [Number(v).toLocaleString('de-DE'), 'Suchvolumen']}
                        contentStyle={TOOLTIP_STYLE}
                        labelStyle={TOOLTIP_LABEL_STYLE}
                        itemStyle={TOOLTIP_ITEM_STYLE}
                        cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                      />
                      <Bar dataKey="volume" radius={[0, 6, 6, 0]}>
                        {keywordChartData.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Bar>
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
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={clusterChartData}
                        cx="50%"
                        cy="45%"
                        outerRadius={88}
                        innerRadius={44}
                        dataKey="value"
                        paddingAngle={3}
                      >
                        {clusterChartData.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={TOOLTIP_STYLE}
                        labelStyle={TOOLTIP_LABEL_STYLE}
                        itemStyle={TOOLTIP_ITEM_STYLE}
                        formatter={(v) => [Number(v), 'Keywords']}
                      />
                      <Legend
                        formatter={(value: string) => (
                          <span style={{ color: '#94a3b8', fontSize: 12 }}>{value}</span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <ChartSkeleton height={240} />
                )}
              </div>
            </div>
          )}

          {/* Alle Keywords – immer sichtbar */}
          {keywords.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Alle Keywords ({keywords.length})
              </h3>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {keywords.map((kw, i) => (
                  <div
                    key={`${kw.keyword}-${i}`}
                    className="rounded-xl border border-border bg-background/60 p-4"
                  >
                    <p className="font-semibold text-sm">{kw.keyword || 'wird ausgewertet'}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
                      {kw.cluster && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">
                          {kw.cluster}
                        </span>
                      )}
                      <span
                        className={`rounded-full px-2 py-0.5 ${
                          Number(kw.volume) > 0
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {Number(kw.volume) > 0
                          ? `${Number(kw.volume).toLocaleString('de-DE')} / Monat`
                          : 'Volumen: —'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
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

          {/* Zusatzpakete SEO */}
          <div className="space-y-4 rounded-2xl border-2 border-primary/40 bg-gradient-to-br from-primary/10 via-card to-amber-500/5 p-6">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-primary/20 p-2.5">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-primary">
                  Mehr Sichtbarkeit
                </p>
                <h3 className="text-lg font-bold">SEO Profi & Blog-Zusatzpakete</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Wählen Sie optional Zusatzleistungen – wir berücksichtigen sie direkt in Ihrem
                  individuellen Angebot.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setAddonSelection((prev) => ({ ...prev, seoProfi: !prev.seoProfi }));
              }}
              className={
                `w-full rounded-xl border p-4 text-left transition-all ` +
                (addonSelection.seoProfi
                  ? 'border-primary bg-primary/15 ring-1 ring-primary/30'
                  : 'border-border bg-background/60 hover:border-primary/40')
              }
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold">{SEO_PROFI_ADDON.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{SEO_PROFI_ADDON.description}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-lg font-bold text-primary">
                    {formatEuro(SEO_PROFI_ADDON.priceCents)}
                  </span>
                </div>
              </div>
            </button>

            <div className="grid gap-3 md:grid-cols-2">
              <button
                type="button"
                onClick={() =>
                  setBlogMode(addonSelection.blogMode === 'bundle_10' ? 'none' : 'bundle_10')
                }
                className={
                  `rounded-xl border p-4 text-left transition-all ` +
                  (addonSelection.blogMode === 'bundle_10'
                    ? 'border-amber-500 bg-amber-500/15 ring-1 ring-amber-500/40'
                    : 'border-border bg-background/60 hover:border-amber-500/40')
                }
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <PenLine className="h-5 w-5 text-amber-400" />
                  <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-400">
                    SEO Profi gratis
                  </span>
                </div>
                <p className="font-bold">{BLOG_BUNDLE_10.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">{BLOG_BUNDLE_10.description}</p>
                <p className="mt-3 text-xl font-bold text-amber-400">
                  {formatEuro(BLOG_BUNDLE_10.priceCents)}
                </p>
              </button>

              <div
                className={
                  `rounded-xl border p-4 transition-all ` +
                  (addonSelection.blogMode === 'custom'
                    ? 'border-amber-500 bg-amber-500/15 ring-1 ring-amber-500/40'
                    : 'border-border bg-background/60')
                }
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <FileText className="h-5 w-5 text-amber-400" />
                  <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-400">
                    SEO Profi gratis
                  </span>
                </div>
                <p className="font-bold">Blog-Artikel individuell</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Ab {BLOG_MIN_COUNT} Artikeln à {formatEuro(BLOG_UNIT_PRICE_CENTS)} – Sie bestimmen
                  die Anzahl.
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setBlogMode('custom')}
                    className={
                      `rounded-lg px-3 py-1.5 text-sm font-medium ` +
                      (addonSelection.blogMode === 'custom'
                        ? 'bg-amber-500 text-black'
                        : 'bg-muted text-foreground')
                    }
                  >
                    Individuell wählen
                  </button>
                  {addonSelection.blogMode === 'custom' && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setAddonSelection((prev) => ({
                            ...prev,
                            blogCount: Math.max(BLOG_MIN_COUNT, prev.blogCount - 1),
                          }))
                        }
                        className="h-8 w-8 rounded-lg border border-border"
                      >
                        −
                      </button>
                      <span className="min-w-[2rem] text-center font-bold">
                        {addonSelection.blogCount}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setAddonSelection((prev) => ({
                            ...prev,
                            blogCount: Math.min(50, prev.blogCount + 1),
                          }))
                        }
                        className="h-8 w-8 rounded-lg border border-border"
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>
                {addonSelection.blogMode === 'custom' && (
                  <p className="mt-2 text-sm font-semibold text-amber-400">
                    {formatEuro(addonSelection.blogCount * BLOG_UNIT_PRICE_CENTS)}
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-background/70 p-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                Zusatzpakete gesamt:{' '}
                <span className="font-bold text-foreground">
                  {formatEuro(
                    addonBreakdown.subtotalCents - STARTERWELLE.priceCents > 0
                      ? addonBreakdown.subtotalCents - STARTERWELLE.priceCents
                      : 0
                  )}
                </span>
                <span className="text-muted-foreground inline-flex flex-wrap items-baseline gap-x-1">
                  {' '}
                  (zzgl. StarterWelle{' '}
                  <StarterWellePriceInline />)
                </span>
              </p>
              <button
                type="button"
                onClick={saveAddonSelection}
                disabled={addonSaving}
                className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
              >
                {addonSaving ? 'Speichert…' : 'Zusatzpakete sichern'}
              </button>
            </div>
            {addonMessage && (
              <p className="text-sm text-primary">{addonMessage}</p>
            )}
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
                        labelStyle={TOOLTIP_LABEL_STYLE}
                        itemStyle={TOOLTIP_ITEM_STYLE}
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

          {typeof designPayload.recommendation === 'string' && designPayload.recommendation && (
            <div className="rounded-2xl border border-primary/40 bg-card overflow-hidden">
              <div className="flex">
                <div className="w-1.5 shrink-0 bg-primary" />
                <div className="p-6 space-y-4 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🤖</span>
                    <h3 className="text-base font-bold">KI-Designempfehlung für Ihre Branche</h3>
                  </div>
                  <div className="text-base leading-relaxed text-foreground">
                    {renderMarkdownish(designPayload.recommendation as string)}
                  </div>
                  {typeof designPayload.summary === 'string' && designPayload.summary && (
                    <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
                      <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">
                        Markt-Zusammenfassung
                      </p>
                      <p className="text-base leading-relaxed text-foreground">
                        {designPayload.summary as string}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Design-Wünsche aus KI-Analyse */}
          <div className="rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-card p-6 space-y-5">
            <div>
              <h3 className="text-lg font-bold">Ihre Design-Wünsche</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Basierend auf Ihrer Branchenanalyse: Wählen Sie, wie Ihre Website wirken soll – wir
                berücksichtigen das im individuellen Angebot.
              </p>
            </div>

            {designResearchPending ? (
              <p className="text-sm text-muted-foreground">
                Design-Empfehlungen werden analysiert … Bitte einen Moment warten.
              </p>
            ) : (
              <>
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                    In StarterWelle enthalten
                  </p>
                  <div className="grid gap-2 md:grid-cols-2">
                    {displayDesignWishes.included.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4"
                      >
                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                          <div className="min-w-0">
                            <p className="font-medium text-sm">{item.label}</p>
                            {item.description && (
                              <p className="mt-1 text-xs text-muted-foreground">
                                {item.description}
                              </p>
                            )}
                            {item.sourceSnippet && (
                              <p className="mt-2 text-xs italic text-muted-foreground/80">
                                „{item.sourceSnippet}"
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-semibold">Optional – Sie wählen</p>
                  <p className="text-xs text-muted-foreground">
                    Diese Leistungen gehen über das StarterWelle-Basispaket hinaus und fließen in
                    Ihr individuelles Angebot ein.
                  </p>
                  <DesignWishOptionalPicker
                    items={displayDesignWishes.optional}
                    selectedIds={selectedOptionalIds}
                    onToggle={toggleOptionalDesignWish}
                  />
                </div>
              </>
            )}

            <button
              type="button"
              onClick={saveDesignStylePreferences}
              disabled={styleSaving || designResearchPending}
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              {styleSaving ? 'Speichert…' : 'Design-Wünsche speichern'}
            </button>
            {styleMessage && <p className="text-sm text-primary">{styleMessage}</p>}
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
                const isOwnSite = isOwnPerformanceSite(site, lead.existing_website_url);
                return (
                  <div
                    key={`${siteKey(site, i)}-card`}
                    className={
                      `rounded-2xl border bg-background/60 p-5 ` +
                      (isOwnSite ? 'border-primary/50 ring-1 ring-primary/20' : 'border-border')
                    }
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">
                        {(site as { name?: string }).name || site.domain || `Website ${i + 1}`}
                      </p>
                      {isOwnSite && (
                        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs text-primary">
                          Eigene Website
                        </span>
                      )}
                    </div>
                    <p className="mb-4 text-xs text-muted-foreground">
                      {site.websiteUrl || site.url}
                    </p>
                    <div className="mt-4 grid gap-5 md:grid-cols-2">
                      {/* Mobil – 4 PSI-Kategorien */}
                      <div className="space-y-3">
                        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                          📱 Mobil
                        </p>
                        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-3 justify-center">
                          <CircleGauge score={mainScore} label="Leistung" size={72} />
                          <CircleGauge score={site.accessibilityScore} label="Barrierefreiheit" size={72} />
                          <CircleGauge score={site.bestPracticesScore} label="Best Practices" size={72} />
                          <CircleGauge score={site.lighthouseSeoScore} label="SEO" size={72} />
                        </div>
                      </div>
                      {/* Desktop – Leistungsscore */}
                      <div className="space-y-3 border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-5">
                        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                          🖥 Desktop
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
              <div className="rounded-xl border border-border bg-background/60 p-4 h-[260px] lg:h-[420px]">
                {mounted ? (
                  <ResponsiveContainer width="100%" height="100%">
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
                      <Tooltip
                        contentStyle={TOOLTIP_STYLE}
                        labelStyle={TOOLTIP_LABEL_STYLE}
                        itemStyle={TOOLTIP_ITEM_STYLE}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <ChartSkeleton />
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
                      Features identifiziert
                    </p>
                    {packageLabel && (
                      <span className="mt-1 inline-block rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
                        {packageLabel}
                      </span>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-blue-500/30 bg-blue-500/5 p-5 flex items-start gap-3">
                  <div className="rounded-xl bg-blue-500/10 p-2.5">
                    <TrendingUp className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    {complexityScore != null ? (
                      <>
                        <p className="text-2xl font-bold">{complexityScore}<span className="text-sm font-normal text-muted-foreground">/10</span></p>
                        <p className="mt-0.5 text-xs text-muted-foreground">Projekt-Komplexität</p>
                        <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden w-24">
                          <div
                            className="h-full rounded-full bg-blue-400"
                            style={{ width: `${(complexityScore / 10) * 100}%` }}
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="font-semibold text-sm leading-snug">
                          {lead.industry_normalized || lead.industry_raw || 'Ihre Branche'}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">Analysierter Markt</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Analyse-Begründung von n8n */}
              {reasoning && (
                <div className="rounded-2xl border border-border bg-background/60 overflow-hidden">
                  <div className="flex">
                    <div className="w-1 shrink-0 bg-primary/60" />
                    <div className="p-5">
                      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                        Analyse-Begründung
                      </p>
                      <p className="text-sm leading-relaxed">{reasoning}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Branchenspezifische Features von n8n (featuresNeeded) */}
              {recommendations.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Empfohlene Website-Features
                  </h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    {recommendations.map((rec, i) => {
                      const label = rec.feature || rec.label || rec.title || `Feature ${i + 1}`;
                      const desc = rec.reason || rec.description || rec.text || '';
                      const prio = rec.priority ? PRIORITY_CHIP[rec.priority] : null;
                      const freq = rec.frequencyInCompetitors;
                      return (
                        <div
                          key={`${label}-${i}`}
                          className="flex gap-3 rounded-2xl border border-border bg-background/60 p-5"
                        >
                          <div
                            className="shrink-0 rounded-xl p-2.5 h-fit"
                            style={{ backgroundColor: `${CHART_COLORS[i % CHART_COLORS.length]}20` }}
                          >
                            <CheckCircle2
                              className="h-5 w-5"
                              style={{ color: CHART_COLORS[i % CHART_COLORS.length] }}
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <p className="text-sm font-semibold">{label}</p>
                              {prio && (
                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${prio.bg} ${prio.text}`}>
                                  {prio.label}
                                </span>
                              )}
                            </div>
                            {desc && (
                              <p className="text-xs text-muted-foreground leading-snug">{desc}</p>
                            )}
                            {freq != null && (
                              <p className="mt-1.5 text-[10px] text-muted-foreground">
                                {freq} von {discoveredCount || '?'} Wettbewerbern nutzen dies
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Persönliche Fragen für die Beratung */}
              {n8nQuestions.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Fragen für Ihr Beratungsgespräch
                  </h3>
                  <div className="rounded-2xl border border-border bg-background/60 divide-y divide-border">
                    {n8nQuestions.map((q, i) => (
                      <div key={i} className="p-4">
                        <p className="text-sm font-medium">{q.q}</p>
                        {q.why && (
                          <p className="mt-1 text-xs text-muted-foreground">{q.why}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {recommendations.length === 0 && !reasoning && n8nQuestions.length === 0 && (
                <div className="rounded-xl border border-border bg-background/60 p-4 text-sm text-muted-foreground">
                  Die Branchenanalyse wurde abgeschlossen. Ihre Paket-Empfehlungen finden Sie
                  unten.
                </div>
              )}
            </div>
          )}

          {/* StarterWelle Festpaket */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              StarterWelle – <StarterWellePriceInline /> für {STARTERWELLE.termLabel}
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              {STARTERWELLE_MODULES.map(({ icon: Icon, label, desc, color }) => (
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
