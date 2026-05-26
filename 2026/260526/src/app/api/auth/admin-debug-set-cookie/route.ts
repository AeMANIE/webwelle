import { NextRequest, NextResponse } from 'next/server';

/**
 * DEBUG-ONLY: Setzt ein Admin-Login-Cookie ohne Passwortprüfung.
 * DEAKTIVIERT: Diese Route ist aus Sicherheitsgründen deaktiviert.
 * Verwenden Sie stattdessen den 2-Schritt-Login mit TAN.
 *
 * Nutzung (POST): /api/auth/admin-debug-set-cookie
 * Body (optional): { email?: string }
 */
export async function POST(request: NextRequest) {
  // IMMER deaktiviert - keine Umgehung des TAN-Systems
  return NextResponse.json({ 
    error: 'Diese Route ist aus Sicherheitsgründen deaktiviert. Bitte verwenden Sie den 2-Schritt-Login mit TAN.' 
  }, { status: 403 });
}

// Komfort: Cookie auch per GET setzen (einfach via Link im Browser)
// DEAKTIVIERT: Diese Route ist aus Sicherheitsgründen deaktiviert.
export async function GET(request: NextRequest) {
  // IMMER deaktiviert - keine Umgehung des TAN-Systems
  return NextResponse.json({ 
    error: 'Diese Route ist aus Sicherheitsgründen deaktiviert. Bitte verwenden Sie den 2-Schritt-Login mit TAN.' 
  }, { status: 403 });
}


