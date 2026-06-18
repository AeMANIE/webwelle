import { NextRequest } from 'next/server';
import { requireAdminAuth, secureResponse } from '@/lib/api-security';
import {
  approveBlogArticle,
  ensureBlogPipelineTables,
  getBlogJobById,
  rejectBlogArticle,
} from '@/lib/blog-jobs-database';
import { revalidateBlogPaths } from '@/lib/blog-revalidation';

export async function POST(request: NextRequest) {
  const auth = await requireAdminAuth(request);
  if (auth instanceof Response) return auth;
  const { user } = auth;

  await ensureBlogPipelineTables();

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return secureResponse({ error: 'invalid_json' }, 400);
  }

  const articleId = Number(body.articleId);
  const action = String(body.action || '').toLowerCase();
  if (!articleId || !['approve', 'reject'].includes(action)) {
    return secureResponse({ error: 'invalid_payload' }, 400);
  }

  if (action === 'approve') {
    const article = await approveBlogArticle({
      articleId,
      approvedBy: user.email,
      customerNote: body.customerNote != null ? String(body.customerNote) : null,
    });
    if (!article) return secureResponse({ error: 'article_not_found_or_invalid_state' }, 404);
    revalidateBlogPaths();
    return secureResponse({ ok: true, article });
  }

  const article = await rejectBlogArticle({
    articleId,
    rejectedBy: user.email,
    internalNote: body.internalNote != null ? String(body.internalNote) : null,
  });
  if (!article) return secureResponse({ error: 'article_not_found_or_invalid_state' }, 404);
  revalidateBlogPaths();
  return secureResponse({ ok: true, article });
}
