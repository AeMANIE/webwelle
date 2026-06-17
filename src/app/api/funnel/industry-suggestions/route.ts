import { NextRequest } from 'next/server';
import { secureResponse, applyRateLimit } from '@/lib/api-security';
import { RATE_LIMITS } from '@/lib/rate-limit';
import { prepareCustomerFreeText } from '@/lib/validation';
import {
  isGenericIndustry,
  suggestIndustryDetails,
} from '@/lib/funnel/industry';
import type { DachMarket } from '@/lib/funnel/types';

export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = await applyRateLimit(request, RATE_LIMITS.FUNNEL_READ);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await request.json();
    const prepared = prepareCustomerFreeText(String(body.industry || ''), 'industry_short');
    if (!prepared.valid || !prepared.value) {
      return secureResponse(
        {
          error: 'invalid_industry',
          message: prepared.hint || 'Branche zu kurz.',
        },
        400
      );
    }
    const industry = prepared.value;

    const market = ['DE', 'AT', 'CH'].includes(String(body.market || ''))
      ? (String(body.market) as DachMarket)
      : undefined;

    const localGeneric = isGenericIndustry(industry, industry);
    const result = await suggestIndustryDetails(industry, market);

    return secureResponse({
      generic: localGeneric || result.generic,
      suggestions: result.suggestions,
      followUpQuestion: result.followUpQuestion,
      source: result.source,
    });
  } catch (error) {
    console.error('industry-suggestions:', error);
    return secureResponse(
      {
        error: 'server_error',
        message: error instanceof Error ? error.message : 'Unbekannter Fehler',
      },
      500
    );
  }
}
