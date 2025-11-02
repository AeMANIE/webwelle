import { NextRequest, NextResponse } from 'next/server';
import { sendBookingConfirmation } from '@/lib/email-confirmation';
import { sendPortalActivationEmail } from '@/lib/email-portal-activation';
import { generateActivationToken, saveActivationToken } from '@/lib/portal-activation';

/**
 * Test-Route für E-Mail-Versand nach Bestellung
 * Simuliert eine Bestellung und sendet E-Mails
 */
export async function POST(request: NextRequest) {
  // Sicherheit: Nur in Development oder mit API-Key
  if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_DEBUG_ROUTES) {
    return NextResponse.json({
      status: 'error',
      message: 'Test-Route nur in Development verfügbar'
    }, { status: 403 });
  }

  try {
    const body = await request.json();
    const {
      customerEmail = 'harmonie_556@yahoo.com',
      customerName = 'Test Kunde',
      packageType = 'starterwelle',
      packageCategory = 'webdesign',
      isMonthly = true,
    } = body;

    console.log('📧 Teste E-Mail-Versand...');
    console.log('📧 Konfiguration:', {
      EMAIL_SMTP_USER: process.env.EMAIL_SMTP_USER ? '✅ gesetzt' : '❌ fehlt',
      EMAIL_SMTP_PASSWORD: process.env.EMAIL_SMTP_PASSWORD ? '✅ gesetzt' : '❌ fehlt',
      EMAIL_FROM: process.env.EMAIL_FROM || 'info@webwelle.com',
    });

    // 1. Bestellbestätigung senden
    console.log('📧 Versende Bestellbestätigung...');
    const bookingResult = await sendBookingConfirmation({
      customerName,
      customerEmail,
      packageName: 'StarterWelle',
      packagePrice: '1.520,00 €',
      isMonthly,
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

    if (!bookingResult.success) {
      return NextResponse.json({
        status: 'error',
        message: 'Bestellbestätigung fehlgeschlagen',
        error: bookingResult.error,
        bookingResult
      }, { status: 500 });
    }

    // 2. Portal-Aktivierungs-E-Mail senden (nur wenn packageCategory = webdesign)
    let activationResult = null;
    if (packageCategory === 'webdesign') {
      console.log('📧 Versende Portal-Aktivierungs-E-Mail...');
      const activationToken = generateActivationToken();
      
      // Token speichern
      await saveActivationToken(
        customerEmail,
        activationToken,
        'test_session_' + Date.now()
      );

      activationResult = await sendPortalActivationEmail({
        customerName,
        customerEmail,
        activationToken,
      });
    }

    return NextResponse.json({
      status: 'success',
      message: 'E-Mails erfolgreich gesendet',
      results: {
        bookingConfirmation: bookingResult,
        portalActivation: activationResult,
      },
      config: {
        customerEmail,
        customerName,
        packageType,
        packageCategory,
        isMonthly,
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

