import { NextRequest, NextResponse } from 'next/server';
import { requireCustomerAuth } from '@/lib/api-security';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireCustomerAuth(request);
    if (auth instanceof NextResponse) return auth;

    const customerBookings: Array<Record<string, unknown>> = [];
    return NextResponse.json(customerBookings);
  } catch (error) {
    console.error('Fehler beim Laden der Kunden-Buchungen:', error);
    return NextResponse.json({ error: 'Fehler beim Laden der Buchungen' }, { status: 500 });
  }
}
