import { NextRequest } from 'next/server';
import { verifyN8nSignature } from '@/lib/n8n/signature';
import {
  getFunnelLeadById,
  getFunnelLeadByToken,
  upsertResearchResult,
  updateFunnelLead,
} from '@/lib/funnel-database';
import {
  dispatchSitePerformance,
  getCallbackBaseUrl,
  type N8nCompetitorPayload,
} from '@/lib/n8n/dispatch';
import { secureResponse } from '@/lib/api-security';

function normalizeCompetitors(value: unknown): N8nCompetitorPayload[] {
  if (!Array.isArray(value)) return [];
  return value.reduce<N8nCompetitorPayload[]>((acc, item) => {
    if (!item || typeof item !== 'object') return acc;
    const competitor = item as Record<string, unknown>;
    const domain = String(competitor.domain || '').trim();
    const websiteUrl = String(competitor.websiteUrl || competitor.url || '').trim();
    const name = String(competitor.name || domain || '').trim();
    if (!domain || !websiteUrl) return acc;
    acc.push({
      name,
      domain,
      websiteUrl,
      address: typeof competitor.address === 'string' ? competitor.address : undefined,
      mapsUri: typeof competitor.mapsUri === 'string' ? competitor.mapsUri : undefined,
    });
    return acc;
  }, []);
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const sig = request.headers.get('x-webwelle-signature');
  if (!verifyN8nSignature(rawBody, sig)) {
    return secureResponse({ error: 'unauthorized' }, 401);
  }

  const body = JSON.parse(rawBody) as Record<string, unknown>;
  const token = String(body.token || body.leadToken || '');
  const leadId = String(body.leadId || '');
  const lead = token
    ? await getFunnelLeadByToken(token)
    : leadId
      ? await getFunnelLeadById(leadId)
      : null;

  if (lead) {
    await upsertResearchResult(
      lead.id,
      'industry_questions',
      String(body.status || 'done'),
      body as Record<string, unknown>
    );
    if (body.done === true || body.status === 'done') {
      await updateFunnelLead(lead.token, { status: 'research_ready' });
      const competitors = normalizeCompetitors(body.discoveredCompetitors || body.competitors);
      if (competitors.length > 0) {
        void dispatchSitePerformance(
          {
            leadId: lead.id,
            token: lead.token,
            industry: lead.industry_normalized || lead.industry_raw || '',
            industryRaw: lead.industry_raw || '',
            postalCode: lead.postal_code || '',
            city: lead.city || '',
            market: lead.market || 'DE',
            country: lead.country || lead.market || 'DE',
            lat: lead.geo_lat ?? undefined,
            lng: lead.geo_lng ?? undefined,
            callbackBaseUrl: getCallbackBaseUrl(),
          },
          competitors
        );
      }
    }
  }

  return secureResponse({ ok: true });
}
