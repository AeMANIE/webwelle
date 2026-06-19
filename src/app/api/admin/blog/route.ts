import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth, secureResponse, validateAPIInput } from '@/lib/api-security';
import { getAllBlogPosts, createBlogPost } from '@/lib/blog-database';
import { getRedisClient } from '@/lib/redis';
import { revalidateBlogPaths } from '@/lib/blog-revalidation';

export async function GET(request: NextRequest) {
  try {
    // Admin-Auth mit Rate Limiting
    const authResult = await requireAdminAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult; // Rate limit oder Auth-Fehler
    }

    const status = request.nextUrl.searchParams.get('status') as 'draft' | 'published' | null;

    const redis = getRedisClient();
    const cacheKey = status ? `admin:blog:${status}` : 'admin:blog:all';
    
    if (redis && redis.status === 'ready') {
      try {
        const cached = await redis.get(cacheKey);
        if (cached) {
          return secureResponse(JSON.parse(cached));
        }
      } catch (cacheError) {
        console.warn('⚠️ Redis Cache-Fehler (ignoriert):', cacheError);
      }
    }

    const posts = await getAllBlogPosts(status || undefined);

    if (redis && redis.status === 'ready') {
      try {
        await redis.setex(cacheKey, 300, JSON.stringify(posts)); // 5 Min TTL
      } catch (cacheError) {
        console.warn('⚠️ Redis Cache-Speicher-Fehler (ignoriert):', cacheError);
      }
    }

    return secureResponse(posts);
  } catch (error) {
    console.error('Fehler beim Laden der Blog-Posts:', error);
    return secureResponse(
      { error: 'Fehler beim Laden der Blog-Posts' },
      500
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Admin-Auth mit Rate Limiting
    const authResult = await requireAdminAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult; // Rate limit oder Auth-Fehler
    }
    const { user } = authResult;

    const body = await request.json();
    
    // Input-Validierung
    const validation = validateAPIInput(body, {
      title: { required: true, type: 'string', minLength: 3, maxLength: 255 },
      slug: { required: true, type: 'string', minLength: 3, maxLength: 255 },
      content: { required: true, type: 'string', minLength: 10 },
      excerpt: { required: false, type: 'string', maxLength: 500 },
      author: { required: false, type: 'string', maxLength: 255 },
      featuredImageUrl: { required: false, type: 'url' },
      metaDescription: { required: false, type: 'string', maxLength: 500 },
      status: { required: false, type: 'string' },
    });

    if (!validation.isValid) {
      return secureResponse(
        { error: 'Validierungsfehler', errors: validation.errors },
        400
      );
    }

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
    if (status === 'published') {
      if (publishedAt) {
        publishedAtDate = new Date(publishedAt);
      } else {
        publishedAtDate = new Date(); // Standard: aktuelles Datum
      }
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
      publishedAt: publishedAtDate,
      createdBy: user.email,
    });

    // Cache invalidieren
    const redis = getRedisClient();
    if (redis && redis.status === 'ready') {
      try {
        await redis.del('admin:blog:all');
        await redis.del('admin:blog:draft');
        await redis.del('admin:blog:published');
        await redis.del('blog:public:list');
      } catch (cacheError) {
        console.warn('⚠️ Redis Cache-Invalidierung-Fehler (ignoriert):', cacheError);
      }
    }

    if (post.status === 'published') {
      revalidateBlogPaths(post.slug);
    }

    return secureResponse(post, 201);
  } catch (error) {
    console.error('Fehler beim Erstellen des Blog-Posts:', error);
    return secureResponse(
      { error: 'Fehler beim Erstellen des Blog-Posts' },
      500
    );
  }
}

