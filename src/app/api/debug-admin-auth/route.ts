import { NextRequest, NextResponse } from 'next/server';

/**
 * Debug-Route zum Prüfen der Admin-Auth-Konfiguration
 * NUR FÜR DEBUGGING - In Produktion entfernen oder schützen!
 */
export async function GET(request: NextRequest) {
  // Sicherheit: Nur wenn explizit erlaubt
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEBUG_ROUTES !== 'true') {
    return NextResponse.json({
      error: 'Debug-Route nur in Development oder mit ALLOW_DEBUG_ROUTES=true verfügbar'
    }, { status: 403 });
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;

  // Teste Passwort-Verifikation
  let passwordTest = null;
  if (adminPasswordHash) {
    try {
      const { verifyPassword } = await import('@/lib/auth');
      // Teste mit dem Passwort, das der User verwendet
      passwordTest = await verifyPassword('87437Kempten+', adminPasswordHash);
    } catch (error) {
      passwordTest = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  return NextResponse.json({
    configStatus: {
      ADMIN_EMAIL: adminEmail ? '✅ gesetzt' : '❌ fehlt',
      ADMIN_PASSWORD_HASH: adminPasswordHash ? '✅ gesetzt' : '❌ fehlt',
      ADMIN_EMAIL_VALUE: adminEmail || 'N/A',
      ADMIN_PASSWORD_HASH_PREFIX: adminPasswordHash ? adminPasswordHash.substring(0, 30) + '...' : 'N/A',
      ADMIN_PASSWORD_HASH_LENGTH: adminPasswordHash ? adminPasswordHash.length : 0,
    },
    passwordVerification: {
      testPassword: '87437Kempten+',
      hashMatch: passwordTest,
    },
    recommendations: [
      !adminEmail ? 'ADMIN_EMAIL fehlt in Umgebungsvariablen' : null,
      !adminPasswordHash ? 'ADMIN_PASSWORD_HASH fehlt in Umgebungsvariablen' : null,
      adminPasswordHash && adminPasswordHash.length !== 60 ? `ADMIN_PASSWORD_HASH hat falsche Länge (erwartet: 60, aktuell: ${adminPasswordHash.length})` : null,
      passwordTest === false ? 'Passwort-Hash stimmt NICHT mit "87437Kempten+" überein. Hash neu generieren!' : null,
      passwordTest === true ? '✅ Passwort-Hash stimmt mit "87437Kempten+" überein' : null,
    ].filter(Boolean),
  });
}

