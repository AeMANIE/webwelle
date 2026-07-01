import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth, secureResponse } from '@/lib/api-security';
import { listOutboundProspects } from '@/lib/outbound-database';

export async function GET(request: NextRequest) {
  const auth = await requireAdminAuth(request);
  if (auth instanceof NextResponse) return auth;

  const status = request.nextUrl.searchParams.get('status') || undefined;
  const search = request.nextUrl.searchParams.get('search') || undefined;

  try {
    const rows = await listOutboundProspects({ status, search, limit: 200 });
    return secureResponse({
      prospects: rows.map((r) => ({
        id: r.id,
        externalId: r.external_id,
        domain: r.domain,
        companyName: r.company_name,
        preferredEmail: r.preferred_email,
        status: r.status,
        sentAt: r.sent_at,
        sentTo: r.sent_to,
        upsells: ((r.audit_payload?.offer as Record<string, unknown>)?.upsells as string[]) || [],
        customerId: r.customer_id,
        leadId: r.lead_id,
        createdAt: r.created_at,
      })),
    });
  } catch (e) {
    console.error('outbound prospects list:', e);
    return secureResponse({ error: 'list_failed' }, 500);
  }
}
