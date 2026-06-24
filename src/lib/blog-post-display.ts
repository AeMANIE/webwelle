import sanitizeHtml from 'sanitize-html';

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

/** Zoom Scheduler – Kontakt / Erstgespräch in Blog-CTAs */
export const BLOG_ZOOM_CONSULTATION_URL =
  'https://scheduler.zoom.us/aemanie-gmbh/30-minuten-mit-aemanie-gmbh-herr-manie';

/** Prose-Klassen: Abstände + sichtbare H2/H3 (Titel der Seite bleibt separates H1) */
export const BLOG_ARTICLE_PROSE_CLASS =
  'prose prose-lg max-w-none prose-headings:tracking-tight prose-headings:font-bold prose-headings:text-foreground prose-h2:mt-10 prose-h2:mb-4 prose-h2:text-2xl md:prose-h2:text-3xl prose-h3:mt-8 prose-h3:mb-3 prose-h3:text-xl md:prose-h3:text-2xl prose-p:text-muted-foreground prose-p:leading-7 prose-p:mb-6 md:prose-p:leading-8 prose-strong:text-foreground prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-ul:my-6 prose-ol:my-6 prose-ul:list-disc prose-ol:list-decimal prose-li:my-2';

export const BLOG_CONTENT_SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat(['h1', 'h2', 'h3']),
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    a: ['href', 'title', 'target', 'rel'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
};
