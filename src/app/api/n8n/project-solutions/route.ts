import { NextRequest } from 'next/server';
import { verifyN8nSignature } from '@/lib/n8n/signature';
import {
  getFunnelLeadById,
  getFunnelLeadByToken,
  upsertResearchResult,
  updateFunnelLead,
} from '@/lib/funnel-database';
import { secureResponse } from '@/lib/api-security';

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
      'project_solutions',
      String(body.status || 'done'),
      body as Record<string, unknown>
    );
    if (body.done === true || body.status === 'done') {
      await updateFunnelLead(lead.token, { status: 'research_ready' });
    }
  }

  return secureResponse({ ok: true });
}
