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

/** StarterWelle – Webdesign-Pakete in Blog-CTAs */
export const BLOG_STARTERWELLE_URL = '/buchung/starterwelle';

/** DB-Testartikel / Legacy – nicht auf /blog listen */
const BLOG_HIDDEN_FROM_LIST_TITLES = new Set([
  'das ist meine produkt für webwelle.com StarterWelle',
  'Kempten Webdesign Allgäu',
  'Next.js & React – Warum moderne Websites von WebWelle einfach besser performen',
]);

export function isBlogPostHiddenFromPublicList(post: { title?: string | null }): boolean {
  const title = (post.title ?? '').trim();
  return BLOG_HIDDEN_FROM_LIST_TITLES.has(title);
}

export function filterPublicBlogList<T extends { title?: string | null }>(posts: T[]): T[] {
  return posts.filter((post) => !isBlogPostHiddenFromPublicList(post));
}

export type FeaturedBlogPostRef = {
  slug: string;
  title: string;
  featured: boolean;
  status?: string;
  publishedAt?: Date;
  createdAt: Date;
};

/** Same criteria as "Featured Artikel" on /blog — used for sitemap and indexation. */
export async function getFeaturedPublicBlogPosts(): Promise<FeaturedBlogPostRef[]> {
  const { getAllBlogPosts } = await import('@/lib/blog-database');
  const { mergeBlogPostsWithGit } = await import('@/lib/blog-git-posts');

  let dbPosts: FeaturedBlogPostRef[] = [];
  try {
    const published = await getAllBlogPosts('published');
    dbPosts = published.map((post) => ({
      slug: post.slug,
      title: post.title,
      featured: post.featured,
      status: post.status,
      publishedAt: post.publishedAt,
      createdAt: post.createdAt,
    }));
  } catch {
    dbPosts = [];
  }

  const merged = mergeBlogPostsWithGit(dbPosts) as FeaturedBlogPostRef[];
  return filterPublicBlogList(merged).filter(
    (post) => post.featured && (post.status === undefined || post.status === 'published')
  );
}

export async function isBlogSlugIndexable(slug: string): Promise<boolean> {
  const featured = await getFeaturedPublicBlogPosts();
  return featured.some((post) => post.slug === slug);
}

/** CSS-Klasse für Blog-Body — Abstände in globals.css (.blog-article-content), nicht Tailwind prose */
export const BLOG_ARTICLE_PROSE_CLASS = 'blog-article-content';

export const BLOG_CONTENT_SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat(['h1', 'h2', 'h3']),
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    a: ['href', 'title', 'target', 'rel'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
};
