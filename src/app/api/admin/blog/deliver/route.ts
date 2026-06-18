import { NextRequest } from 'next/server';
import { requireAdminAuth, secureResponse } from '@/lib/api-security';
import { deliverJobToCustomer, ensureBlogPipelineTables, getBlogJobById } from '@/lib/blog-jobs-database';
import { revalidateBlogPaths } from '@/lib/blog-revalidation';

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

  if (job.sourceType !== 'client') {
    return secureResponse({ error: 'deliver_client_only' }, 400);
  }

  const delivered = await deliverJobToCustomer(jobId);
  if (!delivered) {
    return secureResponse(
      { error: 'not_ready_for_delivery', message: 'Job ist nicht bereit zur Kundenfreigabe.' },
      409
    );
  }

  revalidateBlogPaths();
  return secureResponse({ ok: true, job: delivered });
}
