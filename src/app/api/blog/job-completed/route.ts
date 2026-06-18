import { NextRequest } from 'next/server';
import { verifyN8nSignature } from '@/lib/n8n/signature';
import { secureResponse } from '@/lib/api-security';
import {
  ensureBlogPipelineTables,
  getBlogJobById,
  markPipelineFinished,
} from '@/lib/blog-jobs-database';
import { FINAL_JOB_STATUSES } from '@/lib/blog-constants';

/** Pipeline technically finished — NOT customer delivery (completed) */
export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  if (!verifyN8nSignature(rawBody, request.headers.get('x-webwelle-signature'))) {
    return secureResponse({ error: 'unauthorized' }, 401);
  }

  await ensureBlogPipelineTables();

  const body = JSON.parse(rawBody) as Record<string, unknown>;
  const jobId = Number(body.jobId);
  if (!jobId) {
    return secureResponse({ error: 'job_id_required' }, 400);
  }

  const existing = await getBlogJobById(jobId);
  if (!existing) {
    return secureResponse({ error: 'job_not_found' }, 404);
  }

  if (FINAL_JOB_STATUSES.has(existing.status)) {
    return secureResponse({
      ok: true,
      alreadyFinal: true,
      jobId,
      status: existing.status,
    });
  }

  const failedCount =
    body.failedCount != null
      ? Number(body.failedCount)
      : body.failed_count != null
        ? Number(body.failed_count)
        : undefined;

  const n8nExecutionId =
    body.n8nExecutionId != null
      ? String(body.n8nExecutionId)
      : body.n8n_execution_id != null
        ? String(body.n8n_execution_id)
        : undefined;

  const job = await markPipelineFinished(jobId, { failedCount, n8nExecutionId });

  if (job?.status === 'pipeline_finished' || job?.status === 'awaiting_article_review') {
    console.log(`Blog-Job ${jobId} pipeline_finished`);
  }

  return secureResponse({
    ok: true,
    jobId,
    status: job?.status,
    completedCount: job?.completedCount,
    failedCount: job?.failedCount,
    articleCount: job?.articleCount,
  });
}
