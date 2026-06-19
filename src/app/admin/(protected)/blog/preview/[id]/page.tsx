import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import sanitizeHtml from 'sanitize-html';
import { Calendar, User, ArrowLeft, Clock, Eye } from 'lucide-react';
import { getBlogPostById } from '@/lib/blog-database';
import { getImagesForPost } from '@/lib/blog-jobs-database';

export const dynamic = 'force-dynamic';

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat(['h1', 'h2']),
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    a: ['href', 'title', 'target', 'rel'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
};

export default async function AdminBlogPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await getBlogPostById(id);

  if (!post) {
    notFound();
  }

  const images = await getImagesForPost(post.id);
  const featured = images.find((i) => i.role === 'featured') || (post.featuredImageUrl
    ? { url: post.featuredImageUrl, alt: post.title, width: 1200, height: 630, role: 'featured' as const }
    : undefined);
  const publishDate = post.publishedAt || post.createdAt;
  const readTime = Math.ceil(post.content.split(/\s+/).filter(Boolean).length / 200);
  const isDraft = post.status !== 'published';

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-50 border-b border-border bg-amber-500/10 px-4 py-3">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Eye className="h-4 w-4" />
            {isDraft ? 'Admin-Vorschau (Entwurf — nicht öffentlich)' : 'Admin-Vorschau (veröffentlicht)'}
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin?tab=blog"
              className="text-sm text-primary hover:underline"
            >
              ← Blog-Editor
            </Link>
            {post.status === 'published' && (
              <Link
                href={`/blog/${post.slug}`}
                target="_blank"
                className="text-sm text-primary hover:underline"
              >
                Live-Ansicht
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-primary/10 to-primary/5 py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h1 className="mb-6 text-4xl font-bold leading-tight text-foreground md:text-5xl">
            {post.title}
          </h1>
          {post.excerpt && (
            <p className="mb-6 text-xl leading-relaxed text-muted-foreground">{post.excerpt}</p>
          )}
          <div className="mb-8 flex flex-wrap items-center gap-6 text-muted-foreground">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>{post.author}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{new Date(publishDate).toLocaleDateString('de-DE')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{readTime} Min Lesezeit</span>
            </div>
            <span className="rounded bg-muted px-2 py-0.5 font-mono text-xs">/{post.slug}</span>
          </div>
        </div>
      </div>

      {featured && (
        <div className="mx-auto -mt-4 mb-8 max-w-4xl px-4 sm:px-6 lg:px-8">
          <Image
            src={featured.url}
            alt={featured.alt || post.title}
            width={featured.width || 1200}
            height={featured.height || 630}
            priority
            sizes="(max-width: 768px) 100vw, 896px"
            className="w-full rounded-2xl object-cover shadow-lg"
          />
        </div>
      )}

      <article className="py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div
            className="prose prose-lg max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-a:text-primary"
            dangerouslySetInnerHTML={{
              __html: sanitizeHtml(post.content, SANITIZE_OPTIONS),
            }}
          />
        </div>
      </article>

      <div className="border-t border-border py-8 text-center">
        <Link
          href="/admin?tab=blog"
          className="inline-flex items-center gap-2 text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Zurück zum Blog-Editor
        </Link>
      </div>
    </div>
  );
}
