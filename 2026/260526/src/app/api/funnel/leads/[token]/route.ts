import { NextRequest, NextResponse } from 'next/server';
import {
  getFunnelLeadByToken,
  getResearchResults,
  getDiscountChoice,
  updateFunnelLead,
  saveDiscountChoice,
  upsertResearchResult,
} from '@/lib/funnel-database';
import { DELIVERY_DISCOUNTS, type DeliveryWindow } from '@/lib/funnel/types';
import { detectMarketFromHeaders, validatePostalCode } from '@/lib/funnel/market';
import {
  needsIndustryConfirmation,
  resolveIndustryNormalization,
} from '@/lib/funnel/industry';
import { dispatchAllResearch, getCallbackBaseUrl } from '@/lib/n8n/dispatch';
import { secureResponse } from '@/lib/api-security';
import type { DachMarket } from '@/lib/funnel/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  let lead = await getFunnelLeadByToken(token);
  if (!lead) {
    return secureResponse({ error: 'not_found' }, 404);
  }

  if (lead.status === 'new' && lead.market_auto_detected) {
    const live = detectMarketFromHeaders(request.headers);
    if (live.market && live.market !== lead.market) {
      const refreshed = await updateFunnelLead(token, {
        market: live.market,
        country: live.country ?? live.market,
        market_auto_detected: true,
      });
      if (refreshed) lead = refreshed;
    }
  }

  const research = await getResearchResults(lead.id);
  const discount = await getDiscountChoice(lead.id);

  return secureResponse({ lead, research, discount });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const lead = await getFunnelLeadByToken(token);
  if (!lead) {
    return secureResponse({ error: 'not_found' }, 404);
  }

  const body = await request.json();
  const intent = body.intent as string;

  if (intent === 'normalize-industry' || intent === 'update-industry') {
    const raw =
      intent === 'update-industry'
        ? String(body.industry || '').trim()
        : (lead.industry_raw || '').trim();

    if (raw.length < 2) {
      return secureResponse(
        { error: 'invalid_industry', message: 'Branche zu kurz (mindestens 2 Zeichen).' },
        400
      );
    }

    const acceptNormalized =
      typeof body.acceptNormalized === 'string'
        ? body.acceptNormalized.trim()
        : '';

    const normalized = await resolveIndustryNormalization(
      raw,
      acceptNormalized.length >= 2 ? acceptNormalized : undefined
    );

    if (
      intent === 'update-industry' &&
      !acceptNormalized &&
      needsIndustryConfirmation(normalized)
    ) {
      return secureResponse({
        needsConfirmation: true,
        proposedNormalized: normalized.normalized,
        industryRaw: raw,
        confidence: normalized.confidence,
      });
    }

    const updated = await updateFunnelLead(token, {
      industry_raw: raw,
      industry_normalized: normalized.normalized,
      industry_confidence: normalized.confidence,
    });

    return secureResponse({
      lead: updated,
      industryNormalized: normalized.normalized,
    });
  }

  if (intent === 'geo') {
    const market = body.market as DachMarket;
    const postalCode = String(body.postalCode || '').trim();
    const city = String(body.city || '').trim();

    if (!market || !validatePostalCode(market, postalCode)) {
      return secureResponse(
        { error: 'invalid_postal', message: 'Ungültige PLZ für das gewählte Land.' },
        400
      );
    }

    const marketChosenManually = body.marketChosenManually === true;
    const updated = await updateFunnelLead(token, {
      market,
      country: market,
      market_auto_detected: marketChosenManually
        ? false
        : lead.market_auto_detected,
      postal_code: postalCode,
      city: city || undefined,
      status: 'geo_complete',
    });

    await updateFunnelLead(token, { status: 'research_running' });

    const payload = {
      leadId: lead.id,
      token,
      industry: lead.industry_normalized || lead.industry_raw || '',
      industryRaw: lead.industry_raw || '',
      postalCode,
      city,
      market,
      country: market,
      lat: lead.geo_lat ?? undefined,
      lng: lead.geo_lng ?? undefined,
      callbackBaseUrl: getCallbackBaseUrl(),
    };

    void dispatchAllResearch(payload);

    return secureResponse({ lead: updated, researchStarted: true });
  }

  if (intent === 'discount') {
    const window = body.deliveryWindow as DeliveryWindow;
    if (!window || !(window in DELIVERY_DISCOUNTS)) {
      return secureResponse({ error: 'invalid_discount' }, 400);
    }
    const discountCents = DELIVERY_DISCOUNTS[window];
    await saveDiscountChoice(lead.id, window, discountCents);
    const updated = await updateFunnelLead(token, { status: 'discount_selected' });
    return secureResponse({ lead: updated, discountCents });
  }

  if (intent === 'contact') {
    const updated = await updateFunnelLead(token, {
      first_name: body.firstName,
      last_name: body.lastName,
      company_name: body.companyName,
      email: body.email,
      phone: body.phone,
      street: body.street,
      house_number: body.houseNumber,
      postal_code: body.postalCode || lead.postal_code || undefined,
      city: body.city || lead.city || undefined,
      market: body.market || lead.market || undefined,
      country: body.market || lead.country || undefined,
      address_verified: true,
      status: 'contact_complete',
    });
    return secureResponse({ lead: updated });
  }

  if (intent === 'package') {
    const updated = await updateFunnelLead(token, {
      selected_package: body.packageType,
      selected_modules: body.modules || [],
      wants_custom_offer: Boolean(body.wantsCustomOffer),
      status: 'package_selected',
    });
    return secureResponse({ lead: updated });
  }

  if (intent === 'retry-research') {
    const payload = {
      leadId: lead.id,
      token,
      industry: lead.industry_normalized || '',
      industryRaw: lead.industry_raw || '',
      postalCode: lead.postal_code || '',
      city: lead.city || '',
      market: lead.market || 'DE',
      country: lead.country || lead.market || 'DE',
      callbackBaseUrl: getCallbackBaseUrl(),
    };
    void dispatchAllResearch(payload);
    return secureResponse({ ok: true });
  }

  return secureResponse({ error: 'unknown_intent' }, 400);
}
