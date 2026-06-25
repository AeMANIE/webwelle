import Stripe from 'stripe';
import { pool } from '@/lib/database';
import { generateInvoicePdf } from '@/lib/invoice-pdf';
import { getPackageDisplayName } from '@/lib/email-helpers';
import { INVOICE_BANKING } from '@/lib/post-payment-emails';
import { getInvoiceByRef } from './resolve';

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY nicht gesetzt');
  return new Stripe(key);
}

function mapBilling(isMonthly: boolean): 'monthly' | 'oneTime' {
  return isMonthly ? 'monthly' : 'oneTime';
}

async function buildPdfFromBookingInvoice(invoice: NonNullable<Awaited<ReturnType<typeof getInvoiceByRef>>>) {
  const client = await pool.connect();
  try {
    let packageLabel = 'Leistung WebWelle';
    let isMonthly = false;
    let customerAddress: string | null = null;

    if (invoice.booking_id) {
      const bookingRes = await client.query(
        `SELECT package_type, is_monthly, package_price_display, customer_name, company_name
         FROM webwelle_bookings WHERE id = $1`,
        [invoice.booking_id]
      );
      const booking = bookingRes.rows[0];
      if (booking) {
        packageLabel = getPackageDisplayName(String(booking.package_type || ''));
        isMonthly = Boolean(booking.is_monthly);
      }
    }

    if (invoice.customer_id) {
      const customerRes = await client.query(
        `SELECT street, zip, city, country FROM customers WHERE id = $1`,
        [invoice.customer_id]
      );
      const customer = customerRes.rows[0];
      if (customer) {
        customerAddress = [customer.street, customer.zip, customer.city, customer.country]
          .filter(Boolean)
          .join(' ')
          .trim() || null;
      }
    }

    return generateInvoicePdf({
      invoiceNumber: String(invoice.invoice_number || invoice.stripe_invoice_id),
      issueDate: invoice.created_at ? new Date(invoice.created_at) : new Date(),
      customerNumber: invoice.customer_number || null,
      customer: {
        name: invoice.customer_name || invoice.customer_email,
        email: invoice.customer_email,
        address: customerAddress,
      },
      items: [
        {
          description: packageLabel,
          quantity: 1,
          netAmount: Number(invoice.amount_cents || 0) / 100,
          interval: mapBilling(isMonthly),
        },
      ],
      banking: INVOICE_BANKING,
      notes: 'Alle Preise netto zzgl. 19% MwSt. Vielen Dank für Ihr Vertrauen!',
    });
  } finally {
    client.release();
  }
}

async function buildPdfFromStripeInvoice(stripeInvoiceId: string) {
  const stripe = getStripe();
  const inv = await stripe.invoices.retrieve(stripeInvoiceId, {
    expand: ['customer', 'lines.data.price.product'],
  });

  let customerName: string | null = null;
  let customerEmail: string | null = null;
  if (typeof inv.customer === 'object' && inv.customer && !('deleted' in inv.customer)) {
    const customer = inv.customer as Stripe.Customer;
    customerName = customer.name ?? null;
    customerEmail = customer.email ?? null;
  }

  const items = (inv.lines.data || []).map((line) => {
    let desc = line.description || 'Position';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const price = (line as any).price as Stripe.Price | null;
    const prod = price?.product;
    if (typeof prod === 'object' && prod && 'name' in prod) {
      const maybe = prod as { name?: string };
      if (maybe.name) desc = maybe.name;
    }

    const unitAmount = (price?.unit_amount ?? 0) / 100;
    const quantity = line.quantity ?? 1;

    let interval: 'monthly' | 'yearly' | 'oneTime' = 'oneTime';
    if (price?.recurring?.interval === 'month') interval = 'monthly';
    if (price?.recurring?.interval === 'year') interval = 'yearly';

    return {
      description: desc,
      quantity,
      netAmount: unitAmount,
      interval,
    };
  });

  return generateInvoicePdf({
    invoiceNumber: String(inv.number || inv.id),
    issueDate: new Date((inv.created ?? Math.floor(Date.now() / 1000)) * 1000),
    customerNumber: null,
    customer: {
      name: customerName || customerEmail || '',
      email: customerEmail || '',
      address:
        typeof inv.customer === 'object' && inv.customer && !('deleted' in inv.customer)
          ? [
              (inv.customer as Stripe.Customer).address?.line1,
              (inv.customer as Stripe.Customer).address?.postal_code,
              (inv.customer as Stripe.Customer).address?.city,
            ]
              .filter(Boolean)
              .join(' ')
              .trim() || null
          : null,
    },
    items,
    banking: INVOICE_BANKING,
    notes: 'Alle Preise netto zzgl. 19% MwSt. Vielen Dank für Ihr Vertrauen!',
  });
}

export async function generateBrandedInvoicePdf(invoiceRef: string): Promise<Buffer> {
  const invoice = await getInvoiceByRef(invoiceRef);
  if (!invoice) {
    if (invoiceRef.startsWith('in_')) {
      return buildPdfFromStripeInvoice(invoiceRef);
    }
    throw new Error('Rechnung nicht gefunden');
  }

  if (invoice.stripe_invoice_id.startsWith('in_')) {
    try {
      return await buildPdfFromStripeInvoice(invoice.stripe_invoice_id);
    } catch {
      // Fallback auf DB-Daten
    }
  }

  return buildPdfFromBookingInvoice(invoice);
}
