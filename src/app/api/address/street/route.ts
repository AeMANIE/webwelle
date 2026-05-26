import { NextRequest } from 'next/server';
import { secureResponse } from '@/lib/api-security';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q') || '';
  const postalCode = request.nextUrl.searchParams.get('postalCode') || '';
  const city = request.nextUrl.searchParams.get('city') || '';
  const country = (request.nextUrl.searchParams.get('country') || 'de').toLowerCase();

  if (q.length < 2 || !postalCode || !city) {
    return secureResponse({ streets: [] });
  }

  try {
    const path =
      country === 'at' ? 'at' : country === 'ch' ? 'ch' : 'de';
    const res = await fetch(
      `https://openplzapi.org/${path}/Streets?postalCode=${encodeURIComponent(postalCode)}&name=${encodeURIComponent(q)}`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) {
      return secureResponse({ streets: [] });
    }
    const data = (await res.json()) as Array<{ name: string }>;
    const streets = data
      .map((s) => s.name)
      .filter((name) => name.toLowerCase().includes(q.toLowerCase()))
      .slice(0, 12);
    return secureResponse({ streets });
  } catch {
    return secureResponse({ streets: [] });
  }
}
