import { NextResponse } from 'next/server';
import { getAllBlogPosts } from '@/lib/blog-database';
import { getRedisClient } from '@/lib/redis';

export async function GET() {
  try {
    const redis = getRedisClient();
    
    if (redis && (await redis.status) === 'ready') {
      const cached = await redis.get('blog:public:list');
      if (cached) {
        return NextResponse.json(JSON.parse(cached));
      }
    }

    // Nur veröffentlichte Posts
    const posts = await getAllBlogPosts('published');
    
    // Cache speichern (15 Minuten)
    if (redis && (await redis.status) === 'ready') {
      await redis.setex('blog:public:list', 900, JSON.stringify(posts));
    }

    return NextResponse.json(posts);
  } catch (error) {
    console.error('Fehler beim Laden der Blog-Posts:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden der Blog-Posts' },
      { status: 500 }
    );
  }
}

