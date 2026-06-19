import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/api-security';
import { getBlogPostById, updateBlogPost, deleteBlogPost } from '@/lib/blog-database';
import { getRedisClient } from '@/lib/redis';
import { revalidateBlogPaths } from '@/lib/blog-revalidation';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const auth = await requireAdminAuth(request);
    if (auth instanceof NextResponse) return auth;

    const post = await getBlogPostById(params.id);

    if (!post) {
      return NextResponse.json(
        { error: 'Blog-Post nicht gefunden' },
        { status: 404 }
      );
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

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const auth = await requireAdminAuth(request);
    if (auth instanceof NextResponse) return auth;

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
      publishedAt,
    } = body;

    // Datum verarbeiten
    let publishedAtDate: Date | undefined = undefined;
    if (publishedAt) {
      publishedAtDate = new Date(publishedAt);
    }

    const updated = await updateBlogPost(params.id, {
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
      publishedAt: publishedAtDate,
    });

    if (!updated) {
      return NextResponse.json(
        { error: 'Blog-Post nicht gefunden' },
        { status: 404 }
      );
    }

    // Cache invalidieren
    const redis = getRedisClient();
    if (redis && redis.status === 'ready') {
      try {
        await redis.del('admin:blog:all');
        await redis.del('admin:blog:draft');
        await redis.del('admin:blog:published');
        await redis.del(`blog:post:${updated.slug}`);
        await redis.del('blog:public:list');
      } catch (cacheError) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️ Redis Cache-Invalidierung-Fehler (ignoriert):', cacheError);
        }
      }
    }

    revalidateBlogPaths(updated.status === 'published' ? updated.slug : undefined);

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Blog-Posts:', error);
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren des Blog-Posts' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const auth = await requireAdminAuth(request);
    if (auth instanceof NextResponse) return auth;

    const deleted = await deleteBlogPost(params.id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Blog-Post nicht gefunden' },
        { status: 404 }
      );
    }

    // Cache invalidieren
    const redis = getRedisClient();
    if (redis && redis.status === 'ready') {
      try {
        await redis.del('admin:blog:all');
        await redis.del('admin:blog:draft');
        await redis.del('admin:blog:published');
        await redis.del(`blog:post:${params.id}`); // Note: Would need slug for proper invalidation
        await redis.del('blog:public:list');
      } catch (cacheError) {
        // Redis Fehler ignorieren - Cache wird beim nächsten Request neu geladen
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️ Redis Cache-Invalidierung-Fehler (ignoriert):', cacheError);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Fehler beim Löschen des Blog-Posts:', error);
    return NextResponse.json(
      { error: 'Fehler beim Löschen des Blog-Posts' },
      { status: 500 }
    );
  }
}

