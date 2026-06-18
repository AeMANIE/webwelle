import { NextRequest } from 'next/server';
import { handleStartWebwellePipeline } from '@/lib/blog-start-webwelle-handler';

export async function POST(request: NextRequest) {
  return handleStartWebwellePipeline(request);
}
