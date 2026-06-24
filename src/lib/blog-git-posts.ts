import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import type { BlogPost } from './blog-database';

interface GitBlogMeta {
  slug: string;
  htmlFile: string;
  title: string;
  excerpt: string;
  metaDescription: string;
  featuredImageUrl: string;
  audioUrl?: string;
  author: string;
  tags: string[];
  featured: boolean;
  publishedAt: string;
}

const CONTENT_DIR = join(process.cwd(), 'src/content/blog');
const MANIFEST_PATH = join(CONTENT_DIR, 'posts.json');

function loadManifest(): GitBlogMeta[] {
  if (!existsSync(MANIFEST_PATH)) return [];
  try {
    const raw = readFileSync(MANIFEST_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as GitBlogMeta[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function toBlogPost(meta: GitBlogMeta): BlogPost | null {
  const htmlPath = join(CONTENT_DIR, meta.htmlFile);
  if (!existsSync(htmlPath)) return null;

  const content = readFileSync(htmlPath, 'utf-8').trim();
  if (!content) return null;

  const publishedAt = new Date(meta.publishedAt);
  const safeDate = Number.isNaN(publishedAt.getTime()) ? new Date() : publishedAt;

  return {
    id: `git-${meta.slug}`,
    title: meta.title,
    slug: meta.slug,
    excerpt: meta.excerpt,
    content,
    author: meta.author,
    featuredImageUrl: meta.featuredImageUrl,
    audioUrl: meta.audioUrl,
    metaDescription: meta.metaDescription,
    tags: meta.tags,
    featured: meta.featured,
    status: 'published',
    publishedAt: safeDate,
    createdAt: safeDate,
    updatedAt: safeDate,
    createdBy: 'git-content',
  };
}

export function getGitBlogPosts(): BlogPost[] {
  return loadManifest()
    .map(toBlogPost)
    .filter((p): p is BlogPost => p !== null);
}

export function getGitBlogPostBySlug(slug: string): BlogPost | null {
  const meta = loadManifest().find((p) => p.slug === slug);
  if (!meta) return null;
  return toBlogPost(meta);
}

/** Audio from git manifest (e.g. after cache hit without audioUrl). */
export function getGitBlogAudioUrl(slug: string): string | undefined {
  return loadManifest().find((p) => p.slug === slug)?.audioUrl;
}

/** DB posts win when slug collides. */
export function mergeBlogPostsWithGit<T extends { slug: string }>(dbPosts: T[]): (T | BlogPost)[] {
  const dbSlugs = new Set(dbPosts.map((p) => p.slug));
  const gitOnly = getGitBlogPosts().filter((p) => !dbSlugs.has(p.slug));
  return [...dbPosts, ...gitOnly];
}

export function isGitBlogPostId(id: string): boolean {
  return id.startsWith('git-');
}
