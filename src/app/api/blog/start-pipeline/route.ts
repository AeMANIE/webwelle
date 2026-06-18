import { NextRequest } from 'next/server';
import { requireAdminAuth, secureResponse } from '@/lib/api-security';
import {
  buildExternalRunId,
  createBlogJob,
  ensureBlogPipelineTables,
  getBlogJobByExternalRunId,
  markBlogJobRunning,
} from '@/lib/blog-jobs-database';
import {
  extractFunnelKeywords,
  getLeadResearchForPipeline,
  isResearchReadyForBlog,
  leadHasBlogAddon,
  resolveBlogArticleCount,
} from '@/lib/blog-pipeline';
import { getFunnelLeadByToken } from '@/lib/funnel-database';
import { buildBlogOrchestratorPayload, dispatchBlogPipeline } from '@/lib/n8n/dispatch';
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

  const leadToken = String(body.leadToken || body.token || '').trim();
  if (!leadToken) {
    return secureResponse({ error: 'lead_token_required', message: 'leadToken fehlt.' }, 400);
  }

  const forceResearch = body.forceResearch === true;
  const retryCount = Number(body.retryCount || 0);

  const lead = await getFunnelLeadByToken(leadToken);
  if (!lead) {
    return secureResponse({ error: 'lead_not_found' }, 404);
  }

  if (!leadHasBlogAddon(lead)) {
    return secureResponse(
      { error: 'no_blog_addon', message: 'Lead hat kein Blog-Paket.' },
      400
    );
  }

  const articleCount = resolveBlogArticleCount(lead);
  if (articleCount < 1) {
    return secureResponse({ error: 'invalid_article_count' }, 400);
  }

  const research = await getLeadResearchForPipeline(lead.id);
  const researchReady = isResearchReadyForBlog(research);
  if (!researchReady && !forceResearch) {
    return secureResponse(
      {
        error: 'research_not_ready',
        message: 'Funnel-Research noch nicht abgeschlossen.',
        researchReady: false,
      },
      409
    );
  }

  const keywordRecords = extractFunnelKeywords(research);
  const keywordStrings = keywordRecords
    .map((k) => String(k.keyword || k.term || k.text || '').trim())
    .filter(Boolean);
  const externalRunId =
    String(body.externalRunId || '').trim() ||
    buildExternalRunId({ sourceType: 'client', leadToken, keywords: keywordStrings, retryCount });

  const existing = await getBlogJobByExternalRunId(externalRunId);
  if (existing) {
    return secureResponse({
      jobId: existing.id,
      status: existing.status,
      existingJob: true,
      message: 'Job mit gleicher external_run_id existiert bereits.',
    });
  }

  const job = await createBlogJob({
    leadToken,
    customerId: lead.customer_id,
    articleCount,
    sourceType: 'client',
    externalRunId,
    promptVersion: BLOG_PROMPT_VERSION,
    keywordData: { keywords: keywordRecords },
  });

  const payload = buildBlogOrchestratorPayload(lead, job.id, articleCount, keywordRecords);
  payload.sourceType = 'client';

  await dispatchBlogPipeline(payload);
  await markBlogJobRunning(job.id);

  const n8nUrlSet = Boolean(
    process.env.N8N_WEBHOOK_SEO_01_URL?.trim() ||
      process.env.N8N_WEBHOOK_BLOG_ORCHESTRATOR_URL?.trim()
  );

  return secureResponse({
    jobId: job.id,
    status: 'running',
    leadToken,
    articleCount,
    externalRunId,
    researchReady,
    n8nDispatched: n8nUrlSet,
    warning: n8nUrlSet ? undefined : 'N8N_WEBHOOK_SEO_01_URL nicht gesetzt.',
  });
}
