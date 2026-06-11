import { NextRequest } from 'next/server';
import { requireAdminAuth, secureResponse } from '@/lib/api-security';
import {
  ensureBlogPipelineTables,
  getBlogArticlesByJobId,
  listBlogJobs,
} from '@/lib/blog-jobs-database';

export async function GET(request: NextRequest) {
  const auth = await requireAdminAuth(request);
  if (auth instanceof Response) return auth;

  await ensureBlogPipelineTables();

  const jobIdParam = request.nextUrl.searchParams.get('jobId');
  if (jobIdParam) {
    const jobId = Number(jobIdParam);
    if (!jobId) {
      return secureResponse({ error: 'invalid_job_id' }, 400);
    }
    const articles = await getBlogArticlesByJobId(jobId);
    return secureResponse({ jobId, articles });
  }

  const jobs = await listBlogJobs(100);
  return secureResponse({ jobs });
}
