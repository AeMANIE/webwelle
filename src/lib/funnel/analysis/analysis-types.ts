export const TARGET_WEBSITES = 5;

export type AnalysisTabKey = 'seo' | 'design' | 'performance' | 'recommendation';

export type AnalysisLoadState =
  | 'loading'
  | 'polling'
  | 'partial-ready'
  | 'ready'
  | 'timeout'
  | 'error';

export type PerformanceBadge = 'strong' | 'solid' | 'needs-work' | 'unknown';

export type ResearchItem = {
  workflow_key: string;
  status: string;
  payload: Record<string, unknown> | null;
  updated_at: string;
};

export type FunnelLeadSnapshot = {
  industry_normalized?: string;
  industry_raw?: string;
  postal_code?: string;
  city?: string;
  market?: string;
  design_reference_urls?: string[];
  existing_website?: boolean | null;
  existing_website_url?: string | null;
};

export type KeywordRow = {
  keyword?: string;
  cluster?: string;
  volume?: number | string | null;
};

export type CompetitorRow = {
  name?: string;
  title?: string;
  domain?: string;
  websiteUrl?: string;
  url?: string;
  isOwnSite?: boolean;
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

export type RecommendationRow = {
  label?: string;
  title?: string;
  description?: string;
  text?: string;
  feature?: string;
  reason?: string;
  priority?: 'must' | 'should' | 'nice' | string;
  frequencyInCompetitors?: number;
};

export type ParsedResearch = {
  byKey: Record<string, ResearchItem>;
  seoPayload: Record<string, unknown>;
  designPayload: Record<string, unknown>;
  perfPayload: Record<string, unknown>;
  questionsPayload: Record<string, unknown>;
  competitors: CompetitorRow[];
  performanceSites: CompetitorRow[];
  receivedSites: number;
  progress: number;
  keywords: KeywordRow[];
  gaps: string[];
  recommendations: RecommendationRow[];
  complexityScore: number | null;
  packageLabel: string | null;
  reasoning: string | null;
  discoveredCount: number;
  industryQuestionsLoaded: boolean;
  designResearchPending: boolean;
  lastUpdate: number;
};

export type SummaryCardModel = {
  id: 'visibility' | 'appearance' | 'performance' | 'recommendation';
  title: string;
  summary: string;
  highlights: string[];
  tab: AnalysisTabKey;
  ctaLabel: string;
};

export type CustomerAnalysisViewModel = {
  state: AnalysisLoadState;
  header: {
    industry: string;
    postalCode: string;
    city: string;
    market: string;
    receivedSites: number;
    targetSites: number;
    lastUpdateLabel: string;
    existingWebsite: boolean | null;
    existingWebsiteUrl: string | null;
  };
  summaryCards: SummaryCardModel[];
  topKeywords: string[];
  visibilityGaps: string[];
  benchmarkCompetitor: string | null;
  designPatterns: string[];
  performanceBadge: PerformanceBadge;
  recommendationSummary: string;
  starterWelleFit: string;
  parsed: ParsedResearch;
};

export type AdminWorkflowStatus = {
  key: string;
  status: string;
  updatedAt: string;
  hasPayload: boolean;
};

export type AdminAnalysisViewModel = {
  state: AnalysisLoadState;
  workflows: AdminWorkflowStatus[];
  parsed: ParsedResearch;
  lead: FunnelLeadSnapshot;
};
