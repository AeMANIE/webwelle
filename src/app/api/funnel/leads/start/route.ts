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
import { secureResponse } from '@/lib/api-security';
import { setFunnelTokenCookie } from '@/lib/auth-cookies';

export async function POST(request: NextRequest) {
  try {
    await ensureFunnelTables();

    const body = await request.json();
    const industryInput = String(body.industry || '').trim();
    const acceptNormalized =
      typeof body.acceptNormalized === 'string'
        ? body.acceptNormalized.trim()
        : '';

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
