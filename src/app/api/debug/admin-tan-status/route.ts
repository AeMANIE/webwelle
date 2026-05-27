import { NextRequest, NextResponse } from 'next/server';
import { getAdminTAN } from '@/lib/tan-store';

/**
 * DEBUG-ROUTE: Prüft den Status einer Admin-TAN
 * GET /api/debug/admin-tan-status?email=admin@webwelle.com
 */
export async function GET(request: NextRequest) {
  try {
    // Nur in Development oder mit ALLOW_DEBUG_ROUTES
    if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEBUG_ROUTES !== 'true') {
      return NextResponse.json({ error: 'Debug-Route nur in Development verfügbar' }, { status: 403 });
    }

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
      tan: entry.tan,
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

