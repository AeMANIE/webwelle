import { NextRequest, NextResponse } from 'next/server';
import { createToken } from '@/lib/auth';

/**
 * DEBUG-ONLY: Setzt ein Admin-Login-Cookie ohne Passwortprüfung.
 * Aktiv nur, wenn ALLOW_DEBUG_ROUTES=true gesetzt ist.
 *
 * Nutzung (POST): /api/auth/admin-debug-set-cookie
 * Body (optional): { email?: string }
 */
export async function POST(request: NextRequest) {
  try {
    if (process.env.ALLOW_DEBUG_ROUTES !== 'true') {
      return NextResponse.json({ error: 'Debug-Routen sind deaktiviert' }, { status: 403 });
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      return NextResponse.json({ error: 'ADMIN_EMAIL fehlt' }, { status: 500 });
    }

    let bodyEmail: string | undefined;
    try {
      const body = await request.json().catch(() => ({}));
      bodyEmail = body?.email;
    } catch {}

    const email = (bodyEmail || adminEmail).toLowerCase();

    const user = {
      id: 'admin-1',
      email,
      role: 'admin' as const,
      name: 'WebWelle Admin',
    };

    const token = createToken(user);
    const response = NextResponse.json({ success: true, user });
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60,
      path: '/',
    });
    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Interner Fehler' }, { status: 500 });
  }
}


