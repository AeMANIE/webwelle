import { NextRequest } from 'next/server';
import { requireAdminAuth, secureResponse } from '@/lib/api-security';
import { ensureBlogPipelineTables, getBlogJobById } from '@/lib/blog-jobs-database';
import { parseBlogJobKeywordData } from '@/lib/blog-pipeline-keyword-data';
import { dispatchSeoAdminQualification } from '@/lib/n8n/dispatch';

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

  const job = await getBlogJobById(jobId);
  if (!job) return secureResponse({ error: 'job_not_found' }, 404);

  const parsed = parseBlogJobKeywordData(job.keywordData);
  const seo01 = parsed.pipeline?.seo01;
  const keywords = seo01?.filtered_keywords || [];
  if (!keywords.length) {
    return secureResponse(
      { error: 'no_keywords', message: 'Keine filtered_keywords von seo-01 vorhanden.' },
      400
    );
  }

  const branche = parsed.branche || String(job.keywordData?.branche || '').trim();
  const plz = parsed.plz || String(job.keywordData?.plz || '').trim();
  if (!branche || !plz) {
    return secureResponse({ error: 'missing_input', message: 'Branche oder PLZ fehlen im Job.' }, 400);
  }

  const dfsStatus = seo01?.dataforseo_status || {};
  const locationCode =
    dfsStatus.serp_location_code != null ? Number(dfsStatus.serp_location_code) : undefined;
  const locationLabel =
    dfsStatus.serp_location != null ? String(dfsStatus.serp_location) : parsed.city;

  const top25 = [...keywords]
    .sort((a, b) => (a.difficulty || 99) - (b.difficulty || 99))
    .slice(0, 25);

  try {
    await dispatchSeoAdminQualification({
      jobId,
      branche,
      plz,
      city: parsed.city,
      website: parsed.website,
      locationCode,
      locationLabel,
      keywords: top25,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unbekannter Fehler';
    return secureResponse({ error: 'dispatch_failed', message }, 502);
  }

  return secureResponse({
    ok: true,
    jobId,
    keywordCount: top25.length,
    message: 'seo-02 Qualification erneut gestartet (typisch 2–5 Minuten).',
  });
}
