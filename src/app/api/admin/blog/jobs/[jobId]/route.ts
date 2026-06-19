import { NextRequest } from 'next/server';
import { requireAdminAuth, secureResponse } from '@/lib/api-security';
import {
  ensureBlogPipelineTables,
  getBlogArticlesByJobId,
  getBlogJobById,
} from '@/lib/blog-jobs-database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const auth = await requireAdminAuth(request);
  if (auth instanceof Response) return auth;

  await ensureBlogPipelineTables();

  const { jobId: jobIdParam } = await params;
  const jobId = Number(jobIdParam);
  if (!jobId) return secureResponse({ error: 'invalid_job_id' }, 400);

  const job = await getBlogJobById(jobId);
  if (!job) return secureResponse({ error: 'job_not_found' }, 404);

  const articles = await getBlogArticlesByJobId(jobId);

  const stats = {
    review_pending: articles.filter((a) => a.status === 'review_pending').length,
    approved: articles.filter((a) => a.status === 'approved').length,
    rejected: articles.filter((a) => a.status === 'rejected').length,
    failed: articles.filter((a) => a.status === 'failed').length,
  };

  return secureResponse({ job, articles, stats, keywordData: job.keywordData });
}
