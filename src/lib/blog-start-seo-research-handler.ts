import { NextRequest, after } from 'next/server';
import { requireStaffAuth, secureResponse } from '@/lib/api-security';
import {
  buildExternalRunId,
  createBlogJob,
  ensureBlogPipelineTables,
  markBlogJobRunning,
} from '@/lib/blog-jobs-database';
import {
  buildSeoAdmin01Payload,
  dispatchSeoAdminResearch,
  getBlogPipelineEnvStatus,
} from '@/lib/n8n/dispatch';

export function scheduleSeoAdminResearchDispatch(params: {
  jobId: number;
  branche: string;
  plz: string;
  website?: string;
}): void {
  after(async () => {
    try {
      await dispatchSeoAdminResearch(buildSeoAdmin01Payload(params));
      await markBlogJobRunning(params.jobId);
    } catch (error) {
      console.error(`seo-admin-01 dispatch failed for job ${params.jobId}:`, error);
    }
  });
}

export async function handleStartSeoResearch(request: NextRequest) {
  try {
    const auth = await requireStaffAuth(request, 'TEAM');
    if (auth instanceof Response) return auth;

    await ensureBlogPipelineTables();

    const pipelineEnv = getBlogPipelineEnvStatus();
    if (!pipelineEnv.seoAdminReady) {
      return secureResponse(
        {
          error: 'n8n_not_configured',
          message: 'SEO-Admin-Pipeline ist nicht konfiguriert.',
          missing: pipelineEnv.seoAdminMissing,
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

    const branche = String(body.branche || body.industry || '').trim();
    const plz = String(body.plz || body.postalCode || '').trim();
    const website = String(body.website || '').trim() || undefined;

    if (branche.length < 2) {
      return secureResponse(
        { error: 'branche_required', message: 'Bitte eine Branche eingeben.' },
        400
      );
    }
    if (!/^\d{4,5}$/.test(plz)) {
      return secureResponse(
        { error: 'plz_invalid', message: 'Bitte eine gültige PLZ eingeben.' },
        400
      );
    }

    const externalRunId = buildExternalRunId({
      sourceType: 'webwelle',
      keywords: [branche, plz],
      uniqueRun: true,
    });

    const job = await createBlogJob({
      leadToken: null,
      customerId: null,
      articleCount: 0,
      sourceType: 'webwelle',
      externalRunId,
      publishMode: 'draft',
      keywordData: {
        mode: 'seo_research_only',
        branche,
        plz,
        ...(website ? { website } : {}),
        pipeline: {},
      },
    });

    scheduleSeoAdminResearchDispatch({
      jobId: job.id,
      branche,
      plz,
      website,
    });

    return secureResponse({
      jobId: job.id,
      status: 'queued',
      externalRunId,
      n8nDispatched: true,
      message:
        'Keyword-Research gestartet — Ergebnisse erscheinen im SEO-Tab (typisch 2–10 Minuten).',
    });
  } catch (error) {
    console.error('start-seo-research:', error);
    const message = error instanceof Error ? error.message : 'Unbekannter Fehler';
    return secureResponse({ error: 'pipeline_start_failed', message }, 500);
  }
}
