import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_your_secret_key_here', {
  apiVersion: '2025-08-27.basil',
});

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
  
  // Hier können Sie:
  // - E-Mail-Bestätigung senden
  // - Datenbank-Einträge erstellen
  // - Projekt-Status aktualisieren
  // - Team-Benachrichtigungen senden
  
  const metadata = session.metadata;
  if (metadata) {
    console.log('Kunden-Daten:', {
      packageType: metadata.packageType,
      isMonthly: metadata.isMonthly,
      customerName: metadata.customerName,
      formData: JSON.parse(metadata.formData || '{}')
    });
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('Zahlung erfolgreich:', invoice.id);
  
  // Monatliche Zahlung erfolgreich
  // Hier können Sie:
  // - Verlängerung des Services verarbeiten
  // - Kunde benachrichtigen
  // - Buchhaltung aktualisieren
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log('Zahlung fehlgeschlagen:', invoice.id);
  
  // Zahlung fehlgeschlagen
  // Hier können Sie:
  // - Kunde benachrichtigen
  // - Service pausieren
  // - Retry-Logik implementieren
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
