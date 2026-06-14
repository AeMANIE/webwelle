import { NextRequest } from 'next/server';
import { verifyN8nSignature } from '@/lib/n8n/signature';
import {
  getFunnelLeadById,
  getFunnelLeadByToken,
  getResearchResults,
  upsertResearchResult,
} from '@/lib/funnel-database';
import { mergeCompetitorDesignPayload } from '@/lib/n8n/research-merge';
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
      (result) => result.workflow_key === 'competitor_design'
    );
    const previousPayload = (previous?.payload as Record<string, unknown> | null) ?? null;

    if (body.isOwnSiteSupplement === true) {
      const merged = mergeCompetitorDesignPayload(
        previousPayload,
        body,
        lead.existing_website_url
      );
      await upsertResearchResult(lead.id, 'competitor_design', 'done', merged);
      return secureResponse({ ok: true, merged: true });
    }

    let payload = body;
    if (previousPayload?.ownSiteAnalyzed === true) {
      const ownEntries = (Array.isArray(previousPayload.competitors)
        ? previousPayload.competitors
        : []
      ).filter((entry) => {
        if (!entry || typeof entry !== 'object') return false;
        return (entry as Record<string, unknown>).isOwnSite === true;
      });
      if (ownEntries.length > 0) {
        payload = mergeCompetitorDesignPayload(
          body,
          { competitors: ownEntries },
          lead.existing_website_url
        );
      }
    }

    await upsertResearchResult(lead.id, 'competitor_design', 'done', payload);
  }
  return secureResponse({ ok: true });
}
