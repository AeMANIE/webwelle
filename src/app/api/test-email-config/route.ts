import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';
import { WW_COLORS } from '@/lib/design-tokens';

const C = WW_COLORS;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const testEmail = searchParams.get('email') || 'test@example.com';

    // Teste E-Mail-Konfiguration
    const result = await sendEmail({
      to: testEmail,
      subject: 'WebWelle - E-Mail-Konfiguration Test',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: ${C.background}; color: ${C.foreground}; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: ${C.brand}; margin: 0;">WebWelle</h1>
            <p style="color: ${C.mutedForeground}; margin: 5px 0;">E-Mail-Konfiguration Test</p>
          </div>
          
          <div style="background: ${C.card}; padding: 30px; border-radius: 10px; text-align: center;">
            <h2 style="color: #ffffff; margin-bottom: 20px;">✅ E-Mail-Konfiguration erfolgreich!</h2>
            <p style="color: #a0a0a0; margin-bottom: 20px;">
              Die E-Mail-Konfiguration funktioniert korrekt.
            </p>
            <p style="color: #a0a0a0; font-size: 14px;">
              Sie können jetzt Buchungsbestätigungen und Add-on Bestätigungen per E-Mail empfangen.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #374151;">
            <p style="color: #a0a0a0; font-size: 12px;">
              WebWelle | Allgäu | Bayern<br>
              E-Mail: info@webwelle.com
            </p>
          </div>
        </div>
      `,
      text: 'WebWelle - E-Mail-Konfiguration Test\n\nDie E-Mail-Konfiguration funktioniert korrekt!'
    });

    return NextResponse.json({ 
      success: result,
      message: result ? 'E-Mail erfolgreich gesendet' : 'Fehler beim Senden der E-Mail',
      config: {
        host: process.env.EMAIL_SMTP_HOST,
        port: process.env.EMAIL_SMTP_PORT,
        user: process.env.EMAIL_SMTP_USER,
        secure: process.env.EMAIL_SMTP_SECURE,
        from: process.env.EMAIL_FROM
      }
    });

  } catch (error) {
    console.error('E-Mail-Konfiguration Test Fehler:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unbekannter Fehler',
      config: {
        host: process.env.EMAIL_SMTP_HOST,
        port: process.env.EMAIL_SMTP_PORT,
        user: process.env.EMAIL_SMTP_USER,
        secure: process.env.EMAIL_SMTP_SECURE,
        from: process.env.EMAIL_FROM
      }
    }, { status: 500 });
  }
}
