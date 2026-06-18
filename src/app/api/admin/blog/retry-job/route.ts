import { NextRequest, after } from 'next/server';
import { requireAdminAuth, secureResponse } from '@/lib/api-security';
import {
  buildExternalRunId,
  createBlogJob,
  ensureBlogPipelineTables,
  getBlogJobById,
  markBlogJobRunning,
} from '@/lib/blog-jobs-database';
import { getFunnelLeadByToken } from '@/lib/funnel-database';
import { buildBlogOrchestratorPayload, dispatchBlogPipeline } from '@/lib/n8n/dispatch';
import { scheduleWebwelleN8nDispatch } from '@/lib/blog-start-webwelle-handler';
import { BLOG_PROMPT_VERSION } from '@/lib/blog-constants';

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

  const jobId = Number(body.jobId);
  if (!jobId) return secureResponse({ error: 'job_id_required' }, 400);

  const oldJob = await getBlogJobById(jobId);
  if (!oldJob) return secureResponse({ error: 'job_not_found' }, 404);

  const retryCount = (oldJob as BlogJobRetry).retryCount || 1;
  const externalRunId = buildExternalRunId({
    sourceType: oldJob.sourceType,
    leadToken: oldJob.leadToken,
    retryCount,
    uniqueRun: true,
  });

  const job = await createBlogJob({
    leadToken: oldJob.leadToken,
    customerId: oldJob.customerId,
    articleCount: oldJob.articleCount,
    sourceType: oldJob.sourceType,
    externalRunId,
    publishMode: oldJob.publishMode,
    promptVersion: BLOG_PROMPT_VERSION,
    keywordData: oldJob.keywordData,
  });

  if (oldJob.sourceType === 'client' && oldJob.leadToken) {
    after(async () => {
      const lead = await getFunnelLeadByToken(oldJob.leadToken!);
      if (lead) {
        const keywords = Array.isArray(oldJob.keywordData?.keywords)
          ? (oldJob.keywordData!.keywords as Array<Record<string, unknown>>)
          : [];
        const payload = buildBlogOrchestratorPayload(lead, job.id, job.articleCount, keywords);
        payload.sourceType = 'client';
        try {
          await dispatchBlogPipeline(payload);
          await markBlogJobRunning(job.id);
        } catch (e) {
          console.error(`retry-job client dispatch failed for ${job.id}:`, e);
        }
      }
    });
  } else if (oldJob.sourceType === 'webwelle') {
    const kw = Array.isArray(oldJob.keywordData?.keywords)
      ? (oldJob.keywordData!.keywords as string[])
      : [];
    scheduleWebwelleN8nDispatch({
      jobId: job.id,
      articleCount: job.articleCount,
      keywords: kw.map((k) =>
        typeof k === 'string' ? k : String((k as Record<string, unknown>).keyword || '')
      ),
      branche: String(oldJob.keywordData?.branche || 'Webdesign'),
      plz: String(oldJob.keywordData?.plz || '87435'),
      publishMode: oldJob.publishMode,
    });
  }

  return secureResponse({
    ok: true,
    jobId: job.id,
    previousJobId: jobId,
    status: 'queued',
    message: 'Retry gestartet — Pipeline läuft im Hintergrund.',
  });
}

interface BlogJobRetry {
  retryCount?: number;
}
