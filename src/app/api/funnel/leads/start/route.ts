import { NextRequest, NextResponse } from 'next/server';
import { detectMarketFromRequest } from '@/lib/funnel/market';
import {
  needsIndustryConfirmation,
  normalizeIndustry,
  resolveIndustryNormalization,
} from '@/lib/funnel/industry';
import { createFunnelLead, ensureFunnelTables } from '@/lib/funnel-database';
import { secureResponse } from '@/lib/api-security';

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

    const lead = await createFunnelLead({
      industryRaw: industryInput,
      industryNormalized: normalized.normalized,
      industryConfidence: normalized.confidence,
      source: body.source || 'homepage_hero',
      market: geo.market || body.market || null,
      country: geo.country,
      marketAutoDetected: geo.autoDetected,
      geoLat,
      geoLng,
    });

    const res = secureResponse({
      token: lead.token,
      leadId: lead.id,
      industryNormalized: normalized.normalized,
      needsConfirmation: false,
      market: lead.market,
      marketAutoDetected: lead.market_auto_detected,
    });

    res.cookies.set('wf_token', lead.token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 90,
    });

    return res;
  } catch (error) {
    console.error('Lead start:', error);
    return secureResponse(
      {
        error: 'server_error',
        message: error instanceof Error ? error.message : 'Unbekannter Fehler',
      },
      500
    );
  }
}
