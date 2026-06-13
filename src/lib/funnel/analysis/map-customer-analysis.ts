import { resolveAnalysisLoadState } from './analysis-state';
import { CUSTOMER_COPY } from './analysis-copy';
import { parseResearchData } from './parse-research';
import type {
  CompetitorRow,
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

function recommendationAudiencePhrase(industry: string): string {
  const normalized = industry.toLowerCase();
  if (/anwalt|kanzlei|notar|recht/.test(normalized)) return 'Ihre Kanzlei';
  if (/praxis|arzt|zahn|therap|psych|heil/.test(normalized)) return 'Ihre Praxis';
  if (/handwerk|installateur|elektriker|maler|dach|sanit|betrieb|shk/.test(normalized)) {
    return 'Ihr Betrieb';
  }
  return 'Ihr Unternehmen';
}

function buildRecommendationSummary(industry: string): string {
  const audience = recommendationAudiencePhrase(industry);
  return `Für ${audience} empfiehlt sich ein klarer Website-Auftritt mit vertrauensvoller Wirkung, lokaler Sichtbarkeit und sinnvollen Erweiterungen je nach Schwerpunkt.`;
}

function recommendationHighlights(
  complexity: number | null,
  packageLabel: string | null
): string[] {
  const bullets: string[] = [CUSTOMER_COPY.recommendationBulletBase];
  const showExtensions =
    complexity == null ||
    complexity > 5 ||
    Boolean(packageLabel && !/starter/i.test(packageLabel));

  if (showExtensions) {
    bullets.push(CUSTOMER_COPY.recommendationBulletExtensions);
  }

  const showIndividual =
    (complexity != null && complexity > 7) ||
    Boolean(packageLabel && /individual/i.test(packageLabel));

  if (showIndividual) {
    bullets.push(CUSTOMER_COPY.recommendationBulletIndividual);
  }

  return bullets;
}

function starterWelleFit(complexity: number | null): string {
  if (complexity == null || complexity <= 5) return CUSTOMER_COPY.recommendationBulletBase;
  if (complexity <= 7) {
    return `${CUSTOMER_COPY.recommendationBulletBase} – mit sinnvollen Erweiterungen`;
  }
  return CUSTOMER_COPY.recommendationBulletIndividual;
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

function getMobileScore(site: CompetitorRow): number | null {
  const score = site.mobileScore ?? site.performanceScore;
  if (typeof score !== 'number' || Number.isNaN(score)) return null;
  return Math.round(score);
}

function buildPerformanceHighlights(
  sites: CompetitorRow[],
  existingWebsiteUrl?: string | null
): string[] {
  const bullets: string[] = [];
  const ownSite = existingWebsiteUrl
    ? sites.find((site) => isOwnPerformanceSite(site, existingWebsiteUrl))
    : undefined;

  if (ownSite) {
    const ownScore = getMobileScore(ownSite);
    if (ownScore != null) {
      bullets.push(`Eigene Website: ${ownScore} Mobil`);
    }
  }

  const competitorScores = sites
    .filter((site) => !existingWebsiteUrl || !isOwnPerformanceSite(site, existingWebsiteUrl))
    .map((site) => getMobileScore(site))
    .filter((score): score is number => score != null);

  const bestScore =
    competitorScores.length > 0
      ? Math.max(...competitorScores)
      : ownSite
        ? null
        : sites.map((site) => getMobileScore(site)).find((score) => score != null) ?? null;

  if (bestScore != null) {
    bullets.push(`Beste Vergleichswebsite: ${bestScore} Mobil`);
  }

  bullets.push(CUSTOMER_COPY.performanceBulletStarter);
  return bullets;
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

  const industry =
    input.lead.industry_normalized || input.lead.industry_raw || 'Ihre Branche';

  const recommendationSummary = buildRecommendationSummary(industry);
  const recommendationBullets = recommendationHighlights(
    parsed.complexityScore,
    parsed.packageLabel
  );
  const performanceBullets = buildPerformanceHighlights(
    parsed.performanceSites,
    input.lead.existing_website_url
  );

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
        ctaLabel: CUSTOMER_COPY.designCardCta,
      },
      {
        id: 'performance',
        title: 'Performance',
        summary: CUSTOMER_COPY.performanceSummary,
        highlights: performanceBullets,
        tab: 'performance',
        ctaLabel: CUSTOMER_COPY.performanceCardCta,
      },
      {
        id: 'recommendation',
        title: 'Empfehlung',
        summary: recommendationSummary,
        highlights: recommendationBullets,
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
