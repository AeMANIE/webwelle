import type { FunnelLead, FunnelResearchResult } from './funnel/types';
import {
  BLOG_BUNDLE_10,
  hasBlogSelection,
  normalizeAddonSelection,
} from './funnel/packages';
import { isFunnelResearchComplete } from './funnel/research';
import { getResearchResults } from './funnel-database';

export function resolveBlogArticleCount(lead: FunnelLead): number {
  const addon = normalizeAddonSelection(lead.addon_selection);
  if (addon.blogMode === 'bundle_10') return BLOG_BUNDLE_10.articleCount;
  if (addon.blogMode === 'custom') return addon.blogCount;
  return 0;
}

export function leadHasBlogAddon(lead: FunnelLead): boolean {
  return hasBlogSelection(normalizeAddonSelection(lead.addon_selection));
}

export async function getLeadResearchForPipeline(
  leadId: string
): Promise<FunnelResearchResult[]> {
  return getResearchResults(leadId);
}

export function isResearchReadyForBlog(
  research: Array<{ workflow_key: string; status: string }>
): boolean {
  return isFunnelResearchComplete(research);
}

export function extractFunnelKeywords(
  research: FunnelResearchResult[]
): Array<Record<string, unknown>> {
  const seo = research.find((r) => r.workflow_key === 'seo_keywords');
  const payload = seo?.payload as Record<string, unknown> | null | undefined;
  if (!payload) return [];
  const keywords = payload.keywords;
  return Array.isArray(keywords) ? (keywords as Array<Record<string, unknown>>) : [];
}
