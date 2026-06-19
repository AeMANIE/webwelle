export interface PipelineKeywordRecord {
  keyword: string;
  volume?: number;
  difficulty?: number;
  intent?: string;
  cpc?: number;
  score?: number;
}

export interface Seo01PipelineData {
  status?: string;
  raw_keywords?: PipelineKeywordRecord[];
  root_keywords?: string[];
  dataforseo_status?: Record<string, unknown>;
  discovery_error?: string | null;
  recordedAt?: string;
}

export interface Seo02PipelineData {
  approved_blog_keywords?: PipelineKeywordRecord[];
  approved_service_keywords?: PipelineKeywordRecord[];
  sourceType?: string;
  recordedAt?: string;
}

export interface BlogJobKeywordDataView {
  keywords: string[];
  branche?: string;
  plz?: string;
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
  return {
    keyword,
    volume: row.volume != null ? Number(row.volume) : undefined,
    difficulty: row.difficulty != null ? Number(row.difficulty) : undefined,
    intent: row.intent != null ? String(row.intent) : undefined,
    cpc: row.cpc != null ? Number(row.cpc) : undefined,
    score: row.score != null ? Number(row.score) : undefined,
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
    branche: data.branche != null ? String(data.branche) : undefined,
    plz: data.plz != null ? String(data.plz) : undefined,
    pipeline: {
      seo01: seo01Raw
        ? {
            status: seo01Raw.status != null ? String(seo01Raw.status) : undefined,
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
            sourceType: seo02Raw.sourceType != null ? String(seo02Raw.sourceType) : undefined,
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
        sourceType: body.sourceType != null ? String(body.sourceType) : undefined,
        recordedAt,
      },
    },
  };
}
