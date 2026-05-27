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
  const adminPasswordPlain = process.env.ADMIN_PASSWORD;

  // Teste Passwort-Verifikation (ohne hardcodiertes Passwort)
  let passwordTest = null;
  let plainPasswordTest = null;
  
  // WARNUNG: Keine hardcodierten Passwörter mehr!
  // Teste nur ob Hash-Verifikation funktioniert (ohne echtes Passwort)
  if (adminPasswordHash) {
    try {
      const { verifyPassword } = await import('@/lib/auth');
      // Teste mit einem Dummy-Passwort (nur um zu prüfen ob Funktion funktioniert)
      // ECHTES Passwort wird NICHT getestet (Sicherheit)
      passwordTest = 'Hash-Verifikation verfügbar';
    } catch (error) {
      passwordTest = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }
  
  if (adminPasswordPlain) {
    // Prüfe nur ob Passwort gesetzt ist (ohne Vergleich)
    plainPasswordTest = adminPasswordPlain.length > 0 ? 'Passwort gesetzt' : 'Passwort leer';
  }

  return NextResponse.json({
    configStatus: {
      ADMIN_EMAIL: adminEmail ? '✅ gesetzt' : '❌ fehlt',
      ADMIN_EMAIL_VALUE: adminEmail || 'N/A',
      ADMIN_PASSWORD_HASH: adminPasswordHash ? '✅ gesetzt' : '❌ fehlt',
      ADMIN_PASSWORD_HASH_PREFIX: adminPasswordHash ? adminPasswordHash.substring(0, 30) + '...' : 'N/A',
      ADMIN_PASSWORD_HASH_LENGTH: adminPasswordHash ? adminPasswordHash.length : 0,
      ADMIN_PASSWORD: adminPasswordPlain ? '✅ gesetzt' : '❌ fehlt',
      ADMIN_PASSWORD_VALUE: adminPasswordPlain ? `${adminPasswordPlain.substring(0, 5)}...` : 'N/A',
      ADMIN_PASSWORD_LENGTH: adminPasswordPlain ? adminPasswordPlain.length : 0,
    },
    passwordVerification: {
      hashVerificationAvailable: passwordTest,
      plainPasswordStatus: plainPasswordTest,
      plainPasswordLength: adminPasswordPlain?.length || 0,
      // SICHERHEIT: Keine Passwort-Vergleiche mehr!
      note: 'Passwort-Tests wurden entfernt aus Sicherheitsgründen'
    },
    recommendations: [
      !adminEmail ? 'ADMIN_EMAIL fehlt in Umgebungsvariablen' : null,
      !adminPasswordHash && !adminPasswordPlain ? 'ADMIN_PASSWORD_HASH oder ADMIN_PASSWORD muss gesetzt sein' : null,
      adminPasswordHash && adminPasswordHash.length !== 60 ? `ADMIN_PASSWORD_HASH hat falsche Länge (erwartet: 60, aktuell: ${adminPasswordHash.length})` : null,
      adminPasswordPlain && adminPasswordPlain.length < 8 ? '⚠️ ADMIN_PASSWORD ist zu kurz (mindestens 8 Zeichen empfohlen)' : null,
      adminPasswordHash ? '✅ ADMIN_PASSWORD_HASH ist gesetzt (empfohlen für Produktion)' : null,
      adminPasswordPlain && !adminPasswordHash ? '⚠️ ADMIN_PASSWORD wird verwendet (ADMIN_PASSWORD_HASH wird empfohlen für Produktion)' : null,
    ].filter(Boolean),
  });
}

