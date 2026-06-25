import type Stripe from 'stripe';
import { sendAdminPaidOrderNotification } from '@/lib/admin-order-notification';
import { sendBookingConfirmation } from '@/lib/email-confirmation';
import { sendPortalActivationEmail } from '@/lib/email-portal-activation';
import { renderWebWelleInvoiceEmail } from '@/lib/email-templates/webwelle';
import { getPackageDisplayName, extractAddonsFromMetadata } from '@/lib/email-helpers';
import { generateInvoicePdf } from '@/lib/invoice-pdf';
import { sendEmail } from '@/lib/email';
import { generateActivationToken, saveActivationToken } from '@/lib/portal-activation';
import { getCustomerByEmail, saveInvoice } from '@/lib/database';
import { lookupBookingLinkBySessionId } from '@/lib/invoices/booking-link';

export const INVOICE_BANKING = {
  companyName: 'AeManie GmbH',
  addressLine: 'Uhlandstr. 16 – 87437 Kempten',
  bankName: 'Sparkasse Allgäu',
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

export interface FunnelInvoiceArtifacts {
  invoiceNumber: string;
  pdfBuffer: Buffer;
  amountCents: number;
}

async function buildFunnelInvoiceArtifacts(params: {
  session: Stripe.Checkout.Session;
  customerEmail: string;
  customerName: string;
  customerNumber?: string | null;
  customerAddress?: string | null;
  offerItems: OfferItemRow[];
  offerDiscountCents?: number;
}): Promise<FunnelInvoiceArtifacts> {
  const invoiceNumber = funnelInvoiceNumber(params.session.id);
  const stripeInvoiceId = `checkout_${params.session.id}`;
  const amountCents = params.session.amount_total || 0;

  const pdfBuffer = await generateInvoicePdf({
    invoiceNumber,
    issueDate: new Date(),
    customerNumber: params.customerNumber,
    customer: {
      name: params.customerName,
      email: params.customerEmail,
      address: params.customerAddress || null,
    },
    items: offerItemsToPdfLines(params.offerItems, params.offerDiscountCents || 0),
    banking: INVOICE_BANKING,
  });

  const bookingLink = await lookupBookingLinkBySessionId(params.session.id);

  await saveInvoice({
    stripe_invoice_id: stripeInvoiceId,
    invoice_number: invoiceNumber,
    customer_email: params.customerEmail,
    customer_name: params.customerName,
    customer_number: params.customerNumber || null,
    customer_id: bookingLink.customer_id || null,
    booking_id: bookingLink.booking_id || null,
    session_id: bookingLink.session_id || params.session.id,
    stripe_subscription_id: bookingLink.stripe_subscription_id || null,
    amount_cents: amountCents,
    currency: (params.session.currency || 'eur').toUpperCase(),
    status: 'paid',
    paid_at: new Date(),
    due_date: null,
    pdf_url: null,
    hosted_invoice_url: null,
    issuer: 'WebWelle',
  });

  return { invoiceNumber, pdfBuffer, amountCents };
}

async function sendFunnelInvoiceEmail(params: {
  session: Stripe.Checkout.Session;
  customerEmail: string;
  customerName: string;
  customerNumber?: string | null;
  customerAddress?: string | null;
  offerItems: OfferItemRow[];
  offerDiscountCents?: number;
}): Promise<FunnelInvoiceArtifacts> {
  const artifacts = await buildFunnelInvoiceArtifacts(params);
  const { invoiceNumber, pdfBuffer } = artifacts;

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
  return artifacts;
}

export async function sendPostPaymentEmails(params: PostPaymentEmailParams): Promise<void> {
  const { session, metadata, bookingData, source } = params;

  console.log(`📧 sendPostPaymentEmails (${source}) für Session: ${session.id}`);

  const customerAlreadySent = await wasEmailAlreadySent(session.id);
  if (customerAlreadySent) {
    console.log('⚠️ E-Mail wurde bereits gesendet für Session:', session.id);
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

  let invoiceArtifacts: FunnelInvoiceArtifacts | null = null;

  if (!customerAlreadySent) {
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
        invoiceArtifacts = await sendFunnelInvoiceEmail({
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

  const customerPhone = session.customer_details?.phone || metadata.phone || null;

  try {
    await sendAdminPaidOrderNotification({
      session,
      metadata,
      source,
      packageName,
      packagePrice,
      isMonthly,
      selectedAddons,
      customerName,
      customerEmail,
      customerPhone,
      customerAddress: params.customerAddress,
      customerNumber: params.customerNumber,
      invoiceNumber: invoiceArtifacts?.invoiceNumber ?? null,
      invoicePdf: invoiceArtifacts?.pdfBuffer ?? null,
    });
  } catch (error) {
    console.error('❌ Fehler bei Admin-Bestellbenachrichtigung:', error);
  }
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
