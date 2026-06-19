import { revalidatePath } from 'next/cache';
import { getRedisClient } from '@/lib/redis';

async function invalidateBlogRedis(slug?: string): Promise<void> {
  const redis = getRedisClient();
  if (!redis || (await redis.status) !== 'ready') return;
  if (slug) {
    await redis.del(`blog:post:${slug}`);
  }
  await redis.del('blog:posts:published');
}

export function revalidateBlogPaths(slug?: string): void {
  try {
    revalidatePath('/blog');
    if (slug) {
      revalidatePath(`/blog/${slug}`);
    }
    revalidatePath('/admin');
    revalidatePath('/customer');
    void invalidateBlogRedis(slug);
  } catch {
    // revalidatePath only works in server context
  }
}
