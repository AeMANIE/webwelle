import { NextRequest } from 'next/server';
import { verifyN8nSignature } from '@/lib/n8n/signature';
import { secureResponse } from '@/lib/api-security';
import {
  ensureBlogPipelineTables,
  getBlogJobById,
  incrementBlogJobProgress,
  upsertBlogArticle,
} from '@/lib/blog-jobs-database';

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  if (!verifyN8nSignature(rawBody, request.headers.get('x-webwelle-signature'))) {
    return secureResponse({ error: 'unauthorized' }, 401);
  }

  await ensureBlogPipelineTables();

  const body = JSON.parse(rawBody) as Record<string, unknown>;
  const jobId = Number(body.jobId);
  const articleIndex = Number(body.articleIndex ?? body.article_index);

  if (!jobId || Number.isNaN(articleIndex) || articleIndex < 0) {
    return secureResponse({ error: 'invalid_payload' }, 400);
  }

  const job = await getBlogJobById(jobId);
  if (!job) {
    return secureResponse({ error: 'job_not_found' }, 404);
  }

  const keyword = String(body.keyword || '').trim();
  if (!keyword) {
    return secureResponse({ error: 'keyword_required' }, 400);
  }

  const qaStatus = String(body.qaStatus || body.qa_status || 'passed');
  const failed = qaStatus === 'failed';

  const article = await upsertBlogArticle({
    jobId,
    leadToken: job.leadToken,
    articleIndex,
    keyword,
    title: body.title != null ? String(body.title) : null,
    metaDesc:
      body.metaDesc != null
        ? String(body.metaDesc)
        : body.meta_desc != null
          ? String(body.meta_desc)
          : null,
    htmlContent:
      body.htmlContent != null
        ? String(body.htmlContent)
        : body.html_content != null
          ? String(body.html_content)
          : null,
    wordCount:
      body.wordCount != null
        ? Number(body.wordCount)
        : body.word_count != null
          ? Number(body.word_count)
          : null,
    qaStatus,
    qaFailReason:
      body.qaFailReason && typeof body.qaFailReason === 'object'
        ? (body.qaFailReason as Record<string, unknown>)
        : body.qa_fail_reason && typeof body.qa_fail_reason === 'object'
          ? (body.qa_fail_reason as Record<string, unknown>)
          : null,
  });

  await incrementBlogJobProgress(jobId, { failed });

  return secureResponse({
    ok: true,
    articleId: article.id,
    jobId,
    articleIndex,
    status: article.status,
  });
}
