import { Metadata } from 'next';
import Link from 'next/link';
import { Calendar, User, ArrowLeft, Tag, Clock } from 'lucide-react';
import { notFound } from 'next/navigation';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import ScrollToTop from '../../components/ScrollToTop';
import { getBlogPostBySlug } from '@/lib/blog-database';
import { getRedisClient } from '@/lib/redis';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const redis = getRedisClient();
  let post;
  
  if (redis && (await redis.status) === 'ready') {
    const cached = await redis.get(`blog:post:${slug}`);
    if (cached) {
      post = JSON.parse(cached);
    }
  }
  
  if (!post) {
    post = await getBlogPostBySlug(slug);
    if (post && redis && (await redis.status) === 'ready') {
      await redis.setex(`blog:post:${slug}`, 900, JSON.stringify(post));
    }
  }
  
  if (!post || post.status !== 'published') {
    return {
      title: 'Artikel nicht gefunden | WebWelle',
    };
  }

  return {
    title: `${post.title} | WebWelle Blog`,
    description: post.metaDescription || post.excerpt || '',
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  type PostType = { status?: string; title: string; excerpt?: string | null; author: string; publishedAt?: Date; createdAt: Date; content: string; tags?: string[]; featured?: boolean } | null;
  let post: PostType = null;
  try {
    const redis = getRedisClient();
    try {
      if (redis && (await redis.status) === 'ready') {
        const cached = await redis.get(`blog:post:${slug}`);
        if (cached) post = JSON.parse(cached);
      }
    } catch {}

    if (!post) {
      try {
        post = await getBlogPostBySlug(slug);
      } catch {
        post = null;
      }
      try {
        const redis2 = getRedisClient();
        if (post && redis2 && (await redis2.status) === 'ready') {
          await redis2.setex(`blog:post:${slug}`, 900, JSON.stringify(post));
        }
      } catch {}
    }
  } catch {
    post = null;
  }

  if (!post || post.status !== 'published') {
    notFound();
  }

  const publishDate = post.publishedAt || post.createdAt;
  const readTime = Math.ceil(post.content.split(' ').length / 200); // ~200 Wörter pro Minute

  return (
    <div className="min-h-screen bg-background">
      <Header />
      {/* Page Header */}
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
            <p className="text-xl text-muted-foreground mb-6 leading-relaxed">
              {post.excerpt}
            </p>
          )}
          
          <div className="flex items-center gap-6 text-muted-foreground mb-8">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>{post.author}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{new Date(publishDate).toLocaleDateString('de-DE')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{readTime} Min Lesezeit</span>
            </div>
          </div>
          
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag: string, index: number) => (
                <span key={index} className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <article className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div 
            className="prose prose-lg max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-a:text-primary prose-a:no-underline hover:prose-a:underline"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </div>
      </article>

      {/* Author Bio */}
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
                  Unser erfahrenes SEO-Team aus Kempten hilft Unternehmen im Allgäu dabei, 
                  online sichtbarer zu werden. Mit über 5 Jahren Erfahrung in lokaler SEO 
                  und Webdesign kennen wir die Besonderheiten unserer Region.
                </p>
                <div className="flex gap-4">
                  <Link 
                    href="/#cta"
                    className="text-primary hover:text-primary/80 font-medium"
                  >
                    Kontakt aufnehmen
                  </Link>
                  <Link 
                    href="/#produkte"
                    className="text-primary hover:text-primary/80 font-medium"
                  >
                    Webdesign-Pakete
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-primary to-primary/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-primary-foreground mb-4">
            Bereit für Ihre eigene Erfolgsstory?
          </h2>
          <p className="text-xl text-primary-foreground/90 mb-8">
            Lassen Sie uns gemeinsam Ihre Website zu einer der erfolgreichsten im Allgäu machen.
          </p>
          <Link 
            href="/#cta"
            className="bg-primary-foreground text-primary px-8 py-3 rounded-lg font-semibold hover:bg-primary-foreground/90 transition-colors inline-block"
          >
            Kostenloses Erstgespräch vereinbaren
          </Link>
        </div>
      </section>
      <Footer />
      <ScrollToTop />
    </div>
  );
}

