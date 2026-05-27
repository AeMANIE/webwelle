import { sendEmail } from './email';
import { renderWebWellePortalActivationEmail } from './email-templates/webwelle';

interface PortalActivationData {
  customerName: string;
  customerEmail: string;
  activationToken: string;
}

export async function sendPortalActivationEmail(data: PortalActivationData): Promise<{ success: boolean; error?: string }> {
  const { customerName, customerEmail, activationToken } = data;
  
  // In Produktion nur HTTPS-Links erlauben. Falls BASE_URL fälschlich mit http:// gesetzt ist, härten.
  let baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://webwelle.com';
  if (process.env.NODE_ENV === 'production') {
    if (baseUrl.startsWith('http://')) {
      console.warn('⚠️ NEXT_PUBLIC_BASE_URL ist ohne SSL gesetzt. Erzwinge HTTPS-Link für E-Mail.');
      baseUrl = 'https://webwelle.com';
    }
  }
  const activationLink = `${baseUrl}/customer/activate?token=${activationToken}`;
  
  const subject = 'Ihr Kundenportal ist bereit | WebWelle';
  const { html, text } = renderWebWellePortalActivationEmail({
    customerName,
    activationLink,
  });

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

