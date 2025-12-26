import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { pool } from '@/lib/database';
import { verifyToken } from '@/lib/auth';

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY nicht gesetzt');
  return new Stripe(key);
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const token = request.cookies.get('auth-token')?.value;
    if (!token) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    const user = verifyToken(token);
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 });

    const client = await pool.connect();
    try {
      // Performance: Nur benötigte Spalten selektieren (kein SELECT *)
      const customerRes = await client.query(
        `SELECT id, email, name, phone, company_name, customer_number, 
                portal_activated, portal_activated_at, 
                is_verified, created_at, updated_at 
         FROM customers WHERE id = $1`,
        [params.id]
      );
      if (customerRes.rows.length === 0) return NextResponse.json({ error: 'Kunde nicht gefunden' }, { status: 404 });
      const customer = customerRes.rows[0];

      // Performance: Nur benötigte Spalten selektieren
      const bookingsRes = await client.query(
        `SELECT id, session_id, package_type, is_monthly, checkout_mode, 
                package_price_display, currency, total_amount_cents, 
                customer_id, customer_name, customer_email, customer_phone, 
                company_name, status, created_at, stripe_customer_id, 
                stripe_payment_intent_id, stripe_subscription_id 
         FROM webwelle_bookings 
         WHERE customer_id = $1 OR customer_email = $2 
         ORDER BY created_at DESC`,
        [params.id, customer.email]
      );

      // Stripe Daten ermitteln
      const stripe = getStripe();
      // Stripe-Customer-ID aus Buchungen, falls vorhanden
      type BookingRow = { stripe_customer_id?: string };
      const stripeCustomerId = (bookingsRes.rows as BookingRow[]).find(b => b.stripe_customer_id)?.stripe_customer_id;
      interface InvoiceItem { id: string; number: string | null; amount: number; currency?: string; status: string; hostedInvoiceUrl: string | null; pdfUrl: string | null; createdAt: string; paidAt: string | null }
      interface SubscriptionItem { id: string; status: string; cancelAt: string | null; canceledAt: string | null; currentPeriodEnd: string | null; items: Array<{ priceId: string; productId: string | Stripe.Product | null; recurring?: string; amount: number; currency?: string }>; }
      let invoices: InvoiceItem[] = [];
      let subscriptions: SubscriptionItem[] = [];

      if (stripeCustomerId) {
        const scid = stripeCustomerId as string;
        const invs = await stripe.invoices.list({ customer: scid, limit: 100 });
        invoices = invs.data.map<InvoiceItem>(inv => ({
          id: String(inv.id),
          number: inv.number,
          amount: ((inv.amount_paid ?? 0) as number) / 100,
          currency: inv.currency?.toUpperCase(),
          status: String(inv.status || 'unknown'),
          hostedInvoiceUrl: inv.hosted_invoice_url ?? null,
          pdfUrl: inv.invoice_pdf ?? null,
          createdAt: new Date(inv.created * 1000).toISOString(),
          paidAt: inv.status_transitions?.paid_at ? new Date(inv.status_transitions.paid_at * 1000).toISOString() : null,
        }));

        const subs = await stripe.subscriptions.list({ customer: scid, status: 'all', limit: 100 });
        subscriptions = subs.data.map(sub => {
          const subExtra = sub as unknown as { current_period_end?: number };
          const items = sub.items.data.map(i => {
            const prod = i.price.product;
            const productId = typeof prod === 'string' ? prod : (prod && 'id' in prod ? (prod as { id: string }).id : null);
            return {
              priceId: i.price.id,
              productId,
              recurring: i.price.recurring?.interval?.toString(),
              amount: (i.price.unit_amount ?? 0) / 100,
              currency: i.price.currency?.toUpperCase(),
            };
          });
          const item: SubscriptionItem = ({
          id: sub.id,
          status: sub.status,
          cancelAt: sub.cancel_at ? new Date(sub.cancel_at * 1000).toISOString() : null,
          canceledAt: sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : null,
          currentPeriodEnd: subExtra.current_period_end ? new Date(subExtra.current_period_end * 1000).toISOString() : null,
            items,
        });
          return item;
        });
      }

      // Rechnungen aus der Datenbank holen (zusätzlich zu Stripe)
      const dbInvoicesRes = await client.query(
        `SELECT 
          id,
          invoice_number,
          stripe_invoice_id,
          amount_cents,
          currency,
          status,
          paid_at,
          due_date,
          pdf_url,
          hosted_invoice_url,
          created_at
         FROM invoices 
         WHERE customer_id = $1 OR customer_email = $2 
         ORDER BY created_at DESC`,
        [params.id, customer.email]
      );
      
      // Kombiniere Stripe-Invoices und DB-Invoices (DB hat Priorität)
      const allInvoices = [...dbInvoicesRes.rows, ...invoices.filter(inv => 
        !dbInvoicesRes.rows.some(dbInv => dbInv.stripe_invoice_id === inv.id)
      )];

      return NextResponse.json({ 
        customer, 
        bookings: bookingsRes.rows, 
        invoices: allInvoices, 
        subscriptions 
      });
    } finally {
      client.release();
    }
  } catch {
    return NextResponse.json({ error: 'Fehler bei Kunden-Details' }, { status: 500 });
  }
}

// PUT: Kunde bearbeiten
export async function PUT(request: NextRequest, context: unknown) {
  try {
    const { params } = context as { params: { id: string } };
    const token = request.cookies.get('auth-token')?.value;
    if (!token) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    
    const user = verifyToken(token);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 });
    }

    const body = await request.json();
    const { name, phone, company_name, email } = body;

    const client = await pool.connect();
    try {
      // Prüfe ob Kunde existiert
      const checkRes = await client.query('SELECT id FROM customers WHERE id = $1', [params.id]);
      if (checkRes.rows.length === 0) {
        return NextResponse.json({ error: 'Kunde nicht gefunden' }, { status: 404 });
      }

      // Update-Felder zusammenstellen
      const updates: string[] = [];
      const values: unknown[] = [];
      let paramCount = 1;

      if (name !== undefined) {
        updates.push(`name = $${paramCount++}`);
        values.push(name);
      }
      if (phone !== undefined) {
        updates.push(`phone = $${paramCount++}`);
        values.push(phone);
      }
      if (company_name !== undefined) {
        updates.push(`company_name = $${paramCount++}`);
        values.push(company_name);
      }
      if (email !== undefined) {
        // E-Mail-Änderung: Prüfe ob E-Mail bereits existiert
        const emailCheck = await client.query(
          'SELECT id FROM customers WHERE email = $1 AND id != $2',
          [email, params.id]
        );
        if (emailCheck.rows.length > 0) {
          return NextResponse.json({ error: 'E-Mail-Adresse bereits vergeben' }, { status: 400 });
        }
        updates.push(`email = $${paramCount++}`);
        values.push(email.toLowerCase().trim());
      }

      if (updates.length === 0) {
        return NextResponse.json({ error: 'Keine Felder zum Aktualisieren' }, { status: 400 });
      }

      // updated_at aktualisieren
      updates.push(`updated_at = NOW()`);
      values.push(params.id);

      const query = `UPDATE customers SET ${updates.join(', ')} WHERE id = $${paramCount}`;
      await client.query(query, values);

      // Aktualisierten Kunden zurückgeben (nur benötigte Spalten)
      const customerRes = await client.query(
        `SELECT id, email, name, phone, company_name, customer_number, 
                portal_activated, portal_activated_at, 
                is_verified, created_at, updated_at 
         FROM customers WHERE id = $1`,
        [params.id]
      );
      
      return NextResponse.json({ 
        success: true, 
        customer: customerRes.rows[0] 
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Fehler beim Bearbeiten des Kunden:', error);
    return NextResponse.json(
      { error: 'Fehler beim Bearbeiten des Kunden' },
      { status: 500 }
    );
  }
}

// DELETE: Kunde löschen
export async function DELETE(request: NextRequest, context: unknown) {
  try {
    const { params } = context as { params: { id: string } };
    const token = request.cookies.get('auth-token')?.value;
    if (!token) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    
    const user = verifyToken(token);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 });
    }

    const client = await pool.connect();
    try {
      // Prüfe ob Kunde existiert
      const checkRes = await client.query('SELECT email, name FROM customers WHERE id = $1', [params.id]);
      if (checkRes.rows.length === 0) {
        return NextResponse.json({ error: 'Kunde nicht gefunden' }, { status: 404 });
      }

      // Kunde löschen (CASCADE löscht auch verknüpfte Daten)
      await client.query('DELETE FROM customers WHERE id = $1', [params.id]);

      return NextResponse.json({ 
        success: true,
        message: 'Kunde erfolgreich gelöscht'
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Fehler beim Löschen des Kunden:', error);
    return NextResponse.json(
      { error: 'Fehler beim Löschen des Kunden' },
      { status: 500 }
    );
  }
}


