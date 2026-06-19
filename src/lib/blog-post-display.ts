export function safeToIsoDate(value: unknown): string | undefined {
  if (value == null || value === '') return undefined;
  const date = new Date(value as string | number | Date);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

export function formatBlogDate(value: unknown, locale = 'de-DE'): string {
  if (value == null || value === '') return '—';
  const date = new Date(value as string | number | Date);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString(locale);
}

export function estimateReadTimeMinutes(content: unknown): number {
  const text = typeof content === 'string' ? content : '';
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

export function normalizePostTags(tags: unknown): string[] {
  if (Array.isArray(tags)) {
    return tags.filter((tag): tag is string => typeof tag === 'string' && tag.length > 0);
  }
  if (typeof tags === 'string') {
    try {
      const parsed = JSON.parse(tags) as unknown;
      return Array.isArray(parsed)
        ? parsed.filter((tag): tag is string => typeof tag === 'string' && tag.length > 0)
        : [];
    } catch {
      return [];
    }
  }
  return [];
}

export function normalizeBlogContent(content: unknown): string {
  return typeof content === 'string' ? content : '';
}
