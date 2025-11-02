import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

/**
 * Test-Route für SMTP-Verbindung
 * Testet die Verbindung zum SMTP-Server
 */
export async function GET() {
  // Sicherheit: Nur in Development oder mit ALLOW_DEBUG_ROUTES Flag
  // In Production muss ALLOW_DEBUG_ROUTES=true in .env gesetzt sein
  if (process.env.NODE_ENV === 'production') {
    const allowDebug = process.env.ALLOW_DEBUG_ROUTES === 'true';
    if (!allowDebug) {
      return NextResponse.json({
        status: 'error',
        message: 'Debug-Route nur mit ALLOW_DEBUG_ROUTES=true verfügbar'
      }, { status: 403 });
    }
  }

  try {
    const smtpUser = process.env.EMAIL_SMTP_USER;
    const smtpPassword = process.env.EMAIL_SMTP_PASSWORD;

    if (!smtpUser || !smtpPassword) {
      return NextResponse.json({
        status: 'error',
        message: 'EMAIL_SMTP_USER oder EMAIL_SMTP_PASSWORD fehlt',
        config: {
          EMAIL_SMTP_USER: smtpUser ? '✅ gesetzt' : '❌ fehlt',
          EMAIL_SMTP_PASSWORD: smtpPassword ? '✅ gesetzt' : '❌ fehlt',
        }
      }, { status: 400 });
    }

    // SMTP-Transporter erstellen
    const transporter = nodemailer.createTransport({
      host: 'smtp.hostinger.com',
      port: 465,
      secure: true, // SSL/TLS für Port 465
      auth: {
        user: smtpUser,
        pass: smtpPassword
      }
    });

    // Verbindung testen
    console.log('📧 Teste SMTP-Verbindung...');
    await transporter.verify();
    console.log('✅ SMTP-Verbindung erfolgreich!');

    return NextResponse.json({
      status: 'success',
      message: 'SMTP-Verbindung erfolgreich',
      config: {
        host: 'smtp.hostinger.com',
        port: 465,
        secure: true,
        user: smtpUser,
        passwordLength: smtpPassword.length,
        passwordContainsSpecialChars: /[+@#$%^&*(),.?":{}|<>]/.test(smtpPassword),
      }
    });
  } catch (error) {
    console.error('❌ SMTP-Verbindungsfehler:', error);
    
    const errorDetails: Record<string, unknown> = {
      message: error instanceof Error ? error.message : 'Unbekannter Fehler',
    };

    if (error instanceof Error) {
      const smtpError = error as Error & {
        code?: string;
        command?: string;
        response?: string;
        responseCode?: number;
      };
      errorDetails.code = smtpError.code;
      errorDetails.command = smtpError.command;
      errorDetails.response = smtpError.response;
      errorDetails.responseCode = smtpError.responseCode;
      
      // Spezifische Fehlermeldungen
      if (smtpError.code === 'EAUTH' || smtpError.responseCode === 535) {
        errorDetails.hint = 'Authentifizierung fehlgeschlagen. Prüfen Sie Benutzername und Passwort.';
      } else if (smtpError.code === 'ECONNECTION' || smtpError.code === 'ETIMEDOUT') {
        errorDetails.hint = 'Verbindung zum SMTP-Server fehlgeschlagen. Prüfen Sie Hostname und Port.';
      } else if (smtpError.code === 'ESOCKET') {
        errorDetails.hint = 'Socket-Fehler. Prüfen Sie SSL/TLS-Konfiguration.';
      }
    }

    return NextResponse.json({
      status: 'error',
      message: 'SMTP-Verbindung fehlgeschlagen',
      error: errorDetails
    }, { status: 500 });
  }
}

