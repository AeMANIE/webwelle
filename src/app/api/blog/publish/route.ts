import { NextRequest, NextResponse } from 'next/server';
import { createBlogPost, generateSlug } from '@/lib/blog-database';
import { getRedisClient } from '@/lib/redis';

/**
 * n8n-API für automatische Blog-Veröffentlichung
 * 
 * Authentifizierung: API-Key (N8N_API_KEY in .env)
 * 
 * Request Body:
 * {
 *   "title": "Artikel-Titel",
 *   "content": "HTML-Content",
 *   "excerpt": "Kurzbeschreibung",
 *   "author": "Autor",
 *   "tags": ["tag1", "tag2"],
 *   "featured_image_url": "https://...",
 *   "meta_description": "SEO-Description",
 *   "status": "published"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // API-Key-Authentifizierung
    const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization')?.replace('Bearer ', '');
    const expectedApiKey = process.env.N8N_API_KEY;

    if (!expectedApiKey) {
      console.error('⚠️ N8N_API_KEY nicht in .env gesetzt');
      return NextResponse.json(
        { error: 'API-Key-Konfiguration fehlt' },
        { status: 500 }
      );
    }

    if (!apiKey || apiKey !== expectedApiKey) {
      return NextResponse.json(
        { error: 'Ungültiger API-Key' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      title,
      content,
      excerpt,
      author,
      tags,
      featured_image_url,
      meta_description,
      status = 'published',
    } = body;

    // Validierung
    if (!title || !content) {
      return NextResponse.json(
        { error: 'Titel und Inhalt sind erforderlich' },
        { status: 400 }
      );
    }

    // Slug generieren (falls nicht vorhanden)
    const slug = body.slug || generateSlug(title);

    // Prüfen ob Slug bereits existiert
    const { getAllBlogPosts } = await import('@/lib/blog-database');
    const existingPosts = await getAllBlogPosts();
    let finalSlug = slug;
    let counter = 1;
    while (existingPosts.some(p => p.slug === finalSlug)) {
      finalSlug = `${slug}-${counter}`;
      counter++;
    }

    // Blog-Post erstellen
    const post = await createBlogPost({
      title,
      slug: finalSlug,
      excerpt: excerpt || null,
      content,
      author: author || 'SEO-Team WebWelle',
      featuredImageUrl: featured_image_url || null,
      metaDescription: meta_description || null,
      tags: tags || [],
      featured: body.featured || false,
      status: status as 'draft' | 'published',
      createdBy: 'n8n-automation',
    });

    // Cache invalidieren
    const redis = getRedisClient();
    if (redis && (await redis.status) === 'ready') {
      await redis.del('admin:blog:all');
      await redis.del('admin:blog:draft');
      await redis.del('admin:blog:published');
      await redis.del('blog:public:list');
      await redis.del(`blog:post:${finalSlug}`);
    }

    return NextResponse.json({
      success: true,
      post: {
        id: post.id,
        title: post.title,
        slug: post.slug,
        status: post.status,
        url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/blog/${post.slug}`,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Fehler bei n8n Blog-Veröffentlichung:', error);
    return NextResponse.json(
      { 
        error: 'Fehler beim Veröffentlichen des Blog-Posts',
        details: error instanceof Error ? error.message : 'Unbekannter Fehler'
      },
      { status: 500 }
    );
  }
}

// GET: API-Info (für n8n-Test)
export async function GET() {
  return NextResponse.json({
    name: 'WebWelle Blog Publish API',
    version: '1.0.0',
    description: 'API für automatische Blog-Veröffentlichung via n8n',
    endpoint: '/api/blog/publish',
    method: 'POST',
    authentication: 'API-Key (Header: x-api-key oder Authorization: Bearer <key>)',
    requiredFields: ['title', 'content'],
    optionalFields: ['excerpt', 'author', 'tags', 'featured_image_url', 'meta_description', 'status', 'featured', 'slug'],
    example: {
      title: 'Mein Blog-Artikel',
      content: '<p>HTML-Content hier...</p>',
      excerpt: 'Kurzbeschreibung',
      author: 'Autor Name',
      tags: ['SEO', 'Marketing'],
      status: 'published',
    },
  });
}

