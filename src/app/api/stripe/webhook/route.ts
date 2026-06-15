import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import {
  isCheckoutSessionPaid,
  resolvePaidCheckoutSession,
} from '@/lib/stripe-checkout-paid';

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

      case 'checkout.session.async_payment_succeeded':
        console.log(`📦 Processing checkout.session.async_payment_succeeded für Session: ${(event.data.object as Stripe.Checkout.Session).id}`);
        await handleCheckoutSessionPaid(event.data.object as Stripe.Checkout.Session, stripe);
        break;

      case 'checkout.session.async_payment_failed':
        console.log(`📦 Processing checkout.session.async_payment_failed für Session: ${(event.data.object as Stripe.Checkout.Session).id}`);
        await handleCheckoutSessionAsyncPaymentFailed(event.data.object as Stripe.Checkout.Session);
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
  console.log('Checkout-Session abgeschlossen:', session.id, 'payment_status:', session.payment_status);

  try {
    const metadata = session.metadata;
    if (!metadata) {
      console.warn('⚠️ Keine Metadata in Session gefunden');
      return;
    }

    if (!isCheckoutSessionPaid(session)) {
      console.log(
        `⏳ Zahlung noch nicht bestätigt (payment_status=${session.payment_status}), E-Mails/Rechnung werden übersprungen:`,
        session.id
      );
      if (metadata.offerId) {
        await markFunnelCheckoutAwaitingPayment(session.id);
      }
      return;
    }

    await processPaidCheckout(session);
  } catch (error) {
    console.error('❌ Fehler beim Verarbeiten von checkout.session.completed:', error);
    console.error('❌ Fehler-Details:', {
      message: error instanceof Error ? error.message : 'Unbekannter Fehler',
      stack: error instanceof Error ? error.stack : undefined,
    });
  }
}

async function handleCheckoutSessionPaid(session: Stripe.Checkout.Session, stripe: Stripe) {
  console.log('Checkout-Session Zahlung bestätigt:', session.id);

  try {
    const paidSession = await resolvePaidCheckoutSession(session, stripe);
    if (!paidSession) {
      console.warn('⚠️ Session nach Retrieve nicht paid, übersprungen:', session.id);
      return;
    }

    await processPaidCheckout(paidSession);
  } catch (error) {
    console.error('❌ Fehler beim Verarbeiten von async_payment_succeeded:', error);
  }
}

async function handleCheckoutSessionAsyncPaymentFailed(session: Stripe.Checkout.Session) {
  console.log('Checkout-Session async Zahlung fehlgeschlagen:', session.id);

  try {
    const metadata = session.metadata;
    if (!metadata?.offerId) return;

    const { pool } = await import('@/lib/database');
    const client = await pool.connect();
    try {
      await client.query(
        `UPDATE offer_checkout_sessions SET status = 'failed' WHERE stripe_session_id = $1`,
        [session.id]
      );
      console.log('✅ Funnel-Checkout-Session als failed markiert:', session.id);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Fehler beim Verarbeiten von async_payment_failed:', error);
  }
}

async function markFunnelCheckoutAwaitingPayment(sessionId: string): Promise<void> {
  const { pool } = await import('@/lib/database');
  const client = await pool.connect();
  try {
    await client.query(
      `UPDATE offer_checkout_sessions SET status = 'awaiting_payment' WHERE stripe_session_id = $1`,
      [sessionId]
    );
    console.log('✅ Funnel-Checkout-Session awaiting_payment:', sessionId);
  } finally {
    client.release();
  }
}

async function processPaidCheckout(session: Stripe.Checkout.Session): Promise<void> {
  const metadata = session.metadata;
  if (!metadata) {
    console.warn('⚠️ Keine Metadata in Session gefunden');
    return;
  }

  if (metadata.offerId) {
    await processFunnelCheckoutPaid(session);
    return;
  }

  await processBuchungCheckoutPaid(session);
}

async function processFunnelCheckoutPaid(session: Stripe.Checkout.Session): Promise<void> {
  const metadata = session.metadata;
  if (!metadata?.offerId) return;

  const { pool, getOrCreateCustomerWithNumber, saveBooking } = await import('@/lib/database');
  const { updateOfferStatus, updateFunnelLead, getOfferById } = await import('@/lib/funnel-database');
  const { sendPostPaymentEmails } = await import('@/lib/post-payment-emails');
  const client = await pool.connect();
  try {
    await client.query(
      `UPDATE offer_checkout_sessions SET status = 'paid', paid_at = NOW() WHERE stripe_session_id = $1`,
      [session.id]
    );
    await updateOfferStatus(metadata.offerId, 'paid');
    if (metadata.leadId) {
      const leadRow = await client.query('SELECT token FROM funnel_leads WHERE id = $1', [
        metadata.leadId,
      ]);
      const token = leadRow.rows[0]?.token as string | undefined;
      if (token) await updateFunnelLead(token, { status: 'paid' });
    }

    const email =
      session.customer_email ||
      session.customer_details?.email ||
      '';
    const customerName = session.customer_details?.name || email.split('@')[0];
    const address = session.customer_details?.address;
    const customerAddress = address
      ? [address.line1, address.postal_code, address.city].filter(Boolean).join(' ')
      : null;

    let customerNumber: string | null = null;
    if (email) {
      const customer = await getOrCreateCustomerWithNumber(
        email,
        customerName,
        session.customer_details?.phone || undefined,
        undefined
      );
      customerNumber = customer.customer_number || null;
    }

    const { offer, items } = await getOfferById(metadata.offerId);
    const offerItems = (items || []).map((row: Record<string, unknown>) => ({
      label: String(row.label || 'Position'),
      unit_amount_cents: Number(row.unit_amount_cents || 0),
      billing: row.billing ? String(row.billing) : 'one_time',
      description: row.description ? String(row.description) : null,
    }));

    const bookingData = {
      session_id: session.id,
      package_type: (metadata.packageType as 'starterwelle') || 'starterwelle',
      is_monthly: false,
      checkout_mode: 'payment' as const,
      package_price_display: `${(session.amount_total || 0) / 100} €`,
      currency: 'eur',
      total_amount_cents: session.amount_total || 0,
      customer_email: email,
      customer_name: customerName || undefined,
      stripe_customer_id: session.customer as string,
      stripe_payment_intent_id: session.payment_intent as string,
      status: 'paid' as const,
      raw_form_data: { offerId: metadata.offerId, leadId: metadata.leadId },
    };

    await saveBooking(bookingData);
    console.log('✅ Offer-Checkout verarbeitet:', metadata.offerId);

    if (email) {
      try {
        await sendPostPaymentEmails({
          session,
          metadata,
          bookingData,
          source: 'funnel',
          offerItems,
          offerDiscountCents: Number(offer?.discount_cents || 0),
          customerNumber,
          customerAddress,
        });
        console.log('✅ Funnel Post-Payment E-Mails gesendet');
      } catch (emailError) {
        console.error('❌ Fehler beim Senden der Funnel Post-Payment E-Mails:', emailError);
      }
    } else {
      console.warn('⚠️ Keine Kunden-E-Mail für Funnel-Offer-Checkout:', session.id);
    }
  } finally {
    client.release();
  }
}

async function processBuchungCheckoutPaid(session: Stripe.Checkout.Session): Promise<void> {
  const metadata = session.metadata;
  if (!metadata) return;

  console.log('Kunden-Daten:', {
    packageType: metadata.packageType,
    isMonthly: metadata.isMonthly,
    customerName: metadata.customerName,
    formData: metadata.formData,
  });

  const { getOrCreateCustomerWithNumber, saveBooking } = await import('@/lib/database');
  const customerEmail = session.customer_email || session.customer_details?.email || '';
  const customerName = metadata.customerName || session.customer_details?.name || customerEmail.split('@')[0];
  const customerPhone = session.customer_details?.phone || metadata.phone || undefined;
  const companyName = metadata.companyName || session.customer_details?.address?.line1 || undefined;

  let customerId: string | undefined = undefined;
  let customerNumber: string | null = null;
  if (customerEmail) {
    const customer = await getOrCreateCustomerWithNumber(
      customerEmail,
      customerName,
      customerPhone,
      companyName
    );
    customerId = customer.id?.toString();
    customerNumber = customer.customer_number || null;
    console.log(`✅ Kunde ${customerEmail} erstellt/abgerufen mit Kundennummer: ${customer.customer_number || 'wird generiert'}`);
  }

  let formData: Record<string, unknown> = {};
  try {
    formData = metadata.formData ? JSON.parse(metadata.formData) : {};
  } catch (parseError) {
    console.error('Fehler beim Parsen der FormData:', parseError);
    formData = {};
  }

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

  const isKIPackage = metadata.packageCategory === 'ki-automation';
  const isAIVoicePackage = metadata.packageCategory === 'ai-voice';
  const isSimplifiedCheckout = isKIPackage || isAIVoicePackage;

  const isEinrichtungspaket = metadata.isEinrichtungspaket === 'true';
  const aiVoiceIsMonthly = !isEinrichtungspaket;

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
    customer_id: customerId,
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
    status: 'paid' as const,
  };

  await saveBooking(bookingData);
  console.log('✅ Buchung erfolgreich in Datenbank gespeichert');

  const fallbackEmail = (session.customer_details as { email?: string } | null)?.email;
  const effectiveEmail = session.customer_email || fallbackEmail;
  if (effectiveEmail) {
    console.log(`📧 Versuche E-Mails zu senden an: ${effectiveEmail}`);
    try {
      const { sendPostPaymentEmails } = await import('@/lib/post-payment-emails');
      await sendPostPaymentEmails({
        session,
        metadata,
        bookingData,
        source: 'buchung',
        customerNumber,
      });
      console.log('✅ E-Mail-Versand erfolgreich abgeschlossen');
    } catch (emailError) {
      console.error('❌ Fehler beim Senden der E-Mails:', emailError);
    }
  } else {
    console.warn('⚠️ Keine customer_email in Session gefunden, E-Mails werden nicht gesendet');
    console.warn('⚠️ Session-Details:', {
      id: session.id,
      customer: session.customer,
      customer_details: session.customer_details,
    });
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice, stripe: Stripe) {
  console.log('Zahlung erfolgreich:', invoice.id);
  
  try {
    const { updateBookingStatus, saveInvoice, getCustomerByEmail } = await import('@/lib/database');
    const { generateInvoicePdf } = await import('@/lib/invoice-pdf');
    const { sendStripeInvoiceEmail, INVOICE_BANKING } = await import('@/lib/post-payment-emails');
    
    if (!invoice.id) {
      console.error('❌ Invoice-ID fehlt');
      return;
    }
    
    // Invoice-Details von Stripe abrufen
    const inv = await stripe.invoices.retrieve(invoice.id, { expand: ['customer', 'lines.data.price.product'] });
    
    const customer = typeof inv.customer === 'object' && inv.customer && !('deleted' in inv.customer && (inv.customer as Stripe.DeletedCustomer).deleted)
      ? inv.customer as Stripe.Customer
      : null;
    
    const customerEmail = customer?.email || null;
    const customerName = customer?.name || null;
    
    // Kundennummer abrufen
    let customerNumber: string | null = null;
    if (customerEmail) {
      const dbCustomer = await getCustomerByEmail(customerEmail);
      customerNumber = dbCustomer?.customer_number || null;
    }
    
    // Rechnung in Datenbank speichern
    await saveInvoice({
      stripe_invoice_id: String(inv.id),
      invoice_number: inv.number,
      customer_email: customerEmail || '',
      customer_name: customerName,
      customer_number: customerNumber,
      amount_cents: inv.amount_paid || inv.amount_due || 0,
      currency: inv.currency?.toUpperCase() || 'EUR',
      status: String(inv.status || 'unknown'),
      paid_at: inv.status_transitions?.paid_at ? new Date(inv.status_transitions.paid_at * 1000) : null,
      due_date: inv.due_date ? new Date(inv.due_date * 1000) : null,
      pdf_url: inv.invoice_pdf || null,
      hosted_invoice_url: inv.hosted_invoice_url || null,
      issuer: 'Stripe'
    });
    console.log('✅ Rechnung in Datenbank gespeichert:', inv.id);
    
    // Automatisch gebrandetes PDF generieren und per E-Mail senden
    if (customerEmail) {
      try {
        const items = (inv.lines.data || []).map((l: Stripe.InvoiceLineItem) => {
          let desc = l.description || 'Position';
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const price = (l as any).price as Stripe.Price | null;
          const prod = price?.product;
          if (typeof prod === 'object' && prod && 'name' in prod) {
            const maybe = prod as { name?: string };
            if (maybe.name) desc = maybe.name;
          }

          const unitAmount = (price?.unit_amount ?? 0) / 100;
          const quantity = l.quantity ?? 1;

          let interval: 'monthly' | 'yearly' | 'oneTime' = 'oneTime';
          if (price?.recurring?.interval === 'month') interval = 'monthly';
          if (price?.recurring?.interval === 'year') interval = 'yearly';

          return {
            description: desc,
            quantity: quantity,
            netAmount: unitAmount,
            interval: interval,
          };
        });

        const pdfBuffer = await generateInvoicePdf({
          invoiceNumber: String(inv.number || inv.id),
          issueDate: new Date((inv.created ?? Math.floor(Date.now() / 1000)) * 1000),
          customerNumber,
          customer: {
            name: customerName || customerEmail || '',
            email: customerEmail || '',
            address: customer ? `${customer.address?.line1 || ''} ${customer.address?.postal_code || ''} ${customer.address?.city || ''}`.trim() || null : null,
          },
          items,
          banking: INVOICE_BANKING,
        });

        await sendStripeInvoiceEmail({
          customerEmail,
          customerName: customerName || customerEmail,
          customerNumber,
          invoiceNumber: String(inv.number || inv.id),
          pdfBuffer,
        });
        console.log(`✅ Gebrandetes PDF-Rechnung erfolgreich an ${customerEmail} gesendet.`);
      } catch (emailError) {
        console.error('❌ Fehler beim Senden der PDF-Rechnung per E-Mail:', emailError);
      }
    }
    
    // Buchung Status auf 'paid' aktualisieren
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
    console.error('❌ Fehler beim Aktualisieren der Abonnement-Zahlung oder Senden der Rechnung:', error);
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
