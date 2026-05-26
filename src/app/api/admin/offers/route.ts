import { NextRequest } from 'next/server';
import { requireAdminAuth, secureResponse } from '@/lib/api-security';
import {
  getFunnelLeadByToken,
  createOfferFromLead,
  getDiscountChoice,
} from '@/lib/funnel-database';
import { pool } from '@/lib/database';

export async function POST(request: NextRequest) {
  const auth = await requireAdminAuth(request);
  if (auth instanceof Response) return auth;

  const body = await request.json();
  const leadId = body.leadId as string;
  const token = body.token as string | undefined;

  let leadIdResolved = leadId;
  if (!leadIdResolved && token) {
    const lead = await getFunnelLeadByToken(token);
    if (!lead) return secureResponse({ error: 'lead_not_found' }, 404);
    leadIdResolved = lead.id;
  }

  const client = await pool.connect();
  let lead;
  try {
    const r = await client.query('SELECT * FROM funnel_leads WHERE id = $1', [leadIdResolved]);
    lead = r.rows[0];
  } finally {
    client.release();
  }

  if (!lead) return secureResponse({ error: 'lead_not_found' }, 404);

  const discount = await getDiscountChoice(leadIdResolved);
  const subtotal = Number(body.subtotalCents) || 99000;
  const discountCents = Number(body.discountCents) ?? discount?.discount_cents ?? 0;

  const { id } = await createOfferFromLead({
    leadId: leadIdResolved,
    packageType: body.packageType || 'custom_offer',
    isCustom: Boolean(body.isCustom),
    title: body.title || `Angebot ${lead.company_name || lead.industry_normalized}`,
    subtotalCents: subtotal,
    discountCents,
    monthlyCents: body.monthlyCents,
    items: body.items,
    createdBy: 'admin',
  });

  return secureResponse({ offerId: id });
}
