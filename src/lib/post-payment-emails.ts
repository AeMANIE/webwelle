import type Stripe from 'stripe';
import { sendBookingConfirmation } from '@/lib/email-confirmation';
import { sendPortalActivationEmail } from '@/lib/email-portal-activation';
import { renderWebWelleInvoiceEmail } from '@/lib/email-templates/webwelle';
import { getPackageDisplayName, extractAddonsFromMetadata } from '@/lib/email-helpers';
import { generateInvoicePdf } from '@/lib/invoice-pdf';
import { sendEmail } from '@/lib/email';
import { generateActivationToken, saveActivationToken } from '@/lib/portal-activation';
import { getCustomerByEmail, saveInvoice } from '@/lib/database';

export const INVOICE_BANKING = {
  companyName: 'AeManie GmbH',
  addressLine: 'Uhlandstr. 16 – 87437 Kempten',
  iban: 'DE25 7335 0000 05163187 06',
  bic: 'BYLADEM1ALG',
  taxOffice: 'Finanzamt Kempten',
  taxNumber: '127 121 20418',
  vatId: 'DE 367002188',
} as const;

export interface OfferItemRow {
  label: string;
  unit_amount_cents: number;
  billing?: string | null;
  description?: string | null;
}

export interface PostPaymentEmailParams {
  session: Stripe.Checkout.Session;
  metadata: Stripe.Metadata;
  bookingData: { session_id: string; customer_email?: string; customer_name?: string };
  source: 'funnel' | 'buchung';
  offerItems?: OfferItemRow[];
  offerDiscountCents?: number;
  customerNumber?: string | null;
  customerAddress?: string | null;
}

function resolveSessionEmail(session: Stripe.Checkout.Session, fallback?: string): string {
  return (
    session.customer_email ||
    session.customer_details?.email ||
    fallback ||
    ''
  ).trim();
}

function mapBilling(
  billing?: string | null
): 'oneTime' | 'monthly' | 'yearly' {
  if (billing === 'monthly') return 'monthly';
  if (billing === 'yearly') return 'yearly';
  return 'oneTime';
}

function funnelInvoiceNumber(sessionId: string): string {
  const suffix = sessionId.replace(/^cs_/, '').slice(-8).toUpperCase();
  return `WW-${new Date().getFullYear()}-${suffix}`;
}

async function wasEmailAlreadySent(sessionId: string): Promise<boolean> {
  const { getRedisClient } = await import('@/lib/redis');
  const redis = getRedisClient();
  if (!redis || (await redis.status) !== 'ready') return false;
  const emailSentKey = `email_sent:${sessionId}`;
  return Boolean(await redis.get(emailSentKey));
}

async function markEmailSent(sessionId: string): Promise<void> {
  const { getRedisClient } = await import('@/lib/redis');
  const redis = getRedisClient();
  if (redis && (await redis.status) === 'ready') {
    await redis.setex(`email_sent:${sessionId}`, 86400, '1');
  }
}

function offerItemsToAddons(items: OfferItemRow[]) {
  return items.map((item) => ({
    label: item.label,
    price: `${(item.unit_amount_cents / 100).toFixed(2)} €`,
    billing: mapBilling(item.billing),
  }));
}

function offerItemsToPdfLines(items: OfferItemRow[], discountCents = 0) {
  const lines = items.map((item) => ({
    description: item.label,
    quantity: 1,
    netAmount: item.unit_amount_cents / 100,
    interval: mapBilling(item.billing),
  }));

  if (discountCents > 0) {
    lines.push({
      description: 'Lieferzeit-Rabatt',
      quantity: 1,
      netAmount: -(discountCents / 100),
      interval: 'oneTime' as const,
    });
  }

  return lines;
}

async function sendFunnelInvoiceEmail(params: {
  session: Stripe.Checkout.Session;
  customerEmail: string;
  customerName: string;
  customerNumber?: string | null;
  customerAddress?: string | null;
  offerItems: OfferItemRow[];
  offerDiscountCents?: number;
}): Promise<void> {
  const invoiceNumber = funnelInvoiceNumber(params.session.id);
  const stripeInvoiceId = `checkout_${params.session.id}`;
  const amountCents = params.session.amount_total || 0;

  const pdfBuffer = await generateInvoicePdf({
    invoiceNumber,
    issueDate: new Date(),
    customer: {
      name: params.customerName,
      email: params.customerEmail,
      address: params.customerAddress || null,
    },
    items: offerItemsToPdfLines(params.offerItems, params.offerDiscountCents || 0),
    banking: INVOICE_BANKING,
    notes: params.customerNumber ? `Kundennummer: ${params.customerNumber}` : undefined,
  });

  await saveInvoice({
    stripe_invoice_id: stripeInvoiceId,
    invoice_number: invoiceNumber,
    customer_email: params.customerEmail,
    customer_name: params.customerName,
    customer_number: params.customerNumber || null,
    amount_cents: amountCents,
    currency: (params.session.currency || 'eur').toUpperCase(),
    status: 'paid',
    paid_at: new Date(),
    due_date: null,
    pdf_url: null,
    hosted_invoice_url: null,
    issuer: 'WebWelle',
  });

  const invoiceMail = renderWebWelleInvoiceEmail({
    customerName: params.customerName,
    customerEmail: params.customerEmail,
    invoiceNumber,
    customerNumber: params.customerNumber,
  });

  await sendEmail({
    to: params.customerEmail,
    subject: `Ihre Rechnung von WebWelle #${invoiceNumber}`,
    html: invoiceMail.html,
    text: invoiceMail.text,
    attachments: [
      {
        filename: `Rechnung_${invoiceNumber}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  });

  console.log(`✅ Funnel-Rechnung ${invoiceNumber} an ${params.customerEmail} gesendet`);
}

export async function sendPostPaymentEmails(params: PostPaymentEmailParams): Promise<void> {
  const { session, metadata, bookingData, source } = params;

  console.log(`📧 sendPostPaymentEmails (${source}) für Session: ${session.id}`);

  if (await wasEmailAlreadySent(session.id)) {
    console.log('⚠️ E-Mail wurde bereits gesendet für Session:', session.id);
    return;
  }

  const customerEmail = resolveSessionEmail(session, bookingData.customer_email);
  if (!customerEmail) {
    console.warn('⚠️ Keine Kunden-E-Mail für Post-Payment-Mails:', session.id);
    return;
  }

  const customerName =
    metadata.customerName ||
    bookingData.customer_name ||
    session.customer_details?.name ||
    customerEmail.split('@')[0];

  const packageName =
    source === 'funnel' && metadata.offerId
      ? getPackageDisplayName(metadata.packageType || 'starterwelle', metadata.packageCategory)
      : getPackageDisplayName(metadata.packageType || '', metadata.packageCategory);

  const packagePrice =
    metadata.packagePriceDisplay || `${((session.amount_total || 0) / 100).toFixed(2)} €`;

  const selectedAddons =
    source === 'funnel' && params.offerItems?.length
      ? offerItemsToAddons(params.offerItems)
      : extractAddonsFromMetadata(metadata, session).map((addon) => ({
          label: addon.label,
          price: addon.price,
          billing: addon.billing,
        }));

  const isMonthly = metadata.isMonthly === 'true' || !!session.subscription;

  try {
    const confirmation = await sendBookingConfirmation({
      customerName,
      customerEmail,
      packageName,
      packagePrice,
      isMonthly,
      selectedAddons,
      totalAmount: (session.amount_total || 0) / 100,
      currency: session.currency || 'eur',
      sessionId: session.id,
      showZoomCta: true,
    });

    if (!confirmation.success) {
      console.error(`❌ Bestellbestätigung fehlgeschlagen: ${confirmation.error || 'Unbekannt'}`);
    }
  } catch (error) {
    console.error('❌ Fehler beim Senden der Bestellbestätigung:', error);
  }

  if (source === 'funnel') {
    const invoiceItems =
      params.offerItems?.length && params.offerItems.length > 0
        ? params.offerItems
        : [
            {
              label: packageName,
              unit_amount_cents: session.amount_total || 0,
              billing: 'one_time',
            },
          ];

    try {
      await sendFunnelInvoiceEmail({
        session,
        customerEmail,
        customerName,
        customerNumber: params.customerNumber,
        customerAddress: params.customerAddress,
        offerItems: invoiceItems,
        offerDiscountCents: params.offerDiscountCents,
      });
    } catch (error) {
      console.error('❌ Fehler beim Senden der Funnel-Rechnung:', error);
    }
  }

  try {
    const existingCustomer = await getCustomerByEmail(customerEmail);
    if (existingCustomer?.portal_activated) {
      console.log('ℹ️ Portal bereits aktiv – Aktivierungs-E-Mail übersprungen.');
    } else {
      const activationToken = generateActivationToken();
      await saveActivationToken(customerEmail, activationToken, bookingData.session_id);
      await sendPortalActivationEmail({ customerName, customerEmail, activationToken });
      console.log(`✅ Portal-Aktivierungs-E-Mail gesendet an ${customerEmail}`);
    }
  } catch (error) {
    console.error('❌ Fehler beim Senden der Portal-Aktivierungs-E-Mail:', error);
  }

  await markEmailSent(session.id);
}

export async function sendStripeInvoiceEmail(params: {
  customerEmail: string;
  customerName: string;
  customerNumber?: string | null;
  invoiceNumber: string;
  pdfBuffer: Buffer;
}): Promise<void> {
  const invoiceMail = renderWebWelleInvoiceEmail({
    customerName: params.customerName,
    customerEmail: params.customerEmail,
    invoiceNumber: params.invoiceNumber,
    customerNumber: params.customerNumber,
  });

  await sendEmail({
    to: params.customerEmail,
    subject: `Ihre Rechnung von WebWelle #${params.invoiceNumber}`,
    html: invoiceMail.html,
    text: invoiceMail.text,
    attachments: [
      {
        filename: `Rechnung_${params.invoiceNumber}.pdf`,
        content: params.pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  });
}
