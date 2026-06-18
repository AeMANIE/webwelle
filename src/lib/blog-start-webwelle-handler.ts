import { NextRequest, after } from 'next/server';
import { requireStaffAuth, secureResponse } from '@/lib/api-security';
import {
  buildExternalRunId,
  createBlogJob,
  ensureBlogPipelineTables,
  getBlogJobByExternalRunId,
  markBlogJobRunning,
  type BlogJob,
} from '@/lib/blog-jobs-database';
import {
  buildWebwelleBlogPayload,
  dispatchBlogPipeline,
  getBlogPipelineEnvStatus,
  type N8nBlogOrchestratorPayload,
} from '@/lib/n8n/dispatch';
import { BLOG_PROMPT_VERSION, type BlogPublishMode } from '@/lib/blog-constants';

async function dispatchN8nForJob(params: {
  jobId: number;
  articleCount: number;
  keywords: string[];
  branche: string;
  plz: string;
  publishMode: BlogPublishMode;
}): Promise<{ n8nDispatched: boolean; warning?: string }> {
  const payload = buildWebwelleBlogPayload({
    jobId: params.jobId,
    articleCount: params.articleCount,
    keywords: params.keywords,
    branche: params.branche,
    plz: params.plz,
    publishMode: params.publishMode,
    promptVersion: BLOG_PROMPT_VERSION,
  });
  return dispatchN8nPayload(payload);
}

async function dispatchN8nPayload(
  payload: N8nBlogOrchestratorPayload
): Promise<{ n8nDispatched: boolean; warning?: string }> {
  try {
    await dispatchBlogPipeline(payload);
    return { n8nDispatched: true };
  } catch (e) {
    console.error('n8n dispatch failed:', e);
    return {
      n8nDispatched: false,
      warning: e instanceof Error ? e.message : 'n8n-Webhook fehlgeschlagen',
    };
  }
}

function shouldRedispatchExistingJob(job: BlogJob): boolean {
  return (
    (job.status === 'queued' || job.status === 'running') &&
    job.completedCount === 0 &&
    job.failedCount === 0
  );
}

function scheduleN8nDispatch(params: {
  jobId: number;
  articleCount: number;
  keywords: string[];
  branche: string;
  plz: string;
  publishMode: BlogPublishMode;
}): void {
  after(async () => {
    const { n8nDispatched } = await dispatchN8nForJob(params);
    if (n8nDispatched) {
      await markBlogJobRunning(params.jobId);
    } else {
      console.error(`n8n dispatch failed for blog job ${params.jobId}`);
    }
  });
}

export async function handleStartWebwellePipeline(request: NextRequest) {
  try {
    const auth = await requireStaffAuth(request, 'TEAM');
    if (auth instanceof Response) return auth;

    await ensureBlogPipelineTables();

    const pipelineEnv = getBlogPipelineEnvStatus();
    if (!pipelineEnv.ready) {
      return secureResponse(
        {
          error: 'n8n_not_configured',
          message: 'Blog-Pipeline ist nicht konfiguriert.',
          missing: pipelineEnv.missing,
        },
        503
      );
    }

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
      buildExternalRunId({ sourceType: 'webwelle', keywords, retryCount, uniqueRun: true });

    const existing = await getBlogJobByExternalRunId(externalRunId);
    if (existing) {
      const keywordData = existing.keywordData as { keywords?: string[]; branche?: string; plz?: string } | null;
      const dispatchParams = {
        jobId: existing.id,
        articleCount: existing.articleCount,
        keywords: keywords.length ? keywords : keywordData?.keywords || [],
        branche: branche || keywordData?.branche || 'Webdesign',
        plz: plz || keywordData?.plz || '87435',
        publishMode: existing.publishMode,
      };

      if (shouldRedispatchExistingJob(existing)) {
        scheduleN8nDispatch(dispatchParams);
        return secureResponse({
          jobId: existing.id,
          status: 'queued',
          existingJob: true,
          redispatched: true,
          n8nDispatched: true,
          message:
            'Pipeline wird im Hintergrund neu gestartet — Ergebnis typisch in 5–10 Minuten unter Kunden-Blog.',
        });
      }

      return secureResponse({
        jobId: existing.id,
        status: existing.status,
        existingJob: true,
        n8nDispatched: false,
        warning:
          'Job existiert bereits und wurde nicht erneut gestartet. Neues Keyword oder anderen Zeitpunkt wählen.',
      });
    }

    const job = await createBlogJob({
      leadToken: null,
      customerId: null,
      articleCount,
      sourceType: 'webwelle',
      externalRunId,
      publishMode,
      promptVersion: BLOG_PROMPT_VERSION,
      keywordData: { keywords, branche, plz },
    });

    scheduleN8nDispatch({
      jobId: job.id,
      articleCount,
      keywords,
      branche,
      plz,
      publishMode,
    });

    return secureResponse({
      jobId: job.id,
      status: 'queued',
      articleCount,
      publishMode,
      externalRunId,
      sourceType: 'webwelle',
      n8nDispatched: true,
      message:
        'Pipeline gestartet — läuft im Hintergrund. Ergebnis typisch in 5–10 Minuten unter Kunden-Blog und Blog-Editor (Entwürfe).',
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
