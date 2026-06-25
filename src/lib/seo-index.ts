import type { Metadata } from 'next';
import type { MetadataRoute } from 'next';
import { getFeaturedPublicBlogPosts } from '@/lib/blog-post-display';

export const BASE_URL = 'https://webwelle.com';

export const ROBOTS_INDEX: NonNullable<Metadata['robots']> = {
  index: true,
  follow: true,
  googleBot: {
    index: true,
    follow: true,
    'max-video-preview': -1,
    'max-image-preview': 'large',
    'max-snippet': -1,
  },
};

export const ROBOTS_NOINDEX: NonNullable<Metadata['robots']> = {
  index: false,
  follow: false,
  googleBot: {
    index: false,
    follow: false,
  },
};

export const INDEXED_STATIC_ROUTES: Array<{
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
}> = [
  { path: '', priority: 1.0, changeFrequency: 'weekly' },
  { path: '/leistungen', priority: 1.0, changeFrequency: 'monthly' },
  { path: '/app-entwicklung', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/blog', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/mehrwertsteuer', priority: 0.8, changeFrequency: 'monthly' },
];

const ROBOTS_DISALLOW_PREFIXES = [
  '/admin/',
  '/api/',
  '/customer/',
  '/_next/',
  '/success',
  '/verify-email',
  '/reset-password',
  '/forgot-password',
  '/canva/',
  '/canvamausinteraktiv/',
  '/ai-voice',
  '/buchung/',
  '/funnel',
  '/funnel-dw/',
  '/register',
  '/impressum',
  '/datenschutz',
  '/agb',
  '/widerruf',
  '/analyse/',
  '/blog/pageinsight',
];

export async function getIndexedBlogSlugs(): Promise<
  Array<{ slug: string; publishedAt?: Date; createdAt: Date }>
> {
  const posts = await getFeaturedPublicBlogPosts();
  return posts.map((post) => ({
    slug: post.slug,
    publishedAt: post.publishedAt,
    createdAt: post.createdAt,
  }));
}

export async function buildSitemapEntries(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticEntries: MetadataRoute.Sitemap = INDEXED_STATIC_ROUTES.map((route) => ({
    url: route.path ? `${BASE_URL}${route.path}` : BASE_URL,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  const blogPosts = await getIndexedBlogSlugs();
  const blogEntries: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: post.publishedAt || post.createdAt || now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [...staticEntries, ...blogEntries];
}

export async function buildRobotsRules(): Promise<MetadataRoute.Robots> {
  const blogPosts = await getIndexedBlogSlugs();
  const allow = [
    '/$',
    '/leistungen$',
    '/app-entwicklung$',
    '/blog$',
    '/mehrwertsteuer$',
    ...blogPosts.map((post) => `/blog/${post.slug}$`),
  ];

  return {
    rules: {
      userAgent: '*',
      allow,
      disallow: ['/', ...ROBOTS_DISALLOW_PREFIXES],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
