import { Metadata } from 'next';
import Link from 'next/link';
import { Calendar, User, ArrowRight, Tag } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ScrollToTop from '../components/ScrollToTop';
import { getAllBlogPosts } from '@/lib/blog-database';
import { mergeBlogPostsWithGit } from '@/lib/blog-git-posts';
import { getRedisClient } from '@/lib/redis';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Blog & Insights | WebWelle – Webdesign Kempten (Allgäu)",
  description: "Lokale SEO-Artikel und Webdesign-Insights aus Kempten. Tipps für digitale Sichtbarkeit im Allgäu und Bayern.",
  keywords: "Webdesign Blog Kempten, SEO Tipps Allgäu, Digitale Sichtbarkeit Bayern, Webdesign Trends",
};

async function getBlogPosts() {
  try {
    const redis = getRedisClient();
    type PostType = { featured: boolean; id?: string; slug?: string; title: string; excerpt?: string | null; author: string; publishedAt?: Date; createdAt: Date; tags?: string[] };
    let posts: PostType[] | undefined;

    try {
      if (redis && (await redis.status) === 'ready') {
        const cached = await redis.get('blog:public:list');
        if (cached) {
          posts = JSON.parse(cached);
        }
      }
    } catch {
      // Redis optional – bei Fehler einfach ohne Cache weiter
    }

    if (!posts) {
      try {
        // Nur veröffentlichte Posts (+ Git-Artikel aus src/content/blog)
        posts = mergeBlogPostsWithGit(await getAllBlogPosts('published'));
      } catch {
        // DB nicht erreichbar → nur Git-Artikel
        posts = mergeBlogPostsWithGit([]);
      }

      // Cache speichern (15 Minuten), Fehler ignorieren
      try {
        const redis2 = getRedisClient();
        if (redis2 && (await redis2.status) === 'ready') {
          await redis2.setex('blog:public:list', 900, JSON.stringify(posts));
        }
      } catch {}
    }

    return posts;
  } catch {
    return [];
  }
}

// Fallback zu hardcoded Posts, falls DB leer
const fallbackBlogPosts = [
  {
    id: 1,
    title: "Top 5 Unternehmenswebsites im Allgäu – Was macht sie erfolgreich?",
    excerpt: "Eine Analyse der besten Unternehmenswebsites in Kempten und dem Allgäu. Welche Design- und SEO-Strategien führen zu mehr Sichtbarkeit und Kunden?",
    content: "In diesem Artikel analysieren wir die erfolgreichsten Unternehmenswebsites in unserer Region. Von lokalen Handwerksbetrieben bis hin zu innovativen Start-ups – wir zeigen Ihnen, welche Elemente eine Website zum Erfolg führen...",
    author: "SEO-Team WebWelle",
    date: "2025-01-15",
    readTime: "8 Min",
    tags: ["Lokales SEO", "Webdesign", "Allgäu", "Unternehmenswebsites"],
    featured: true
  },
  {
    id: 2,
    title: "Wie Allgäuer Firmen 2025 online sichtbarer werden",
    excerpt: "Praktische Tipps für lokale Unternehmen: Von Google My Business bis hin zu lokalen Keywords – so steigern Sie Ihre Online-Sichtbarkeit in Kempten und Umgebung.",
    content: "Die digitale Landschaft verändert sich rasant. Für Unternehmen im Allgäu bedeutet das neue Chancen, aber auch neue Herausforderungen. In diesem Guide zeigen wir Ihnen, wie Sie 2025 online sichtbarer werden...",
    author: "SEO-Team WebWelle",
    date: "2025-01-10",
    readTime: "12 Min",
    tags: ["Lokales SEO", "Google My Business", "Online Marketing", "Kempten"],
    featured: true
  },
  {
    id: 3,
    title: "Webdesign-Trends 2025: Was Unternehmen im Allgäu wissen müssen",
    excerpt: "Von KI-Integration bis hin zu Performance-Optimierung – die wichtigsten Webdesign-Trends für 2025 und wie sie Ihrem Unternehmen helfen können.",
    content: "Das Jahr 2025 bringt spannende Entwicklungen im Webdesign mit sich. Besonders für Unternehmen in unserer Region ergeben sich neue Möglichkeiten, sich online von der Konkurrenz abzuheben...",
    author: "SEO-Team WebWelle",
    date: "2025-01-05",
    readTime: "10 Min",
    tags: ["Webdesign Trends", "KI", "Performance", "2025"],
    featured: false
  },
  {
    id: 4,
    title: "SEO für Handwerksbetriebe: So werden Sie in Kempten gefunden",
    excerpt: "Spezielle SEO-Strategien für Handwerker und Dienstleister im Allgäu. Von lokalen Keywords bis hin zu Google My Business Optimierung.",
    content: "Handwerksbetriebe haben besondere Anforderungen an ihre Online-Präsenz. In diesem Artikel zeigen wir Ihnen, wie Sie als Handwerker in Kempten und dem Allgäu online gefunden werden...",
    author: "SEO-Team WebWelle",
    date: "2024-12-28",
    readTime: "15 Min",
    tags: ["Handwerk", "Lokales SEO", "Google My Business", "Kempten"],
    featured: false
  },
  {
    id: 5,
    title: "E-Commerce im Allgäu: Online-Shops erfolgreich aufbauen",
    excerpt: "Tipps für den Aufbau eines erfolgreichen Online-Shops in der Region. Von der technischen Umsetzung bis hin zum lokalen Marketing.",
    content: "Der Online-Handel wächst auch in ländlichen Regionen wie dem Allgäu. Wir zeigen Ihnen, wie Sie einen erfolgreichen Online-Shop aufbauen und dabei die Besonderheiten unserer Region nutzen...",
    author: "SEO-Team WebWelle",
    date: "2024-12-20",
    readTime: "18 Min",
    tags: ["E-Commerce", "Online-Shop", "Allgäu", "Marketing"],
    featured: false
  },
  {
    id: 6,
    slug: "pageinsight",
    title: "Warum ein PageSpeed Insights Score über 90 für Unternehmen in Kempten und dem Allgäu unverzichtbar ist",
    excerpt: "Warum ein Score + 90 heute Standard ist: bessere Sichtbarkeit, mehr Vertrauen, höhere Conversion – besonders für lokale Unternehmen in Kempten & Allgäu.",
    content: "Ein praxisnaher Leitfaden zu PageSpeed, Core Web Vitals, Helpful Content und Local SEO – mit konkreten Vorteilen für Unternehmen in Kempten und dem Allgäu.",
    author: "SEO-Team WebWelle",
    date: "2025-01-29",
    readTime: "15 Min",
    tags: ["PageSpeed", "Performance", "Core Web Vitals", "Allgäu", "Kempten"],
    featured: true
  }
];

export default async function BlogPage() {
  const posts = await getBlogPosts();
  type PostType = { featured: boolean; id?: string | number; slug?: string; title: string; excerpt?: string | null; author?: string; publishedAt?: Date | string; createdAt?: Date | string; tags?: string[] };
  const featuredPosts = posts.filter((post: PostType) => post.featured);
  const regularPosts = posts.filter((post: PostType) => !post.featured);
  
  // Fallback zu hardcoded Posts, falls DB leer
  const displayFeatured: PostType[] = posts.length > 0 ? featuredPosts : fallbackBlogPosts.filter(post => post.featured);
  const displayRegular: PostType[] = posts.length > 0 ? regularPosts : fallbackBlogPosts.filter(post => !post.featured);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      {/* Page Header */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Blog & Insights
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Lokale SEO-Artikel und Webdesign-Insights aus Kempten. 
              Tipps für digitale Sichtbarkeit im Allgäu und Bayern.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <span className="bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-medium">
                Webdesign Kempten
              </span>
              <span className="bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-medium">
                Lokales SEO
              </span>
              <span className="bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-medium">
                Allgäu
              </span>
              <span className="bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-medium">
                Bayern
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Posts */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-foreground mb-8 text-center">
            Featured Artikel
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {displayFeatured.map((post) => (
              <Link
                key={post.id || (post as unknown as { id: number }).id}
                href={`/blog/${post.slug || (post.id || (post as unknown as { id: number }).id)}`}
                className="block bg-card rounded-2xl p-8 shadow-lg border border-border hover:shadow-xl transition-shadow focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Tag className="w-4 h-4 text-primary" />
                  <span className="text-primary font-semibold text-sm">Featured</span>
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4 leading-tight">
                  {post.title}
                </h3>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  {post.excerpt || ''}
                </p>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      <span>{post.author}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{(() => {
                        const d = (post.publishedAt ?? post.createdAt) as unknown as string | number | Date | undefined;
                        if (d) return new Date(d as string | number | Date).toLocaleDateString('de-DE');
                        const legacy = (post as unknown as { date?: string }).date;
                        return legacy ? new Date(legacy as string).toLocaleDateString('de-DE') : 'N/A';
                      })()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-2">
                    {(post.tags || []).map((tag, index) => (
                      <span key={index} className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <span className="inline-flex items-center gap-2 text-primary font-semibold">
                    Artikel lesen
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Regular Posts */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-foreground mb-8 text-center">
            Weitere Artikel
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayRegular.map((post) => (
              <Link
                key={post.id || (post as unknown as { id: number }).id}
                href={`/blog/${post.slug || (post.id || (post as unknown as { id: number }).id)}`}
                className="block bg-card rounded-xl p-6 shadow-md border border-border hover:shadow-lg transition-shadow focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <h3 className="text-xl font-bold text-foreground mb-3 leading-tight">
                  {post.title}
                </h3>
                <p className="text-muted-foreground mb-4 leading-relaxed text-sm">
                  {post.excerpt || ''}
                </p>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      <span>{post.author}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{(() => {
                        const d = (post.publishedAt ?? post.createdAt) as unknown as string | number | Date | undefined;
                        if (d) return new Date(d as string | number | Date).toLocaleDateString('de-DE');
                        const legacy = (post as unknown as { date?: string }).date;
                        return legacy ? new Date(legacy as string).toLocaleDateString('de-DE') : 'N/A';
                      })()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {(post.tags || []).slice(0, 2).map((tag, index) => (
                      <span key={index} className="bg-primary/10 text-primary px-2 py-1 rounded text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <span className="inline-flex items-center gap-1 text-primary font-medium text-sm">
                    Lesen
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-primary-foreground mb-4">
            Brauchen Sie Hilfe bei Ihrer Online-Sichtbarkeit?
          </h2>
          <p className="text-xl text-primary-foreground/90 mb-8">
            Unser SEO-Team aus Kempten hilft Ihnen dabei, online gefunden zu werden.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/#cta"
              className="bg-primary-foreground text-primary px-8 py-3 rounded-lg font-semibold hover:bg-primary-foreground/90 transition-colors"
            >
              Kostenloses Erstgespräch
            </Link>
            <Link 
              href="/#produkte"
              className="border-2 border-primary-foreground text-primary-foreground px-8 py-3 rounded-lg font-semibold hover:bg-primary-foreground/10 transition-colors"
            >
              Webdesign-Pakete
            </Link>
          </div>
        </div>
      </section>
      <Footer />
      <ScrollToTop />
    </div>
  );
}
