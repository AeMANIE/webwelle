import { NextRequest } from 'next/server';
import { requireCustomerAuth, secureResponse } from '@/lib/api-security';
import {
  customerHasBlogJobs,
  ensureBlogPipelineTables,
  getCustomerVisibleArticles,
} from '@/lib/blog-jobs-database';

export async function GET(request: NextRequest) {
  const auth = await requireCustomerAuth(request);
  if (auth instanceof Response) return auth;
  const { user } = auth;

  await ensureBlogPipelineTables();

  const hasJobs = await customerHasBlogJobs(user.id);
  const articles = await getCustomerVisibleArticles(user.id);

  return secureResponse({
    hasBlogPackage: hasJobs,
    articles: articles.map((a) => ({
      id: a.id,
      title: a.title,
      keyword: a.keyword,
      metaDesc: a.metaDesc,
      htmlContent: a.htmlContent,
      wordCount: a.wordCount,
      customerNote: a.customerNote,
      customerVisibleAt: a.customerVisibleAt,
      copiedToProjectAt: a.copiedToProjectAt,
    })),
  });
}
