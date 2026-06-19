import { NextRequest } from 'next/server';
import { verifyN8nRequest } from '@/lib/n8n/signature';
import { secureResponse } from '@/lib/api-security';
import {
  ensureBlogPipelineTables,
  getBlogJobById,
  mergeBlogJobKeywordData,
} from '@/lib/blog-jobs-database';
import { buildPipelineStepPatch } from '@/lib/blog-pipeline-keyword-data';

const VALID_STEPS = new Set(['seo01', 'seo02']);

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

    const patch = buildPipelineStepPatch(step as 'seo01' | 'seo02', body);
    await mergeBlogJobKeywordData(jobId, patch);

    return secureResponse({ ok: true, jobId, step });
  } catch (error) {
    console.error('pipeline-step callback failed:', error);
    // Non-blocking for n8n — report success so the chain continues
    return secureResponse({ ok: true, jobId, step, stored: false });
  }
}
