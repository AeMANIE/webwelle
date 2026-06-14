type CompetitorEntry = Record<string, unknown>;

function hostname(url: string): string | null {
  try {
    const normalized = url.startsWith('http') ? url : `https://${url}`;
    return new URL(normalized).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return null;
  }
}

export function domainsMatch(a: string, b: string): boolean {
  const ha = hostname(a);
  const hb = hostname(b);
  return Boolean(ha && hb && ha === hb);
}

function asCompetitors(value: unknown): CompetitorEntry[] {
  return Array.isArray(value) ? (value as CompetitorEntry[]) : [];
}

function markOwnSiteEntries(entries: CompetitorEntry[]): CompetitorEntry[] {
  return entries.map((entry) => ({ ...entry, isOwnSite: true }));
}

export function mergeCompetitorDesignPayload(
  existing: Record<string, unknown> | null,
  incoming: Record<string, unknown>,
  ownUrl?: string | null
): Record<string, unknown> {
  const incomingCompetitors = markOwnSiteEntries(asCompetitors(incoming.competitors));
  const existingCompetitors = asCompetitors(existing?.competitors);

  const withoutOwn = ownUrl
    ? existingCompetitors.filter((entry) => {
        const url = String(entry.websiteUrl || entry.url || '');
        return !url || !domainsMatch(url, ownUrl);
      })
    : existingCompetitors.filter((entry) => !entry.isOwnSite);

  const competitors = [...incomingCompetitors, ...withoutOwn].slice(0, 6);

  return {
    ...(existing ?? {}),
    ...incoming,
    competitors,
    ownSiteAnalyzed: true,
    summary:
      typeof incoming.summary === 'string' && incoming.summary
        ? incoming.summary
        : existing?.summary,
    recommendation:
      typeof incoming.recommendation === 'string' && incoming.recommendation
        ? incoming.recommendation
        : existing?.recommendation,
    isOwnSiteSupplement: undefined,
  };
}

export function mergeSeoKeywordsPayload(
  existing: Record<string, unknown> | null,
  incoming: Record<string, unknown>,
  ownDomain?: string | null
): Record<string, unknown> {
  const incomingKeywords = Array.isArray(incoming.keywords)
    ? (incoming.keywords as Record<string, unknown>[])
    : [];
  const existingKeywords = Array.isArray(existing?.keywords)
    ? (existing.keywords as Record<string, unknown>[])
    : [];

  const ownKeywords = incomingKeywords.map((row) => ({
    ...row,
    cluster: row.cluster || 'eigene-website',
    isOwnSite: true,
  }));

  const incomingPerSite = Array.isArray(incoming.perSite)
    ? (incoming.perSite as Record<string, unknown>[])
    : [];
  const existingPerSite = Array.isArray(existing?.perSite)
    ? (existing.perSite as Record<string, unknown>[])
    : [];

  const withoutOwnPerSite = ownDomain
    ? existingPerSite.filter((row) => String(row.domain || '') !== ownDomain)
    : existingPerSite;

  const keywords = [...ownKeywords, ...existingKeywords].slice(0, 40);

  return {
    ...(existing ?? {}),
    ...incoming,
    keywords,
    perSite: [...incomingPerSite, ...withoutOwnPerSite],
    ownSiteAnalyzed: true,
    isOwnSiteSupplement: undefined,
  };
}

export function ownSiteDomainFromUrl(url?: string | null): string | null {
  if (!url) return null;
  return hostname(url);
}
