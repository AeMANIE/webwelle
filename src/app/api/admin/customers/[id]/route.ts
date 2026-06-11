import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { pool, ensureAddressColumnsExist, updateCustomerProfile, getCustomerById } from '@/lib/database';
import { requireAdminAuth, secureResponse } from '@/lib/api-security';
import {
  buildFullName,
  sanitizeText,
  splitFullName,
  validateCustomerProfile,
  validateEmail,
} from '@/lib/validation';

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY nicht gesetzt');
  return new Stripe(key);
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const auth = await requireAdminAuth(request);
    if (auth instanceof NextResponse) return auth;

    let client: import('pg').PoolClient;
    let tempPool: import('pg').Pool | null = null;
    try {
      client = await pool.connect();
    } catch (connectionError) {
      const errorMsg = connectionError instanceof Error ? connectionError.message : '';
      const isSSLError = errorMsg.includes('certificate') || errorMsg.includes('SSL') || errorMsg.includes('TLS') || errorMsg.includes('unable to verify');
      const isHostnameError = errorMsg.includes('ENOTFOUND') || errorMsg.includes('getaddrinfo');
      
      if (isHostnameError) {
        const publicUrl = process.env.DATABASE_PUBLICURL;
        if (publicUrl) {
          const { Pool: TempPool } = await import('pg');
          tempPool = new TempPool({
            connectionString: publicUrl,
            ssl: publicUrl.includes('sslmode=require') ? { rejectUnauthorized: false } : false,
            connectionTimeoutMillis: 10000,
          });
          client = await tempPool.connect();
        } else {
          throw new Error(`Datenbank-Hostname kann nicht aufgelöst werden: ${errorMsg}`);
        }
      } else if (isSSLError) {
        const { Pool: TempPool } = await import('pg');
        const dbUrl = process.env.DATABASE_URL;
        if (!dbUrl) throw new Error('DATABASE_URL ist nicht gesetzt');
        tempPool = new TempPool({
          connectionString: dbUrl,
          ssl: { rejectUnauthorized: false },
          connectionTimeoutMillis: 10000,
        });
        client = await tempPool.connect();
      } else {
        throw connectionError;
      }
    }

    try {
      // Prüfe ob Adressfelder existieren
      const columnCheck = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'customers' 
        AND column_name IN ('street', 'city', 'zip', 'country', 'vat_id')
      `);
      const existingCustomerColumns = columnCheck.rows.map(row => row.column_name);
      const hasAddressFields = ['street', 'city', 'zip', 'country'].every((column) =>
        existingCustomerColumns.includes(column)
      );
      
      // Baue Query dynamisch auf - nur Spalten verwenden, die existieren
      const baseColumns = 'id, email, name, phone, company_name, customer_number, portal_activated, portal_activated_at, is_verified, created_at, updated_at';
      const addressColumns = hasAddressFields ? ', street, city, zip, country' : '';
      const vatColumn = existingCustomerColumns.includes('vat_id') ? ', vat_id' : '';
      const selectColumns = baseColumns + addressColumns + vatColumn;
      
      // Performance: Nur benötigte Spalten selektieren (kein SELECT *)
      const customerRes = await client.query(
        `SELECT ${selectColumns} FROM customers WHERE id = $1`,
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
      if (client) client.release();
      if (tempPool) await tempPool.end();
    }
  } catch (error) {
    console.error('Fehler bei Kunden-Details:', error);
    return NextResponse.json({ error: 'Fehler bei Kunden-Details' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const auth = await requireAdminAuth(request);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const existing = await getCustomerById(params.id);
    if (!existing) {
      return secureResponse({ error: 'Kunde nicht gefunden' }, 404);
    }

    const existingSplit = splitFullName(existing.name || '');
    let firstName = String(body.firstName ?? '').trim();
    let lastName = String(body.lastName ?? '').trim();
    if (!firstName && !lastName) {
      const sourceName = body.name !== undefined ? String(body.name) : existing.name || '';
      const fromName = splitFullName(sourceName);
      firstName = fromName.firstName;
      lastName = fromName.lastName;
    }
    const profileInput = {
      firstName,
      lastName,
      companyName: String(body.companyName ?? body.company_name ?? existing.company_name ?? '').trim(),
      street: String(body.street ?? existing.street ?? '').trim(),
      zip: String(body.zip ?? existing.zip ?? '').trim(),
      city: String(body.city ?? existing.city ?? '').trim(),
      country: String(body.country ?? existing.country ?? 'DE').trim().toUpperCase(),
      phone: String(body.phone ?? existing.phone ?? '').trim(),
    };

    const validation = validateCustomerProfile(profileInput);
    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0];
      return secureResponse(
        { error: 'validation_failed', message: firstError, errors: validation.errors },
        400
      );
    }

    let emailUpdate: string | undefined;
    if (body.email !== undefined) {
      const email = String(body.email).toLowerCase().trim();
      if (!validateEmail(email)) {
        return secureResponse({ error: 'Ungültige E-Mail-Adresse' }, 400);
      }
      const client = await pool.connect();
      try {
        const emailCheck = await client.query(
          'SELECT id FROM customers WHERE LOWER(email) = LOWER($1) AND id != $2',
          [email, params.id]
        );
        if (emailCheck.rows.length > 0) {
          return secureResponse({ error: 'E-Mail-Adresse bereits vergeben' }, 400);
        }
      } finally {
        client.release();
      }
      emailUpdate = email;
    }

    await ensureAddressColumnsExist();

    const updated = await updateCustomerProfile(params.id, {
      name: buildFullName(profileInput.firstName, profileInput.lastName),
      phone: profileInput.phone,
      company_name: sanitizeText(profileInput.companyName) || undefined,
      street: sanitizeText(profileInput.street),
      zip: profileInput.zip,
      city: sanitizeText(profileInput.city),
      country: profileInput.country,
      vat_id: body.vat_id !== undefined ? String(body.vat_id).trim() : undefined,
      email: emailUpdate,
    });

    if (!updated) {
      return secureResponse({ error: 'Aktualisierung fehlgeschlagen' }, 500);
    }

    return secureResponse({ success: true, customer: updated });
  } catch (error) {
    console.error('Fehler beim Bearbeiten des Kunden:', error);
    return secureResponse({ error: 'Fehler beim Bearbeiten des Kunden' }, 500);
  }
}

// PUT: Kunde bearbeiten (Legacy)
export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const auth = await requireAdminAuth(request);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const { name, phone, company_name, vat_id, email, street, city, zip, country } = body;

    let client: import('pg').PoolClient;
    let tempPool: import('pg').Pool | null = null;
    try {
      client = await pool.connect();
    } catch (connectionError) {
      const errorMsg = connectionError instanceof Error ? connectionError.message : '';
      const isSSLError = errorMsg.includes('certificate') || errorMsg.includes('SSL') || errorMsg.includes('TLS') || errorMsg.includes('unable to verify');
      const isHostnameError = errorMsg.includes('ENOTFOUND') || errorMsg.includes('getaddrinfo');
      
      if (isHostnameError) {
        const publicUrl = process.env.DATABASE_PUBLICURL;
        if (publicUrl) {
          const { Pool: TempPool } = await import('pg');
          tempPool = new TempPool({
            connectionString: publicUrl,
            ssl: publicUrl.includes('sslmode=require') ? { rejectUnauthorized: false } : false,
            connectionTimeoutMillis: 10000,
          });
          client = await tempPool.connect();
        } else {
          throw new Error(`Datenbank-Hostname kann nicht aufgelöst werden: ${errorMsg}`);
        }
      } else if (isSSLError) {
        const { Pool: TempPool } = await import('pg');
        const dbUrl = process.env.DATABASE_URL;
        if (!dbUrl) throw new Error('DATABASE_URL ist nicht gesetzt');
        tempPool = new TempPool({
          connectionString: dbUrl,
          ssl: { rejectUnauthorized: false },
          connectionTimeoutMillis: 10000,
        });
        client = await tempPool.connect();
      } else {
        throw connectionError;
      }
    }

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
      if (vat_id !== undefined) {
        await client.query('ALTER TABLE customers ADD COLUMN IF NOT EXISTS vat_id VARCHAR(50)');
        updates.push(`vat_id = $${paramCount++}`);
        values.push(vat_id);
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
      // Stelle sicher, dass Adressfelder existieren (füge sie hinzu, falls nötig)
      const hasAddressData = street !== undefined || city !== undefined || zip !== undefined || country !== undefined;
      if (hasAddressData) {
        try {
          await ensureAddressColumnsExist();
        } catch (migrationError) {
          console.error('⚠️ Fehler beim Hinzufügen der Adressfelder:', migrationError);
          // Weiter machen, auch wenn Migration fehlschlägt
        }
      }
      
      // Prüfe ob Adressfelder existieren, bevor wir sie aktualisieren
      const columnCheck = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'customers' 
        AND column_name IN ('street', 'city', 'zip', 'country', 'vat_id')
      `);
      const existingAddressColumns = columnCheck.rows.map(row => row.column_name);
      console.log('📋 Vorhandene Adressspalten:', existingAddressColumns);
      
      if (street !== undefined && existingAddressColumns.includes('street')) {
        updates.push(`street = $${paramCount++}`);
        values.push(street);
        console.log('✅ Street wird aktualisiert:', street);
      }
      if (city !== undefined && existingAddressColumns.includes('city')) {
        updates.push(`city = $${paramCount++}`);
        values.push(city);
        console.log('✅ City wird aktualisiert:', city);
      }
      if (zip !== undefined && existingAddressColumns.includes('zip')) {
        updates.push(`zip = $${paramCount++}`);
        values.push(zip);
        console.log('✅ Zip wird aktualisiert:', zip);
      }
      if (country !== undefined && existingAddressColumns.includes('country')) {
        updates.push(`country = $${paramCount++}`);
        values.push(country);
        console.log('✅ Country wird aktualisiert:', country);
      }

      if (updates.length === 0) {
        return NextResponse.json({ error: 'Keine Felder zum Aktualisieren' }, { status: 400 });
      }

      // updated_at aktualisieren
      updates.push(`updated_at = NOW()`);
      values.push(params.id);

      const query = `UPDATE customers SET ${updates.join(', ')} WHERE id = $${paramCount}`;
      console.log('📝 UPDATE Query:', query);
      console.log('📝 UPDATE Values:', values);
      await client.query(query, values);
      console.log('✅ Update erfolgreich ausgeführt');

      // Prüfe ob Adressfelder existieren für Rückgabe-Query
      const columnCheckReturn = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'customers' 
        AND column_name IN ('street', 'city', 'zip', 'country')
      `);
      const existingReturnColumns = columnCheckReturn.rows.map(r => r.column_name);
      const hasAddressFieldsReturn = ['street', 'city', 'zip', 'country'].every((column) =>
        existingReturnColumns.includes(column)
      );
      console.log('📋 Adressfelder für Rückgabe vorhanden:', hasAddressFieldsReturn, columnCheckReturn.rows.map(r => r.column_name));
      
      const baseColumnsReturn = 'id, email, name, phone, company_name, customer_number, portal_activated, portal_activated_at, is_verified, created_at, updated_at';
      const addressColumnsReturn = hasAddressFieldsReturn ? ', street, city, zip, country' : '';
      const vatColumnReturn = existingReturnColumns.includes('vat_id') ? ', vat_id' : '';
      const selectColumnsReturn = baseColumnsReturn + addressColumnsReturn + vatColumnReturn;
      
      // Aktualisierten Kunden zurückgeben (nur benötigte Spalten)
      const customerRes = await client.query(
        `SELECT ${selectColumnsReturn} FROM customers WHERE id = $1`,
        [params.id]
      );
      console.log('📊 Zurückgegebene Kundendaten:', customerRes.rows[0]);
      
      return NextResponse.json({ 
        success: true, 
        customer: customerRes.rows[0] 
      });
    } finally {
      if (client) client.release();
      if (tempPool) await tempPool.end();
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
export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const auth = await requireAdminAuth(request);
    if (auth instanceof NextResponse) return auth;

    let client: import('pg').PoolClient;
    let tempPool: import('pg').Pool | null = null;
    try {
      client = await pool.connect();
    } catch (connectionError) {
      const errorMsg = connectionError instanceof Error ? connectionError.message : '';
      const isSSLError = errorMsg.includes('certificate') || errorMsg.includes('SSL') || errorMsg.includes('TLS') || errorMsg.includes('unable to verify');
      const isHostnameError = errorMsg.includes('ENOTFOUND') || errorMsg.includes('getaddrinfo');
      
      if (isHostnameError) {
        const publicUrl = process.env.DATABASE_PUBLICURL;
        if (publicUrl) {
          const { Pool: TempPool } = await import('pg');
          tempPool = new TempPool({
            connectionString: publicUrl,
            ssl: publicUrl.includes('sslmode=require') ? { rejectUnauthorized: false } : false,
            connectionTimeoutMillis: 10000,
          });
          client = await tempPool.connect();
        } else {
          throw new Error(`Datenbank-Hostname kann nicht aufgelöst werden: ${errorMsg}`);
        }
      } else if (isSSLError) {
        const { Pool: TempPool } = await import('pg');
        const dbUrl = process.env.DATABASE_URL;
        if (!dbUrl) throw new Error('DATABASE_URL ist nicht gesetzt');
        tempPool = new TempPool({
          connectionString: dbUrl,
          ssl: { rejectUnauthorized: false },
          connectionTimeoutMillis: 10000,
        });
        client = await tempPool.connect();
      } else {
        throw connectionError;
      }
    }

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
      if (client) client.release();
      if (tempPool) await tempPool.end();
    }
  } catch (error) {
    console.error('Fehler beim Löschen des Kunden:', error);
    return NextResponse.json(
      { error: 'Fehler beim Löschen des Kunden' },
      { status: 500 }
    );
  }
}


