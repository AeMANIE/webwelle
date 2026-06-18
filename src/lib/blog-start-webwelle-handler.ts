import { NextRequest } from 'next/server';
import { requireStaffAuth, secureResponse } from '@/lib/api-security';
import {
  buildExternalRunId,
  createBlogJob,
  ensureBlogPipelineTables,
  getBlogJobByExternalRunId,
  markBlogJobRunning,
} from '@/lib/blog-jobs-database';
import { buildWebwelleBlogPayload, dispatchBlogPipeline } from '@/lib/n8n/dispatch';
import { BLOG_PROMPT_VERSION, WEBWELLE_LEAD_TOKEN, type BlogPublishMode } from '@/lib/blog-constants';

export async function handleStartWebwellePipeline(request: NextRequest) {
  try {
    const auth = await requireStaffAuth(request, 'TEAM');
    if (auth instanceof Response) return auth;

    await ensureBlogPipelineTables();

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return secureResponse({ error: 'invalid_json' }, 400);
    }

    const keywords = Array.isArray(body.keywords)
      ? (body.keywords as unknown[]).map((k) => String(k).trim()).filter(Boolean)
      : [];
    const articleCount = Math.max(1, Math.min(20, Number(body.articleCount || keywords.length || 1)));
    const publishMode = (body.publishMode === 'publish' ? 'publish' : 'draft') as BlogPublishMode;
    const branche = String(body.branche || body.industry || 'Webdesign').trim();
    const plz = String(body.plz || body.postalCode || '87435').trim();
    const retryCount = Number(body.retryCount || 0);

    const externalRunId =
      String(body.externalRunId || '').trim() ||
      buildExternalRunId({ sourceType: 'webwelle', keywords, retryCount });

    const existing = await getBlogJobByExternalRunId(externalRunId);
    if (existing) {
      return secureResponse({
        jobId: existing.id,
        status: existing.status,
        existingJob: true,
      });
    }

    const job = await createBlogJob({
      leadToken: WEBWELLE_LEAD_TOKEN,
      customerId: null,
      articleCount,
      sourceType: 'webwelle',
      externalRunId,
      publishMode,
      promptVersion: BLOG_PROMPT_VERSION,
      keywordData: { keywords, branche, plz },
    });

    const payload = buildWebwelleBlogPayload({
      jobId: job.id,
      articleCount,
      keywords,
      branche,
      plz,
      publishMode,
      promptVersion: BLOG_PROMPT_VERSION,
    });

    let n8nDispatched = false;
    let warning: string | undefined;

    try {
      await dispatchBlogPipeline(payload);
      n8nDispatched = true;
    } catch (e) {
      console.error('n8n dispatch failed:', e);
      const n8nUrlSet = Boolean(
        process.env.N8N_WEBHOOK_SEO_01_URL?.trim() ||
          process.env.N8N_WEBHOOK_BLOG_ORCHESTRATOR_URL?.trim()
      );
      warning = n8nUrlSet
        ? 'n8n-Webhook fehlgeschlagen — Job angelegt, Pipeline manuell prüfen.'
        : 'N8N_WEBHOOK_SEO_01_URL nicht gesetzt — Job angelegt, n8n nicht gestartet.';
    }

    await markBlogJobRunning(job.id);

    return secureResponse({
      jobId: job.id,
      status: 'running',
      articleCount,
      publishMode,
      externalRunId,
      sourceType: 'webwelle',
      n8nDispatched,
      warning,
    });
  } catch (error) {
    console.error('start-webwelle-pipeline:', error);
    const message = error instanceof Error ? error.message : 'Unbekannter Fehler';
    return secureResponse(
      {
        error: 'pipeline_start_failed',
        message,
      },
      500
    );
  }
}
