import { pool } from '@/lib/database';
import type { InvoiceData } from '@/lib/database';
import { ensureInvoiceColumns } from './schema';
import type { AdminInvoiceRow } from './types';

interface BookingRow {
  id: string;
  session_id: string;
  stripe_invoice_id: string | null;
  stripe_subscription_id: string | null;
  customer_email: string | null;
  customer_id: string | null;
}

function dedupeInvoices(rows: InvoiceData[]): InvoiceData[] {
  const seen = new Set<string>();
  const result: InvoiceData[] = [];
  for (const row of rows) {
    const key = row.stripe_invoice_id || String(row.id || '');
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(row);
  }
  return result;
}

export async function resolveInvoicesForBooking(bookingId: string): Promise<InvoiceData[]> {
  await ensureInvoiceColumns();

  const client = await pool.connect();
  try {
    const bookingRes = await client.query(
      `SELECT id, session_id, stripe_invoice_id, stripe_subscription_id, customer_email, customer_id
       FROM webwelle_bookings WHERE id = $1`,
      [bookingId]
    );
    if (bookingRes.rows.length === 0) return [];

    const booking = bookingRes.rows[0] as BookingRow;
    const collected: InvoiceData[] = [];

    const byBookingId = await client.query(
      `SELECT * FROM invoices WHERE booking_id = $1 ORDER BY created_at DESC`,
      [bookingId]
    );
    collected.push(...byBookingId.rows);

    if (booking.stripe_invoice_id) {
      const byStripeInvoice = await client.query(
        `SELECT * FROM invoices WHERE stripe_invoice_id = $1 ORDER BY created_at DESC`,
        [booking.stripe_invoice_id]
      );
      collected.push(...byStripeInvoice.rows);
    }

    const checkoutKey = `checkout_${booking.session_id}`;
    const byCheckout = await client.query(
      `SELECT * FROM invoices WHERE stripe_invoice_id = $1 ORDER BY created_at DESC`,
      [checkoutKey]
    );
    collected.push(...byCheckout.rows);

    if (booking.stripe_subscription_id) {
      const bySubscription = await client.query(
        `SELECT * FROM invoices
         WHERE stripe_subscription_id = $1
         ORDER BY created_at DESC`,
        [booking.stripe_subscription_id]
      );
      collected.push(...bySubscription.rows);
    }

    const webwelleRes = await client.query(
      `SELECT id, invoice_number, amount_cents, currency, status, paid_at, due_date, pdf_url,
              created_at, stripe_invoice_id, booking_id
       FROM webwelle_invoices
       WHERE booking_id = $1
       ORDER BY created_at DESC`,
      [bookingId]
    );

    for (const row of webwelleRes.rows) {
      collected.push({
        id: row.id,
        stripe_invoice_id: row.stripe_invoice_id || String(row.id),
        invoice_number: row.invoice_number || null,
        amount_cents: row.amount_cents,
        currency: row.currency || 'EUR',
        status: row.status,
        paid_at: row.paid_at || null,
        due_date: row.due_date || null,
        pdf_url: row.pdf_url || null,
        hosted_invoice_url: null,
        customer_email: booking.customer_email || '',
        customer_id: booking.customer_id || null,
        customer_name: null,
        customer_number: null,
        issuer: 'WebWelle',
        created_at: row.created_at,
        updated_at: row.created_at,
        booking_id: row.booking_id || bookingId,
        session_id: booking.session_id,
      } as InvoiceData);
    }

    return dedupeInvoices(collected).sort((a, b) => {
      const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
      return bTime - aTime;
    });
  } finally {
    client.release();
  }
}

export type AdminInvoicePeriod = '30days' | '3months' | '6months' | 'all';

export async function listInvoicesForAdmin(params: {
  period?: AdminInvoicePeriod;
  status?: string | null;
  customerId?: string | null;
}): Promise<AdminInvoiceRow[]> {
  await ensureInvoiceColumns();

  const period = params.period || 'all';
  const client = await pool.connect();

  try {
    const conditions: string[] = ['1=1'];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (params.customerId) {
      conditions.push(`(i.customer_id = $${paramIndex}::uuid)`);
      values.push(params.customerId);
      paramIndex++;
    }

    if (params.status && params.status !== 'all') {
      conditions.push(`i.status = $${paramIndex}`);
      values.push(params.status);
      paramIndex++;
    }

    if (period !== 'all') {
      const days =
        period === '30days' ? 30 : period === '3months' ? 90 : period === '6months' ? 180 : 0;
      if (days > 0) {
        conditions.push(`i.created_at >= NOW() - ($${paramIndex}::int * INTERVAL '1 day')`);
        values.push(days);
        paramIndex++;
      }
    }

    const query = `
      SELECT
        i.id,
        i.stripe_invoice_id,
        i.invoice_number,
        i.customer_email,
        COALESCE(i.customer_name, c.name) AS customer_name,
        COALESCE(i.customer_number, c.customer_number) AS customer_number,
        i.amount_cents,
        i.currency,
        i.status,
        i.issuer,
        i.paid_at,
        i.due_date,
        i.pdf_url,
        i.hosted_invoice_url,
        i.created_at,
        i.booking_id
      FROM invoices i
      LEFT JOIN customers c ON c.id = i.customer_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY i.created_at DESC
      LIMIT 500
    `;

    const result = await client.query(query, values);

    return result.rows.map((row) => ({
      id: String(row.id),
      stripeInvoiceId: String(row.stripe_invoice_id || ''),
      invoiceNumber: row.invoice_number ? String(row.invoice_number) : null,
      customerEmail: String(row.customer_email || ''),
      customerName: row.customer_name ? String(row.customer_name) : null,
      customerNumber: row.customer_number ? String(row.customer_number) : null,
      amount: Number(row.amount_cents || 0) / 100,
      currency: String(row.currency || 'EUR').toUpperCase(),
      status: String(row.status || 'unknown'),
      issuer: String(row.issuer || 'WebWelle'),
      paidAt: row.paid_at ? new Date(row.paid_at).toISOString() : null,
      dueDate: row.due_date ? new Date(row.due_date).toISOString() : null,
      pdfUrl: row.pdf_url ? String(row.pdf_url) : null,
      hostedInvoiceUrl: row.hosted_invoice_url ? String(row.hosted_invoice_url) : null,
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
      bookingId: row.booking_id ? String(row.booking_id) : null,
    }));
  } finally {
    client.release();
  }
}

export async function getInvoiceByRef(invoiceRef: string): Promise<InvoiceData | null> {
  await ensureInvoiceColumns();

  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT * FROM invoices
       WHERE id::text = $1 OR stripe_invoice_id = $1
       LIMIT 1`,
      [invoiceRef]
    );
    return result.rows[0] || null;
  } finally {
    client.release();
  }
}
