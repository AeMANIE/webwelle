import { NextRequest, NextResponse } from 'next/server';
import { createBlogPost, generateSlug } from '@/lib/blog-database';
import { getRedisClient } from '@/lib/redis';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { assertSystemAOnly, BlogSystemGuardError, stripUncontrolledImages } from '@/lib/blog-guards';
import { BLOG_PROMPT_VERSION } from '@/lib/blog-constants';
import { revalidateBlogPaths } from '@/lib/blog-revalidation';
import {
  recordWebwellePublishDelivery,
  savePostImages,
  type BlogImageInput,
} from '@/lib/blog-jobs-database';

function parseImages(raw: unknown): BlogImageInput[] {
  if (!Array.isArray(raw)) return [];
  const out: BlogImageInput[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const o = item as Record<string, unknown>;
    const url = String(o.url || '').trim();
    if (!url) continue;
    out.push({
      role: String(o.role || 'featured') as BlogImageInput['role'],
      url,
      alt: o.alt != null ? String(o.alt) : undefined,
      caption: o.caption != null ? String(o.caption) : undefined,
      width: o.width != null ? Number(o.width) : undefined,
      height: o.height != null ? Number(o.height) : undefined,
      mimeType:
        o.mime_type != null
          ? String(o.mime_type)
          : o.mimeType != null
            ? String(o.mimeType)
            : undefined,
      storagePath: o.storage_path != null ? String(o.storage_path) : undefined,
      position: o.position != null ? Number(o.position) : undefined,
    });
  }
  return out;
}

export async function POST(request: NextRequest) {
  try {
    const apiKey =
      request.headers.get('x-api-key') ||
      request.headers.get('authorization')?.replace('Bearer ', '');
    const expectedApiKey = process.env.N8N_API_KEY;

    if (!expectedApiKey) {
      return NextResponse.json({ error: 'API-Key-Konfiguration fehlt' }, { status: 500 });
    }
    if (!apiKey || apiKey !== expectedApiKey) {
      return NextResponse.json({ error: 'Ungültiger API-Key' }, { status: 401 });
    }

    let body: Record<string, unknown>;
    let featuredImageUrl: string | null = null;

    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      body = {
        title: formData.get('title') as string,
        content: formData.get('content') as string,
        excerpt: formData.get('excerpt') as string || null,
        author: formData.get('author') as string || null,
        tags: formData.get('tags') ? JSON.parse(formData.get('tags') as string) : [],
        meta_description: formData.get('meta_description') as string || null,
        status: formData.get('status') as string || 'draft',
        featured: formData.get('featured') === 'true',
        slug: formData.get('slug') as string || null,
        source_type: formData.get('source_type') as string || 'webwelle',
        jobId: formData.get('jobId') as string || null,
        prompt_version: formData.get('prompt_version') as string || null,
      };
      const featuredImage = formData.get('featured_image') as File | null;
      if (featuredImage && featuredImage.size > 0) {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowedTypes.includes(featuredImage.type)) {
          return NextResponse.json({ error: 'Nur Bilder erlaubt' }, { status: 400 });
        }
        const timestamp = Date.now();
        const fileName = `${timestamp}-${featuredImage.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const uploadDir = join(process.cwd(), 'public', 'blog-images');
        if (!existsSync(uploadDir)) await mkdir(uploadDir, { recursive: true });
        await writeFile(join(uploadDir, fileName), Buffer.from(await featuredImage.arrayBuffer()));
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        featuredImageUrl = `${baseUrl}/blog-images/${fileName}`;
      } else {
        featuredImageUrl = (formData.get('featured_image_url') as string) || null;
      }
    } else {
      body = await request.json();
      featuredImageUrl = (body.featured_image_url as string) || null;
    }

    try {
      assertSystemAOnly(body);
    } catch (e) {
      if (e instanceof BlogSystemGuardError) {
        return NextResponse.json({ error: e.message }, { status: 403 });
      }
      throw e;
    }

    const title = body.title as string;
    const rawContent = body.content as string;
    const content = stripUncontrolledImages(rawContent);
    const excerpt = body.excerpt as string | null;
    const author = body.author as string | null;
    const tags = body.tags as string[] | null;
    const meta_description = body.meta_description as string | null;
    const status = (body.status as string) || 'draft';
    const images = parseImages(body.images);
    const promptVersion = String(body.prompt_version || body.promptVersion || BLOG_PROMPT_VERSION);
    const sourceJobId = body.jobId != null ? Number(body.jobId) : undefined;
    const articleIndex =
      body.articleIndex != null
        ? Number(body.articleIndex)
        : body.article_index != null
          ? Number(body.article_index)
          : 0;
    const keyword = String(body.keyword || title || '').trim();

    if (!title || !content) {
      return NextResponse.json({ error: 'Titel und Inhalt sind erforderlich' }, { status: 400 });
    }

    if (status === 'published' && !featuredImageUrl && !images.some((i) => i.role === 'featured')) {
      return NextResponse.json(
        { error: 'Featured Image ist für veröffentlichte Artikel erforderlich.' },
        { status: 400 }
      );
    }

    const slug = (body.slug as string) || generateSlug(title);
    const { getAllBlogPosts } = await import('@/lib/blog-database');
    const existingPosts = await getAllBlogPosts();
    let finalSlug = slug;
    let counter = 1;
    while (existingPosts.some((p) => p.slug === finalSlug)) {
      finalSlug = `${slug}-${counter}`;
      counter++;
    }

    const featuredFromImages = images.find((i) => i.role === 'featured');
    const post = await createBlogPost({
      title,
      slug: finalSlug,
      excerpt: excerpt || undefined,
      content,
      author: author || 'SEO-Team WebWelle',
      featuredImageUrl: featuredImageUrl || featuredFromImages?.url || undefined,
      metaDescription: meta_description || undefined,
      tags: tags || [],
      featured: (body.featured as boolean) || false,
      status: status as 'draft' | 'published',
      createdBy: 'n8n-automation',
      promptVersion,
      sourceJobId,
      guardPayload: body,
    });

    if (images.length) {
      await savePostImages(post.id, images);
    } else if (featuredImageUrl) {
      await savePostImages(post.id, [
        { role: 'featured', url: featuredImageUrl, alt: title, width: 1200, height: 630 },
      ]);
    }

    const redis = getRedisClient();
    if (redis && (await redis.status) === 'ready') {
      await redis.del('admin:blog:all');
      await redis.del('admin:blog:draft');
      await redis.del('admin:blog:published');
      await redis.del('blog:public:list');
      await redis.del(`blog:post:${finalSlug}`);
    }

    revalidateBlogPaths(finalSlug);

    let jobTracking: { articleId?: number; jobFinished?: boolean } | undefined;
    if (sourceJobId && !Number.isNaN(sourceJobId) && sourceJobId > 0) {
      const wordCount =
        body.wordCount != null
          ? Number(body.wordCount)
          : body.word_count != null
            ? Number(body.word_count)
            : content.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
      const qaStatus = String(body.qa_status || body.qaStatus || 'passed');
      const delivery = await recordWebwellePublishDelivery({
        jobId: sourceJobId,
        articleIndex: Number.isNaN(articleIndex) ? 0 : articleIndex,
        keyword: keyword || title,
        title,
        metaDesc: meta_description,
        htmlContent: content,
        wordCount,
        promptVersion,
        qaStatus,
      });
      jobTracking = { articleId: delivery.article.id, jobFinished: delivery.jobFinished };
    }

    return NextResponse.json(
      {
        success: true,
        post: {
          id: post.id,
          title: post.title,
          slug: post.slug,
          status: post.status,
          url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/blog/${post.slug}`,
        },
        jobTracking,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Fehler bei n8n Blog-Veröffentlichung:', error);
    return NextResponse.json(
      {
        error: 'Fehler beim Veröffentlichen des Blog-Posts',
        details: error instanceof Error ? error.message : 'Unbekannter Fehler',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    name: 'WebWelle Blog Publish API',
    version: '2.0.0',
    endpoint: '/api/blog/publish',
    authentication: 'API-Key',
    system: 'A-only (webwelle.com/blog)',
    defaultStatus: 'draft',
  });
}
