import { NextRequest } from 'next/server';
import { verifyN8nSignature } from '@/lib/n8n/signature';
import {
  getFunnelLeadById,
  getFunnelLeadByToken,
  getResearchResults,
  upsertResearchResult,
} from '@/lib/funnel-database';
import {
  mergeSeoKeywordsPayload,
  ownSiteDomainFromUrl,
} from '@/lib/n8n/research-merge';
import { secureResponse } from '@/lib/api-security';

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  if (!verifyN8nSignature(rawBody, request.headers.get('x-webwelle-signature'))) {
    return secureResponse({ error: 'unauthorized' }, 401);
  }

  const body = JSON.parse(rawBody) as Record<string, unknown>;
  const token = String(body.token || '');
  const leadId = String(body.leadId || '');
  const lead = token
    ? await getFunnelLeadByToken(token)
    : leadId
      ? await getFunnelLeadById(leadId)
      : null;

  if (lead) {
    const previous = (await getResearchResults(lead.id)).find(
      (result) => result.workflow_key === 'seo_keywords'
    );
    const previousPayload = (previous?.payload as Record<string, unknown> | null) ?? null;
    const ownDomain = ownSiteDomainFromUrl(lead.existing_website_url);

    if (body.isOwnSiteSupplement === true) {
      const merged = mergeSeoKeywordsPayload(previousPayload, body, ownDomain);
      await upsertResearchResult(lead.id, 'seo_keywords', 'done', merged);
      return secureResponse({ ok: true, merged: true });
    }

    let payload = body;
    if (previousPayload?.ownSiteAnalyzed === true && ownDomain) {
      const ownKeywords = (Array.isArray(previousPayload.keywords)
        ? previousPayload.keywords
        : []
      ).filter((entry) => {
        if (!entry || typeof entry !== 'object') return false;
        return (entry as Record<string, unknown>).isOwnSite === true;
      });
      const ownPerSite = (Array.isArray(previousPayload.perSite) ? previousPayload.perSite : []).filter(
        (entry) =>
          entry &&
          typeof entry === 'object' &&
          String((entry as Record<string, unknown>).domain || '') === ownDomain
      );
      if (ownKeywords.length > 0 || ownPerSite.length > 0) {
        payload = mergeSeoKeywordsPayload(
          body,
          { keywords: ownKeywords, perSite: ownPerSite },
          ownDomain
        );
      }
    }

    await upsertResearchResult(lead.id, 'seo_keywords', 'done', payload);
  }
  return secureResponse({ ok: true });
}
