import type Stripe from 'stripe';
import { dwaLeadProductTitle } from '@/app/components/leistungen-offers';
import { sendEmail } from '@/lib/email';
import {
  renderWebWelleAdminDwaConsultationEmail,
  renderWebWelleAdminPaidOrderEmail,
} from '@/lib/email-templates/webwelle';
import { DWA_SOLUTION_CATALOG } from '@/lib/funnel/dwa';
import type { FunnelLead } from '@/lib/funnel/types';

const NOTIFY_TTL_SECONDS = 86400;

export function getAdminOrderNotificationEmail(): string {
  return (process.env.ADMIN_ORDER_NOTIFICATION_EMAIL || 'info@webwelle.com').trim();
}

async function wasRedisFlagSet(key: string): Promise<boolean> {
  const { getRedisClient } = await import('@/lib/redis');
  const redis = getRedisClient();
  if (!redis || (await redis.status) !== 'ready') return false;
  return Boolean(await redis.get(key));
}

async function setRedisFlag(key: string): Promise<void> {
  const { getRedisClient } = await import('@/lib/redis');
  const redis = getRedisClient();
  if (redis && (await redis.status) === 'ready') {
    await redis.setex(key, NOTIFY_TTL_SECONDS, '1');
  }
}

function resolveSolutionLabels(selectedIds: string[] | undefined): string[] {
  if (!selectedIds?.length) return [];
  const byId = new Map(DWA_SOLUTION_CATALOG.map((item) => [item.id, item.title]));
  return selectedIds.map((id) => byId.get(id) || id);
}

export async function sendAdminPaidOrderNotification(params: {
  session: Stripe.Checkout.Session;
  metadata: Stripe.Metadata;
  source: 'funnel' | 'buchung';
  packageName: string;
  packagePrice: string;
  isMonthly: boolean;
  selectedAddons: Array<{ label: string; price: string; billing: string }>;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  customerAddress?: string | null;
  customerNumber?: string | null;
  invoiceNumber?: string | null;
  invoicePdf?: Buffer | null;
}): Promise<void> {
  const redisKey = `admin_order_notified:${params.session.id}`;
  if (await wasRedisFlagSet(redisKey)) {
    console.log('⚠️ Admin-Bestellmail bereits gesendet für Session:', params.session.id);
    return;
  }

  const mail = renderWebWelleAdminPaidOrderEmail({
    customerName: params.customerName,
    customerEmail: params.customerEmail,
    customerPhone: params.customerPhone,
    customerAddress: params.customerAddress,
    customerNumber: params.customerNumber,
    packageName: params.packageName,
    packagePrice: params.packagePrice,
    isMonthly: params.isMonthly,
    selectedAddons: params.selectedAddons,
    totalAmount: (params.session.amount_total || 0) / 100,
    currency: params.session.currency || 'eur',
    sessionId: params.session.id,
    source: params.source,
    leadId: params.metadata.leadId || null,
    offerId: params.metadata.offerId || null,
    invoiceNumber: params.invoiceNumber || null,
    hasInvoicePdf: Boolean(params.invoicePdf && params.invoiceNumber),
  });

  const attachments =
    params.invoicePdf && params.invoiceNumber
      ? [
          {
            filename: `Rechnung_${params.invoiceNumber}.pdf`,
            content: params.invoicePdf,
            contentType: 'application/pdf',
          },
        ]
      : undefined;

  await sendEmail({
    to: getAdminOrderNotificationEmail(),
    subject: mail.subject,
    html: mail.html,
    text: mail.text,
    attachments,
  });

  await setRedisFlag(redisKey);
  console.log(`✅ Admin-Bestellbenachrichtigung gesendet (${params.source}): ${params.session.id}`);
}

export async function sendAdminDwaConsultationNotification(lead: FunnelLead): Promise<void> {
  const redisKey = `admin_dwa_notified:${lead.id}`;
  if (await wasRedisFlagSet(redisKey)) {
    console.log('⚠️ Admin-DWA-Mail bereits gesendet für Lead:', lead.id);
    return;
  }

  const customerEmail = String(lead.email || '').trim();
  if (!customerEmail) {
    console.warn('⚠️ Admin-DWA-Mail übersprungen: keine Kunden-E-Mail für Lead', lead.id);
    return;
  }

  const customerName =
    [lead.first_name, lead.last_name].filter(Boolean).join(' ').trim() ||
    lead.company_name ||
    customerEmail.split('@')[0];

  const mail = renderWebWelleAdminDwaConsultationEmail({
    productTitle: dwaLeadProductTitle(lead.source),
    customerName,
    customerEmail,
    customerPhone: lead.phone,
    companyName: lead.company_name,
    industry: lead.industry_normalized || lead.industry_raw,
    projectBrief: lead.project_brief,
    postalCode: lead.postal_code,
    city: lead.city,
    market: lead.market || lead.country,
    selectedSolutions: resolveSolutionLabels(lead.solution_selection?.selectedIds),
    projectNotes: lead.project_notes,
    leadId: lead.id,
    leadToken: lead.token,
  });

  await sendEmail({
    to: getAdminOrderNotificationEmail(),
    subject: mail.subject,
    html: mail.html,
    text: mail.text,
  });

  await setRedisFlag(redisKey);
  console.log(`✅ Admin-DWA-Benachrichtigung gesendet für Lead ${lead.id}`);
}
