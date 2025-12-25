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

  // Teste Passwort-Verifikation (nur wenn Test-Passwort als Parameter übergeben wird)
  let passwordTest = null;
  let plainPasswordTest = null;
  
  // Hole Test-Passwort aus Query-Parameter (nicht hardcoded!)
  const testPassword = request.nextUrl.searchParams.get('testPassword');
  
  if (testPassword && adminPasswordHash) {
    try {
      const { verifyPassword } = await import('@/lib/auth');
      passwordTest = await verifyPassword(testPassword, adminPasswordHash);
    } catch (error) {
      passwordTest = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }
  
  if (testPassword && adminPasswordPlain) {
    plainPasswordTest = testPassword === adminPasswordPlain;
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
    passwordVerification: testPassword ? {
      testPasswordProvided: true,
      testPasswordLength: testPassword.length,
      hashMatch: passwordTest,
      plainMatch: plainPasswordTest,
      passwordsEqual: testPassword === adminPasswordPlain,
    } : {
      testPasswordProvided: false,
      note: 'Kein Test-Passwort übergeben. Verwenden Sie ?testPassword=... als Query-Parameter zum Testen.'
    },
    recommendations: [
      !adminEmail ? 'ADMIN_EMAIL fehlt in Umgebungsvariablen' : null,
      !adminPasswordHash && !adminPasswordPlain ? 'ADMIN_PASSWORD_HASH oder ADMIN_PASSWORD muss gesetzt sein' : null,
      adminPasswordHash && adminPasswordHash.length !== 60 ? `ADMIN_PASSWORD_HASH hat falsche Länge (erwartet: 60, aktuell: ${adminPasswordHash.length})` : null,
      testPassword && passwordTest === false ? `Passwort-Hash stimmt NICHT mit dem Test-Passwort überein. Hash neu generieren!` : null,
      testPassword && passwordTest === true ? '✅ Passwort-Hash stimmt mit dem Test-Passwort überein' : null,
      testPassword && plainPasswordTest === false ? '⚠️ ADMIN_PASSWORD stimmt NICHT mit dem Test-Passwort überein. Prüfe Umgebungsvariablen!' : null,
      testPassword && plainPasswordTest === true ? '✅ ADMIN_PASSWORD stimmt mit dem Test-Passwort überein' : null,
    ].filter(Boolean),
  });
}

