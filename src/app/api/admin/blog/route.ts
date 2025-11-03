import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getAllBlogPosts, createBlogPost } from '@/lib/blog-database';
import { getRedisClient } from '@/lib/redis';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 });
    }

    const status = request.nextUrl.searchParams.get('status') as 'draft' | 'published' | null;

    const redis = getRedisClient();
    const cacheKey = status ? `admin:blog:${status}` : 'admin:blog:all';
    
    if (redis && (await redis.status) === 'ready') {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return NextResponse.json(JSON.parse(cached));
      }
    }

    const posts = await getAllBlogPosts(status || undefined);

    if (redis && (await redis.status) === 'ready') {
      await redis.setex(cacheKey, 300, JSON.stringify(posts)); // 5 Min TTL
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

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 });
    }

    const body = await request.json();
    const {
      title,
      slug,
      excerpt,
      content,
      author,
      featuredImageUrl,
      metaDescription,
      tags,
      featured,
      status,
    } = body;

    if (!title || !slug || !content) {
      return NextResponse.json(
        { error: 'Titel, Slug und Inhalt sind erforderlich' },
        { status: 400 }
      );
    }

    const post = await createBlogPost({
      title,
      slug,
      excerpt,
      content,
      author: author || 'SEO-Team WebWelle',
      featuredImageUrl,
      metaDescription,
      tags: tags || [],
      featured: featured || false,
      status: status || 'draft',
      createdBy: user.email,
    });

    // Cache invalidieren
    const redis = getRedisClient();
    if (redis && (await redis.status) === 'ready') {
      await redis.del('admin:blog:all');
      await redis.del('admin:blog:draft');
      await redis.del('admin:blog:published');
      await redis.del('blog:public:list');
    }

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error('Fehler beim Erstellen des Blog-Posts:', error);
    return NextResponse.json(
      { error: 'Fehler beim Erstellen des Blog-Posts' },
      { status: 500 }
    );
  }
}

