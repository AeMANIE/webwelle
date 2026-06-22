import { NextRequest } from 'next/server';
import { handleStartSeoResearch } from '@/lib/blog-start-seo-research-handler';

export async function POST(request: NextRequest) {
  return handleStartSeoResearch(request);
}
