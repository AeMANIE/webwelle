import { pool, getBookingBySessionId, getCustomerByEmail } from '@/lib/database';
import type { BookingLinkFields } from './types';

export async function lookupBookingLinkBySessionId(
  sessionId: string
): Promise<BookingLinkFields> {
  const booking = await getBookingBySessionId(sessionId);
  if (!booking?.id) return { session_id: sessionId };

  return {
    booking_id: String(booking.id),
    session_id: sessionId,
    customer_id: booking.customer_id ? String(booking.customer_id) : null,
    stripe_subscription_id: booking.stripe_subscription_id || null,
  };
}

export async function lookupBookingLinkForStripeInvoice(params: {
  stripeInvoiceId: string;
  stripeSubscriptionId?: string | null;
  customerEmail?: string | null;
}): Promise<BookingLinkFields> {
  const client = await pool.connect();
  try {
    if (params.stripeSubscriptionId) {
      const bySub = await client.query(
        `SELECT id, session_id, customer_id, stripe_subscription_id
         FROM webwelle_bookings
         WHERE stripe_subscription_id = $1
         ORDER BY created_at DESC
         LIMIT 1`,
        [params.stripeSubscriptionId]
      );
      if (bySub.rows[0]) {
        const row = bySub.rows[0];
        return {
          booking_id: String(row.id),
          session_id: row.session_id || null,
          customer_id: row.customer_id ? String(row.customer_id) : null,
          stripe_subscription_id: row.stripe_subscription_id || null,
        };
      }
    }

    const byStripeInvoice = await client.query(
      `SELECT id, session_id, customer_id, stripe_subscription_id
       FROM webwelle_bookings
       WHERE stripe_invoice_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [params.stripeInvoiceId]
    );
    if (byStripeInvoice.rows[0]) {
      const row = byStripeInvoice.rows[0];
      return {
        booking_id: String(row.id),
        session_id: row.session_id || null,
        customer_id: row.customer_id ? String(row.customer_id) : null,
        stripe_subscription_id: row.stripe_subscription_id || null,
      };
    }

    if (params.customerEmail) {
      const customer = await getCustomerByEmail(params.customerEmail);
      return {
        customer_id: customer?.id ? String(customer.id) : null,
        stripe_subscription_id: params.stripeSubscriptionId || null,
      };
    }

    return {
      stripe_subscription_id: params.stripeSubscriptionId || null,
    };
  } finally {
    client.release();
  }
}
