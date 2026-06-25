import { pool } from '@/lib/database';

let schemaEnsured = false;

export async function ensureInvoiceColumns(): Promise<void> {
  if (schemaEnsured) return;

  const client = await pool.connect();
  try {
    await client.query(`
      ALTER TABLE invoices
        ADD COLUMN IF NOT EXISTS booking_id UUID REFERENCES webwelle_bookings(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS session_id VARCHAR(255),
        ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255);

      CREATE INDEX IF NOT EXISTS idx_invoices_booking_id ON invoices(booking_id);
      CREATE INDEX IF NOT EXISTS idx_invoices_session_id ON invoices(session_id);
      CREATE INDEX IF NOT EXISTS idx_invoices_stripe_subscription_id ON invoices(stripe_subscription_id);
    `);

    await client.query(`
      UPDATE invoices i
      SET booking_id = b.id,
          session_id = b.session_id
      FROM webwelle_bookings b
      WHERE i.booking_id IS NULL
        AND (
          (b.stripe_invoice_id IS NOT NULL AND i.stripe_invoice_id = b.stripe_invoice_id)
          OR i.stripe_invoice_id = 'checkout_' || b.session_id
        )
    `);

    await client.query(`
      UPDATE invoices i
      SET booking_id = b.id,
          session_id = b.session_id,
          stripe_subscription_id = COALESCE(i.stripe_subscription_id, b.stripe_subscription_id)
      FROM webwelle_bookings b
      WHERE i.booking_id IS NULL
        AND b.stripe_subscription_id IS NOT NULL
        AND i.stripe_subscription_id = b.stripe_subscription_id
    `);

    schemaEnsured = true;
  } finally {
    client.release();
  }
}
