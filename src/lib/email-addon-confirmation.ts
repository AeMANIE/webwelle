import { sendEmail } from './email';
import { WW_COLORS, WW_EMAIL } from './design-tokens';

const C = WW_COLORS;

interface AddonConfirmationData {
  customerName: string;
  customerEmail: string;
  addonLabel: string;
  addonPrice: string;
  billing: 'oneTime' | 'monthly';
  sessionId: string;
  bookingId?: string;
}

export async function sendAddonConfirmation(data: AddonConfirmationData) {
  const { customerName, customerEmail, addonLabel, addonPrice, billing, sessionId } = data;

  const subject = `Add-on Bestätigung - ${addonLabel} | WebWelle`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Add-on Bestätigung - WebWelle</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: ${C.background}; color: ${C.foreground};">
      <div style="max-width: 600px; margin: 0 auto; padding: 28px 16px;">
        <div style="border: 1px solid ${WW_EMAIL.brandBorder}; border-radius: 16px; overflow: hidden; background: ${WW_EMAIL.cardGradient}; box-shadow: 0 24px 80px rgba(0,0,0,.35);">
          
          <div style="padding: 34px 30px 22px; border-bottom: 1px solid ${WW_EMAIL.brandBorderLight}; text-align: center;">
            <div style="letter-spacing: .18em; text-transform: uppercase; color: ${C.primary}; font-size: 12px; font-weight: 700;">WebWelle</div>
            <h1 style="color: ${C.foreground}; font-size: 26px; font-weight: 700; margin: 12px 0 6px 0;">Add-on Bestätigung</h1>
          </div>

          <div style="padding: 30px;">
            <h2 style="color: ${C.foreground}; font-size: 22px; font-weight: 600; margin: 0 0 20px 0;">Add-on erfolgreich bestellt!</h2>
            
            <p style="color: #cbd5e1; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
              Hallo ${customerName},
            </p>
            
            <p style="color: #cbd5e1; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
              vielen Dank für Ihre Add-on Bestellung! Ihr zusätzlicher Service wurde erfolgreich zu Ihrem bestehenden Paket hinzugefügt.
            </p>

            <div style="background: rgba(255,255,255,.045); border: 1px solid rgba(255,255,255,.1); border-radius: 12px; padding: 24px; margin: 30px 0;">
              <h3 style="color: ${C.foreground}; font-size: 18px; margin: 0 0 20px 0;">Add-on Details</h3>
              
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid ${C.border};">
                <span style="color: ${C.mutedForeground}; font-weight: 500;">Service</span>
                <span style="color: ${C.foreground}; font-weight: 600;">${addonLabel}</span>
              </div>
              
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid ${C.border};">
                <span style="color: ${C.mutedForeground}; font-weight: 500;">Zahlungsart</span>
                <span style="color: ${C.foreground}; font-weight: 600;">${billing === 'monthly' ? 'Monatlich' : 'Einmalzahlung'}</span>
              </div>
              
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid ${C.border};">
                <span style="color: ${C.mutedForeground}; font-weight: 500;">Preis</span>
                <span style="color: ${C.primary}; font-weight: 600;">${addonPrice}</span>
              </div>
              
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0;">
                <span style="color: ${C.mutedForeground}; font-weight: 500;">Bestell-ID</span>
                <span style="color: ${C.mutedForeground}; font-family: monospace; font-size: 14px;">${sessionId}</span>
              </div>
            </div>

            <div style="background: rgba(102, 153, 255, 0.08); border: 1px solid rgba(102, 153, 255, 0.2); border-radius: 12px; padding: 24px; margin: 30px 0;">
              <h3 style="color: ${C.info}; font-size: 18px; margin: 0 0 15px 0;">Nächste Schritte</h3>
              <ol style="color: #cbd5e1; font-size: 16px; line-height: 1.6; margin: 0; padding-left: 20px;">
                <li style="margin-bottom: 8px;">Unser Team wird sich innerhalb von 24 Stunden bei Ihnen melden</li>
                <li style="margin-bottom: 8px;">Wir besprechen die Integration des Add-ons in Ihr bestehendes Projekt</li>
                <li style="margin-bottom: 8px;">Die Implementierung beginnt nach der Abstimmung</li>
                <li>Sie erhalten Updates zum Fortschritt der Add-on Integration</li>
              </ol>
            </div>

            <div style="text-align: center; margin: 40px 0 20px 0;">
              <p style="color: ${C.mutedForeground}; font-size: 14px; margin: 0 0 10px 0;">
                Bei Fragen stehen wir Ihnen gerne zur Verfügung:
              </p>
              <p style="color: ${C.primary}; font-size: 16px; font-weight: 600; margin: 0;">
                📧 info@webwelle.com
              </p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="https://webwelle.com/customer" 
                 style="display: inline-block; background: ${C.brand}; color: ${C.brandForeground}; text-decoration: none; padding: 14px 28px; border-radius: 999px; font-weight: 700; font-size: 16px; box-shadow: 0 10px 26px ${WW_EMAIL.brandShadow};">
                Zum Kundenportal
              </a>
            </div>
          </div>

          <div style="padding: 24px 30px; text-align: center; border-top: 1px solid rgba(255,255,255,.1);">
            <p style="color: ${C.mutedForeground}; font-size: 12px; margin: 0;">
              © ${new Date().getFullYear()} WebWelle. Alle Rechte vorbehalten.
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Add-on Bestätigung - ${addonLabel}

Hallo ${customerName},

vielen Dank für Ihre Add-on Bestellung bei WebWelle! Ihr zusätzlicher Service wurde erfolgreich zu Ihrem bestehenden Paket hinzugefügt.

ADD-ON DETAILS:
- Service: ${addonLabel}
- Zahlungsart: ${billing === 'monthly' ? 'Monatlich' : 'Einmalzahlung'}
- Preis: ${addonPrice}
- Bestell-ID: ${sessionId}

NÄCHSTE SCHRITTE:
1. Unser Team wird sich innerhalb von 24 Stunden bei Ihnen melden
2. Wir besprechen die Integration des Add-ons in Ihr bestehendes Projekt
3. Die Implementierung beginnt nach der Abstimmung
4. Sie erhalten Updates zum Fortschritt der Add-on Integration

Bei Fragen stehen wir Ihnen gerne zur Verfügung:
📧 info@webwelle.com

Zum Kundenportal: https://webwelle.com/customer

© ${new Date().getFullYear()} WebWelle. Alle Rechte vorbehalten.
  `;

  try {
    await sendEmail({
      to: customerEmail,
      subject,
      html,
      text,
    });
    
    console.log(`✅ Add-on Bestätigung erfolgreich an ${customerEmail} gesendet`);
    return { success: true };
  } catch (error) {
    console.error('❌ Fehler beim Senden der Add-on Bestätigung:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unbekannter Fehler' };
  }
}
