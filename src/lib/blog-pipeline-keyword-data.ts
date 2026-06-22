export interface PipelineKeywordRecord {
  keyword: string;
  volume?: number;
  difficulty?: number;
  intent?: string;
  cpc?: number;
  score?: number;
  status?: string;
  localCompetitors?: number;
  top3Urls?: string;
  avgWordCount?: number;
  avgH2Count?: number;
  keywordCluster?: string;
  isOpenGap?: boolean;
  isRelevant?: boolean;
  error?: string;
}

export interface Seo01PipelineData {
  status?: string;
  sourceType?: string;
  raw_keywords?: PipelineKeywordRecord[];
  root_keywords?: string[];
  dataforseo_status?: Record<string, unknown>;
  discovery_error?: string | null;
  recordedAt?: string;
}

export interface Seo02PipelineData {
  approved_blog_keywords?: PipelineKeywordRecord[];
  approved_service_keywords?: PipelineKeywordRecord[];
  skipped_keywords?: PipelineKeywordRecord[];
  sourceType?: string;
  error?: string;
  recordedAt?: string;
}

export interface BlogJobKeywordDataView {
  keywords: string[];
  mode?: string;
  branche?: string;
  plz?: string;
  city?: string;
  website?: string;
  pipeline?: {
    seo01?: Seo01PipelineData;
    seo02?: Seo02PipelineData;
  };
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === 'string') return item.trim();
      if (item && typeof item === 'object' && 'keyword' in item) {
        return String((item as { keyword: unknown }).keyword || '').trim();
      }
      return '';
    })
    .filter(Boolean);
}

export function normalizeKeywordRecord(item: unknown): PipelineKeywordRecord | null {
  if (typeof item === 'string') {
    const keyword = item.trim();
    return keyword ? { keyword } : null;
  }
  if (!item || typeof item !== 'object') return null;
  const row = item as Record<string, unknown>;
  const keyword = String(row.keyword || row.term || '').trim();
  if (!keyword) return null;
  const volume =
    row.volume != null
      ? Number(row.volume)
      : row.search_volume != null
        ? Number(row.search_volume)
        : undefined;
  const difficulty =
    row.difficulty != null
      ? Number(row.difficulty)
      : row.keyword_difficulty != null
        ? Number(row.keyword_difficulty)
        : undefined;

  return {
    keyword,
    volume,
    difficulty,
    intent: row.intent != null ? String(row.intent) : undefined,
    cpc: row.cpc != null ? Number(row.cpc) : undefined,
    score: row.score != null ? Number(row.score) : undefined,
    status: row.status != null ? String(row.status) : undefined,
    localCompetitors:
      row.localCompetitors != null
        ? Number(row.localCompetitors)
        : row.local_competitors != null
          ? Number(row.local_competitors)
          : undefined,
    top3Urls:
      row.top3Urls != null
        ? String(row.top3Urls)
        : row.top3_urls != null
          ? String(row.top3_urls)
          : undefined,
    avgWordCount:
      row.avgWordCount != null
        ? Number(row.avgWordCount)
        : row.avg_word_count != null
          ? Number(row.avg_word_count)
          : undefined,
    avgH2Count:
      row.avgH2Count != null
        ? Number(row.avgH2Count)
        : row.avg_h2_count != null
          ? Number(row.avg_h2_count)
          : undefined,
    keywordCluster:
      row.keywordCluster != null
        ? String(row.keywordCluster)
        : row.keyword_cluster != null
          ? String(row.keyword_cluster)
          : undefined,
    isOpenGap:
      row.isOpenGap != null
        ? Boolean(row.isOpenGap)
        : row.is_open_gap != null
          ? Boolean(row.is_open_gap)
          : undefined,
    isRelevant:
      row.isRelevant != null
        ? Boolean(row.isRelevant)
        : row.is_relevant != null
          ? Boolean(row.is_relevant)
          : undefined,
    error: row.error != null ? String(row.error) : undefined,
  };
}

export function normalizeKeywordRecords(value: unknown): PipelineKeywordRecord[] {
  if (!Array.isArray(value)) return [];
  return value.map(normalizeKeywordRecord).filter((r): r is PipelineKeywordRecord => r !== null);
}

export function parseBlogJobKeywordData(raw: unknown): BlogJobKeywordDataView {
  const data = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const pipelineRaw =
    data.pipeline && typeof data.pipeline === 'object'
      ? (data.pipeline as Record<string, unknown>)
      : {};
  const seo01Raw =
    pipelineRaw.seo01 && typeof pipelineRaw.seo01 === 'object'
      ? (pipelineRaw.seo01 as Record<string, unknown>)
      : undefined;
  const seo02Raw =
    pipelineRaw.seo02 && typeof pipelineRaw.seo02 === 'object'
      ? (pipelineRaw.seo02 as Record<string, unknown>)
      : undefined;

  const inputKeywords = asStringArray(data.keywords);

  return {
    keywords: inputKeywords,
    mode: data.mode != null ? String(data.mode) : undefined,
    branche: data.branche != null ? String(data.branche) : undefined,
    plz: data.plz != null ? String(data.plz) : undefined,
    city: data.city != null ? String(data.city) : undefined,
    website: data.website != null ? String(data.website) : undefined,
    pipeline: {
      seo01: seo01Raw
        ? {
            status: seo01Raw.status != null ? String(seo01Raw.status) : undefined,
            sourceType: seo01Raw.sourceType != null ? String(seo01Raw.sourceType) : undefined,
            raw_keywords: normalizeKeywordRecords(seo01Raw.raw_keywords),
            root_keywords: asStringArray(seo01Raw.root_keywords),
            dataforseo_status:
              seo01Raw.dataforseo_status && typeof seo01Raw.dataforseo_status === 'object'
                ? (seo01Raw.dataforseo_status as Record<string, unknown>)
                : undefined,
            discovery_error:
              seo01Raw.discovery_error != null ? String(seo01Raw.discovery_error) : null,
            recordedAt: seo01Raw.recordedAt != null ? String(seo01Raw.recordedAt) : undefined,
          }
        : undefined,
      seo02: seo02Raw
        ? {
            approved_blog_keywords: normalizeKeywordRecords(seo02Raw.approved_blog_keywords),
            approved_service_keywords: normalizeKeywordRecords(seo02Raw.approved_service_keywords),
            skipped_keywords: normalizeKeywordRecords(seo02Raw.skipped_keywords),
            sourceType: seo02Raw.sourceType != null ? String(seo02Raw.sourceType) : undefined,
            error: seo02Raw.error != null ? String(seo02Raw.error) : undefined,
            recordedAt: seo02Raw.recordedAt != null ? String(seo02Raw.recordedAt) : undefined,
          }
        : undefined,
    },
  };
}

export function mergeKeywordDataRoot(
  current: Record<string, unknown>,
  partial: Record<string, unknown>
): Record<string, unknown> {
  const next = { ...current, ...partial };
  const currentPipeline =
    current.pipeline && typeof current.pipeline === 'object'
      ? (current.pipeline as Record<string, unknown>)
      : {};
  const partialPipeline =
    partial.pipeline && typeof partial.pipeline === 'object'
      ? (partial.pipeline as Record<string, unknown>)
      : undefined;

  if (partialPipeline) {
    next.pipeline = {
      ...currentPipeline,
      ...Object.fromEntries(
        Object.entries(partialPipeline).map(([step, stepData]) => {
          const existingStep =
            currentPipeline[step] && typeof currentPipeline[step] === 'object'
              ? (currentPipeline[step] as Record<string, unknown>)
              : {};
          return [
            step,
            stepData && typeof stepData === 'object'
              ? { ...existingStep, ...(stepData as Record<string, unknown>) }
              : stepData,
          ];
        })
      ),
    };
  }

  return next;
}

export function buildPipelineStepPatch(
  step: 'seo01' | 'seo02',
  body: Record<string, unknown>
): Record<string, unknown> {
  const recordedAt = new Date().toISOString();
  if (step === 'seo01') {
    return {
      pipeline: {
        seo01: {
          status: body.status != null ? String(body.status) : 'research_done',
          sourceType: body.sourceType != null ? String(body.sourceType) : undefined,
          raw_keywords: body.raw_keywords ?? [],
          root_keywords: body.root_keywords ?? [],
          dataforseo_status: body.dataforseo_status ?? undefined,
          discovery_error: body.discovery_error ?? null,
          recordedAt,
        },
      },
    };
  }

  return {
    pipeline: {
      seo02: {
        approved_blog_keywords: body.approved_blog_keywords ?? [],
        approved_service_keywords: body.approved_service_keywords ?? [],
        skipped_keywords: body.skipped_keywords ?? [],
        sourceType: body.sourceType != null ? String(body.sourceType) : undefined,
        recordedAt,
      },
    },
  };
}

export function isSeoResearchOnlyJob(keywordData: Record<string, unknown> | null | undefined): boolean {
  if (!keywordData || typeof keywordData !== 'object') return false;
  return keywordData.mode === 'seo_research_only';
}
