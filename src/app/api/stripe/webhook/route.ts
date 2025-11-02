import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';

// Stripe-Konfiguration zur Laufzeit validieren
function getStripeConfig() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY Umgebungsvariable ist nicht gesetzt');
  }
  
  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET Umgebungsvariable ist nicht gesetzt');
  }
  
  return {
    stripe: new Stripe(secretKey),
    webhookSecret
  };
}

export async function POST(request: NextRequest) {
  try {
    const { stripe, webhookSecret } = getStripeConfig();
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
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice, stripe);
        break;
      
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice, stripe);
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
        formData: metadata.formData
      });

      // Buchung in Datenbank speichern
      const { saveBooking } = await import('@/lib/database');
      
      // Defensive JSON-Parsing
      let formData: Record<string, unknown> = {};
      try {
        formData = metadata.formData ? JSON.parse(metadata.formData) : {};
      } catch (parseError) {
        console.error('Fehler beim Parsen der FormData:', parseError);
        formData = {};
      }
      
      // Defensive Parsing für Arrays
      let targetGroup: string[] = [];
      try {
        targetGroup = formData.targetGroup ? JSON.parse(formData.targetGroup as string) : [];
        if (!Array.isArray(targetGroup)) targetGroup = [];
      } catch (parseError) {
        console.error('Fehler beim Parsen der targetGroup:', parseError);
        targetGroup = [];
      }

      let functions: string[] = [];
      try {
        functions = formData.functions ? JSON.parse(formData.functions as string) : [];
        if (!Array.isArray(functions)) functions = [];
      } catch (parseError) {
        console.error('Fehler beim Parsen der functions:', parseError);
        functions = [];
      }
      
      // Prüfe ob es ein KI-Paket oder AI-Voice-Paket ist (vereinfachtes Checkout)
      const isKIPackage = metadata.packageCategory === 'ki-automation';
      const isAIVoicePackage = metadata.packageCategory === 'ai-voice';
      const isSimplifiedCheckout = isKIPackage || isAIVoicePackage;
      
      // Für AI-Voice Pakete: isMonthly basierend auf isEinrichtungspaket
      const isEinrichtungspaket = metadata.isEinrichtungspaket === 'true';
      const aiVoiceIsMonthly = !isEinrichtungspaket; // Hauptpakete sind monatlich, Einrichtungspaket ist einmalig
      
      // Für KI-Pakete und AI-Voice-Pakete: Vereinfachte Datenstruktur
      // Für Webdesign-Pakete: Vollständige Formular-Daten
      const bookingData = {
        session_id: session.id,
        package_type: metadata.packageType as 'starterwelle' | 'businesswelle' | 'erfolgswelle' | 'flowwelle' | 'powerwelle' | 'meisterwelle' | 'minijob' | 'midijob' | 'festangestellt' | 'einrichtungspaket',
        is_monthly: isAIVoicePackage ? aiVoiceIsMonthly : (metadata.isMonthly === 'true'),
        checkout_mode: (isAIVoicePackage 
          ? (isEinrichtungspaket ? 'payment' : 'subscription')
          : ((metadata.isMonthly === 'true' || session.subscription) ? 'subscription' : 'payment')
        ) as 'payment' | 'subscription',
        package_price_display: metadata.packagePriceDisplay || `${(session.amount_total || 0) / 100} €`,
        currency: 'eur',
        total_amount_cents: session.amount_total || 0,
        customer_name: metadata.customerName || (formData.customerName as string) || undefined,
        customer_email: session.customer_email || (formData.customerEmail as string) || undefined,
        customer_phone: isSimplifiedCheckout ? undefined : (formData.customerPhone as string) || undefined,
        company_name: isSimplifiedCheckout ? undefined : (formData.companyName as string) || undefined,
        existing_website: isSimplifiedCheckout ? undefined : (formData.existingWebsite as string) === 'ja' ? true : false,
        existing_website_url: isSimplifiedCheckout ? undefined : (formData.existingWebsiteUrl as string) || undefined,
        target_group: isSimplifiedCheckout ? undefined : targetGroup,
        design_style: isSimplifiedCheckout ? undefined : (formData.designStyle as string) || undefined,
        design_reference_url: isSimplifiedCheckout ? undefined : (formData.designReferenceUrl as string) || undefined,
        selected_addons: isSimplifiedCheckout 
          ? (isAIVoicePackage && metadata.addonPriceIds ? JSON.parse(metadata.addonPriceIds as string) : undefined)
          : (formData.selectedAddons ? JSON.parse(formData.selectedAddons as string) : undefined),
        message: isSimplifiedCheckout ? undefined : (formData.message as string) || undefined,
        raw_form_data: formData,
        stripe_metadata: metadata,
        stripe_customer_id: session.customer as string || undefined,
        stripe_payment_intent_id: session.payment_intent as string || undefined,
        stripe_subscription_id: session.subscription as string || undefined,
        stripe_invoice_id: session.invoice as string || undefined,
        status: 'paid' as const
      };

      await saveBooking(bookingData);
      console.log('✅ Buchung erfolgreich in Datenbank gespeichert');
    }
  } catch (error) {
    console.error('❌ Fehler beim Speichern der Buchung:', error);
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice, stripe: Stripe) {
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

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice, stripe: Stripe) {
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
