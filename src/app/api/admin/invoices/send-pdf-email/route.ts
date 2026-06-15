import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { requireAdminAuth } from '@/lib/api-security';
import { generateInvoicePdf } from '@/lib/invoice-pdf';
import { INVOICE_BANKING } from '@/lib/post-payment-emails';
import { sendEmail } from '@/lib/email';
import { getCustomerByEmail } from '@/lib/database';

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY nicht gesetzt');
  return new Stripe(key);
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { invoiceId, customerEmail } = await request.json();
    if (!invoiceId || !customerEmail) {
      return NextResponse.json({ error: 'Rechnungs-ID und Kunden-E-Mail sind erforderlich' }, { status: 400 });
    }

    const stripe = getStripe();
    const inv = await stripe.invoices.retrieve(invoiceId, { expand: ['customer', 'lines.data.price.product'] });

    const customer = typeof inv.customer === 'object' && inv.customer && !('deleted' in inv.customer && (inv.customer as Stripe.DeletedCustomer).deleted)
      ? inv.customer as Stripe.Customer
      : null;

    const customerName = customer?.name || null;
    
    // Kundennummer abrufen
    const dbCustomer = await getCustomerByEmail(customerEmail);
    const customerNumber = dbCustomer?.customer_number || null;

    const items = (inv.lines.data || []).map((l: Stripe.InvoiceLineItem) => {
      let desc = l.description || 'Position';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const price = (l as any).price as Stripe.Price | null;
      const prod = price?.product;
      if (typeof prod === 'object' && prod && 'name' in prod) {
        const maybe = prod as { name?: string };
        if (maybe.name) desc = maybe.name;
      }

      const unitAmount = (price?.unit_amount ?? 0) / 100;
      const quantity = l.quantity ?? 1;

      let interval: 'monthly' | 'yearly' | 'oneTime' = 'oneTime';
      if (price?.recurring?.interval === 'month') interval = 'monthly';
      if (price?.recurring?.interval === 'year') interval = 'yearly';

      return {
        description: desc,
        quantity: quantity,
        netAmount: unitAmount,
        interval: interval,
      };
    });

    const pdfBuffer = await generateInvoicePdf({
      invoiceNumber: String(inv.number || inv.id),
      issueDate: new Date((inv.created ?? Math.floor(Date.now() / 1000)) * 1000),
      customerNumber,
      customer: {
        name: customerName || customerEmail || '',
        email: customerEmail || '',
        address: customer ? `${customer.address?.line1 || ''} ${customer.address?.postal_code || ''} ${customer.address?.city || ''}`.trim() || null : null,
      },
      items,
      banking: INVOICE_BANKING,
    });

    await sendEmail({
      to: customerEmail,
      subject: `Ihre Rechnung von WebWelle #${inv.number || inv.id}`,
      html: `
        <p>Hallo ${customerName || customerEmail},</p>
        <p>Vielen Dank für Ihre Bestellung bei WebWelle. Im Anhang finden Sie Ihre Rechnung.</p>
        ${customerNumber ? `<p>Ihre Kundennummer: <strong>${customerNumber}</strong></p>` : ''}
        <p>Sie können Ihre Rechnungen auch jederzeit in Ihrem Kundenportal einsehen.</p>
        <p>Mit freundlichen Grüßen,</p>
        <p>Ihr WebWelle Team</p>
      `,
      text: `Hallo ${customerName || customerEmail},\n\nVielen Dank für Ihre Bestellung bei WebWelle. Im Anhang finden Sie Ihre Rechnung.\n${customerNumber ? `Ihre Kundennummer: ${customerNumber}\n` : ''}Sie können Ihre Rechnungen auch jederzeit in Ihrem Kundenportal einsehen.\n\nMit freundlichen Grüßen,\nIhr WebWelle Team`,
      attachments: [{
        filename: `Rechnung_${inv.number || inv.id}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      }],
    });

    return NextResponse.json({ success: true, message: 'Rechnung erfolgreich per E-Mail versendet.' });
  } catch (error) {
    console.error('Fehler beim Senden der Rechnung per E-Mail:', error);
    return NextResponse.json({ error: 'Fehler beim Senden der Rechnung per E-Mail' }, { status: 500 });
  }
}

