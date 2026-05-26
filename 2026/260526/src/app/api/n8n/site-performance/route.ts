import { NextRequest } from 'next/server';
import { verifyN8nSignature } from '@/lib/n8n/signature';
import {
  getFunnelLeadById,
  getFunnelLeadByToken,
  getResearchResults,
  upsertResearchResult,
} from '@/lib/funnel-database';
import { secureResponse } from '@/lib/api-security';

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function mergeSites(existing: unknown, incoming: unknown): Record<string, unknown> {
  const merged: Record<string, unknown> = {};
  const addSite = (site: unknown, fallbackKey: string) => {
    if (!site || typeof site !== 'object') return;
    const row = site as Record<string, unknown>;
    const key = String(row.domain || row.websiteUrl || row.url || fallbackKey).trim();
    if (key) merged[key] = row;
  };

  const addCollection = (value: unknown) => {
    if (Array.isArray(value)) {
      value.forEach((site, index) => addSite(site, String(index)));
      return;
    }
    if (value && typeof value === 'object') {
      for (const [key, site] of Object.entries(value)) addSite(site, key);
    }
  };

  addCollection(existing);
  addCollection(incoming);
  return merged;
}

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
      (result) => result.workflow_key === 'site_performance'
    );
    const previousPayload = asRecord(previous?.payload);
    const sites = mergeSites(previousPayload.sites, body.sites);
    const totalSites = Number(body.totalSites || previousPayload.totalSites || 4);
    const receivedSites = Object.keys(sites).length;
    const done = receivedSites >= totalSites || body.done === true;
    await upsertResearchResult(lead.id, 'site_performance', done ? 'done' : 'partial', {
      ...previousPayload,
      ...body,
      sites,
      totalSites,
      receivedSites,
      done,
      partial: !done,
    });
  }
  return secureResponse({ ok: true });
}
