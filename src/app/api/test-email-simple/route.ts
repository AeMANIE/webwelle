import { NextRequest, NextResponse } from 'next/server';
import { sendBookingConfirmation } from '@/lib/email-confirmation';
import { sendEmail } from '@/lib/email';

/**
 * Einfache Test-Route für E-Mail-Versand (ohne Datenbank)
 * Testet nur den E-Mail-Versand, ohne Portal-Aktivierung
 */
export async function POST(request: NextRequest) {
  // Sicherheit: Nur in Development oder mit ALLOW_DEBUG_ROUTES Flag
  if (process.env.NODE_ENV === 'production') {
    const allowDebug = process.env.ALLOW_DEBUG_ROUTES === 'true';
    if (!allowDebug) {
      return NextResponse.json({
        status: 'error',
        message: 'Test-Route nur mit ALLOW_DEBUG_ROUTES=true verfügbar'
      }, { status: 403 });
    }
  }

  try {
    const body = await request.json();
    const {
      customerEmail = 'harmonie_556@yahoo.com',
      customerName = 'Test Kunde',
    } = body;

    console.log('📧 Teste einfachen E-Mail-Versand...');
    console.log('📧 Konfiguration:', {
      EMAIL_SMTP_USER: process.env.EMAIL_SMTP_USER ? '✅ gesetzt' : '❌ fehlt',
      EMAIL_SMTP_PASSWORD: process.env.EMAIL_SMTP_PASSWORD ? '✅ gesetzt' : '❌ fehlt',
      EMAIL_FROM: process.env.EMAIL_FROM || 'info@webwelle.com',
    });

    // Test 1: Einfache E-Mail über sendEmail()
    console.log('📧 Test 1: Sende einfache E-Mail...');
    const simpleEmailResult = await sendEmail({
      to: customerEmail,
      subject: 'Test-E-Mail von WebWelle',
      html: `
        <h1>Test-E-Mail</h1>
        <p>Hallo ${customerName},</p>
        <p>Dies ist eine Test-E-Mail von WebWelle.</p>
        <p>Wenn Sie diese E-Mail erhalten, funktioniert die SMTP-Konfiguration korrekt.</p>
      `,
      text: `Test-E-Mail\n\nHallo ${customerName},\n\nDies ist eine Test-E-Mail von WebWelle.`,
    });

    // Test 2: Bestellbestätigung senden
    console.log('📧 Test 2: Sende Bestellbestätigung...');
    const bookingResult = await sendBookingConfirmation({
      customerName,
      customerEmail,
      packageName: 'StarterWelle',
      packagePrice: '1.520,00 €',
      isMonthly: true,
      selectedAddons: [
        {
          label: 'Terminbuchungs-System',
          price: '145,99 €',
          billing: 'monthly'
        }
      ],
      totalAmount: 1665.99,
      currency: 'eur',
      sessionId: 'test_session_' + Date.now(),
    });

    return NextResponse.json({
      status: 'success',
      message: 'E-Mail-Tests abgeschlossen',
      results: {
        simpleEmail: simpleEmailResult ? '✅ Erfolg' : '❌ Fehlgeschlagen',
        bookingConfirmation: bookingResult.success ? '✅ Erfolg' : `❌ Fehlgeschlagen: ${bookingResult.error || 'Unbekannter Fehler'}`,
      },
      config: {
        customerEmail,
        customerName,
        smtpUser: process.env.EMAIL_SMTP_USER ? '✅ gesetzt' : '❌ fehlt',
        smtpPassword: process.env.EMAIL_SMTP_PASSWORD ? '✅ gesetzt' : '❌ fehlt',
      }
    });
  } catch (error) {
    console.error('❌ Fehler beim Testen der E-Mails:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Fehler beim Senden der Test-E-Mails',
      error: error instanceof Error ? error.message : 'Unbekannter Fehler',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

