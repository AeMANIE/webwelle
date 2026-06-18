import { NextRequest } from 'next/server';
import { requireAdminAuth, secureResponse } from '@/lib/api-security';
import {
  ensureBlogPipelineTables,
  exportBlogArticle,
  getBlogArticleById,
} from '@/lib/blog-jobs-database';

export async function POST(request: NextRequest) {
  const auth = await requireAdminAuth(request);
  if (auth instanceof Response) return auth;

  await ensureBlogPipelineTables();

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return secureResponse({ error: 'invalid_json' }, 400);
  }

  const articleId = Number(body.articleId);
  const format = String(body.format || 'copy_html');
  if (!articleId) return secureResponse({ error: 'article_id_required' }, 400);

  const article = await getBlogArticleById(articleId);
  if (!article) return secureResponse({ error: 'article_not_found' }, 404);

  const updated = await exportBlogArticle({
    articleId,
    deliveryType: format,
    exportFormat: format,
    targetProjectName: body.targetProjectName != null ? String(body.targetProjectName) : null,
    targetProjectUrl: body.targetProjectUrl != null ? String(body.targetProjectUrl) : null,
    targetCms: body.targetCms != null ? String(body.targetCms) : null,
    canonicalUrl: body.canonicalUrl != null ? String(body.canonicalUrl) : null,
  });

  let exportPayload: Record<string, unknown> = {
    id: article.id,
    title: article.title,
    keyword: article.keyword,
    metaDesc: article.metaDesc,
    htmlContent: article.htmlContent,
  };

  if (format === 'export_json') {
    exportPayload = {
      title: article.title,
      keyword: article.keyword,
      meta_description: article.metaDesc,
      content_html: article.htmlContent,
      word_count: article.wordCount,
    };
  } else if (format === 'export_markdown') {
    const text = (article.htmlContent || '')
      .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
      .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
      .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
      .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
      .replace(/<[^>]+>/g, '');
    exportPayload = { markdown: text.trim() };
  } else if (format === 'copy_plain') {
    exportPayload = {
      plain: (article.htmlContent || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
    };
  }

  return secureResponse({ ok: true, article: updated, export: exportPayload });
}
