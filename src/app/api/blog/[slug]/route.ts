import { NextRequest, NextResponse } from 'next/server';
import { getBlogPostBySlug } from '@/lib/blog-database';
import { getRedisClient } from '@/lib/redis';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const params = await context.params;
    const redis = getRedisClient();
    const cacheKey = `blog:post:${params.slug}`;
    
    if (redis && (await redis.status) === 'ready') {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return NextResponse.json(JSON.parse(cached));
      }
    }

    const post = await getBlogPostBySlug(params.slug);

    if (!post || post.status !== 'published') {
      return NextResponse.json(
        { error: 'Blog-Post nicht gefunden' },
        { status: 404 }
      );
    }

    // Cache speichern (15 Minuten)
    if (redis && (await redis.status) === 'ready') {
      await redis.setex(cacheKey, 900, JSON.stringify(post));
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error('Fehler beim Laden des Blog-Posts:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden des Blog-Posts' },
      { status: 500 }
    );
  }
}

