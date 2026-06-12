import { sendEmail } from './email';
import { WW_COLORS, WW_EMAIL } from './design-tokens';

const C = WW_COLORS;

interface BookingConfirmationData {
  customerName: string;
  customerEmail: string;
  packageName: string;
  packagePrice: string;
  isMonthly: boolean;
  selectedAddons: Array<{
    label: string;
    price: string;
    billing: 'oneTime' | 'monthly' | 'yearly';
  }>;
  totalAmount: number;
  currency: string;
  sessionId: string;
}

export async function sendBookingConfirmation(data: BookingConfirmationData) {
  const { customerName, customerEmail, packageName, packagePrice, isMonthly, selectedAddons, totalAmount, currency, sessionId } = data;

  const subject = `Buchungsbestätigung - ${packageName} | WebWelle`;
  
  const addonsHtml = selectedAddons.length > 0 
    ? `
      <h3 style="color: ${C.foreground}; font-size: 18px; margin: 20px 0 10px 0;">Zusatzoptionen:</h3>
      <ul style="list-style: none; padding: 0; margin: 0 0 20px 0;">
        ${selectedAddons.map(addon => `
          <li style="padding: 8px 0; border-bottom: 1px solid ${C.border};">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="color: #cbd5e1;">${addon.label}</span>
              <span style="color: ${C.brand}; font-weight: 600;">${addon.price} ${addon.billing === 'monthly' ? 'mtl.' : addon.billing === 'yearly' ? 'jährlich' : ''}</span>
            </div>
          </li>
        `).join('')}
      </ul>
    `
    : '';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Buchungsbestätigung - WebWelle</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: ${C.background}; color: ${C.foreground};">
      <div style="max-width: 600px; margin: 0 auto; padding: 28px 16px;">
        <div style="border: 1px solid ${WW_EMAIL.brandBorder}; border-radius: 16px; overflow: hidden; background: ${WW_EMAIL.cardGradient}; box-shadow: 0 24px 80px rgba(0,0,0,.35);">
          
          <div style="padding: 34px 30px 22px; border-bottom: 1px solid ${WW_EMAIL.brandBorderLight}; text-align: center;">
            <div style="letter-spacing: .18em; text-transform: uppercase; color: ${C.brand}; font-size: 12px; font-weight: 700;">WebWelle</div>
            <h1 style="color: ${C.foreground}; font-size: 26px; font-weight: 700; margin: 12px 0 6px 0;">Ihre Buchungsbestätigung</h1>
          </div>

          <div style="padding: 30px;">
            <h2 style="color: ${C.foreground}; font-size: 22px; font-weight: 600; margin: 0 0 20px 0;">Vielen Dank für Ihre Buchung!</h2>
            
            <p style="color: #cbd5e1; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
              Hallo ${customerName},
            </p>
            
            <p style="color: #cbd5e1; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
              wir freuen uns, dass Sie sich für ${packageName} entschieden haben! Ihre Buchung wurde erfolgreich verarbeitet.
            </p>

            <div style="background: rgba(255,255,255,.045); border: 1px solid rgba(255,255,255,.1); border-radius: 12px; padding: 24px; margin: 30px 0;">
              <h3 style="color: ${C.foreground}; font-size: 18px; margin: 0 0 20px 0;">Buchungsdetails</h3>
              
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid ${C.border};">
                <span style="color: ${C.mutedForeground}; font-weight: 500;">Paket</span>
                <span style="color: ${C.foreground}; font-weight: 600;">${packageName}</span>
              </div>
              
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid ${C.border};">
                <span style="color: ${C.mutedForeground}; font-weight: 500;">Zahlungsart</span>
                <span style="color: ${C.foreground}; font-weight: 600;">${isMonthly ? 'Monatlich' : 'Einmalzahlung'}</span>
              </div>
              
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid ${C.border};">
                <span style="color: ${C.mutedForeground}; font-weight: 500;">Preis</span>
                <span style="color: ${C.foreground}; font-weight: 600;">${packagePrice}</span>
              </div>
              
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0;">
                <span style="color: ${C.mutedForeground}; font-weight: 500;">Buchungs-ID</span>
                <span style="color: ${C.mutedForeground}; font-family: monospace; font-size: 14px;">${sessionId}</span>
              </div>
            </div>

            ${addonsHtml}

            <div style="background: ${C.brand}; color: ${C.brandForeground}; border-radius: 12px; padding: 20px; margin: 30px 0; text-align: center;">
              <h3 style="color: ${C.brandForeground}; font-size: 18px; margin: 0 0 10px 0;">Gesamtbetrag</h3>
              <p style="color: ${C.brandForeground}; font-size: 32px; font-weight: 700; margin: 0;">${totalAmount.toFixed(2)} ${currency.toUpperCase()}</p>
            </div>

            <div style="background: rgba(102, 153, 255, 0.08); border: 1px solid rgba(102, 153, 255, 0.2); border-radius: 12px; padding: 24px; margin: 30px 0;">
              <h3 style="color: ${C.info}; font-size: 18px; margin: 0 0 15px 0;">Nächste Schritte</h3>
              <ol style="color: #cbd5e1; font-size: 16px; line-height: 1.6; margin: 0; padding-left: 20px;">
                <li style="margin-bottom: 8px;">Unser Team wird sich innerhalb von 24 Stunden bei Ihnen melden</li>
                <li style="margin-bottom: 8px;">Wir besprechen Ihre Anforderungen und den Projektablauf</li>
                <li style="margin-bottom: 8px;">Die Entwicklung Ihres Projekts beginnt nach der Abstimmung</li>
                <li>Sie erhalten regelmäßige Updates zum Projektfortschritt</li>
              </ol>
            </div>

            <div style="text-align: center; margin: 40px 0 20px 0;">
              <p style="color: ${C.mutedForeground}; font-size: 14px; margin: 0 0 10px 0;">
                Bei Fragen stehen wir Ihnen gerne zur Verfügung:
              </p>
              <p style="color: ${C.brand}; font-size: 16px; font-weight: 600; margin: 0;">
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
Buchungsbestätigung - ${packageName}

Hallo ${customerName},

vielen Dank für Ihre Buchung bei WebWelle! Ihre Buchung wurde erfolgreich verarbeitet.

BUCHUNGSDETAILS:
- Paket: ${packageName}
- Zahlungsart: ${isMonthly ? 'Monatlich' : 'Einmalzahlung'}
- Preis: ${packagePrice}
- Buchungs-ID: ${sessionId}

${selectedAddons.length > 0 ? 'ZUSATZOPTIONEN:\n' + selectedAddons.map(addon => `- ${addon.label}: ${addon.price} ${addon.billing === 'monthly' ? 'mtl.' : addon.billing === 'yearly' ? 'jährlich' : ''}`).join('\n') + '\n' : ''}

GESAMTBETRAG: ${totalAmount.toFixed(2)} ${currency.toUpperCase()}

NÄCHSTE SCHRITTE:
1. Unser Team wird sich innerhalb von 24 Stunden bei Ihnen melden
2. Wir besprechen Ihre Anforderungen und den Projektablauf
3. Die Entwicklung Ihres Projekts beginnt nach der Abstimmung
4. Sie erhalten regelmäßige Updates zum Projektfortschritt

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
    
    console.log(`✅ Buchungsbestätigung erfolgreich an ${customerEmail} gesendet`);
    return { success: true };
  } catch (error) {
    console.error('❌ Fehler beim Senden der Buchungsbestätigung:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unbekannter Fehler' };
  }
}
