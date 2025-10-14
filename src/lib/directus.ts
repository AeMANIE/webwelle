import { BookingData } from './database';

// Directus API Configuration
const DIRECTUS_URL = process.env.DIRECTUS_URL || 'http://localhost:8055';
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN;

if (!DIRECTUS_TOKEN) {
  console.warn('DIRECTUS_TOKEN ist nicht gesetzt. Directus-Integration deaktiviert.');
}

// Directus API Client
class DirectusClient {
  private baseUrl: string;
  private token: string | undefined;

  constructor(baseUrl: string, token?: string) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  async request<T = unknown>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}/items/${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    console.log(`🔄 Directus API Request: ${options.method || 'GET'} ${url}`);

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Directus API Error: ${response.status} - ${errorText}`);
      throw new Error(`Directus API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`✅ Directus API Success: ${options.method || 'GET'} ${url}`);
    return data;
  }

  // Booking Operations
  async createBooking(bookingData: BookingData) {
    if (!this.token) {
      console.warn('Directus Token nicht verfügbar. Booking wird nicht gespeichert.');
      return null;
    }

    try {
      const directusBooking = {
        status: 'pending',
        session_id: bookingData.session_id,
        package_type: bookingData.package_type,
        is_monthly: bookingData.is_monthly,
        checkout_mode: bookingData.checkout_mode || 'payment',
        package_price_display: bookingData.package_price_display,
        currency: bookingData.currency || 'eur',
        total_amount_cents: bookingData.total_amount_cents,
        customer_name: bookingData.customer_name,
        customer_email: bookingData.customer_email,
        customer_phone: bookingData.customer_phone,
        company_name: bookingData.company_name,
        existing_website: bookingData.existing_website,
        existing_website_url: bookingData.existing_website_url,
        target_group: bookingData.target_group,
        design_style: bookingData.design_style,
        design_reference_url: bookingData.design_reference_url,
        selected_addons: bookingData.selected_addons,
        message: bookingData.message,
        raw_form_data: bookingData.raw_form_data,
        stripe_metadata: bookingData.stripe_metadata,
        stripe_customer_id: bookingData.stripe_customer_id,
        stripe_payment_intent_id: bookingData.stripe_payment_intent_id,
        stripe_subscription_id: bookingData.stripe_subscription_id,
        stripe_invoice_id: bookingData.stripe_invoice_id,
      };

      const result = await this.request<{ data: { id: string } }>('webwelle_bookings', {
        method: 'POST',
        body: JSON.stringify(directusBooking),
      });

      console.log('Booking erfolgreich in Directus gespeichert:', result.data.id);
      return result.data;
    } catch (error) {
      console.error('Fehler beim Speichern in Directus:', error);
      throw error;
    }
  }

  async updateBookingStatus(sessionId: string, status: string, stripeData?: Record<string, unknown>) {
    if (!this.token) return null;

    try {
      // Erst die Booking-ID finden
      const bookings = await this.request<{ data: Array<{ id: string }> }>(
        `webwelle_bookings?filter[session_id][_eq]=${sessionId}`
      );

      if (bookings.data.length === 0) {
        throw new Error(`Booking mit session_id ${sessionId} nicht gefunden`);
      }

      const bookingId = bookings.data[0].id;
      const updateData: Record<string, unknown> = { status };

      // Stripe-Daten hinzufügen falls vorhanden
      if (stripeData) {
        if (stripeData.customer_id) updateData.stripe_customer_id = stripeData.customer_id;
        if (stripeData.payment_intent_id) updateData.stripe_payment_intent_id = stripeData.payment_intent_id;
        if (stripeData.subscription_id) updateData.stripe_subscription_id = stripeData.subscription_id;
        if (stripeData.invoice_id) updateData.stripe_invoice_id = stripeData.invoice_id;
      }

      const result = await this.request<{ data: { id: string } }>(
        `webwelle_bookings/${bookingId}`,
        {
          method: 'PATCH',
          body: JSON.stringify(updateData),
        }
      );

      console.log('Booking-Status erfolgreich aktualisiert:', result.data.id);
      return result.data;
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Booking-Status:', error);
      throw error;
    }
  }

  // Subscription Operations
  async createSubscription(bookingId: string, subscriptionData: Record<string, unknown>) {
    if (!this.token) return null;

    try {
      const directusSubscription = {
        booking_id: bookingId,
        stripe_subscription_id: subscriptionData.id,
        status: subscriptionData.status,
        current_period_start: subscriptionData.current_period_start,
        current_period_end: subscriptionData.current_period_end,
        cancelled_at: subscriptionData.cancelled_at,
        cancel_at_period_end: subscriptionData.cancel_at_period_end,
        next_billing_date: subscriptionData.next_billing_date,
        trial_start: subscriptionData.trial_start,
        trial_end: subscriptionData.trial_end,
        customer_cancelled: false,
        cancellation_reason: null,
      };

      const result = await this.request<{ data: { id: string } }>('webwelle_subscriptions', {
        method: 'POST',
        body: JSON.stringify(directusSubscription),
      });

      console.log('Subscription erfolgreich in Directus gespeichert:', result.data.id);
      return result.data;
    } catch (error) {
      console.error('Fehler beim Speichern der Subscription:', error);
      throw error;
    }
  }

  // Invoice Operations
  async createInvoice(bookingId: string, invoiceData: Record<string, unknown>) {
    if (!this.token) return null;

    try {
      const directusInvoice = {
        booking_id: bookingId,
        invoice_number: invoiceData.invoice_number,
        amount_cents: invoiceData.amount_cents,
        currency: invoiceData.currency || 'eur',
        status: invoiceData.status || 'draft',
        due_date: invoiceData.due_date,
        paid_at: invoiceData.paid_at,
        stripe_invoice_id: invoiceData.stripe_invoice_id,
        pdf_url: invoiceData.pdf_url,
        notes: invoiceData.notes,
      };

      const result = await this.request<{ data: { id: string } }>('webwelle_invoices', {
        method: 'POST',
        body: JSON.stringify(directusInvoice),
      });

      console.log('Invoice erfolgreich in Directus gespeichert:', result.data.id);
      return result.data;
    } catch (error) {
      console.error('Fehler beim Speichern der Invoice:', error);
      throw error;
    }
  }

  // Customer Portal Operations
  async getCustomerBookings(customerEmail: string) {
    if (!this.token) return [];

    try {
      const result = await this.request<{ data: Array<Record<string, unknown>> }>(
        `webwelle_bookings?filter[customer_email][_eq]=${customerEmail}&sort=-created_at`
      );
      return result.data;
    } catch (error) {
      console.error('Fehler beim Laden der Kundenbuchungen:', error);
      return [];
    }
  }

  async getBookingInvoices(bookingId: string) {
    if (!this.token) return [];

    try {
      const result = await this.request<{ data: Array<Record<string, unknown>> }>(
        `webwelle_invoices?filter[booking_id][_eq]=${bookingId}&sort=-created_at`
      );
      return result.data;
    } catch (error) {
      console.error('Fehler beim Laden der Rechnungen:', error);
      return [];
    }
  }

  async getBookingSubscription(bookingId: string) {
    if (!this.token) return null;

    try {
      const result = await this.request<{ data: Array<Record<string, unknown>> }>(
        `webwelle_subscriptions?filter[booking_id][_eq]=${bookingId}`
      );
      return result.data[0] || null;
    } catch (error) {
      console.error('Fehler beim Laden der Subscription:', error);
      return null;
    }
  }

  async cancelSubscription(subscriptionId: string, reason?: string) {
    if (!this.token) return null;

    try {
      const result = await this.request<{ data: Record<string, unknown> }>(
        `webwelle_subscriptions?filter[stripe_subscription_id][_eq]=${subscriptionId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            customer_cancelled: true,
            cancellation_reason: reason,
            cancel_at_period_end: true,
          }),
        }
      );

      console.log('Subscription erfolgreich gekündigt:', result.data);
      return result.data;
    } catch (error) {
      console.error('Fehler beim Kündigen der Subscription:', error);
      throw error;
    }
  }

  // Add-on Order Operations
  async createAddonOrder(bookingId: string, addonData: {
    addon_key: string;
    addon_label: string;
    billing: 'oneTime' | 'monthly';
    price_id: string;
    amount_cents: number;
    checkout_mode: 'payment' | 'subscription';
    session_id: string;
    stripe_invoice_id?: string;
    stripe_subscription_id?: string;
  }) {
    if (!this.token) return null;

    try {
      const directusAddonOrder = {
        booking_id: bookingId,
        addon_key: addonData.addon_key,
        addon_label: addonData.addon_label,
        billing: addonData.billing,
        price_id: addonData.price_id,
        amount_cents: addonData.amount_cents,
        checkout_mode: addonData.checkout_mode,
        status: 'pending',
        session_id: addonData.session_id,
        stripe_invoice_id: addonData.stripe_invoice_id || null,
        stripe_subscription_id: addonData.stripe_subscription_id || null,
      };

      const result = await this.request<{ data: { id: string } }>('webwelle_addon_orders', {
        method: 'POST',
        body: JSON.stringify(directusAddonOrder),
      });

      console.log('Add-on Bestellung erfolgreich in Directus gespeichert:', result.data.id);
      return result.data;
    } catch (error) {
      console.error('Fehler beim Speichern der Add-on Bestellung:', error);
      throw error;
    }
  }

  async updateAddonOrderStatus(sessionId: string, status: string, stripeData?: Record<string, unknown>) {
    if (!this.token) return null;

    try {
      // Finde die Add-on Bestellung
      const orders = await this.request<{ data: Array<{ id: string }> }>(
        `webwelle_addon_orders?filter[session_id][_eq]=${sessionId}`
      );

      if (orders.data.length === 0) {
        throw new Error(`Add-on Bestellung mit session_id ${sessionId} nicht gefunden`);
      }

      const orderId = orders.data[0].id;
      const updateData: Record<string, unknown> = { status };

      // Stripe-Daten hinzufügen falls vorhanden
      if (stripeData) {
        if (stripeData.invoice_id) updateData.stripe_invoice_id = stripeData.invoice_id;
        if (stripeData.subscription_id) updateData.stripe_subscription_id = stripeData.subscription_id;
      }

      const result = await this.request<{ data: { id: string } }>(
        `webwelle_addon_orders/${orderId}`,
        {
          method: 'PATCH',
          body: JSON.stringify(updateData),
        }
      );

      console.log('Add-on Bestellung-Status erfolgreich aktualisiert:', result.data.id);
      return result.data;
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Add-on Bestellung:', error);
      throw error;
    }
  }

  async getCustomerAddonOrders(customerEmail: string) {
    if (!this.token) return [];

    try {
      // Hole alle Buchungen des Kunden
      const bookings = await this.request<{ data: Array<{ id: string }> }>(
        `webwelle_bookings?filter[customer_email][_eq]=${customerEmail}`
      );

      if (bookings.data.length === 0) return [];

      // Hole alle Add-on Bestellungen für diese Buchungen
      const bookingIds = bookings.data.map(b => b.id);
      const result = await this.request<{ data: Array<Record<string, unknown>> }>(
        `webwelle_addon_orders?filter[booking_id][_in]=${bookingIds.join(',')}&sort=-created_at`
      );
      
      return result.data;
    } catch (error) {
      console.error('Fehler beim Laden der Add-on Bestellungen:', error);
      return [];
    }
  }
}

// Export singleton instance
export const directus = new DirectusClient(DIRECTUS_URL, DIRECTUS_TOKEN);

// Helper function to check if Directus is available
export const isDirectusAvailable = (): boolean => {
  return !!DIRECTUS_TOKEN;
};
