import { NextRequest, NextResponse } from 'next/server';
import { adminLogin } from '@/lib/auth';
import bcrypt from 'bcryptjs';

/**
 * Test-Route zum Debuggen des Admin-Logins
 * Zeigt detaillierte Informationen über den Login-Versuch
 */
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ 
        error: 'E-Mail und Passwort sind erforderlich',
        received: { email: !!email, password: !!password }
      }, { status: 400 });
    }

    // Zeige Konfiguration (ohne sensibel Daten vollständig)
    const config = {
      adminEmailSet: !!process.env.ADMIN_EMAIL,
      adminEmailValue: process.env.ADMIN_EMAIL,
      adminEmailMatch: email.toLowerCase() === (process.env.ADMIN_EMAIL || '').toLowerCase(),
      hashSet: !!process.env.ADMIN_PASSWORD_HASH,
      hashLength: process.env.ADMIN_PASSWORD_HASH?.length || 0,
      hashPrefix: process.env.ADMIN_PASSWORD_HASH?.substring(0, 20) || 'N/A',
    };

    // Teste Passwort-Verifikation direkt
    let passwordVerification: { match: boolean; error?: string } | null = null;
    if (process.env.ADMIN_PASSWORD_HASH) {
      try {
        const match = await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH);
        passwordVerification = { match };
      } catch (error) {
        passwordVerification = { 
          match: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        };
      }
    }

    // Versuche Login
    let loginResult = null;
    try {
      loginResult = await adminLogin(email, password);
    } catch (error) {
      loginResult = { 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      };
    }

    return NextResponse.json({
      config,
      passwordVerification,
      loginAttempt: {
        success: !!loginResult && 'user' in loginResult,
        hasError: !!loginResult && 'error' in loginResult,
        error: loginResult && 'error' in loginResult ? loginResult.error : null,
      },
      recommendations: [
        !config.adminEmailSet ? '❌ ADMIN_EMAIL fehlt in Umgebungsvariablen' : null,
        !config.hashSet ? '❌ ADMIN_PASSWORD_HASH fehlt in Umgebungsvariablen' : null,
        !config.adminEmailMatch ? `❌ E-Mail stimmt nicht überein. Erwartet: ${config.adminEmailValue}, Erhalten: ${email}` : null,
        passwordVerification && !passwordVerification.match ? '❌ Passwort-Hash stimmt NICHT mit dem eingegebenen Passwort überein!' : null,
        passwordVerification && passwordVerification.match ? '✅ Passwort-Hash stimmt überein' : null,
        config.hashLength !== 60 ? `⚠️ Hash-Länge ungewöhnlich (erwartet: 60, aktuell: ${config.hashLength})` : null,
      ].filter(Boolean),
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Interner Serverfehler',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}

