import { NextRequest } from 'next/server';
import { verifyN8nSignature } from '@/lib/n8n/signature';
import { secureResponse } from '@/lib/api-security';
import {
  ensureBlogPipelineTables,
  finalizeBlogJob,
  getBlogJobById,
} from '@/lib/blog-jobs-database';

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

  const failedCount =
    body.failedCount != null
      ? Number(body.failedCount)
      : body.failed_count != null
        ? Number(body.failed_count)
        : undefined;

  const job = await finalizeBlogJob(jobId, { failedCount });

  // E-Mail-Benachrichtigung: Sprint 4
  if (job?.status === 'completed' || job?.status === 'partial') {
    console.log(`Blog-Job ${jobId} abgeschlossen: ${job.status}`);
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
