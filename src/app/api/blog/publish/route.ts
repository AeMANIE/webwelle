import { NextRequest, NextResponse } from 'next/server';
import { createBlogPost, generateSlug } from '@/lib/blog-database';
import { getRedisClient } from '@/lib/redis';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

/**
 * n8n-API für automatische Blog-Veröffentlichung
 * 
 * Authentifizierung: API-Key (N8N_API_KEY in .env)
 * 
 * Request Body (JSON):
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
 * 
 * ODER FormData (für Bild-Upload):
 * - title, content, excerpt, author, tags (JSON-String), meta_description, status
 * - featured_image: File (optional)
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

    // Unterstützung für JSON und FormData
    let body: Record<string, unknown>;
    let featuredImageUrl: string | null = null;
    
    const contentType = request.headers.get('content-type') || '';
    
    if (contentType.includes('multipart/form-data')) {
      // FormData-Verarbeitung (für Bild-Upload)
      const formData = await request.formData();
      
      // Text-Felder
      body = {
        title: formData.get('title') as string,
        content: formData.get('content') as string,
        excerpt: formData.get('excerpt') as string || null,
        author: formData.get('author') as string || null,
        tags: formData.get('tags') ? JSON.parse(formData.get('tags') as string) : [],
        meta_description: formData.get('meta_description') as string || null,
        status: formData.get('status') as string || 'published',
        featured: formData.get('featured') === 'true',
        slug: formData.get('slug') as string || null,
      };
      
      // Bild-Upload verarbeiten
      const featuredImage = formData.get('featured_image') as File | null;
      if (featuredImage && featuredImage.size > 0) {
        // Validierung
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowedTypes.includes(featuredImage.type)) {
          return NextResponse.json(
            { error: 'Nur Bilder (JPEG, PNG, WebP, GIF) sind erlaubt' },
            { status: 400 }
          );
        }
        
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (featuredImage.size > maxSize) {
          return NextResponse.json(
            { error: 'Datei ist zu groß (max. 5MB)' },
            { status: 400 }
          );
        }
        
        // Bild speichern
        const timestamp = Date.now();
        const sanitizedName = featuredImage.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileName = `${timestamp}-${sanitizedName}`;
        
        const uploadDir = join(process.cwd(), 'public', 'blog-images');
        if (!existsSync(uploadDir)) {
          await mkdir(uploadDir, { recursive: true });
        }
        
        const bytes = await featuredImage.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const filePath = join(uploadDir, fileName);
        
        await writeFile(filePath, buffer);
        
        // URL generieren - verwende API-Route für Bilder (funktioniert auch im standalone mode)
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        featuredImageUrl = `${baseUrl}/blog-images/${fileName}`;
      } else {
        // Falls URL übergeben wurde
        featuredImageUrl = (formData.get('featured_image_url') as string) || null;
      }
    } else {
      // JSON-Verarbeitung
      body = await request.json();
      featuredImageUrl = (body.featured_image_url as string) || null;
    }
    
    const title = body.title as string;
    const content = body.content as string;
    const excerpt = body.excerpt as string | null;
    const author = body.author as string | null;
    const tags = body.tags as string[] | null;
    const meta_description = body.meta_description as string | null;
    const status = (body.status as string) || 'published';

    // Validierung
    if (!title || !content) {
      return NextResponse.json(
        { error: 'Titel und Inhalt sind erforderlich' },
        { status: 400 }
      );
    }

    // Slug generieren (falls nicht vorhanden)
    const slug = (body.slug as string) || generateSlug(title);

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
      excerpt: excerpt || undefined,
      content,
      author: author || 'SEO-Team WebWelle',
      featuredImageUrl: featuredImageUrl || undefined,
      metaDescription: meta_description || undefined,
      tags: tags || [],
      featured: (body.featured as boolean) || false,
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
    optionalFields: ['excerpt', 'author', 'tags', 'featured_image_url', 'featured_image', 'meta_description', 'status', 'featured', 'slug'],
    imageUpload: 'Unterstützt sowohl featured_image_url (URL) als auch featured_image (File-Upload via FormData)',
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

