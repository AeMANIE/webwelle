import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth, secureResponse } from '@/lib/api-security';
import { getBlogPostById, updateBlogPost } from '@/lib/blog-database';
import {
  countWordsFromHtml,
  isBlogStubContent,
  normalizeHtmlForQuill,
} from '@/lib/blog-html-for-editor';
import { getPipelineHtmlForJob } from '@/lib/blog-jobs-database';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminAuth(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await context.params;
  const post = await getBlogPostById(id);
  if (!post) {
    return secureResponse({ error: 'Blog-Post nicht gefunden' }, 404);
  }

  if (!post.sourceJobId) {
    return secureResponse(
      { error: 'Kein SEO-Job verknüpft — Import nur für Pipeline-Artikel möglich.' },
      400
    );
  }

  const pipelineHtml = await getPipelineHtmlForJob(post.sourceJobId);
  if (!pipelineHtml?.trim()) {
    return secureResponse(
      { error: 'Kein Pipeline-HTML in blog_articles für diesen Job gefunden.' },
      404
    );
  }

  const normalized = normalizeHtmlForQuill(pipelineHtml);
  const pipelineWords = countWordsFromHtml(normalized);
  const currentWords = countWordsFromHtml(post.content || '');

  if (pipelineWords <= currentWords && !isBlogStubContent(post.content || '')) {
    return secureResponse({
      ok: true,
      skipped: true,
      message: 'Aktueller Inhalt ist bereits gleichwertig oder länger.',
      wordCount: currentWords,
    });
  }

  const updated = await updateBlogPost(id, { content: normalized });
  if (!updated) {
    return secureResponse({ error: 'Update fehlgeschlagen' }, 500);
  }

  return secureResponse({
    ok: true,
    post: updated,
    wordCount: pipelineWords,
    message: `Pipeline-Text importiert (${pipelineWords} Wörter).`,
  });
}
