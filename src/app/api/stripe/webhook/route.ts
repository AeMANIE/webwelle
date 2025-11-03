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

    console.log('🔔 Stripe Webhook empfangen');

    if (!signature) {
      console.error('❌ Keine Stripe-Signatur gefunden');
      return NextResponse.json({ error: 'Keine Stripe-Signatur gefunden' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      console.log(`✅ Webhook Event verifiziert: ${event.type}`);
    } catch (err) {
      console.error('❌ Webhook-Signatur-Verifikation fehlgeschlagen:', err);
      return NextResponse.json({ error: 'Ungültige Signatur' }, { status: 400 });
    }

    // Verarbeite verschiedene Event-Typen
    switch (event.type) {
      case 'checkout.session.completed':
        console.log(`📦 Processing checkout.session.completed für Session: ${(event.data.object as Stripe.Checkout.Session).id}`);
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
      
      // Bestellbestätigung und Portal-Aktivierung E-Mails senden (mit Fallback auf customer_details.email)
      const fallbackEmail = (session.customer_details as { email?: string } | null)?.email;
      const effectiveEmail = session.customer_email || fallbackEmail;
      if (effectiveEmail) {
        // Falls session.customer_email leer war, setze sie lokal für die Übergabe
        console.log(`📧 Versuche E-Mails zu senden an: ${effectiveEmail}`);
        try {
          await sendBookingAndActivationEmails(session, metadata, bookingData);
          console.log('✅ E-Mail-Versand erfolgreich abgeschlossen');
        } catch (emailError) {
          console.error('❌ Fehler beim Senden der E-Mails:', emailError);
          // Fehler nicht weiterwerfen - Buchung wurde gespeichert
          // E-Mail kann später manuell gesendet werden
        }
      } else {
        console.warn('⚠️ Keine customer_email in Session gefunden, E-Mails werden nicht gesendet');
        console.warn('⚠️ Session-Details:', {
          id: session.id,
          customer: session.customer,
          customer_details: session.customer_details
        });
      }
    } else {
      console.warn('⚠️ Keine Metadata in Session gefunden');
    }
  } catch (error) {
    console.error('❌ Fehler beim Speichern der Buchung:', error);
    console.error('❌ Fehler-Details:', {
      message: error instanceof Error ? error.message : 'Unbekannter Fehler',
      stack: error instanceof Error ? error.stack : undefined
    });
    // Wichtig: Nicht weiterwerfen, damit Stripe 200 erhält und keine dauerhaften Retries entstehen
    // Fehlerfälle (z. B. E-Mail-Versand) werden separat durch manuelle Routen abgedeckt
  }
}

// Bestellbestätigung und Portal-Aktivierungs-E-Mails senden
async function sendBookingAndActivationEmails(
  session: Stripe.Checkout.Session,
  metadata: Stripe.Metadata,
  bookingData: { session_id: string; customer_email?: string; customer_name?: string }
) {
  const { getRedisClient } = await import('@/lib/redis');
  const { sendBookingConfirmation } = await import('@/lib/email-confirmation');
  const { sendPortalActivationEmail } = await import('@/lib/email-portal-activation');
  const { generateActivationToken, saveActivationToken } = await import('@/lib/portal-activation');
  const { getPackageDisplayName, extractAddonsFromMetadata } = await import('@/lib/email-helpers');
  
  const redis = getRedisClient();
  const emailSentKey = `email_sent:${session.id}`;
  
  console.log(`📧 sendBookingAndActivationEmails aufgerufen für Session: ${session.id}`);
  console.log(`📧 E-Mail-Konfiguration prüfen: EMAIL_SMTP_USER=${process.env.EMAIL_SMTP_USER ? '✅ gesetzt' : '❌ fehlt'}, EMAIL_SMTP_PASSWORD=${process.env.EMAIL_SMTP_PASSWORD ? '✅ gesetzt' : '❌ fehlt'}`);
  
  try {
    // Prüfe ob E-Mail bereits gesendet wurde (verhindert Duplikate)
    if (redis && (await redis.status) === 'ready') {
      const emailAlreadySent = await redis.get(emailSentKey);
      if (emailAlreadySent) {
        console.log('⚠️ E-Mail wurde bereits gesendet für Session:', session.id);
        console.log('⚠️ Falls die E-Mail fehlt, verwenden Sie die manuelle Route: /api/manual-send-booking-email');
        console.log('⚠️ Oder prüfen Sie den Status mit: /api/debug-email-status?sessionId=' + session.id);
        return; // Verhindert Duplikate bei Webhook-Wiederholungen
      }
    }
    
    const customerEmail = session.customer_email!;
    const customerName = metadata.customerName || bookingData.customer_name || customerEmail.split('@')[0];
    const packageName = getPackageDisplayName(metadata.packageType || '', metadata.packageCategory);
    const packagePrice = metadata.packagePriceDisplay || `${(session.amount_total || 0) / 100} €`;
    const selectedAddons = extractAddonsFromMetadata(metadata, session);
    const isMonthly = metadata.isMonthly === 'true' || !!session.subscription;
    
    // 1. Bestellbestätigung senden (für alle Pakettypen)
    try {
      console.log(`📧 Versende Bestellbestätigung an: ${customerEmail}`);
      const emailResult = await sendBookingConfirmation({
        customerName,
        customerEmail,
        packageName,
        packagePrice,
        isMonthly,
        selectedAddons: selectedAddons.map(addon => ({
          label: addon.label,
          price: addon.price,
          billing: addon.billing // Behalte original billing (yearly, monthly, oneTime)
        })),
        totalAmount: (session.amount_total || 0) / 100,
        currency: session.currency || 'eur',
        sessionId: session.id,
      });
      
      if (emailResult.success) {
        console.log(`✅ Bestellbestätigung erfolgreich gesendet an ${customerEmail}`);
      } else {
        console.error(`❌ Bestellbestätigung fehlgeschlagen: ${emailResult.error || 'Unbekannter Fehler'}`);
      }
    } catch (error) {
      console.error('❌ Fehler beim Senden der Bestellbestätigung:', error);
      // Weiter mit Portal-Aktivierung auch wenn Bestätigung fehlschlägt
    }
    
    // 2. Portal-Aktivierungs-Token generieren und senden – für ALLE Pakettypen (nur wenn noch kein Portal)
    try {
      const { getCustomerByEmail } = await import('@/lib/database');
      const existingCustomer = await getCustomerByEmail(customerEmail);
      if (existingCustomer?.portal_activated) {
        console.log('ℹ️ Kunde hat bereits ein aktiviertes Portal – Aktivierungs-E-Mail wird nicht erneut gesendet.');
      } else {
        const activationToken = generateActivationToken();
        await saveActivationToken(customerEmail, activationToken, bookingData.session_id);
        await sendPortalActivationEmail({ customerName, customerEmail, activationToken });
        console.log(`✅ Portal-Aktivierungs-E-Mail gesendet an ${customerEmail}`);
      }
    } catch (error) {
      console.error('❌ Fehler beim Senden der Portal-Aktivierungs-E-Mail:', error);
      // Nicht kritisch - kann später manuell gesendet werden
    }
    
    // Markiere E-Mail als gesendet (24h TTL)
    if (redis && (await redis.status) === 'ready') {
      await redis.setex(emailSentKey, 86400, '1'); // 24 Stunden
    }
  } catch (error) {
    console.error('❌ Fehler beim Senden der E-Mails:', error);
    // Nicht kritisch - kann später manuell gesendet werden
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
  console.log('📦 Abonnement erstellt:', subscription.id);
  
  try {
    // Subscription-Metadata prüfen (könnte session_id enthalten)
    const sessionId = subscription.metadata?.session_id;
    if (sessionId) {
      console.log(`📦 Subscription erstellt für Session: ${sessionId}`);
      // Session-ID kann verwendet werden, um Buchung zu verknüpfen
    }
    
    // Neues Abonnement erstellt
    // Hier können Sie:
    // - Service aktivieren
    // - Willkommens-E-Mail senden
    // - Projekt starten
    console.log('✅ Subscription erstellt erfolgreich verarbeitet');
  } catch (error) {
    console.error('❌ Fehler beim Verarbeiten der Subscription-Erstellung:', error);
    // Fehler nicht weiterwerfen, da Subscription bereits erstellt wurde
  }
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
