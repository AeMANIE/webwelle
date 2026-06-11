import { NextRequest, NextResponse } from 'next/server';
import { getAdminTAN } from '@/lib/tan-store';
import { blockInProduction } from '@/lib/prod-guard';

/**
 * DEBUG-ROUTE: Prüft den Status einer Admin-TAN
 * GET /api/debug/admin-tan-status?email=admin@webwelle.com
 */
export async function GET(request: NextRequest) {
  const blocked = blockInProduction();
  if (blocked) return blocked;

  try {

    const email = request.nextUrl.searchParams.get('email');
    if (!email) {
      return NextResponse.json({ error: 'E-Mail-Parameter erforderlich' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const entry = await getAdminTAN(normalizedEmail);

    if (!entry) {
      return NextResponse.json({
        found: false,
        email: normalizedEmail,
        message: 'Keine TAN für diese E-Mail gefunden'
      });
    }

    const now = Date.now();
    const isExpired = now > entry.expiresAt;
    const timeRemaining = isExpired ? 0 : Math.floor((entry.expiresAt - now) / 1000);

    return NextResponse.json({
      found: true,
      email: normalizedEmail,
      expiresAt: new Date(entry.expiresAt).toISOString(),
      now: new Date(now).toISOString(),
      isExpired,
      timeRemainingSeconds: timeRemaining,
      timeRemainingMinutes: Math.floor(timeRemaining / 60)
    });
  } catch (error) {
    console.error('❌ Debug TAN-Status Fehler:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unbekannter Fehler' },
      { status: 500 }
    );
  }
}

