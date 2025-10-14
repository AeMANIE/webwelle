import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';

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
      console.log('Kunden-Daten:', {
        packageType: metadata.packageType,
        isMonthly: metadata.isMonthly,
        customerName: metadata.customerName,
        formData: JSON.parse(metadata.formData || '{}')
      });

      // Buchung in Datenbank speichern
      const { saveBooking } = await import('@/lib/database');
      
      const formData = JSON.parse(metadata.formData || '{}');
      
      const bookingData = {
        session_id: session.id,
        package_type: metadata.packageType as 'starterwelle' | 'businesswelle' | 'erfolgswelle' | 'flowwelle' | 'powerwelle' | 'meisterwelle',
        is_monthly: metadata.isMonthly === 'true',
        customer_name: metadata.customerName || formData.customerName || 'Unbekannt',
        customer_email: session.customer_email || formData.customerEmail || 'unbekannt@example.com',
        customer_phone: formData.customerPhone || null,
        company_name: formData.companyName || 'Unbekanntes Unternehmen',
        existing_website: formData.existingWebsite || 'nein',
        target_group: formData.targetGroup ? JSON.parse(formData.targetGroup) : [],
        design_style: formData.designStyle || 'modern',
        functions: formData.functions ? JSON.parse(formData.functions) : [],
        budget: formData.budget || 'nicht angegeben',
        message: formData.message || null,
        stripe_customer_id: session.customer as string || undefined,
        stripe_payment_intent_id: session.payment_intent as string || undefined,
        status: 'paid' as const
      };

      await saveBooking(bookingData);
      console.log('✅ Buchung erfolgreich in Datenbank gespeichert');
    }
  } catch (error) {
    console.error('❌ Fehler beim Speichern der Buchung:', error);
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('Zahlung erfolgreich:', invoice.id);
  
  try {
    // Buchung Status auf 'paid' aktualisieren
    const { updateBookingStatus } = await import('@/lib/database');
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((invoice as any).subscription && typeof (invoice as any).subscription === 'string') {
      // Für Abonnements - Session ID aus Subscription Metadata holen
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const subscription = await stripe.subscriptions.retrieve((invoice as any).subscription as string);
      const sessionId = subscription.metadata?.session_id;
      
      if (sessionId) {
        await updateBookingStatus(sessionId, 'paid', {
          customer_id: invoice.customer as string,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          payment_intent_id: (invoice as any).payment_intent as string
        });
        console.log('✅ Abonnement-Zahlung erfolgreich verarbeitet');
      }
    }
  } catch (error) {
    console.error('❌ Fehler beim Aktualisieren der Abonnement-Zahlung:', error);
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log('Zahlung fehlgeschlagen:', invoice.id);
  
  try {
    // Buchung Status auf 'failed' aktualisieren
    const { updateBookingStatus } = await import('@/lib/database');
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((invoice as any).subscription && typeof (invoice as any).subscription === 'string') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const subscription = await stripe.subscriptions.retrieve((invoice as any).subscription as string);
      const sessionId = subscription.metadata?.session_id;
      
      if (sessionId) {
        await updateBookingStatus(sessionId, 'failed');
        console.log('✅ Fehlgeschlagene Zahlung verarbeitet');
      }
    }
  } catch (error) {
    console.error('❌ Fehler beim Aktualisieren der fehlgeschlagenen Zahlung:', error);
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log('Abonnement erstellt:', subscription.id);
  
  // Neues Abonnement erstellt
  // Hier können Sie:
  // - Service aktivieren
  // - Willkommens-E-Mail senden
  // - Projekt starten
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('Abonnement aktualisiert:', subscription.id);
  
  // Abonnement geändert (z.B. Plan gewechselt)
  // Hier können Sie:
  // - Service-Level anpassen
  // - Kunde benachrichtigen
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('Abonnement gekündigt:', subscription.id);
  
  // Abonnement gekündigt
  // Hier können Sie:
  // - Service deaktivieren
  // - Kunde benachrichtigen
  // - Daten archivieren
}
