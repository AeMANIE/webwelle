import type { BlogSourceType } from './blog-constants';

export class BlogSystemGuardError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BlogSystemGuardError';
  }
}

export interface SystemAPublishPayload {
  source_type?: string;
  sourceType?: string;
  jobId?: number | string;
  article_id?: number | string;
  articleId?: number | string;
  blog_article_id?: number | string;
}

/** System A (webwelle.com/blog) — rejects client pipeline data */
export function assertSystemAOnly(payload: SystemAPublishPayload): void {
  const sourceType = String(payload.source_type || payload.sourceType || 'webwelle').toLowerCase();
  if (sourceType === 'client') {
    throw new BlogSystemGuardError('System-B-Artikel dürfen nicht in blog_posts veröffentlicht werden.');
  }
  if (payload.article_id != null || payload.articleId != null || payload.blog_article_id != null) {
    throw new BlogSystemGuardError('blog_articles dürfen nicht direkt nach blog_posts publiziert werden.');
  }
}

/** System B — must not target blog_posts */
export function assertSystemBOnly(sourceType: BlogSourceType): void {
  if (sourceType !== 'client' && sourceType !== 'webwelle') {
    throw new BlogSystemGuardError('Ungültiger source_type.');
  }
}

export function assertClientJobOnly(sourceType: BlogSourceType): void {
  if (sourceType !== 'client') {
    throw new BlogSystemGuardError('Diese Operation ist nur für Kunden-Blog-Jobs erlaubt.');
  }
}

/** Strip img tags from n8n HTML — images come via structured blog_images */
export function stripUncontrolledImages(html: string): string {
  return html.replace(/<img\b[^>]*>/gi, '');
}
