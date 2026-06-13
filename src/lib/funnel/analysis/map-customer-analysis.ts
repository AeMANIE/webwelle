import { resolveAnalysisLoadState } from './analysis-state';
import { CUSTOMER_COPY } from './analysis-copy';
import { parseResearchData } from './parse-research';
import type {
  CustomerAnalysisViewModel,
  FunnelLeadSnapshot,
  PerformanceBadge,
  ResearchItem,
} from './analysis-types';

function performanceBadgeFromSites(sites: { mobileScore?: number | null }[]): PerformanceBadge {
  const scores = sites
    .map((s) => s.mobileScore)
    .filter((s): s is number => typeof s === 'number' && !Number.isNaN(s));
  if (!scores.length) return 'unknown';
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  if (avg >= 85) return 'strong';
  if (avg >= 65) return 'solid';
  return 'needs-work';
}

function starterWelleFit(complexity: number | null): string {
  if (complexity == null) return 'Gut mit StarterWelle umsetzbar';
  if (complexity <= 5) return 'Gut mit StarterWelle umsetzbar';
  if (complexity <= 7) return 'StarterWelle mit sinnvollen Erweiterungen';
  return 'Bei größeren Anforderungen individuelles Angebot sinnvoll';
}

export function mapCustomerAnalysisViewModel(input: {
  lead: FunnelLeadSnapshot;
  research: ResearchItem[];
  pollCount?: number;
  maxPolls?: number;
  hasLoadError?: boolean;
}): CustomerAnalysisViewModel {
  const parsed = parseResearchData(input.research, input.lead);
  const state = resolveAnalysisLoadState({
    research: input.research,
    pollCount: input.pollCount ?? 0,
    maxPolls: input.maxPolls ?? 60,
    hasLoadError: input.hasLoadError,
  });

  const topKeywords = parsed.keywords
    .map((k) => k.keyword || k.cluster || '')
    .filter(Boolean)
    .slice(0, 5);

  const benchmark =
    parsed.competitors.find((c) => (c.designScore ?? 0) >= 4) ||
    parsed.competitors[0];

  const designPatterns = parsed.competitors
    .flatMap((c) => asArray<string>(c.strengths))
    .filter(Boolean)
    .slice(0, 3);

  const visibilitySummary = CUSTOMER_COPY.visibilitySummary;

  const appearanceSummary =
    'In Ihrer Branche wirken klare Strukturen, ruhige Gestaltung und vertrauensvolle Inhalte besonders überzeugend.';

  const recommendationSummary =
    parsed.reasoning ||
    'Für Ihr Vorhaben empfehlen sich ein klarer Seitenaufbau, lokale Sichtbarkeit und passende Erweiterungen.';

  return {
    state,
    header: {
      industry: input.lead.industry_normalized || input.lead.industry_raw || 'Ihre Branche',
      postalCode: input.lead.postal_code || '–',
      city: input.lead.city || '',
      market: input.lead.market || 'DE',
      receivedSites: parsed.receivedSites,
      targetSites: 5,
      lastUpdateLabel: parsed.lastUpdate
        ? new Date(parsed.lastUpdate).toLocaleString('de-DE')
        : 'wird geladen…',
      existingWebsite: input.lead.existing_website ?? null,
      existingWebsiteUrl: input.lead.existing_website_url ?? null,
    },
    summaryCards: [
      {
        id: 'visibility',
        title: 'Sichtbarkeit',
        summary: visibilitySummary,
        highlights: topKeywords.slice(0, 3),
        tab: 'seo',
        ctaLabel: CUSTOMER_COPY.visibilityCardCta,
      },
      {
        id: 'appearance',
        title: 'Außenwirkung',
        summary: appearanceSummary,
        highlights: [
          benchmark?.name || benchmark?.domain || 'Branchen-Benchmark',
          ...designPatterns.slice(0, 2),
        ].filter(Boolean),
        tab: 'design',
        ctaLabel: CUSTOMER_COPY.summaryCardCta,
      },
      {
        id: 'recommendation',
        title: 'Empfehlung',
        summary: recommendationSummary,
        highlights: [
          starterWelleFit(parsed.complexityScore),
          parsed.packageLabel || 'StarterWelle passend',
        ],
        tab: 'recommendation',
        ctaLabel: CUSTOMER_COPY.summaryCardCta,
      },
    ],
    topKeywords,
    visibilityGaps: parsed.gaps.slice(0, 3),
    benchmarkCompetitor: benchmark?.name || benchmark?.domain || null,
    designPatterns,
    performanceBadge: performanceBadgeFromSites(parsed.performanceSites),
    recommendationSummary,
    starterWelleFit: starterWelleFit(parsed.complexityScore),
    parsed,
  };
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export { CUSTOMER_COPY };
