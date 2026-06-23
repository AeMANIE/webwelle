import type { KeywordRow } from './analysis-types';

export type ClusterChartRow = { name: string; value: number };

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function clusterLabel(raw: Record<string, unknown>): string {
  return String(raw.cluster || raw.name || raw.topic || raw.label || '').trim();
}

function toVolume(value: unknown): number | string | null | undefined {
  if (typeof value === 'number' || typeof value === 'string') return value;
  return undefined;
}

function clusterWeight(raw: Record<string, unknown>, nestedKeywordCount: number): number {
  if (typeof raw.count === 'number' && raw.count > 0) return raw.count;
  if (typeof raw.volume === 'number' && raw.volume > 0) return raw.volume;
  if (nestedKeywordCount > 0) return nestedKeywordCount;
  return 1;
}

/** Flattens n8n seo_keywords payload into keyword rows (supports nested cluster groups). */
export function normalizeSeoKeywords(seoPayload: Record<string, unknown>): KeywordRow[] {
  const flat = asArray<KeywordRow>(seoPayload.keywords);
  if (flat.length > 0) return flat.slice(0, 30);

  const groups = asArray<Record<string, unknown>>(seoPayload.clusters);
  const expanded: KeywordRow[] = [];

  for (const group of groups) {
    const clusterName = clusterLabel(group);
    const nested = asArray<Record<string, unknown>>(group.keywords);

    if (nested.length > 0) {
      for (const item of nested) {
        const keyword = String(item.keyword || item.term || item.query || '').trim();
        if (!keyword) continue;
        expanded.push({
          keyword,
          cluster: clusterName || String(item.cluster || '').trim() || undefined,
          volume: toVolume(item.volume) ?? toVolume(group.volume),
        });
      }
      continue;
    }

    const keyword = String(group.keyword || group.term || clusterName || '').trim();
    if (!keyword) continue;
    expanded.push({
      keyword,
      cluster: clusterName || undefined,
      volume: toVolume(group.volume),
    });
  }

  return expanded.slice(0, 30);
}

export type KeywordVolumeChartRow = { keyword: string; volume: number };

export type KeywordDetailChartRow = KeywordVolumeChartRow & {
  cluster?: string;
};

/** Per-keyword chart rows for technical details (not cluster aggregation). */
export function buildKeywordDetailsChartData(
  keywords: KeywordRow[],
  options?: { limit?: number }
): {
  rows: KeywordDetailChartRow[];
  usesRelevanceFallback: boolean;
} {
  const limit = options?.limit ?? 30;

  const withVolume = keywords
    .filter((k) => k.volume != null && Number(k.volume) > 0)
    .map((k) => ({
      keyword: (k.keyword || k.cluster || 'Keyword').trim(),
      volume: Number(k.volume),
      cluster: (k.cluster || '').trim() || undefined,
    }))
    .sort((a, b) => b.volume - a.volume)
    .slice(0, limit);

  if (withVolume.length > 0) {
    return { rows: withVolume, usesRelevanceFallback: false };
  }

  const deduped: KeywordDetailChartRow[] = [];
  const seen = new Set<string>();
  for (const k of keywords) {
    const keyword = (k.keyword || k.cluster || '').trim();
    if (!keyword) continue;
    const key = keyword.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push({
      keyword,
      volume: 1,
      cluster: (k.cluster || '').trim() || undefined,
    });
    if (deduped.length >= limit) break;
  }

  return { rows: deduped, usesRelevanceFallback: deduped.length > 0 };
}

/** Bar chart data: search volume when available, otherwise equal relevance weights. */
export function buildKeywordVolumeChartData(keywords: KeywordRow[]): {
  rows: KeywordVolumeChartRow[];
  usesRelevanceFallback: boolean;
} {
  const { rows, usesRelevanceFallback } = buildKeywordDetailsChartData(keywords, { limit: 10 });
  return {
    rows: rows.map(({ keyword, volume }) => ({ keyword, volume })),
    usesRelevanceFallback,
  };
}

/** Pie slices per keyword for the technical-details section (not cluster aggregation). */
export function buildKeywordDetailsPieChartData(
  keywords: KeywordRow[],
  options?: { limit?: number }
): {
  rows: ClusterChartRow[];
  usesRelevanceFallback: boolean;
} {
  const { rows, usesRelevanceFallback } = buildKeywordDetailsChartData(keywords, options);
  return {
    rows: rows.map(({ keyword, volume, cluster }) => ({
      name: keyword.slice(0, 28),
      value: volume,
      cluster,
    })),
    usesRelevanceFallback,
  };
}

/** Pie chart data: cluster groups, then keyword-volume fallback when only one cluster exists. */
export function buildKeywordClusterChartData(
  keywords: KeywordRow[],
  seoPayload?: Record<string, unknown>
): ClusterChartRow[] {
  const payload = seoPayload ?? {};
  const rawClusters = asArray<Record<string, unknown>>(payload.clusters);

  if (rawClusters.length > 0) {
    const fromGroups = rawClusters
      .map((group) => {
        const name = clusterLabel(group);
        if (!name) return null;
        const nested = asArray(group.keywords);
        return {
          name: name.slice(0, 28),
          value: clusterWeight(group, nested.length),
        };
      })
      .filter((row): row is ClusterChartRow => row != null && row.value > 0);

    if (fromGroups.length > 1) {
      return fromGroups.sort((a, b) => b.value - a.value).slice(0, 6);
    }
  }

  const byCluster: Record<string, number> = {};
  for (const k of keywords) {
    const name = (k.cluster || '').trim();
    if (!name) continue;
    const weight =
      k.volume != null && Number(k.volume) > 0 ? Number(k.volume) : 1;
    byCluster[name] = (byCluster[name] || 0) + weight;
  }

  const clusterEntries = Object.entries(byCluster).sort((a, b) => b[1] - a[1]);
  if (clusterEntries.length > 1) {
    return clusterEntries
      .slice(0, 6)
      .map(([name, value]) => ({ name: name.slice(0, 28), value }));
  }

  const byKeyword = keywords
    .map((k) => {
      const name = (k.keyword || k.cluster || '').trim();
      if (!name) return null;
      return {
        name: name.slice(0, 28),
        value:
          k.volume != null && Number(k.volume) > 0 ? Number(k.volume) : 1,
      };
    })
    .filter((row): row is ClusterChartRow => row != null)
    .sort((a, b) => b.value - a.value);

  const deduped: ClusterChartRow[] = [];
  const seen = new Set<string>();
  for (const row of byKeyword) {
    const key = row.name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(row);
    if (deduped.length >= 6) break;
  }

  if (deduped.length > 1) return deduped;

  if (clusterEntries.length === 1) {
    return [{ name: clusterEntries[0][0].slice(0, 28), value: clusterEntries[0][1] }];
  }

  return deduped;
}

export function clusterChartUsesKeywordFallback(
  keywords: KeywordRow[],
  seoPayload?: Record<string, unknown>
): boolean {
  const data = buildKeywordClusterChartData(keywords, seoPayload);
  if (data.length <= 1) return false;

  const clusterNames = new Set(
    keywords.map((k) => (k.cluster || '').trim()).filter(Boolean)
  );
  if (clusterNames.size > 1) return false;

  const rawClusters = asArray(seoPayload?.clusters);
  if (rawClusters.length > 1) return false;

  return data.every((row) =>
    keywords.some((k) => (k.keyword || '').trim().slice(0, 28) === row.name)
  );
}
