import { sendEmail } from './email';

interface PortalActivationData {
  customerName: string;
  customerEmail: string;
  activationToken: string;
}

export async function sendPortalActivationEmail(data: PortalActivationData): Promise<{ success: boolean; error?: string }> {
  const { customerName, customerEmail, activationToken } = data;
  
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://webwelle.com';
  const activationLink = `${baseUrl}/customer/activate?token=${activationToken}`;
  
  const subject = 'Ihr Kundenportal ist bereit | WebWelle';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Kundenportal aktivieren - WebWelle</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #DCA441 0%, #B8942E 100%); padding: 40px 30px; text-align: center;">
          <h1 style="color: #0e141f; font-size: 28px; font-weight: 700; margin: 0 0 10px 0;">WebWelle</h1>
          <p style="color: #1a2332; font-size: 16px; margin: 0;">Ihr Kundenportal aktivieren</p>
        </div>

        <!-- Content -->
        <div style="padding: 40px 30px;">
          <h2 style="color: #1f2937; font-size: 24px; font-weight: 600; margin: 0 0 20px 0;">Willkommen im Kundenportal!</h2>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Hallo ${customerName},
          </p>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
            Ihr Kundenportal bei WebWelle ist jetzt bereit! Im Portal können Sie:
          </p>

          <!-- Features -->
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; margin: 30px 0;">
            <ul style="list-style: none; padding: 0; margin: 0;">
              <li style="padding: 8px 0; color: #374151; font-size: 16px;">
                ✅ Alle Ihre Pakete und Bestellungen einsehen
              </li>
              <li style="padding: 8px 0; color: #374151; font-size: 16px;">
                ✅ Rechnungen herunterladen
              </li>
              <li style="padding: 8px 0; color: #374151; font-size: 16px;">
                ✅ Subscriptions verwalten und kündigen
              </li>
              <li style="padding: 8px 0; color: #374151; font-size: 16px;">
                ✅ Support-Anfragen stellen
              </li>
            </ul>
          </div>

          <!-- CTA Button -->
          <div style="text-align: center; margin: 40px 0;">
            <a href="${activationLink}" 
               style="display: inline-block; background-color: #DCA441; color: #0e141f; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 18px;">
              Kundenportal aktivieren
            </a>
          </div>

          <!-- Info Box -->
          <div style="background-color: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 20px; margin: 30px 0;">
            <p style="color: #92400e; font-size: 14px; margin: 0; line-height: 1.6;">
              <strong>Wichtig:</strong> Dieser Link ist 7 Tage gültig. Nach dem Aktivieren können Sie sich mit Ihrem Passwort anmelden.
            </p>
          </div>

          <!-- Contact Info -->
          <div style="text-align: center; margin: 40px 0 20px 0;">
            <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
              Bei Fragen stehen wir Ihnen gerne zur Verfügung:
            </p>
            <p style="color: #DCA441; font-size: 16px; font-weight: 600; margin: 0;">
              📧 info@webwelle.com | 📞 +49 (0) 123 456 789
            </p>
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
Willkommen im Kundenportal!

Hallo ${customerName},

Ihr Kundenportal bei WebWelle ist jetzt bereit! Im Portal können Sie:
- Alle Ihre Pakete und Bestellungen einsehen
- Rechnungen herunterladen
- Subscriptions verwalten und kündigen
- Support-Anfragen stellen

Aktivieren Sie Ihr Portal hier:
${activationLink}

Wichtig: Dieser Link ist 7 Tage gültig.

Bei Fragen: info@webwelle.com | +49 (0) 123 456 789

© 2024 WebWelle. Alle Rechte vorbehalten.
  `;

  try {
    await sendEmail({
      to: customerEmail,
      subject,
      html,
      text,
    });
    
    console.log(`✅ Portal-Aktivierungs-E-Mail erfolgreich an ${customerEmail} gesendet`);
    return { success: true };
  } catch (error) {
    console.error('❌ Fehler beim Senden der Portal-Aktivierungs-E-Mail:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unbekannter Fehler' 
    };
  }
}

