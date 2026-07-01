import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth, secureResponse } from '@/lib/api-security';
import { ensureOutboundTables, upsertProspectFromDraft, type N8nProspectDraft } from '@/lib/outbound-database';
import { n8nAnalyze, n8nGetDraft } from '@/lib/outbound/n8n-client';

export async function POST(request: NextRequest) {
  const auth = await requireAdminAuth(request);
  if (auth instanceof NextResponse) return auth;

  const body = await request.json().catch(() => ({}));
  const websiteUrl = String(body.websiteUrl || '').trim();
  if (!websiteUrl) return secureResponse({ error: 'websiteUrl_required' }, 400);

  try {
    await ensureOutboundTables();
    const analyze = await n8nAnalyze({
      websiteUrl,
      googleMapsUrl: body.googleMapsUrl,
      industryHint: body.industryHint,
    });

    const draft = await n8nGetDraft(analyze.prospectId);
    const row = await upsertProspectFromDraft(draft as unknown as N8nProspectDraft);

    return secureResponse({
      ok: true,
      prospectId: row.id,
      externalId: row.external_id,
      domain: row.domain,
      status: row.status,
    });
  } catch (e) {
    console.error('outbound analyze:', e);
    const msg = e instanceof Error ? e.message : 'analyze_failed';
    return secureResponse({ error: msg }, 500);
  }
}
