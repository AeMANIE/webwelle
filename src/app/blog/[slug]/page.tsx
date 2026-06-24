import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, User, ArrowLeft, Tag, Clock } from 'lucide-react';
import { notFound } from 'next/navigation';
import sanitizeHtml from 'sanitize-html';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import ScrollToTop from '../../components/ScrollToTop';
import BlogAudioPlayer from '../../components/BlogAudioPlayer';
import { getBlogPostBySlug } from '@/lib/blog-database';
import { getGitBlogPostBySlug, isGitBlogPostId } from '@/lib/blog-git-posts';
import { getImagesForPost } from '@/lib/blog-jobs-database';
import {
  estimateReadTimeMinutes,
  formatBlogDate,
  normalizeBlogContent,
  normalizePostTags,
  safeToIsoDate,
  BLOG_ARTICLE_PROSE_CLASS,
  BLOG_CONTENT_SANITIZE_OPTIONS,
  BLOG_ZOOM_CONSULTATION_URL,
} from '@/lib/blog-post-display';
import { getRedisClient } from '@/lib/redis';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://webwelle.com';

async function loadPost(slug: string) {
  const redis = getRedisClient();
  let post = null;

  if (redis && (await redis.status) === 'ready') {
    const cached = await redis.get(`blog:post:${slug}`);
    if (cached) post = JSON.parse(cached);
  }

  if (!post) {
    post = await getBlogPostBySlug(slug);
    if (!post) {
      post = getGitBlogPostBySlug(slug);
    }
    if (post && redis && (await redis.status) === 'ready') {
      await redis.setex(`blog:post:${slug}`, 900, JSON.stringify(post));
    }
  }

  return post;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await loadPost(slug);

  if (!post || post.status !== 'published') {
    return { title: 'Artikel nicht gefunden | WebWelle' };
  }

  const images = isGitBlogPostId(post.id)
    ? []
    : await getImagesForPost(post.id).catch(() => []);
  const featured =
    images.find((i) => i.role === 'featured') ||
    (post.featuredImageUrl
      ? {
          url: post.featuredImageUrl,
          alt: post.title,
          width: 1200,
          height: 630,
          role: 'featured' as const,
        }
      : undefined);
  const description = post.metaDescription || post.excerpt || '';
  const canonical = `${BASE_URL}/blog/${slug}`;
  const keywords = normalizePostTags(post.tags).join(', ');

  return {
    title: `${post.title} | WebWelle Blog`,
    description,
    keywords: keywords || undefined,
    authors: [{ name: post.author || 'WebWelle' }],
    creator: 'WebWelle',
    publisher: 'WebWelle',
    alternates: { canonical },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      type: 'article',
      locale: 'de_DE',
      siteName: 'WebWelle',
      title: post.title,
      description,
      url: canonical,
      publishedTime: safeToIsoDate(post.publishedAt || post.createdAt),
      modifiedTime: safeToIsoDate(post.updatedAt || post.publishedAt || post.createdAt),
      tags: normalizePostTags(post.tags),
      images: featured
        ? [{ url: featured.url, width: featured.width, height: featured.height, alt: featured.alt }]
        : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description,
      images: featured ? [featured.url] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let post = null;

  try {
    post = await loadPost(slug);
  } catch {
    post = null;
  }

  if (!post || post.status !== 'published') {
    notFound();
  }

  const images = isGitBlogPostId(post.id)
    ? []
    : await getImagesForPost(post.id).catch(() => []);
  const featured =
    images.find((i) => i.role === 'featured') ||
    (post.featuredImageUrl
      ? {
          url: post.featuredImageUrl,
          alt: post.title,
          width: 1200,
          height: 630,
          role: 'featured' as const,
        }
      : undefined);
  const inlineImages = images.filter((i) => i.role === 'inline');
  const content = normalizeBlogContent(post.content);
  const tags = normalizePostTags(post.tags);
  const publishDate = post.publishedAt || post.createdAt;
  const readTime = estimateReadTimeMinutes(content);
  const canonical = `${BASE_URL}/blog/${slug}`;
  const datePublished = safeToIsoDate(publishDate);
  const dateModified = safeToIsoDate(post.updatedAt || publishDate);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.metaDescription || post.excerpt || '',
    author: { '@type': 'Organization', name: post.author || 'WebWelle' },
    ...(datePublished ? { datePublished } : {}),
    ...(dateModified ? { dateModified } : {}),
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
    image: images.length
      ? images.map((img) => img.url)
      : post.featuredImageUrl
        ? [post.featuredImageUrl]
        : undefined,
  };

  return (
    <div className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Zurück zum Blog
          </Link>

          {post.featured && (
            <div className="flex items-center gap-2 mb-4">
              <Tag className="w-4 h-4 text-primary" />
              <span className="text-primary font-semibold text-sm">Featured Artikel</span>
            </div>
          )}

          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
            {post.title}
          </h1>

          {post.excerpt && (
            <p className="text-xl text-muted-foreground mb-6 leading-relaxed">{post.excerpt}</p>
          )}

          <div className="flex items-center gap-6 text-muted-foreground mb-8">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>{post.author}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{formatBlogDate(publishDate)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{readTime} Min Lesezeit</span>
            </div>
          </div>

          {post.audioUrl && (
            <BlogAudioPlayer
              audioUrl={post.audioUrl}
              title={post.title}
              durationHintMinutes={readTime}
            />
          )}

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag: string, index: number) => (
                <span key={index} className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {featured && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4 mb-8">
          <Image
            src={featured.url}
            alt={featured.alt || post.title}
            width={featured.width || 1200}
            height={featured.height || 630}
            priority
            sizes="(max-width: 768px) 100vw, 896px"
            className="w-full rounded-2xl object-cover shadow-lg"
          />
          {'caption' in featured && featured.caption && (
            <p className="text-sm text-muted-foreground mt-2 text-center">{featured.caption}</p>
          )}
        </div>
      )}

      <article className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className={BLOG_ARTICLE_PROSE_CLASS}
            dangerouslySetInnerHTML={{
              __html: sanitizeHtml(content, BLOG_CONTENT_SANITIZE_OPTIONS),
            }}
          />

          {inlineImages.length > 0 && (
            <div className="mt-10 space-y-8">
              {inlineImages.map((img, idx) => (
                <figure key={idx}>
                  <Image
                    src={img.url}
                    alt={img.alt || post.title}
                    width={img.width || 800}
                    height={img.height || 450}
                    loading="lazy"
                    sizes="(max-width: 768px) 100vw, 896px"
                    className="w-full rounded-xl object-cover"
                  />
                  {img.caption && (
                    <figcaption className="text-sm text-muted-foreground mt-2 text-center">
                      {img.caption}
                    </figcaption>
                  )}
                </figure>
              ))}
            </div>
          )}
        </div>
      </article>

      <section className="py-12 bg-card">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-background rounded-2xl p-8 border border-border">
            <h3 className="text-2xl font-bold text-foreground mb-4">Über den Autor</h3>
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-xl">
                W
              </div>
              <div>
                <h4 className="text-lg font-semibold text-foreground mb-2">{post.author}</h4>
                <p className="text-muted-foreground mb-4">
                  Unser erfahrenes SEO-Team aus Kempten hilft Unternehmen im Allgäu dabei, online
                  sichtbarer zu werden. Mit über 5 Jahren Erfahrung in lokaler SEO und Webdesign
                  kennen wir die Besonderheiten unserer Region.
                </p>
                <div className="flex gap-4">
                  <a
                    href={BLOG_ZOOM_CONSULTATION_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 font-medium"
                  >
                    Kontakt aufnehmen
                  </a>
                  <Link href="/#produkte" className="text-primary hover:text-primary/80 font-medium">
                    Webdesign-Pakete
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-primary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-primary-foreground mb-4">
            Bereit für Ihre eigene Erfolgsstory?
          </h2>
          <p className="text-xl text-primary-foreground/90 mb-8">
            Lassen Sie uns gemeinsam Ihre Website zu einer der erfolgreichsten im Allgäu machen.
          </p>
          <a
            href={BLOG_ZOOM_CONSULTATION_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-primary-foreground text-primary px-8 py-3 rounded-lg font-semibold hover:bg-primary-foreground/90 transition-colors inline-block"
          >
            Kostenloses Erstgespräch vereinbaren
          </a>
        </div>
      </section>
      <Footer />
      <ScrollToTop />
    </div>
  );
}
