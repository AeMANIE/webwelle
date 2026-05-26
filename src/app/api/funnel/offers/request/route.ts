import { NextRequest } from 'next/server';
import {
  getFunnelLeadByToken,
  createOfferFromLead,
  getDiscountChoice,
  updateFunnelLead,
} from '@/lib/funnel-database';
import { secureResponse } from '@/lib/api-security';

const PACKAGE_BASE_CENTS: Record<string, number> = {
  starterwelle: 99000,
  businesswelle: 199000,
  erfolgswelle: 299000,
};

export async function POST(request: NextRequest) {
  const body = await request.json();
  const token = String(body.token || '');
  const lead = await getFunnelLeadByToken(token);
  if (!lead) {
    return secureResponse({ error: 'not_found' }, 404);
  }

  const packageType = String(body.packageType || lead.selected_package || 'starterwelle');
  const modules = (body.modules as string[]) || (lead.selected_modules as string[]) || [];
  const discount = await getDiscountChoice(lead.id);
  const discountCents = discount?.discount_cents || 0;
  const subtotal = PACKAGE_BASE_CENTS[packageType] || 99000;
  const isCustom = modules.length > 0 || lead.wants_custom_offer;

  const items = modules.map((label: string) => ({
    label,
    unitAmountCents: 0,
    billing: 'one_time',
  }));

  const { id: offerId } = await createOfferFromLead({
    leadId: lead.id,
    packageType: isCustom ? 'custom_offer' : packageType,
    isCustom,
    title: `${packageType} – ${lead.company_name || lead.industry_normalized}`,
    subtotalCents: subtotal,
    discountCents,
    items,
    createdBy: 'funnel_auto',
  });

  await updateFunnelLead(token, { status: 'package_selected' });

  return secureResponse({ offerId, status: 'draft' });
}
