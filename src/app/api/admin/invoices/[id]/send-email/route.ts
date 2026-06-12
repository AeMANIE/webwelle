import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { pool } from '@/lib/database';
import { requireAdminAuth } from '@/lib/api-security';
import { sendEmail } from '@/lib/email';
import { WW_COLORS } from '@/lib/design-tokens';

const C = WW_COLORS;

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY nicht gesetzt');
  return new Stripe(key);
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const auth = await requireAdminAuth(request);
    if (auth instanceof NextResponse) return auth;

    const client = await pool.connect();
    try {
      // Prüfe ob Rechnung in DB existiert
      const invoiceRes = await client.query(
        'SELECT * FROM invoices WHERE id = $1 OR stripe_invoice_id = $1',
        [params.id]
      );

      interface InvoiceData {
        id: string;
        invoice_number?: string | null;
        number?: string | null;
        amount_cents?: number;
        amount?: number;
        currency?: string;
        status: string;
        pdf_url?: string | null;
        hosted_invoice_url?: string | null;
        customer_email?: string | null;
        customer_id?: string | null;
      }

      let invoice: InvoiceData | null = null;
      let customerEmail = '';
      let customerName = '';

      if (invoiceRes.rows.length > 0) {
        // Rechnung aus DB
        invoice = invoiceRes.rows[0] as InvoiceData;
        customerEmail = invoice.customer_email || '';
        
        // Hole Kunden-Name
        if (invoice.customer_id) {
          const customerRes = await client.query('SELECT name, email FROM customers WHERE id = $1', [invoice.customer_id]);
          if (customerRes.rows.length > 0) {
            customerName = customerRes.rows[0].name || '';
            customerEmail = customerEmail || customerRes.rows[0].email;
          }
        }
      } else {
        // Versuche Stripe-Rechnung
        const stripe = getStripe();
        try {
          const stripeInvoice = await stripe.invoices.retrieve(params.id);
          invoice = {
            id: stripeInvoice.id || params.id,
            invoice_number: stripeInvoice.number,
            amount_cents: stripeInvoice.amount_paid || stripeInvoice.amount_due,
            currency: stripeInvoice.currency,
            status: stripeInvoice.status || 'unknown',
            pdf_url: stripeInvoice.invoice_pdf,
            hosted_invoice_url: stripeInvoice.hosted_invoice_url,
            customer_email: typeof stripeInvoice.customer === 'string' 
              ? null 
              : (stripeInvoice.customer && 'email' in stripeInvoice.customer && !('deleted' in stripeInvoice.customer))
                ? stripeInvoice.customer.email
                : null,
          };
          
          if (typeof stripeInvoice.customer === 'object' && stripeInvoice.customer && 'email' in stripeInvoice.customer && !('deleted' in stripeInvoice.customer)) {
            customerEmail = stripeInvoice.customer.email || '';
            customerName = stripeInvoice.customer.name || '';
          }
        } catch {
          return NextResponse.json({ error: 'Rechnung nicht gefunden' }, { status: 404 });
        }
      }

      if (!customerEmail) {
        return NextResponse.json({ error: 'Kunden-E-Mail nicht gefunden' }, { status: 400 });
      }

      const invoiceNumber = invoice.invoice_number || invoice.number || params.id;
      const amount = invoice.amount_cents 
        ? (invoice.amount_cents / 100).toFixed(2) 
        : invoice.amount 
        ? invoice.amount.toFixed(2) 
        : '0.00';
      const currency = invoice.currency || 'EUR';
      const pdfUrl = invoice.pdf_url || invoice.hosted_invoice_url;

      // E-Mail-Inhalt
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: ${C.background}; color: ${C.foreground}; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: ${C.brand}; margin: 0;">WebWelle</h1>
            <p style="color: #a0a0a0; margin: 5px 0;">Ihre Rechnung</p>
          </div>
          
          <div style="background: ${C.card}; padding: 30px; border-radius: 10px;">
            <h2 style="color: #ffffff; margin-bottom: 20px;">Rechnung ${invoiceNumber}</h2>
            <p style="color: #a0a0a0; margin-bottom: 20px;">
              Sehr ${customerName ? customerName : 'geehrter Kunde'},
            </p>
            <p style="color: #a0a0a0; margin-bottom: 20px;">
              anbei erhalten Sie Ihre Rechnung im PDF-Format.
            </p>
            <div style="background: #0e141f; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span style="color: #a0a0a0;">Rechnungsnummer:</span>
                <span style="color: #ffffff; font-weight: bold;">${invoiceNumber}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span style="color: #a0a0a0;">Betrag:</span>
                <span style="color: ${C.brand}; font-weight: bold; font-size: 18px;">${amount} ${currency}</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #a0a0a0;">Status:</span>
                <span style="color: ${invoice.status === 'paid' ? '#10b981' : '#f59e0b'}; font-weight: bold;">
                  ${invoice.status === 'paid' ? 'Bezahlt' : invoice.status === 'open' ? 'Offen' : invoice.status}
                </span>
              </div>
            </div>
            ${pdfUrl ? `
              <div style="text-align: center; margin-top: 30px;">
                <a href="${pdfUrl}" 
                   style="display: inline-block; background: ${C.brand}; color: ${C.brandForeground}; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                  Rechnung herunterladen
                </a>
              </div>
            ` : ''}
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #374151;">
            <p style="color: #a0a0a0; font-size: 12px;">
              WebWelle | Allgäu | Bayern<br>
              E-Mail: info@webwelle.com
            </p>
          </div>
        </div>
      `;

      const success = await sendEmail({
        to: customerEmail,
        subject: `Rechnung ${invoiceNumber} - WebWelle`,
        html: emailHtml,
        text: `Rechnung ${invoiceNumber}\n\nSehr ${customerName ? customerName : 'geehrter Kunde'},\n\nanbei erhalten Sie Ihre Rechnung.\n\nRechnungsnummer: ${invoiceNumber}\nBetrag: ${amount} ${currency}\nStatus: ${invoice.status}\n\n${pdfUrl ? `Rechnung herunterladen: ${pdfUrl}` : ''}`,
      });

      if (success) {
        return NextResponse.json({ success: true, message: 'Rechnung erfolgreich per E-Mail gesendet' });
      } else {
        return NextResponse.json({ error: 'Fehler beim Senden der E-Mail' }, { status: 500 });
      }
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Fehler beim Senden der Rechnung per E-Mail:', error);
    return NextResponse.json({ error: 'Fehler beim Senden der Rechnung per E-Mail' }, { status: 500 });
  }
}

