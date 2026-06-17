import { NextRequest, NextResponse } from 'next/server';
import { detectMarketFromRequest } from '@/lib/funnel/market';
import {
  needsIndustryConfirmation,
  normalizeIndustry,
  resolveIndustryNormalization,
} from '@/lib/funnel/industry';
import { createFunnelLead, ensureFunnelTables } from '@/lib/funnel-database';
import { funnelKindFromSource } from '@/lib/funnel/funnel-kind';
import type { FunnelKind } from '@/lib/funnel/types';
import { secureResponse, applyRateLimit } from '@/lib/api-security';
import { RATE_LIMITS } from '@/lib/rate-limit';
import { prepareCustomerFreeText } from '@/lib/validation';
import { setFunnelTokenCookie } from '@/lib/auth-cookies';

export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = await applyRateLimit(request, RATE_LIMITS.FUNNEL_WRITE);
    if (rateLimitResponse) return rateLimitResponse;

    await ensureFunnelTables();

    const body = await request.json();
    const preparedIndustry = prepareCustomerFreeText(
      String(body.industry || ''),
      'industry_short'
    );
    if (!preparedIndustry.valid || !preparedIndustry.value) {
      return secureResponse(
        {
          error: 'invalid_industry',
          message: preparedIndustry.hint || 'Branche zu kurz.',
        },
        400
      );
    }
    const industryInput = preparedIndustry.value;
    const acceptNormalizedInput =
      typeof body.acceptNormalized === 'string' ? body.acceptNormalized : '';
    const preparedAccepted = acceptNormalizedInput
      ? prepareCustomerFreeText(acceptNormalizedInput, 'industry_short')
      : null;
    if (preparedAccepted && !preparedAccepted.valid) {
      return secureResponse(
        {
          error: 'invalid_industry',
          message: preparedAccepted.hint || 'Ungültige Branchenangabe.',
        },
        400
      );
    }
    const acceptNormalized = preparedAccepted?.value || '';

    if (industryInput.length < 2) {
      return secureResponse(
        { error: 'invalid_industry', message: 'Branche zu kurz.' },
        400
      );
    }

    const precheck = normalizeIndustry(industryInput);
    if (precheck.blocked) {
      return secureResponse(
        {
          error: 'invalid_industry',
          message: 'Bitte eine gültige Branche eingeben.',
        },
        400
      );
    }

    const normalized = await resolveIndustryNormalization(
      industryInput,
      acceptNormalized.length >= 2 ? acceptNormalized : undefined
    );

    if (normalized.blocked || normalized.confidence < 0.56) {
      return secureResponse(
        {
          error: 'invalid_industry',
          message: 'Bitte eine gültige Branche eingeben (z. B. Malerbetrieb, Arztpraxis).',
        },
        400
      );
    }

    if (
      !acceptNormalized &&
      needsIndustryConfirmation(normalized)
    ) {
      return secureResponse({
        needsConfirmation: true,
        proposedNormalized: normalized.normalized,
        industryRaw: industryInput,
        confidence: normalized.confidence,
      });
    }

    const geo = detectMarketFromRequest(
      request.headers,
      request.cookies.get('market')?.value
    );
    const geoLat = typeof body.lat === 'number' ? body.lat : undefined;
    const geoLng = typeof body.lng === 'number' ? body.lng : undefined;

    const source = body.source || 'homepage_hero';
    const funnelKind: FunnelKind =
      body.funnelKind === 'wachstumsarchitektur'
        ? 'wachstumsarchitektur'
        : funnelKindFromSource(source);

    const lead = await createFunnelLead({
      industryRaw: industryInput,
      industryNormalized: normalized.normalized,
      industryConfidence: normalized.confidence,
      source,
      funnelKind,
      market: geo.market || body.market || null,
      country: geo.country,
      marketAutoDetected: geo.autoDetected,
      geoLat,
      geoLng,
    });

    const res = secureResponse({
      token: lead.token,
      leadId: lead.id,
      funnelKind: lead.funnel_kind,
      industryNormalized: normalized.normalized,
      needsConfirmation: false,
      market: lead.market,
      marketAutoDetected: lead.market_auto_detected,
    });

    setFunnelTokenCookie(res, lead.token);

    return res;
  } catch (error) {
    console.error('Lead start:', error);
    const message = error instanceof Error ? error.message : 'Unbekannter Fehler';
    const isDbHostError =
      message.includes('ENOTFOUND') ||
      message.includes('getaddrinfo') ||
      message.includes('ECONNREFUSED');
    return secureResponse(
      {
        error: 'server_error',
        message: isDbHostError
          ? 'Datenbank nicht erreichbar. Bitte DATABASE_PUBLICURL in .env.local setzen (Coolify-Postgres von außen).'
          : message,
      },
      500
    );
  }
}
