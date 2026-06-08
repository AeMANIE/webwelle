import { NextRequest, NextResponse } from 'next/server';
import { 
  getCustomerByEmail, 
  getBookingsByEmail, 
  getInvoicesByBookingId,
  getSubscriptionByBookingId
} from '@/lib/database';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const action = searchParams.get('action');
    const token = request.cookies.get('auth-token')?.value;
    const user = token ? verifyToken(token) : null;
    const effectiveEmail =
      user?.role === 'customer' ? user.email.toLowerCase() : email?.toLowerCase();

    if (!effectiveEmail) {
      return NextResponse.json({ error: 'E-Mail-Adresse ist erforderlich' }, { status: 400 });
    }

    if (user?.role === 'customer' && email && email.toLowerCase() !== effectiveEmail) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 });
    }

    switch (action) {
      case 'customer-info':
        return await getCustomerInfo(effectiveEmail);
      case 'bookings':
        return await getCustomerBookings(effectiveEmail);
      case 'addon-orders':
        return await getCustomerAddonOrders(effectiveEmail);
      case 'invoices':
        const bookingId = searchParams.get('bookingId');
        if (!bookingId) {
          return NextResponse.json({ error: 'Booking-ID ist erforderlich' }, { status: 400 });
        }
        return await getBookingInvoices(bookingId);
      case 'subscription':
        const subscriptionBookingId = searchParams.get('bookingId');
        if (!subscriptionBookingId) {
          return NextResponse.json({ error: 'Booking-ID ist erforderlich' }, { status: 400 });
        }
        return await getBookingSubscription(subscriptionBookingId);
      case 'funnel-analysis':
        return await getCustomerFunnelAnalysis(request, effectiveEmail);
      default:
        return NextResponse.json({ error: 'Ungültige Aktion' }, { status: 400 });
    }
  } catch (error) {
    console.error('Kundenportal API Fehler:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}

async function getCustomerFunnelAnalysis(request: NextRequest, email: string) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    const user = token ? verifyToken(token) : null;
    const effectiveEmail =
      user?.role === 'customer' && user.email ? user.email.toLowerCase() : email.toLowerCase();

    if (user?.role === 'customer' && email.toLowerCase() !== effectiveEmail) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 });
    }

    const { pool } = await import('@/lib/database');
    const client = await pool.connect();
    try {
      const customer = user?.role === 'customer' ? await getCustomerByEmail(effectiveEmail) : null;
      const customerId = customer?.id ? String(customer.id) : null;
      const leads = await client.query(
        `SELECT id, token, status, industry_raw, industry_normalized, postal_code, city, market,
                first_name, last_name, company_name, email, design_reference_urls,
                existing_website, existing_website_url,
                created_at, updated_at
         FROM funnel_leads
         WHERE ($2::uuid IS NOT NULL AND customer_id = $2::uuid)
            OR LOWER(email) = LOWER($1)
         ORDER BY updated_at DESC
         LIMIT 10`,
        [effectiveEmail, customerId]
      );

      const analyses = [];
      for (const lead of leads.rows) {
        const research = await client.query(
          `SELECT workflow_key, status, payload, error_message, updated_at
           FROM funnel_research_results
           WHERE lead_id = $1
           ORDER BY workflow_key`,
          [lead.id]
        );
        analyses.push({
          ...lead,
          research: research.rows,
        });
      }

      return NextResponse.json({ analyses });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Fehler beim Laden der Funnel-Analyse:', error);
    return NextResponse.json({ error: 'Fehler beim Laden der Funnel-Analyse' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    const user = token ? verifyToken(token) : null;
    if (!user || (user.role !== 'customer' && user.role !== 'admin')) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    const body = await request.json();
    const { action, subscriptionId, reason, vatId } = body;

    switch (action) {
      case 'cancel-subscription':
        if (!subscriptionId) {
          return NextResponse.json({ error: 'Subscription-ID ist erforderlich' }, { status: 400 });
        }
        return await cancelSubscription(subscriptionId, reason);
      case 'update-profile-vat':
        return await updateCustomerVat(request, vatId);
      default:
        return NextResponse.json({ error: 'Ungültige Aktion' }, { status: 400 });
    }
  } catch (error) {
    console.error('Kundenportal API Fehler:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}

async function getCustomerInfo(email: string) {
  try {
    const customer = await getCustomerByEmail(email);
    return NextResponse.json({
      customerNumber: customer?.customer_number || null,
      name: customer?.name || null,
      vatId: customer?.vat_id || null,
    });
  } catch (error) {
    console.error('Fehler beim Laden der Kundeninformationen:', error);
    return NextResponse.json({ error: 'Fehler beim Laden der Kundeninformationen' }, { status: 500 });
  }
}

async function updateCustomerVat(request: NextRequest, vatId: unknown) {
  const token = request.cookies.get('auth-token')?.value;
  const user = token ? verifyToken(token) : null;
  if (!user || user.role !== 'customer') {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  const { updateCustomer, ensureCustomerPortalColumns } = await import('@/lib/database');
  await ensureCustomerPortalColumns();
  const customer = await updateCustomer(user.email, {
    vat_id: String(vatId || '').trim(),
  });

  return NextResponse.json({ success: true, vatId: customer?.vat_id || null });
}

async function getCustomerBookings(email: string) {
  try {
    const bookings = await getBookingsByEmail(email);
    
    // Formatiere die Daten für das Frontend
    const formattedBookings = bookings.map(booking => ({
      id: String(booking.id),
      packageType: String(booking.package_type),
      packageName: getPackageDisplayName(String(booking.package_type)),
      isMonthly: Boolean(booking.is_monthly),
      status: String(booking.status),
      totalAmount: Number(booking.total_amount_cents) / 100,
      currency: String(booking.currency || 'eur'),
      createdAt: String(booking.created_at),
      packagePriceDisplay: String(booking.package_price_display || `${Number(booking.total_amount_cents) / 100} €`),
      selectedAddons: Array.isArray(booking.selected_addons) ? booking.selected_addons : [],
    }));

    return NextResponse.json({ bookings: formattedBookings });
  } catch (error) {
    console.error('Fehler beim Laden der Buchungen:', error);
    return NextResponse.json({ error: 'Fehler beim Laden der Buchungen' }, { status: 500 });
  }
}

async function getCustomerAddonOrders(email: string) {
  try {
    // Add-on Bestellungen aus webwelle_addon_orders laden
    const { Pool } = await import('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL?.includes('sslmode=require') 
        ? { rejectUnauthorized: false } 
        : undefined,
      connectionTimeoutMillis: 10000,
    });
    const client = await pool.connect();
    
    try {
      // Lade Add-on Bestellungen über customer_email oder customer_id
      const customer = await getCustomerByEmail(email);
      let query = `
        SELECT id, booking_id, addon_key, addon_label, billing, price_id, 
               amount_cents, currency, checkout_mode, status, session_id, 
               stripe_invoice_id, stripe_subscription_id, notes, created_at 
        FROM webwelle_addon_orders 
        WHERE customer_email = $1
      `;
      const params: (string | number)[] = [email];
      
      if (customer?.id) {
        query = `
          SELECT id, booking_id, addon_key, addon_label, billing, price_id, 
               amount_cents, currency, checkout_mode, status, session_id, 
               stripe_invoice_id, stripe_subscription_id, notes, created_at 
        FROM webwelle_addon_orders 
          WHERE customer_email = $1 OR customer_id = $2
        `;
        params.push(customer.id);
      }
      
      query += ' ORDER BY created_at DESC';
      const result = await client.query(query, params);
      
      interface AddonOrderRow {
        id: string;
        addon_key?: string;
        addon_label?: string;
        billing?: string;
        amount_cents?: number;
        status?: string;
        created_at?: Date;
        checkout_mode?: string;
      }
      
      const formattedAddonOrders = result.rows.map((order: AddonOrderRow) => ({
        id: String(order.id),
        addonKey: String(order.addon_key || ''),
        addonLabel: String(order.addon_label || ''),
        billing: String(order.billing || 'oneTime'),
        amount: Number(order.amount_cents || 0) / 100,
        currency: 'eur',
        status: String(order.status || 'pending'),
        createdAt: String(order.created_at || ''),
        checkoutMode: String(order.checkout_mode || 'payment'),
      }));

      return NextResponse.json({ addonOrders: formattedAddonOrders });
    } finally {
      client.release();
      await pool.end();
    }
  } catch (error) {
    console.error('Fehler beim Laden der Add-on Bestellungen:', error);
    return NextResponse.json({ error: 'Fehler beim Laden der Add-on Bestellungen' }, { status: 500 });
  }
}

async function getBookingInvoices(bookingId: string) {
  try {
    const invoices = await getInvoicesByBookingId(bookingId);
    
    const formattedInvoices = invoices.map(invoice => ({
      id: String(invoice.id || ''),
      invoiceNumber: String(invoice.invoice_number || ''),
      amount: Number(invoice.amount_cents || 0) / 100,
      currency: String(invoice.currency || 'EUR'),
      status: String(invoice.status || 'draft'),
      dueDate: invoice.due_date ? String(invoice.due_date) : null,
      paidAt: invoice.paid_at ? String(invoice.paid_at) : null,
      pdfUrl: invoice.pdf_url ? String(invoice.pdf_url) : null,
      hostedInvoiceUrl: invoice.hosted_invoice_url ? String(invoice.hosted_invoice_url) : null,
    }));

    return NextResponse.json({ invoices: formattedInvoices });
  } catch (error) {
    console.error('Fehler beim Laden der Rechnungen:', error);
    return NextResponse.json({ error: 'Fehler beim Laden der Rechnungen' }, { status: 500 });
  }
}

async function getBookingSubscription(bookingId: string) {
  try {
    const subscription = await getSubscriptionByBookingId(bookingId);
    
    if (!subscription) {
      return NextResponse.json({ subscription: null });
    }

    const formattedSubscription = {
      id: String(subscription.id || ''),
      status: String(subscription.status || 'active'),
      currentPeriodStart: subscription.current_period_start ? String(subscription.current_period_start) : '',
      currentPeriodEnd: subscription.current_period_end ? String(subscription.current_period_end) : '',
      cancelledAt: subscription.cancelled_at ? String(subscription.cancelled_at) : null,
      cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end || false),
      nextBillingDate: subscription.next_billing_date ? String(subscription.next_billing_date) : null,
      customerCancelled: Boolean(subscription.customer_cancelled || false),
      cancellationReason: subscription.cancellation_reason ? String(subscription.cancellation_reason) : null,
    };

    return NextResponse.json({ subscription: formattedSubscription });
  } catch (error) {
    console.error('Fehler beim Laden der Subscription:', error);
    return NextResponse.json({ error: 'Fehler beim Laden der Subscription' }, { status: 500 });
  }
}

async function cancelSubscription(subscriptionId: string, reason?: string) {
  try {
    // Abonnement in Datenbank aktualisieren
    const { Pool } = await import('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL?.includes('sslmode=require') 
        ? { rejectUnauthorized: false } 
        : undefined,
      connectionTimeoutMillis: 10000,
    });
    const client = await pool.connect();
    
    try {
      await client.query(
        `UPDATE webwelle_subscriptions 
         SET customer_cancelled = true, 
             cancellation_reason = $1,
             status = 'cancelled'
         WHERE stripe_subscription_id = $2 OR id = $2`,
        [reason || null, subscriptionId]
      );
      
      return NextResponse.json({ success: true, message: 'Abonnement erfolgreich gekündigt' });
    } finally {
      client.release();
      await pool.end();
    }
  } catch (error) {
    console.error('Fehler beim Kündigen der Subscription:', error);
    return NextResponse.json({ error: 'Fehler beim Kündigen des Abonnements' }, { status: 500 });
  }
}

function getPackageDisplayName(packageType: string): string {
  const packageNames: Record<string, string> = {
    'starterwelle': 'StarterWelle',
    'businesswelle': 'BusinessWelle',
    'erfolgswelle': 'ErfolgsWelle',
    'flowwelle': 'FlowWelle',
    'powerwelle': 'PowerWelle',
    'meisterwelle': 'MeisterWelle',
    'minijob': 'MiniJob',
    'midijob': 'MidiJob',
    'festangestellt': 'Festangestellt',
    'einrichtungspaket': 'Einrichtungspaket',
  };
  
  return packageNames[packageType] || packageType;
}
