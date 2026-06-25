import type { MetadataRoute } from 'next';
import { buildRobotsRules } from '@/lib/seo-index';

export const dynamic = 'force-dynamic';

export default async function robots(): Promise<MetadataRoute.Robots> {
  return buildRobotsRules();
}
