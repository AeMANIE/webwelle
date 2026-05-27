import type { DachMarket } from './types';

const COUNTRY_TO_MARKET: Record<string, DachMarket> = {
  DE: 'DE',
  AT: 'AT',
  CH: 'CH',
};

export function countryToMarket(countryCode: string | null | undefined): DachMarket | null {
  if (!countryCode) return null;
  const upper = countryCode.toUpperCase().trim();
  return COUNTRY_TO_MARKET[upper] ?? null;
}

export function detectMarketFromHeaders(headers: Headers): {
  market: DachMarket | null;
  country: string | null;
  confidence: 'high' | 'low';
} {
  const candidates = [
    headers.get('x-vercel-ip-country'),
    headers.get('cf-ipcountry'),
    headers.get('x-country-code'),
  ].filter(Boolean) as string[];

  for (const code of candidates) {
    const market = countryToMarket(code);
    if (market) {
      return { market, country: code.toUpperCase(), confidence: 'high' };
    }
  }

  return { market: null, country: null, confidence: 'low' };
}

/**
 * Markt für neuen Lead: nur IP-Header zählen als „automatisch erkannt“.
 * Cookie ist nur schwacher Fallback (kann von früherem Besuch/Test stammen).
 */
export function detectMarketFromRequest(
  headers: Headers,
  cookieMarket?: string | null
): {
  market: DachMarket | null;
  country: string | null;
  autoDetected: boolean;
} {
  const fromHeaders = detectMarketFromHeaders(headers);
  if (fromHeaders.market) {
    return {
      market: fromHeaders.market,
      country: fromHeaders.country,
      autoDetected: true,
    };
  }

  const fromCookie = countryToMarket(cookieMarket);
  if (fromCookie) {
    return {
      market: fromCookie,
      country: cookieMarket!.toUpperCase(),
      autoDetected: false,
    };
  }

  return { market: null, country: null, autoDetected: false };
}

export function validatePostalCode(market: DachMarket, postalCode: string): boolean {
  const cleaned = postalCode.replace(/\s/g, '');
  switch (market) {
    case 'DE':
      return /^\d{5}$/.test(cleaned);
    case 'AT':
    case 'CH':
      return /^\d{4}$/.test(cleaned);
    default:
      return false;
  }
}

export function marketLabel(market: DachMarket): string {
  const labels: Record<DachMarket, string> = {
    DE: 'Deutschland',
    AT: 'Österreich',
    CH: 'Schweiz',
  };
  return labels[market];
}
