import { NextRequest } from 'next/server';
import { secureResponse } from '@/lib/api-security';
import type { DachMarket } from '@/lib/funnel/types';

async function fetchDeLocalities(postalCode: string) {
  const res = await fetch(
    `https://openplzapi.org/de/Localities?postalCode=${encodeURIComponent(postalCode)}`,
    { next: { revalidate: 86400 } }
  );
  if (!res.ok) return [];
  const data = (await res.json()) as Array<{ name: string; postalCode: string }>;
  return data.map((d) => ({ city: d.name, postalCode: d.postalCode }));
}

async function fetchAtLocalities(postalCode: string) {
  const res = await fetch(
    `https://openplzapi.org/at/Localities?postalCode=${encodeURIComponent(postalCode)}`,
    { next: { revalidate: 86400 } }
  );
  if (!res.ok) return [];
  const data = (await res.json()) as Array<{ name: string; postalCode: string }>;
  return data.map((d) => ({ city: d.name, postalCode: d.postalCode }));
}

async function fetchChLocalities(postalCode: string) {
  const res = await fetch(
    `https://openplzapi.org/ch/Localities?postalCode=${encodeURIComponent(postalCode)}`,
    { next: { revalidate: 86400 } }
  );
  if (!res.ok) return [];
  const data = (await res.json()) as Array<{ name: string; postalCode: string }>;
  return data.map((d) => ({ city: d.name, postalCode: d.postalCode }));
}

export async function GET(request: NextRequest) {
  const country = (request.nextUrl.searchParams.get('country') || 'DE').toUpperCase() as DachMarket;
  const postalCode = (request.nextUrl.searchParams.get('postalCode') || '').replace(/\s/g, '');

  if (!postalCode) {
    return secureResponse({ error: 'postalCode required' }, 400);
  }

  let localities: Array<{ city: string; postalCode: string }> = [];
  if (country === 'DE') localities = await fetchDeLocalities(postalCode);
  else if (country === 'AT') localities = await fetchAtLocalities(postalCode);
  else if (country === 'CH') localities = await fetchChLocalities(postalCode);

  const uniqueCities = [...new Set(localities.map((l) => l.city))].map((city) => ({
    city,
    postalCode,
  }));

  return secureResponse({ localities: uniqueCities });
}
