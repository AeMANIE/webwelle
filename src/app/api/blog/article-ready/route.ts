import { NextRequest } from 'next/server';
import { verifyN8nSignature } from '@/lib/n8n/signature';
import { secureResponse } from '@/lib/api-security';
import {
  ensureBlogPipelineTables,
  getBlogJobById,
  incrementBlogJobProgress,
  saveArticleImages,
  upsertBlogArticle,
  type BlogImageInput,
} from '@/lib/blog-jobs-database';
import { BLOG_PROMPT_VERSION } from '@/lib/blog-constants';

function parseImages(raw: unknown): BlogImageInput[] {
  if (!Array.isArray(raw)) return [];
  const out: BlogImageInput[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const o = item as Record<string, unknown>;
    const url = String(o.url || '').trim();
    if (!url) continue;
    out.push({
      role: String(o.role || 'featured') as BlogImageInput['role'],
      url,
      alt: o.alt != null ? String(o.alt) : undefined,
      width: o.width != null ? Number(o.width) : undefined,
      height: o.height != null ? Number(o.height) : undefined,
      mimeType: o.mime_type != null ? String(o.mime_type) : undefined,
      position: o.position != null ? Number(o.position) : undefined,
    });
  }
  return out;
}

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
    promptVersion: String(body.promptVersion || body.prompt_version || BLOG_PROMPT_VERSION),
    n8nExecutionId:
      body.n8nExecutionId != null
        ? String(body.n8nExecutionId)
        : body.n8n_execution_id != null
          ? String(body.n8n_execution_id)
          : null,
  });

  const images = parseImages(body.images);
  if (images.length) {
    await saveArticleImages(article.id, job.sourceType, images);
  }

  await incrementBlogJobProgress(jobId, { failed: qaStatus === 'failed' });

  return secureResponse({
    ok: true,
    articleId: article.id,
    jobId,
    articleIndex,
    status: article.status,
  });
}
