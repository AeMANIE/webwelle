import { TARGET_WEBSITES } from './analysis-types';
import { clampDesignScore, clampReceivedSites } from './analysis-sanitize';
import { normalizeSeoKeywords } from './keyword-clusters';
import type {
  CompetitorRow,
  FunnelLeadSnapshot,
  KeywordRow,
  ParsedResearch,
  RecommendationRow,
  ResearchItem,
} from './analysis-types';

const PACKAGE_LABELS: Record<string, string> = {
  individual_offer: 'Individual-Angebot',
  individual: 'Individual-Lösung',
  fixed: 'Festpreis-Paket',
  starter: 'Starter-Paket',
};

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

function extractRecommendations(payload: Record<string, unknown>): RecommendationRow[] {
  const keys = [
    'featuresNeeded',
    'upsell_opportunities',
    'recommendations',
    'opportunities',
    'industry_opportunities',
    'upsell',
    'suggested_services',
    'services',
  ];
  for (const key of keys) {
    const arr = asArray<RecommendationRow>(payload[key]);
    if (arr.length > 0) return arr;
  }
  return [];
}

export function parseResearchData(
  research: ResearchItem[],
  _lead?: FunnelLeadSnapshot
): ParsedResearch {
  const byKey: Record<string, ResearchItem> = {};
  for (const r of research) byKey[r.workflow_key] = r;

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
  )
    .slice(0, TARGET_WEBSITES)
    .map((c) => ({
      ...c,
      designScore: clampDesignScore(c.designScore) ?? undefined,
    }));

  const performanceSites = normalizeSites(perfPayload.sites).slice(0, TARGET_WEBSITES);
  const receivedSites = clampReceivedSites(
    Number(perfPayload.receivedSites || performanceSites.length || competitors.length || 0)
  );
  const progress = Math.min(100, Math.round((receivedSites / TARGET_WEBSITES) * 100));

  const keywords = normalizeSeoKeywords(seoPayload);

  const gaps = (
    asArray<string>(seoPayload.gaps).length
      ? asArray<string>(seoPayload.gaps)
      : asArray<string>(seoPayload.opportunities)
  ).slice(0, 8);

  const recommendations = extractRecommendations(questionsPayload);
  const complexityScore =
    typeof questionsPayload.complexityScore === 'number'
      ? questionsPayload.complexityScore
      : null;
  const packageLabel =
    PACKAGE_LABELS[String(questionsPayload.recommendation || '')] ||
    (questionsPayload.recommendation ? String(questionsPayload.recommendation) : null);
  const reasoning =
    typeof questionsPayload.reasoning === 'string' ? questionsPayload.reasoning : null;

  const discoveredCount =
    asArray(questionsPayload.discoveredCompetitors).length ||
    asArray(questionsPayload.competitors).length ||
    competitors.length;

  const industryQuestionsLoaded =
    Boolean(byKey.industry_questions) && byKey.industry_questions.status !== 'pending';
  const designResearchPending =
    !byKey.competitor_design || byKey.competitor_design.status === 'pending';

  const lastUpdate = research.reduce((max, r) => {
    const t = new Date(r.updated_at).getTime();
    return t > max ? t : max;
  }, 0);

  return {
    byKey,
    seoPayload,
    designPayload,
    perfPayload,
    questionsPayload,
    competitors,
    performanceSites,
    receivedSites,
    progress,
    keywords,
    gaps,
    recommendations,
    complexityScore,
    packageLabel,
    reasoning,
    discoveredCount,
    industryQuestionsLoaded,
    designResearchPending,
    lastUpdate,
  };
}

export { asArray, normalizeSites, extractRecommendations, PACKAGE_LABELS };
