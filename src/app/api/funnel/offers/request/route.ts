import { NextRequest } from 'next/server';
import {
  getFunnelLeadByToken,
  createOfferFromLead,
  getDiscountChoice,
  updateFunnelLead,
} from '@/lib/funnel-database';
import { secureResponse } from '@/lib/api-security';
import {
  calculateFunnelOfferTotal,
  normalizeAddonSelection,
  STARTERWELLE,
} from '@/lib/funnel/packages';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const token = String(body.token || '');
  const lead = await getFunnelLeadByToken(token);
  if (!lead) {
    return secureResponse({ error: 'not_found' }, 404);
  }

  const addonSelection = normalizeAddonSelection(lead.addon_selection);
  const discount = await getDiscountChoice(lead.id);
  const discountCents = discount?.discount_cents || 0;
  const breakdown = calculateFunnelOfferTotal(addonSelection);

  const items = breakdown.items.map((item) => ({
    label: item.label,
    description: item.description,
    unitAmountCents: item.amountCents,
    billing: 'one_time' as const,
  }));

  const { id: offerId } = await createOfferFromLead({
    leadId: lead.id,
    packageType: STARTERWELLE.id,
    isCustom: items.length > 1,
    title: `${STARTERWELLE.name} – ${lead.company_name || lead.industry_normalized}`,
    subtotalCents: breakdown.subtotalCents,
    discountCents,
    items,
    createdBy: 'funnel_auto',
  });

  await updateFunnelLead(token, { status: 'package_selected' });

  return secureResponse({
    offerId,
    status: 'draft',
    subtotalCents: breakdown.subtotalCents,
    discountCents,
  });
}
