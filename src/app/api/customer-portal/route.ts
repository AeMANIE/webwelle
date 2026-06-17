import { NextRequest, NextResponse } from 'next/server';
import {
  getCustomerById,
  getCustomerByEmail,
  getBookingsByCustomerId,
  getInvoicesByBookingId,
  getSubscriptionByBookingId,
  updateCustomerProfile,
  ensureAddressColumnsExist,
} from '@/lib/database';
import { requireCustomerAuth, requireMemberAuth, secureResponse } from '@/lib/api-security';
import {
  buildFullName,
  sanitizeText,
  splitFullName,
  validateCustomerProfile,
} from '@/lib/validation';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireCustomerAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const email = auth.user.email.toLowerCase();
    const customerId = auth.user.customerId;
    if (!customerId) {
      return secureResponse({ error: 'Kundenkontext fehlt' }, 403);
    }

    switch (action) {
      case 'customer-info':
        return await getCustomerInfo(email, customerId);
      case 'bookings':
        return await getCustomerBookings(customerId, email);
      case 'addon-orders':
        return await getCustomerAddonOrders(email, customerId);
      case 'invoices': {
        const bookingId = searchParams.get('bookingId');
        if (!bookingId) {
          return secureResponse({ error: 'Booking-ID ist erforderlich' }, 400);
        }
        return await getBookingInvoices(bookingId, customerId, email);
      }
      case 'subscription': {
        const subscriptionBookingId = searchParams.get('bookingId');
        if (!subscriptionBookingId) {
          return secureResponse({ error: 'Booking-ID ist erforderlich' }, 400);
        }
        return await getBookingSubscription(subscriptionBookingId, customerId, email);
      }
      case 'funnel-analysis':
        return await getCustomerFunnelAnalysis(email, customerId);
      default:
        return secureResponse({ error: 'Ungültige Aktion' }, 400);
    }
  } catch (error) {
    console.error('Kundenportal API Fehler:', error);
    return secureResponse({ error: 'Interner Serverfehler' }, 500);
  }
}

async function getCustomerFunnelAnalysis(email: string, customerId: string) {
  try {
    const { pool } = await import('@/lib/database');
    const client = await pool.connect();
    try {
      const leads = await client.query(
        `SELECT id, token, status, funnel_kind, industry_raw, industry_normalized, postal_code, city, market,
                first_name, last_name, company_name, email, design_reference_urls,
                existing_website, existing_website_url,
                project_brief, project_notes, solution_selection, zoom_booking_confirmed,
                created_at, updated_at
         FROM funnel_leads
         WHERE ($2::uuid IS NOT NULL AND customer_id = $2::uuid)
            OR LOWER(email) = LOWER($1)
         ORDER BY updated_at DESC
         LIMIT 10`,
        [email, customerId]
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

      return secureResponse({ analyses });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Fehler beim Laden der Funnel-Analyse:', error);
    return secureResponse({ error: 'Fehler beim Laden der Funnel-Analyse' }, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireMemberAuth(request);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const { action, subscriptionId, reason, vatId } = body;

    switch (action) {
      case 'cancel-subscription':
        if (!subscriptionId) {
          return secureResponse({ error: 'Subscription-ID ist erforderlich' }, 400);
        }
        return await cancelSubscription(
          subscriptionId,
          auth.user.customerId!,
          auth.user.email,
          reason
        );
      case 'update-profile-vat':
        return await updateCustomerVat(auth.user.customerId!, auth.user.email, vatId);
      case 'update-profile':
        return await updateCustomerProfileData(auth.user.customerId!, body);
      default:
        return secureResponse({ error: 'Ungültige Aktion' }, 400);
    }
  } catch (error) {
    console.error('Kundenportal API Fehler:', error);
    return secureResponse({ error: 'Interner Serverfehler' }, 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireMemberAuth(request);
    if (auth instanceof NextResponse) return auth;

    const customerId = auth.user.customerId;
    if (!customerId) {
      return secureResponse({ error: 'Kundenkontext fehlt' }, 403);
    }

    const body = await request.json();
    return await updateCustomerProfileData(customerId, body);
  } catch (error) {
    console.error('Kundenportal API Fehler:', error);
    return secureResponse({ error: 'Interner Serverfehler' }, 500);
  }
}

function formatCustomerProfile(customer: Awaited<ReturnType<typeof getCustomerById>>) {
  if (!customer) return null;
  const { firstName, lastName } = splitFullName(customer.name || '');
  return {
    customerNumber: customer.customer_number || null,
    firstName,
    lastName,
    name: customer.name || null,
    companyName: customer.company_name || '',
    street: customer.street || '',
    zip: customer.zip || '',
    city: customer.city || '',
    country: customer.country || 'DE',
    phone: customer.phone || '',
    vatId: customer.vat_id || '',
  };
}

async function getCustomerInfo(email: string, customerId: string) {
  try {
    await ensureAddressColumnsExist();
    const customer = await getCustomerById(customerId);
    if (!customer || customer.email.toLowerCase() !== email.toLowerCase()) {
      return secureResponse({ error: 'Nicht autorisiert' }, 403);
    }
    return secureResponse(formatCustomerProfile(customer));
  } catch (error) {
    console.error('Fehler beim Laden der Kundeninformationen:', error);
    return secureResponse({ error: 'Fehler beim Laden der Kundeninformationen' }, 500);
  }
}

async function updateCustomerProfileData(
  customerId: string,
  body: Record<string, unknown>
) {
  const customer = await getCustomerById(customerId);
  if (!customer) {
    return secureResponse({ error: 'Kunde nicht gefunden' }, 404);
  }

  const profileInput = {
    firstName: String(body.firstName || '').trim(),
    lastName: String(body.lastName || '').trim(),
    companyName: String(body.companyName ?? body.company_name ?? '').trim(),
    street: String(body.street || '').trim(),
    zip: String(body.zip ?? body.postalCode ?? '').trim(),
    city: String(body.city || '').trim(),
    country: String(body.country || 'DE').trim().toUpperCase(),
    phone: String(body.phone || '').trim(),
  };

  const validation = validateCustomerProfile(profileInput);
  if (!validation.isValid) {
    const firstError = Object.values(validation.errors)[0];
    return secureResponse(
      { error: 'validation_failed', message: firstError, errors: validation.errors },
      400
    );
  }

  const updated = await updateCustomerProfile(customerId, {
    name: buildFullName(profileInput.firstName, profileInput.lastName),
    phone: profileInput.phone,
    company_name: sanitizeText(profileInput.companyName) || undefined,
    street: sanitizeText(profileInput.street),
    zip: profileInput.zip,
    city: sanitizeText(profileInput.city),
    country: profileInput.country,
  });

  return secureResponse({
    success: true,
    profile: formatCustomerProfile(updated),
  });
}

async function updateCustomerVat(customerId: string, email: string, vatId: unknown) {
  void customerId;
  const { updateCustomer, ensureCustomerPortalColumns } = await import('@/lib/database');
  await ensureCustomerPortalColumns();
  const customer = await updateCustomer(email, {
    vat_id: String(vatId || '').trim(),
  });

  return secureResponse({ success: true, vatId: customer?.vat_id || null });
}

async function getCustomerBookings(customerId: string, email: string) {
  try {
    const bookings = await getBookingsByCustomerId(customerId, email);

    const formattedBookings = bookings.map((booking) => ({
      id: String(booking.id),
      packageType: String(booking.package_type),
      packageName: getPackageDisplayName(String(booking.package_type)),
      isMonthly: Boolean(booking.is_monthly),
      status: String(booking.status),
      totalAmount: Number(booking.total_amount_cents) / 100,
      currency: String(booking.currency || 'eur'),
      createdAt: String(booking.created_at),
      packagePriceDisplay: String(
        booking.package_price_display || `${Number(booking.total_amount_cents) / 100} €`
      ),
      selectedAddons: Array.isArray(booking.selected_addons) ? booking.selected_addons : [],
    }));

    return secureResponse({ bookings: formattedBookings });
  } catch (error) {
    console.error('Fehler beim Laden der Buchungen:', error);
    return secureResponse({ error: 'Fehler beim Laden der Buchungen' }, 500);
  }
}

async function getCustomerAddonOrders(email: string, customerId: string) {
  try {
    const { pool } = await import('@/lib/database');
    const client = await pool.connect();

    try {
      const query = `
        SELECT id, booking_id, addon_key, addon_label, billing, price_id,
               amount_cents, currency, checkout_mode, status, session_id,
               stripe_invoice_id, stripe_subscription_id, notes, created_at
        FROM webwelle_addon_orders
        WHERE customer_email = $1 OR customer_id = $2::uuid
        ORDER BY created_at DESC
      `;
      const params: (string | number)[] = [email, customerId];
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

      return secureResponse({ addonOrders: formattedAddonOrders });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Fehler beim Laden der Add-on Bestellungen:', error);
    return secureResponse({ error: 'Fehler beim Laden der Add-on Bestellungen' }, 500);
  }
}

async function bookingBelongsToCustomer(
  bookingId: string,
  customerId: string,
  email: string
): Promise<boolean> {
  const bookings = await getBookingsByCustomerId(customerId, email);
  return bookings.some((b) => String(b.id) === bookingId);
}

async function getBookingInvoices(bookingId: string, customerId: string, email: string) {
  if (!(await bookingBelongsToCustomer(bookingId, customerId, email))) {
    return secureResponse({ error: 'Nicht autorisiert' }, 403);
  }

  try {
    const invoices = await getInvoicesByBookingId(bookingId);

    const formattedInvoices = invoices.map((invoice) => ({
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

    return secureResponse({ invoices: formattedInvoices });
  } catch (error) {
    console.error('Fehler beim Laden der Rechnungen:', error);
    return secureResponse({ error: 'Fehler beim Laden der Rechnungen' }, 500);
  }
}

async function getBookingSubscription(bookingId: string, customerId: string, email: string) {
  if (!(await bookingBelongsToCustomer(bookingId, customerId, email))) {
    return secureResponse({ error: 'Nicht autorisiert' }, 403);
  }

  try {
    const subscription = await getSubscriptionByBookingId(bookingId);

    if (!subscription) {
      return secureResponse({ subscription: null });
    }

    const formattedSubscription = {
      id: String(subscription.id || ''),
      status: String(subscription.status || 'active'),
      currentPeriodStart: subscription.current_period_start
        ? String(subscription.current_period_start)
        : '',
      currentPeriodEnd: subscription.current_period_end
        ? String(subscription.current_period_end)
        : '',
      cancelledAt: subscription.cancelled_at ? String(subscription.cancelled_at) : null,
      cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end || false),
      nextBillingDate: subscription.next_billing_date
        ? String(subscription.next_billing_date)
        : null,
      customerCancelled: Boolean(subscription.customer_cancelled || false),
      cancellationReason: subscription.cancellation_reason
        ? String(subscription.cancellation_reason)
        : null,
    };

    return secureResponse({ subscription: formattedSubscription });
  } catch (error) {
    console.error('Fehler beim Laden der Subscription:', error);
    return secureResponse({ error: 'Fehler beim Laden der Subscription' }, 500);
  }
}

async function cancelSubscription(
  subscriptionId: string,
  customerId: string,
  email: string,
  reason?: string
) {
  void customerId;
  try {
    const { pool } = await import('@/lib/database');
    const client = await pool.connect();

    try {
      const owned = await client.query(
        `SELECT s.id
         FROM webwelle_subscriptions s
         JOIN webwelle_bookings b ON b.id = s.booking_id
         WHERE (s.stripe_subscription_id = $1 OR s.id::text = $1)
           AND LOWER(b.customer_email) = LOWER($2)
         LIMIT 1`,
        [subscriptionId, email]
      );
      if (owned.rows.length === 0) {
        return secureResponse({ error: 'Nicht autorisiert' }, 403);
      }

      await client.query(
        `UPDATE webwelle_subscriptions
         SET customer_cancelled = true,
             cancellation_reason = $1,
             status = 'cancelled'
         WHERE stripe_subscription_id = $2 OR id::text = $2`,
        [reason || null, subscriptionId]
      );

      return secureResponse({ success: true, message: 'Abonnement erfolgreich gekündigt' });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Fehler beim Kündigen der Subscription:', error);
    return secureResponse({ error: 'Fehler beim Kündigen des Abonnements' }, 500);
  }
}

function getPackageDisplayName(packageType: string): string {
  const packageNames: Record<string, string> = {
    starterwelle: 'StarterWelle',
    businesswelle: 'BusinessWelle',
    erfolgswelle: 'ErfolgsWelle',
    flowwelle: 'FlowWelle',
    powerwelle: 'PowerWelle',
    meisterwelle: 'MeisterWelle',
    minijob: 'MiniJob',
    midijob: 'MidiJob',
    festangestellt: 'Festangestellt',
    einrichtungspaket: 'Einrichtungspaket',
  };

  return packageNames[packageType] || packageType;
}
