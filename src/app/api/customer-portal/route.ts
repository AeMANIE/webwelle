import { NextRequest, NextResponse } from 'next/server';
import { directus, isDirectusAvailable } from '@/lib/directus';
import { getCustomerByEmail } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const action = searchParams.get('action');

    if (!email) {
      return NextResponse.json({ error: 'E-Mail-Adresse ist erforderlich' }, { status: 400 });
    }

    if (!isDirectusAvailable()) {
      return NextResponse.json({ error: 'Directus nicht verfügbar' }, { status: 503 });
    }

    switch (action) {
      case 'customer-info':
        return await getCustomerInfo(email);
      case 'bookings':
        return await getCustomerBookings(email);
      case 'addon-orders':
        return await getCustomerAddonOrders(email);
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
      default:
        return NextResponse.json({ error: 'Ungültige Aktion' }, { status: 400 });
    }
  } catch (error) {
    console.error('Kundenportal API Fehler:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, subscriptionId, reason } = body;

    if (!isDirectusAvailable()) {
      return NextResponse.json({ error: 'Directus nicht verfügbar' }, { status: 503 });
    }

    switch (action) {
      case 'cancel-subscription':
        if (!subscriptionId) {
          return NextResponse.json({ error: 'Subscription-ID ist erforderlich' }, { status: 400 });
        }
        return await cancelSubscription(subscriptionId, reason);
      default:
        return NextResponse.json({ error: 'Ungültige Aktion' }, { status: 400 });
    }
  } catch (error) {
    console.error('Kundenportal API Fehler:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}

async function getCustomerBookings(email: string) {
  try {
    const bookings = await directus.getCustomerBookings(email);
    
    // Formatiere die Daten für das Frontend
    const formattedBookings = bookings.map(booking => ({
      id: String(booking.id),
      packageType: String(booking.package_type),
      packageName: getPackageDisplayName(String(booking.package_type)),
      isMonthly: Boolean(booking.is_monthly),
      status: String(booking.status),
      totalAmount: Number(booking.total_amount_cents) / 100,
      currency: String(booking.currency),
      createdAt: String(booking.created_at),
      packagePriceDisplay: String(booking.package_price_display),
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
    const addonOrders = await directus.getCustomerAddonOrders(email);
    
    const formattedAddonOrders = addonOrders.map(order => ({
      id: String(order.id),
      addonKey: String(order.addon_key),
      addonLabel: String(order.addon_label),
      billing: String(order.billing),
      amount: Number(order.amount_cents) / 100,
      currency: 'eur', // Standard für Add-ons
      status: String(order.status),
      createdAt: String(order.created_at),
      checkoutMode: String(order.checkout_mode),
    }));

    return NextResponse.json({ addonOrders: formattedAddonOrders });
  } catch (error) {
    console.error('Fehler beim Laden der Add-on Bestellungen:', error);
    return NextResponse.json({ error: 'Fehler beim Laden der Add-on Bestellungen' }, { status: 500 });
  }
}

async function getBookingInvoices(bookingId: string) {
  try {
    const invoices = await directus.getBookingInvoices(bookingId);
    
    const formattedInvoices = invoices.map(invoice => ({
      id: String(invoice.id),
      invoiceNumber: String(invoice.invoice_number),
      amount: Number(invoice.amount_cents) / 100,
      currency: String(invoice.currency),
      status: String(invoice.status),
      dueDate: String(invoice.due_date),
      paidAt: invoice.paid_at ? String(invoice.paid_at) : null,
      pdfUrl: invoice.pdf_url ? String(invoice.pdf_url) : null,
    }));

    return NextResponse.json({ invoices: formattedInvoices });
  } catch (error) {
    console.error('Fehler beim Laden der Rechnungen:', error);
    return NextResponse.json({ error: 'Fehler beim Laden der Rechnungen' }, { status: 500 });
  }
}

async function getBookingSubscription(bookingId: string) {
  try {
    const subscription = await directus.getBookingSubscription(bookingId);
    
    if (!subscription) {
      return NextResponse.json({ subscription: null });
    }

    const formattedSubscription = {
      id: String(subscription.id),
      status: String(subscription.status),
      currentPeriodStart: String(subscription.current_period_start),
      currentPeriodEnd: String(subscription.current_period_end),
      cancelledAt: subscription.cancelled_at ? String(subscription.cancelled_at) : null,
      cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
      nextBillingDate: subscription.next_billing_date ? String(subscription.next_billing_date) : null,
      customerCancelled: Boolean(subscription.customer_cancelled),
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
    await directus.cancelSubscription(subscriptionId, reason);
    return NextResponse.json({ success: true, message: 'Abonnement erfolgreich gekündigt' });
  } catch (error) {
    console.error('Fehler beim Kündigen der Subscription:', error);
    return NextResponse.json({ error: 'Fehler beim Kündigen des Abonnements' }, { status: 500 });
  }
}

async function getCustomerInfo(email: string) {
  try {
    const customer = await getCustomerByEmail(email);
    return NextResponse.json({
      customerNumber: customer?.customer_number || null,
      name: customer?.name || null,
    });
  } catch (error) {
    console.error('Fehler beim Laden der Kundeninformationen:', error);
    return NextResponse.json({ error: 'Fehler beim Laden der Kundeninformationen' }, { status: 500 });
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
  };
  
  return packageNames[packageType] || packageType;
}
