import { NextRequest } from 'next/server';
import { requireAdminAuth, secureResponse } from '@/lib/api-security';
import {
  ensureBlogPipelineTables,
  getBlogArticleById,
  getBlogJobById,
  incrementArticleRetry,
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
  if (!articleId) return secureResponse({ error: 'article_id_required' }, 400);

  const article = await getBlogArticleById(articleId);
  if (!article) return secureResponse({ error: 'article_not_found' }, 404);

  await incrementArticleRetry(articleId);

  return secureResponse({
    ok: true,
    message: 'Artikel für Retry markiert. n8n-Workflow manuell oder per Job-Retry erneut starten.',
    articleId,
    retryCount: article.retryCount + 1,
  });
}
