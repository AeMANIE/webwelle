import { sendEmail } from './email';
import { WW_EMAIL_LIGHT as L } from './design-tokens';
import { PAYMENT_SUCCESS_CONTENT, ZOOM_SCHEDULER_URL } from './payment-success-content';
import {
  emailButton,
  emailDetailRow,
  emailPanel,
  escapeHtml,
  renderWebWelleEmailShell,
} from './email-templates/email-layout';

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
  showZoomCta?: boolean;
  zoomSchedulerUrl?: string;
}

export async function sendBookingConfirmation(data: BookingConfirmationData) {
  const {
    customerName,
    customerEmail,
    packageName,
    packagePrice,
    isMonthly,
    selectedAddons,
    totalAmount,
    currency,
    sessionId,
    showZoomCta = false,
    zoomSchedulerUrl = ZOOM_SCHEDULER_URL,
  } = data;

  const safeName = escapeHtml(customerName);
  const safePackage = escapeHtml(packageName);
  const safePrice = escapeHtml(packagePrice);
  const safeSessionId = escapeHtml(sessionId);
  const zoomCopy = PAYMENT_SUCCESS_CONTENT;

  const zoomBlock = showZoomCta
    ? emailPanel(`
        <h3 style="color:${L.heading};font-size:18px;margin:0 0 12px 0;text-align:center;">${escapeHtml(zoomCopy.ctaTitle)}</h3>
        <p style="color:${L.body};font-size:15px;line-height:1.6;margin:0 0 20px 0;text-align:center;">${escapeHtml(zoomCopy.ctaDescription)}</p>
        <div style="text-align:center;margin-bottom:12px;">${emailButton(zoomSchedulerUrl, escapeHtml(zoomCopy.ctaButton))}</div>
        <p style="color:${L.muted};font-size:13px;margin:0;text-align:center;">${escapeHtml(zoomCopy.emailNote)}</p>
      `)
    : '';

  const addonsHtml =
    selectedAddons.length > 0
      ? `
      <h3 style="color:${L.heading};font-size:18px;margin:20px 0 10px 0;">Zusatzoptionen:</h3>
      <ul style="list-style:none;padding:0;margin:0 0 20px 0;">
        ${selectedAddons
          .map(
            (addon) => `
          <li style="padding:8px 0;border-bottom:1px solid ${L.border};">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span style="color:${L.body};">${escapeHtml(addon.label)}</span>
              <span style="color:${L.primary};font-weight:600;">${escapeHtml(addon.price)} ${addon.billing === 'monthly' ? 'mtl.' : addon.billing === 'yearly' ? 'jährlich' : ''}</span>
            </div>
          </li>`
          )
          .join('')}
      </ul>`
      : '';

  const bodyHtml = `
    <h2 style="color:${L.heading};font-size:22px;font-weight:600;margin:0 0 20px 0;">Vielen Dank für Ihre Buchung!</h2>
    <p style="color:${L.body};font-size:16px;line-height:1.6;margin:0 0 20px 0;">Hallo ${safeName},</p>
    <p style="color:${L.body};font-size:16px;line-height:1.6;margin:0 0 24px 0;">
      wir freuen uns, dass Sie sich für ${safePackage} entschieden haben! Ihre Buchung wurde erfolgreich verarbeitet.
    </p>
    ${emailPanel(`
      <h3 style="color:${L.heading};font-size:18px;margin:0 0 8px 0;">Buchungsdetails</h3>
      ${emailDetailRow('Paket', safePackage)}
      ${emailDetailRow('Zahlungsart', isMonthly ? 'Monatlich' : 'Einmalzahlung')}
      ${emailDetailRow('Preis', safePrice)}
      <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;">
        <span style="color:${L.muted};font-weight:500;">Buchungs-ID</span>
        <span style="color:${L.muted};font-family:monospace;font-size:14px;">${safeSessionId}</span>
      </div>
    `)}
    ${addonsHtml}
    ${zoomBlock}
    <div style="background:${L.brand};color:${L.brandText};border-radius:12px;padding:20px;margin:24px 0;text-align:center;">
      <h3 style="color:${L.brandText};font-size:18px;margin:0 0 10px 0;">Gesamtbetrag</h3>
      <p style="color:${L.brandText};font-size:32px;font-weight:700;margin:0;">${totalAmount.toFixed(2)} ${currency.toUpperCase()}</p>
    </div>
    <div style="background:${L.infoBg};border:1px solid ${L.infoBorder};border-radius:12px;padding:24px;margin:24px 0;">
      <h3 style="color:${L.primary};font-size:18px;margin:0 0 15px 0;">Nächste Schritte</h3>
      <ol style="color:${L.body};font-size:16px;line-height:1.6;margin:0;padding-left:20px;">
        <li style="margin-bottom:8px;">Unser Team wird sich innerhalb von 24 Stunden bei Ihnen melden</li>
        <li style="margin-bottom:8px;">Wir besprechen Ihre Anforderungen und den Projektablauf</li>
        <li style="margin-bottom:8px;">Die Entwicklung Ihres Projekts beginnt nach der Abstimmung</li>
        <li>Sie erhalten regelmäßige Updates zum Projektfortschritt</li>
      </ol>
    </div>
    <div style="text-align:center;margin:32px 0 16px 0;">
      <p style="color:${L.muted};font-size:14px;margin:0 0 10px 0;">Bei Fragen stehen wir Ihnen gerne zur Verfügung:</p>
      <p style="color:${L.primary};font-size:16px;font-weight:600;margin:0;">info@webwelle.com</p>
    </div>
    <div style="text-align:center;margin:24px 0 0;">${emailButton('https://webwelle.com/customer', 'Zum Kundenportal')}</div>
  `;

  const html = renderWebWelleEmailShell({
    title: 'Ihre Buchungsbestätigung',
    bodyHtml,
  });

  const subject = `Buchungsbestätigung - ${packageName} | WebWelle`;

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
${showZoomCta ? `\nNÄCHSTER SCHRITT:\n${zoomCopy.ctaTitle}\n${zoomCopy.ctaDescription}\n${zoomCopy.ctaButton}: ${zoomSchedulerUrl}\n${zoomCopy.emailNote}\n` : ''}

GESAMTBETRAG: ${totalAmount.toFixed(2)} ${currency.toUpperCase()}

NÄCHSTE SCHRITTE:
1. Unser Team wird sich innerhalb von 24 Stunden bei Ihnen melden
2. Wir besprechen Ihre Anforderungen und den Projektablauf
3. Die Entwicklung Ihres Projekts beginnt nach der Abstimmung
4. Sie erhalten regelmäßige Updates zum Projektfortschritt

Bei Fragen stehen wir Ihnen gerne zur Verfügung:
info@webwelle.com

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
