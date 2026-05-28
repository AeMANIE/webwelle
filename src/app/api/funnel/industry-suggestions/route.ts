import { NextRequest } from 'next/server';
import { secureResponse } from '@/lib/api-security';
import {
  isGenericIndustry,
  suggestIndustryDetails,
} from '@/lib/funnel/industry';
import type { DachMarket } from '@/lib/funnel/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const industry = String(body.industry || '').trim();

    if (industry.length < 2) {
      return secureResponse(
        { error: 'invalid_industry', message: 'Branche zu kurz.' },
        400
      );
    }

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
