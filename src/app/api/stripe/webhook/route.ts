import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { directus, isDirectusAvailable } from '@/lib/directus';
import { sendBookingConfirmation } from '@/lib/email-confirmation';
import { sendAddonConfirmation } from '@/lib/email-addon-confirmation';
import { BookingData } from '@/lib/database';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_your_secret_key_here');

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_your_webhook_secret_here';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Keine Stripe-Signatur gefunden' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook-Signatur-Verifikation fehlgeschlagen:', err);
      return NextResponse.json({ error: 'Ungültige Signatur' }, { status: 400 });
    }

    // Verarbeite verschiedene Event-Typen
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      
      default:
        console.log(`Unbehandeltes Event-Typ: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook-Fehler:', error);
    return NextResponse.json({ error: 'Webhook-Fehler' }, { status: 500 });
  }
}

// Event-Handler
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log('Checkout-Session abgeschlossen:', session.id);
  
  try {
    const metadata = session.metadata;
    if (metadata) {
      // Prüfe ob es sich um eine Add-on Bestellung handelt
      if (metadata.type === 'addon_order') {
        await handleAddonOrderCompleted(session, metadata);
        return;
      }

      console.log('Kunden-Daten:', {
        packageType: metadata.packageType,
        isMonthly: metadata.isMonthly,
        customerName: metadata.customerName,
        formData: JSON.parse(metadata.formData || '{}')
      });

      const formData = JSON.parse(metadata.formData || '{}');
      
      // Berechne Gesamtbetrag aus Line Items
      const totalAmount = session.amount_total || 0;
      
      // Erstelle BookingData für Directus
      const bookingData: BookingData = {
        session_id: session.id,
        package_type: metadata.packageType as 'starterwelle' | 'businesswelle' | 'erfolgswelle' | 'flowwelle' | 'powerwelle' | 'meisterwelle',
        is_monthly: metadata.isMonthly === 'true',
        checkout_mode: metadata.checkoutMode || 'payment',
        package_price_display: metadata.packagePriceDisplay || 'Preis nicht verfügbar',
        currency: session.currency || 'eur',
        total_amount_cents: totalAmount,
        customer_name: metadata.customerName || formData.customerName || 'Unbekannt',
        customer_email: session.customer_email || formData.customerEmail || 'unbekannt@example.com',
        customer_phone: formData.customerPhone || undefined,
        company_name: formData.companyName || 'Unbekanntes Unternehmen',
        existing_website: formData.existingWebsite === 'Ja' ? 'ja' : 'nein',
        existing_website_url: formData.aktuelleWebsiteUrl || undefined,
        target_group: formData.targetGroup ? JSON.parse(formData.targetGroup) : [],
        design_style: formData.designStyle || 'modern',
        design_reference_url: formData.wettbewerberWebsite || formData.designVorbild || undefined,
        selected_addons: formData.zusatzfunktionen ? JSON.parse(formData.zusatzfunktionen) : undefined,
        message: formData.message || undefined,
        raw_form_data: formData,
        stripe_metadata: metadata,
        stripe_customer_id: session.customer as string || undefined,
        stripe_payment_intent_id: session.payment_intent as string || undefined,
        stripe_subscription_id: session.subscription as string || undefined,
        stripe_invoice_id: undefined,
        functions: [], // Legacy field
        budget: 'nicht angegeben', // Legacy field
        status: 'paid',
      };

      // Speichere in Directus (falls verfügbar)
      if (isDirectusAvailable()) {
        try {
          const directusBooking = await directus.createBooking(bookingData);
          
          if (directusBooking) {
            // Erstelle Subscription falls monatlich
            if (bookingData.is_monthly && session.subscription) {
              const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
              await directus.createSubscription(directusBooking.id, subscription as unknown as Record<string, unknown>);
            }
            
            // Erstelle Invoice
            if (session.invoice) {
              const invoice = await stripe.invoices.retrieve(session.invoice as string);
              await directus.createInvoice(directusBooking.id, {
                invoice_number: invoice.number || `INV-${Date.now()}`,
                amount_cents: invoice.amount_paid || totalAmount,
                currency: invoice.currency || 'eur',
                status: 'paid',
                due_date: invoice.due_date ? new Date(invoice.due_date * 1000).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                paid_at: new Date().toISOString(),
                stripe_invoice_id: invoice.id,
                pdf_url: invoice.invoice_pdf || null,
              });
            }
          }
          
          console.log('✅ Buchung erfolgreich in Directus gespeichert');
          
          // Sende E-Mail-Bestätigung
          await sendBookingConfirmationEmail(bookingData as unknown as Record<string, unknown>, formData);
        } catch (directusError) {
          console.error('❌ Fehler beim Speichern in Directus:', directusError);
          // Fallback: Speichere in PostgreSQL
          const { saveBooking } = await import('@/lib/database');
          await saveBooking(bookingData);
          console.log('✅ Buchung als Fallback in PostgreSQL gespeichert');
          
          // Sende E-Mail-Bestätigung auch bei Fallback
          await sendBookingConfirmationEmail(bookingData as unknown as Record<string, unknown>, formData);
        }
      } else {
        // Fallback: Speichere in PostgreSQL
        const { saveBooking } = await import('@/lib/database');
        await saveBooking(bookingData);
        console.log('✅ Buchung in PostgreSQL gespeichert (Directus nicht verfügbar)');
        
        // Sende E-Mail-Bestätigung auch bei Fallback
        await sendBookingConfirmationEmail(bookingData as unknown as Record<string, unknown>, formData);
      }
    }
  } catch (error) {
    console.error('❌ Fehler beim Speichern der Buchung:', error);
  }
}

async function handleAddonOrderCompleted(session: Stripe.Checkout.Session, _metadata: Record<string, string>) {
  console.log('Add-on Bestellung abgeschlossen:', session.id);
  
  try {
    if (isDirectusAvailable()) {
      // Aktualisiere Add-on Bestellung Status
      await directus.updateAddonOrderStatus(session.id, 'paid', {
        customer_id: session.customer as string,
        payment_intent_id: session.payment_intent as string,
        invoice_id: session.invoice as string,
        subscription_id: session.subscription as string,
      });

      // Sende Add-on Bestätigungs-E-Mail
      try {
        // Hole Add-on Bestellung Details
        const addonOrders = await directus.request<{ data: Array<Record<string, unknown>> }>(
          `webwelle_addon_orders?filter[session_id][_eq]=${session.id}`
        );

        if (addonOrders.data.length > 0) {
          const order = addonOrders.data[0];
          const booking = await directus.request<{ data: Record<string, unknown> }>(
            `webwelle_bookings/${order.booking_id}`
          );

          await sendAddonConfirmation({
            customerName: String(booking.data.customer_name),
            customerEmail: String(booking.data.customer_email),
            addonLabel: String(order.addon_label),
            addonPrice: `${(Number(order.amount_cents) / 100).toFixed(2)} €`,
            billing: String(order.billing) as 'oneTime' | 'monthly',
            sessionId: String(order.session_id),
            bookingId: String(order.booking_id),
          });
        }
      } catch (emailError) {
        console.error('❌ Fehler beim Senden der Add-on Bestätigungs-E-Mail:', emailError);
      }

      console.log('✅ Add-on Bestellung erfolgreich verarbeitet');
    }
  } catch (error) {
    console.error('❌ Fehler beim Verarbeiten der Add-on Bestellung:', error);
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('Zahlung erfolgreich:', invoice.id);
  
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((invoice as any).subscription && typeof (invoice as any).subscription === 'string') {
      // Für Abonnements - Session ID aus Subscription Metadata holen
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const subscription = await stripe.subscriptions.retrieve((invoice as any).subscription as string);
      const sessionId = subscription.metadata?.session_id;
      
      if (sessionId) {
        // Aktualisiere in Directus (falls verfügbar)
        if (isDirectusAvailable()) {
          try {
            await directus.updateBookingStatus(sessionId, 'paid', {
              customer_id: invoice.customer as string,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              payment_intent_id: (invoice as any).payment_intent as string,
              invoice_id: invoice.id,
            });
            console.log('✅ Abonnement-Zahlung erfolgreich in Directus verarbeitet');
          } catch (directusError) {
            console.error('❌ Fehler beim Aktualisieren in Directus:', directusError);
            // Fallback: PostgreSQL
            const { updateBookingStatus } = await import('@/lib/database');
            await updateBookingStatus(sessionId, 'paid', {
              customer_id: invoice.customer as string,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              payment_intent_id: (invoice as any).payment_intent as string
            });
            console.log('✅ Abonnement-Zahlung als Fallback in PostgreSQL verarbeitet');
          }
        } else {
          // Fallback: PostgreSQL
          const { updateBookingStatus } = await import('@/lib/database');
          await updateBookingStatus(sessionId, 'paid', {
            customer_id: invoice.customer as string,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            payment_intent_id: (invoice as any).payment_intent as string
          });
          console.log('✅ Abonnement-Zahlung in PostgreSQL verarbeitet');
        }
      }
    }
  } catch (error) {
    console.error('❌ Fehler beim Aktualisieren der Abonnement-Zahlung:', error);
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log('Zahlung fehlgeschlagen:', invoice.id);
  
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((invoice as any).subscription && typeof (invoice as any).subscription === 'string') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const subscription = await stripe.subscriptions.retrieve((invoice as any).subscription as string);
      const sessionId = subscription.metadata?.session_id;
      
      if (sessionId) {
        // Aktualisiere in Directus (falls verfügbar)
        if (isDirectusAvailable()) {
          try {
            await directus.updateBookingStatus(sessionId, 'failed');
            console.log('✅ Fehlgeschlagene Zahlung in Directus verarbeitet');
          } catch (directusError) {
            console.error('❌ Fehler beim Aktualisieren in Directus:', directusError);
            // Fallback: PostgreSQL
            const { updateBookingStatus } = await import('@/lib/database');
            await updateBookingStatus(sessionId, 'failed');
            console.log('✅ Fehlgeschlagene Zahlung als Fallback in PostgreSQL verarbeitet');
          }
        } else {
          // Fallback: PostgreSQL
          const { updateBookingStatus } = await import('@/lib/database');
          await updateBookingStatus(sessionId, 'failed');
          console.log('✅ Fehlgeschlagene Zahlung in PostgreSQL verarbeitet');
        }
      }
    }
  } catch (error) {
    console.error('❌ Fehler beim Aktualisieren der fehlgeschlagenen Zahlung:', error);
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log('Abonnement erstellt:', subscription.id);
  
  try {
    if (isDirectusAvailable()) {
      // Finde die zugehörige Buchung
      const sessionId = subscription.metadata?.session_id;
      if (sessionId) {
        // Hole die Booking-ID aus Directus
        const bookings = await directus.request<{ data: Array<{ id: string }> }>(
          `webwelle_bookings?filter[session_id][_eq]=${sessionId}`
        );
        
        if (bookings.data.length > 0) {
          const bookingId = bookings.data[0].id;
          await directus.createSubscription(bookingId, subscription as unknown as Record<string, unknown>);
          console.log('✅ Subscription erfolgreich in Directus gespeichert');
        }
      }
    }
    
    // Hier können Sie zusätzlich:
    // - Service aktivieren
    // - Willkommens-E-Mail senden
    // - Projekt starten
  } catch (error) {
    console.error('❌ Fehler beim Verarbeiten der Subscription-Erstellung:', error);
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('Abonnement aktualisiert:', subscription.id);
  
  try {
    if (isDirectusAvailable()) {
      // Aktualisiere Subscription in Directus
      const subscriptions = await directus.request<{ data: Array<{ id: string }> }>(
        `webwelle_subscriptions?filter[stripe_subscription_id][_eq]=${subscription.id}`
      );
      
      if (subscriptions.data.length > 0) {
        const subscriptionId = subscriptions.data[0].id;
        await directus.request(`webwelle_subscriptions/${subscriptionId}`, {
          method: 'PATCH',
          body: JSON.stringify({
            status: subscription.status,
            cancelled_at: subscription.canceled_at,
            cancel_at_period_end: subscription.cancel_at_period_end,
          }),
        });
        console.log('✅ Subscription erfolgreich in Directus aktualisiert');
      }
    }
    
    // Hier können Sie zusätzlich:
    // - Service-Level anpassen
    // - Kunde benachrichtigen
  } catch (error) {
    console.error('❌ Fehler beim Aktualisieren der Subscription:', error);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('Abonnement gekündigt:', subscription.id);
  
  try {
    if (isDirectusAvailable()) {
      // Aktualisiere Subscription-Status in Directus
      const subscriptions = await directus.request<{ data: Array<{ id: string }> }>(
        `webwelle_subscriptions?filter[stripe_subscription_id][_eq]=${subscription.id}`
      );
      
      if (subscriptions.data.length > 0) {
        const subscriptionId = subscriptions.data[0].id;
        await directus.request(`webwelle_subscriptions/${subscriptionId}`, {
          method: 'PATCH',
          body: JSON.stringify({
            status: 'cancelled',
            cancelled_at: new Date().toISOString(),
            customer_cancelled: true,
          }),
        });
        console.log('✅ Subscription erfolgreich in Directus als gekündigt markiert');
      }
    }
    
    // Hier können Sie zusätzlich:
    // - Service deaktivieren
    // - Kunde benachrichtigen
    // - Daten archivieren
  } catch (error) {
    console.error('❌ Fehler beim Verarbeiten der Subscription-Kündigung:', error);
  }
}

// Helper function für E-Mail-Bestätigung
async function sendBookingConfirmationEmail(bookingData: Record<string, unknown>, formData: Record<string, unknown>) {
  try {
    // Mappe Add-ons für E-Mail
    const selectedAddons = formData.zusatzfunktionen ? JSON.parse(String(formData.zusatzfunktionen)).map((addonKey: string) => {
      const addonConfig = {
        'blitz-welle': { label: 'Blitz-Welle: Online in 2 Wochen', price: '249,99 €' },
        'logo-welle': { label: 'Logo-Welle: Professionelles Logo-Design', price: '199,99 €' },
        'terminbuchung': { label: 'Terminbuchungs-System', price: '1.599 €' },
        'online-shop': { label: 'Online-Shop', price: '2.999 €' },
        'mitglieder-welle': { label: 'MitgliederWelle', price: '1.999 €' },
        'foto-welle-5': { label: 'Foto-Welle (5 Fotos)', price: '299,99 €' },
        'foto-welle-10': { label: 'Foto-Welle (10 Fotos)', price: '499,99 €' },
        'foto-welle-20': { label: 'Foto-Welle (20 Fotos)', price: '799,99 €' },
        'lieferdienst': { label: 'Lieferdienst-Integration', price: '1.299 €' },
        'google-my-business': { label: 'Google My Business', price: '399 €' },
        'visitenkarten': { label: 'Visitenkarten-Paket', price: '100 €' },
      };
      
      const config = addonConfig[addonKey as keyof typeof addonConfig];
      const billing = (formData.zusatzzahlung as Record<string, unknown>)?.[addonKey] || 'oneTime';
      
      return {
        label: config?.label || addonKey,
        price: config?.price || 'Preis nicht verfügbar',
        billing: billing as 'oneTime' | 'monthly',
      };
    }) : [];

    // Mappe Paket-Namen
    const packageNames: Record<string, string> = {
      'starterwelle': 'StarterWelle',
      'businesswelle': 'BusinessWelle',
      'erfolgswelle': 'ErfolgsWelle',
      'flowwelle': 'FlowWelle',
      'powerwelle': 'PowerWelle',
      'meisterwelle': 'MeisterWelle',
    };

    await sendBookingConfirmation({
      customerName: String(bookingData.customer_name || 'Kunde'),
      customerEmail: String(bookingData.customer_email || 'unbekannt@example.com'),
      packageName: packageNames[String(bookingData.package_type)] || String(bookingData.package_type),
      packagePrice: String(bookingData.package_price_display || 'Preis nicht verfügbar'),
      isMonthly: Boolean(bookingData.is_monthly),
      selectedAddons,
      totalAmount: Number(bookingData.total_amount_cents) / 100,
      currency: String(bookingData.currency || 'eur'),
      sessionId: String(bookingData.session_id),
    });
  } catch (error) {
    console.error('❌ Fehler beim Senden der E-Mail-Bestätigung:', error);
  }
}
