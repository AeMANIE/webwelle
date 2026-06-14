import { NextRequest, NextResponse } from 'next/server';
import {
  getFunnelLeadByToken,
  getResearchResults,
  getDiscountChoice,
  updateFunnelLead,
  saveDiscountChoice,
  upsertResearchResult,
  ensureFunnelTables,
} from '@/lib/funnel-database';
import { DELIVERY_DISCOUNTS, type DeliveryWindow } from '@/lib/funnel/types';
import { detectMarketFromHeaders, validatePostalCode } from '@/lib/funnel/market';
import {
  buildIndustryForResearch,
  hasValidIndustryDetail,
  INDUSTRY_DETAIL_MIN_LENGTH,
  leadRequiresIndustryDetail,
  needsIndustryConfirmation,
  resolveIndustryNormalization,
} from '@/lib/funnel/industry';
import {
  dispatchAllResearch,
  dispatchOwnSiteDesignAndSeo,
  dispatchOwnSitePerformance,
  getCallbackBaseUrl,
} from '@/lib/n8n/dispatch';
import { secureResponse } from '@/lib/api-security';
import {
  fixEmailTypo,
  validateEmail,
  validateMobileDACH,
  validatePersonName,
  validatePersonNamePair,
  validateUrl,
} from '@/lib/validation';
import {
  BLOG_MIN_COUNT,
  normalizeAddonSelection,
  normalizeDesignPreferences,
} from '@/lib/funnel/packages';
import type { DachMarket } from '@/lib/funnel/types';
import {
  ensureCustomerPortalColumns,
  getCustomerByEmail,
  getOrCreateCustomerWithNumber,
  updateCustomer,
} from '@/lib/database';
import {
  createActivationTokenIfNeeded,
  type ActivationPurpose,
} from '@/lib/portal-activation';
import { sendEmail } from '@/lib/email';
import { renderWebWellePortalActivationEmail } from '@/lib/email-templates/webwelle';

type FunnelCustomerType = 'new_customer' | 'existing_unactivated' | 'existing_active';

function classifyCustomer(customer: { password_hash?: string; portal_activated?: boolean } | null): FunnelCustomerType {
  if (!customer) return 'new_customer';
  return customer.password_hash && customer.portal_activated
    ? 'existing_active'
    : 'existing_unactivated';
}

function purposeForCustomerType(type: FunnelCustomerType, isResume?: boolean): ActivationPurpose {
  if (isResume) return 'resume_analysis';
  if (type === 'existing_active') return 'existing_customer_link';
  if (type === 'existing_unactivated') return 'password_setup';
  return 'new_customer_activation';
}

function getPublicBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.WEBWELLE_PUBLIC_APP_URL ||
    'https://webwelle.com'
  ).replace(/\/$/, '');
}

function cleanDesignReferences(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  return value
    .map((url) => String(url || '').trim())
    .filter((url) => {
      if (!url || seen.has(url)) return false;
      try {
        const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
        const normalized = parsed.toString();
        seen.add(normalized);
        return true;
      } catch {
        return false;
      }
    })
    .slice(0, 3);
}

async function sendPortalActivationMail(params: {
  email: string;
  name: string;
  token: string;
  leadToken: string;
  customerType?: FunnelCustomerType;
  isResume?: boolean;
}) {
  const baseUrl = getPublicBaseUrl();
  const redirectTo = encodeURIComponent('/customer?tab=analysis');
  const activationLink = params.customerType === 'existing_active'
    ? `${baseUrl}/customer/login?redirectTo=${redirectTo}`
    : `${baseUrl}/customer/activate?token=${params.token}`;
  const resumeLink = `${baseUrl}/funnel-5?t=${encodeURIComponent(params.leadToken)}`;
  const variant = params.isResume
    ? 'resume'
    : params.customerType === 'existing_active'
      ? 'existing_active'
      : params.customerType === 'existing_unactivated'
        ? 'existing_unactivated'
        : 'new_customer';
  const subject =
    variant === 'existing_active'
      ? 'WebWelle - Ihre neue Analyse ist im Portal'
      : variant === 'existing_unactivated'
        ? 'WebWelle - Portal aktivieren und Analyse verbinden'
        : params.isResume
          ? 'WebWelle - Analyse gespeichert und Portalzugang'
          : 'WebWelle - Kundenportal einrichten';
  const email = renderWebWellePortalActivationEmail({
    customerName: params.name,
    customerEmail: params.email,
    activationLink,
    resumeLink,
    isResume: params.isResume,
    variant,
  });

  return sendEmail({
    to: params.email,
    subject,
    html: email.html,
    text: email.text,
  });
}

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

  if (intent === 'industry-detail') {
    const detail = String(body.industryDetail || body.detail || '').trim();
    if (!hasValidIndustryDetail(detail)) {
      return secureResponse(
        {
          error: 'invalid_industry_detail',
          message: `Bitte konkretisieren Sie Ihre Branche (mindestens ${INDUSTRY_DETAIL_MIN_LENGTH} Zeichen).`,
        },
        400
      );
    }

    const updated = await updateFunnelLead(token, {
      industry_detail: detail,
    });

    return secureResponse({ lead: updated });
  }

  if (intent === 'geo') {
    if (leadRequiresIndustryDetail(lead)) {
      return secureResponse(
        {
          error: 'industry_detail_required',
          message:
            'Ihre Branche ist sehr allgemein. Bitte wählen Sie einen Vorschlag oder beschreiben Sie konkret, was Sie anbieten.',
        },
        400
      );
    }

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

    const refreshed = (await getFunnelLeadByToken(token)) || lead;
    const industryForResearch = buildIndustryForResearch(
      refreshed.industry_normalized,
      refreshed.industry_detail,
      refreshed.industry_raw
    );

    const payload = {
      leadId: refreshed.id,
      token,
      industry: industryForResearch,
      industryRaw: refreshed.industry_raw || '',
      industryDetail: refreshed.industry_detail || undefined,
      industryForResearch,
      postalCode,
      city,
      market,
      country: market,
      lat: refreshed.geo_lat ?? undefined,
      lng: refreshed.geo_lng ?? undefined,
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

  if (intent === 'website-intent') {
    await ensureFunnelTables();
    const hasExisting = body.hasExistingWebsite === true;

    if (hasExisting) {
      const rawUrl = String(body.existingWebsiteUrl || '').trim();
      if (!rawUrl) {
        return secureResponse(
          {
            error: 'website_url_required',
            message: 'Bitte geben Sie die Adresse Ihrer aktuellen Website ein.',
          },
          400
        );
      }
      const normalizedUrl = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;
      if (!validateUrl(normalizedUrl)) {
        return secureResponse(
          {
            error: 'invalid_website_url',
            message: 'Bitte geben Sie eine gültige Website-Adresse ein (z. B. https://ihre-firma.de).',
          },
          400
        );
      }
      const updated = await updateFunnelLead(token, {
        existing_website: true,
        existing_website_url: normalizedUrl,
        status: 'website_intent_set',
      });
      if (updated) {
        void dispatchOwnSitePerformance(updated);
        void dispatchOwnSiteDesignAndSeo(updated);
      }
      return secureResponse({
        lead: updated,
        sitePerformanceStarted: true,
        ownSiteResearchStarted: true,
      });
    }

    const updated = await updateFunnelLead(token, {
      existing_website: false,
      existing_website_url: null,
      status: 'website_intent_set',
    });
    return secureResponse({ lead: updated });
  }

  if (intent === 'contact') {
    const email = String(body.email || '').trim().toLowerCase();
    if (!validateEmail(email)) {
      return secureResponse(
        { error: 'invalid_email', message: 'Bitte eine gültige E-Mail-Adresse eingeben.' },
        400
      );
    }
    const emailFix = fixEmailTypo(email);
    if (emailFix && emailFix !== email && body.confirmEmailTypo !== true) {
      return secureResponse(
        {
          error: 'email_typo',
          message: `Meinten Sie ${emailFix}?`,
          suggestedEmail: emailFix,
        },
        400
      );
    }
    const firstName = String(body.firstName || '').trim();
    const lastName = String(body.lastName || '').trim();
    const contactMarket = (body.market || lead.market || 'DE') as DachMarket;

    const firstNameResult = validatePersonName(firstName, 'Vorname');
    if (!firstNameResult.valid) {
      return secureResponse(
        { error: 'invalid_first_name', message: firstNameResult.hint },
        400
      );
    }

    const lastNameResult = validatePersonName(lastName, 'Nachname');
    if (!lastNameResult.valid) {
      return secureResponse(
        { error: 'invalid_last_name', message: lastNameResult.hint },
        400
      );
    }

    const namePairResult = validatePersonNamePair(firstName, lastName);
    if (!namePairResult.valid) {
      return secureResponse(
        { error: 'invalid_name_pair', message: namePairResult.hint },
        400
      );
    }

    const phoneResult = validateMobileDACH(String(body.phone || ''), contactMarket);
    if (!phoneResult.valid) {
      return secureResponse(
        { error: 'invalid_phone', message: phoneResult.hint },
        400
      );
    }

    const fullName = `${firstName} ${lastName}`.trim() || email;
    const companyName = String(body.companyName || '').trim();
    let customerId: string | undefined;

    if (email) {
      await ensureCustomerPortalColumns();
      const existingCustomer = await getCustomerByEmail(email);
      const customerType = classifyCustomer(existingCustomer);
      const customer = await getOrCreateCustomerWithNumber(
        email,
        fullName,
        String(body.phone || '').trim() || undefined,
        companyName || undefined
      );
      customerId = customer.id != null ? String(customer.id) : undefined;
      await updateCustomer(email, {
        name: fullName,
        phone: String(body.phone || '').trim() || undefined,
        company_name: companyName || undefined,
        street: String(body.street || '').trim() || undefined,
        city: String(body.city || lead.city || '').trim() || undefined,
        zip: String(body.postalCode || lead.postal_code || '').trim() || undefined,
        country: String(body.market || lead.market || lead.country || 'DE'),
        is_verified: Boolean(customer.is_verified),
      });

      const purpose = purposeForCustomerType(customerType);
      const activationToken = await createActivationTokenIfNeeded(
        email,
        lead.id,
        undefined,
        60,
        purpose,
        { customerType, source: 'funnel_contact' }
      );
      if (activationToken.created) {
        void sendPortalActivationMail({
          email,
          name: fullName,
          token: activationToken.token,
          leadToken: token,
          customerType,
        });
      }
    }

    const updated = await updateFunnelLead(token, {
      first_name: firstName,
      last_name: lastName,
      company_name: companyName,
      email,
      phone: body.phone,
      street: body.street,
      house_number: body.houseNumber,
      postal_code: body.postalCode || lead.postal_code || undefined,
      city: body.city || lead.city || undefined,
      market: body.market || lead.market || undefined,
      country: body.market || lead.country || undefined,
      address_verified: true,
      customer_id: customerId,
      status: 'contact_complete',
    });
    return secureResponse({ lead: updated });
  }

  if (intent === 'design-preferences') {
    const urls = cleanDesignReferences(body.urls);
    const updated = await updateFunnelLead(token, {
      design_reference_urls: urls,
    });
    return secureResponse({ lead: updated, urls });
  }

  if (intent === 'design-style-preferences') {
    const normalized = normalizeDesignPreferences({
      includedItems: body.includedItems,
      optionalItems: body.optionalItems,
      selectedOptionalIds: body.selectedOptionalIds,
      parsedAt: new Date().toISOString(),
    });

    const optionalIdSet = new Set(normalized.optionalItems.map((item) => item.id));
    const selectedOptionalIds = normalized.selectedOptionalIds.filter((id) =>
      optionalIdSet.has(id)
    );

    const preferences = {
      ...normalized,
      selectedOptionalIds,
    };

    const updated = await updateFunnelLead(token, {
      design_preferences: preferences,
    });
    return secureResponse({ lead: updated, preferences });
  }

  if (intent === 'addon-selection') {
    const selection = normalizeAddonSelection({
      seoProfi: body.seoProfi,
      blogMode: body.blogMode,
      blogCount: body.blogCount,
      brandingSelected: body.brandingSelected,
      animationSelected: body.animationSelected,
    });

    if (selection.blogMode === 'custom' && selection.blogCount < BLOG_MIN_COUNT) {
      return secureResponse(
        {
          error: 'invalid_blog_count',
          message: `Bitte mindestens ${BLOG_MIN_COUNT} Blog-Artikel wählen.`,
        },
        400
      );
    }

    const updated = await updateFunnelLead(token, {
      addon_selection: selection,
      selected_package: 'starterwelle',
    });
    return secureResponse({ lead: updated, selection });
  }

  if (intent === 'save-resume') {
    if (lead.email) {
      const existingCustomer = await getCustomerByEmail(lead.email);
      const customerType = classifyCustomer(existingCustomer);
      const activationToken = await createActivationTokenIfNeeded(
        lead.email,
        lead.id,
        undefined,
        60,
        purposeForCustomerType(customerType, true),
        { customerType, source: 'save_resume' }
      );
      if (activationToken.created) {
        void sendPortalActivationMail({
          email: lead.email,
          name: `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || lead.email,
          token: activationToken.token,
          leadToken: token,
          customerType,
          isResume: true,
        });
      }
    }
    return secureResponse({
      ok: true,
      message: lead.email
        ? 'Analyse gespeichert. Wir haben den Portal-Link per E-Mail gesendet.'
        : 'Analyse wurde auf diesem Gerät gespeichert.',
    });
  }

  if (intent === 'package') {
    const updated = await updateFunnelLead(token, {
      selected_package: 'starterwelle',
      selected_modules: body.modules || [],
      wants_custom_offer: true,
      status: 'package_selected',
    });
    return secureResponse({ lead: updated });
  }

  if (intent === 'retry-research') {
    const industryForResearch = buildIndustryForResearch(
      lead.industry_normalized,
      lead.industry_detail,
      lead.industry_raw
    );
    const payload = {
      leadId: lead.id,
      token,
      industry: industryForResearch,
      industryRaw: lead.industry_raw || '',
      industryDetail: lead.industry_detail || undefined,
      industryForResearch,
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
