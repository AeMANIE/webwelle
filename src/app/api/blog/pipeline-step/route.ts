import { NextRequest } from 'next/server';
import { verifyN8nRequest } from '@/lib/n8n/signature';
import { secureResponse } from '@/lib/api-security';
import {
  ensureBlogPipelineTables,
  getBlogJobById,
  markSeoResearchJobFailed,
  markSeoResearchJobFinished,
  mergeBlogJobKeywordData,
} from '@/lib/blog-jobs-database';
import {
  buildPipelineStepPatch,
  isSeoResearchOnlyJob,
} from '@/lib/blog-pipeline-keyword-data';

const VALID_STEPS = new Set(['seo01', 'seo02', 'seo02_error']);

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  if (!verifyN8nRequest(request, rawBody)) {
    return secureResponse({ error: 'unauthorized' }, 401);
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return secureResponse({ error: 'invalid_json' }, 400);
  }

  const jobId = Number(body.jobId ?? body.job_id);
  const step = String(body.step || '').toLowerCase();

  if (!jobId) {
    return secureResponse({ error: 'job_id_required' }, 400);
  }
  if (!VALID_STEPS.has(step)) {
    return secureResponse({ error: 'invalid_step' }, 400);
  }

  try {
    await ensureBlogPipelineTables();

    const existing = await getBlogJobById(jobId);
    if (!existing) {
      return secureResponse({ error: 'job_not_found' }, 404);
    }

    if (step === 'seo02_error') {
      const errorText = String(body.error || body.message || 'seo02 workflow failed');
      const current = (existing.keywordData as Record<string, unknown> | null) || {};
      await mergeBlogJobKeywordData(jobId, {
        pipeline: {
          seo02: {
            error: errorText,
            recordedAt: new Date().toISOString(),
          },
        },
      });
      if (isSeoResearchOnlyJob(current)) {
        await markSeoResearchJobFailed(jobId, errorText);
      }
      return secureResponse({ ok: true, jobId, step, failed: true });
    }

    const patch = buildPipelineStepPatch(step as 'seo01' | 'seo02', body);
    await mergeBlogJobKeywordData(jobId, patch);

    if (step === 'seo02') {
      const existingData = (existing.keywordData as Record<string, unknown> | null) || {};
      const refreshed = await getBlogJobById(jobId);
      const keywordData = (refreshed?.keywordData as Record<string, unknown> | null) || {};
      const isResearchJob =
        isSeoResearchOnlyJob(keywordData) ||
        isSeoResearchOnlyJob(existingData) ||
        (existing.articleCount === 0 && existing.sourceType === 'webwelle');
      if (isResearchJob) {
        await markSeoResearchJobFinished(jobId);
      }
    }

    return secureResponse({ ok: true, jobId, step });
  } catch (error) {
    console.error('pipeline-step callback failed:', error);
    return secureResponse({ ok: true, jobId, step, stored: false });
  }
}
