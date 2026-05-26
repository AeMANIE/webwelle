import { sendEmail } from './email';

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
  const { customerName, customerEmail, addonLabel, addonPrice, billing, sessionId, bookingId } = data;

  const subject = `Add-on Bestätigung - ${addonLabel} | WebWelle`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Add-on Bestätigung - WebWelle</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 40px 30px; text-align: center;">
          <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0 0 10px 0;">WebWelle</h1>
          <p style="color: #e0e7ff; font-size: 16px; margin: 0;">Add-on Bestätigung</p>
        </div>

        <!-- Content -->
        <div style="padding: 40px 30px;">
          <h2 style="color: #1f2937; font-size: 24px; font-weight: 600; margin: 0 0 20px 0;">Add-on erfolgreich bestellt!</h2>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Hallo ${customerName},
          </p>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
            vielen Dank für Ihre Add-on Bestellung! Ihr zusätzlicher Service wurde erfolgreich zu Ihrem bestehenden Paket hinzugefügt.
          </p>

          <!-- Add-on Details -->
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; margin: 30px 0;">
            <h3 style="color: #1f2937; font-size: 18px; margin: 0 0 20px 0;">Add-on Details</h3>
            
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
              <span style="color: #6b7280; font-weight: 500;">Service</span>
              <span style="color: #1f2937; font-weight: 600;">${addonLabel}</span>
            </div>
            
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
              <span style="color: #6b7280; font-weight: 500;">Zahlungsart</span>
              <span style="color: #1f2937; font-weight: 600;">${billing === 'monthly' ? 'Monatlich' : 'Einmalzahlung'}</span>
            </div>
            
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
              <span style="color: #6b7280; font-weight: 500;">Preis</span>
              <span style="color: #1f2937; font-weight: 600;">${addonPrice}</span>
            </div>
            
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0;">
              <span style="color: #6b7280; font-weight: 500;">Bestell-ID</span>
              <span style="color: #6b7280; font-family: monospace; font-size: 14px;">${sessionId}</span>
            </div>
          </div>

          <!-- Next Steps -->
          <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 24px; margin: 30px 0;">
            <h3 style="color: #0c4a6e; font-size: 18px; margin: 0 0 15px 0;">Nächste Schritte</h3>
            <ol style="color: #0c4a6e; font-size: 16px; line-height: 1.6; margin: 0; padding-left: 20px;">
              <li style="margin-bottom: 8px;">Unser Team wird sich innerhalb von 24 Stunden bei Ihnen melden</li>
              <li style="margin-bottom: 8px;">Wir besprechen die Integration des Add-ons in Ihr bestehendes Projekt</li>
              <li style="margin-bottom: 8px;">Die Implementierung beginnt nach der Abstimmung</li>
              <li>Sie erhalten Updates zum Fortschritt der Add-on Integration</li>
            </ol>
          </div>

          <!-- Contact Info -->
          <div style="text-align: center; margin: 40px 0 20px 0;">
            <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
              Bei Fragen stehen wir Ihnen gerne zur Verfügung:
            </p>
            <p style="color: #3b82f6; font-size: 16px; font-weight: 600; margin: 0;">
              📧 info@webwelle.com | 📞 +49 (0) 123 456 789
            </p>
          </div>

          <!-- CTA -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://webwelle.com/customer" 
               style="display: inline-block; background-color: #3b82f6; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 16px;">
              Zum Kundenportal
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
            © 2024 WebWelle. Alle Rechte vorbehalten.
          </p>
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            Diese E-Mail wurde automatisch generiert. Bitte antworten Sie nicht direkt auf diese E-Mail.
          </p>
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
📧 info@webwelle.com | 📞 +49 (0) 123 456 789

Zum Kundenportal: https://webwelle.com/customer

© 2024 WebWelle. Alle Rechte vorbehalten.
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
