/** Public URL for published posts; admin preview for drafts. */
export function getBlogPreviewUrl(post: {
  id: string;
  slug: string;
  status: 'draft' | 'published';
}): string {
  return post.status === 'published' ? `/blog/${post.slug}` : `/admin/blog/preview/${post.id}`;
}
