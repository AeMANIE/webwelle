import { revalidatePath } from 'next/cache';

export function revalidateBlogPaths(slug?: string): void {
  try {
    revalidatePath('/blog');
    if (slug) {
      revalidatePath(`/blog/${slug}`);
    }
    revalidatePath('/admin');
    revalidatePath('/customer');
  } catch {
    // revalidatePath only works in server context
  }
}
