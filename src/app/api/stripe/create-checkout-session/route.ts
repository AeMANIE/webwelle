import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { saveBooking, BookingData } from '@/lib/database';
import { validateBookingForm } from '@/lib/validation';
import { applyRateLimit, secureResponse, validateAPIInput } from '@/lib/api-security';
import { RATE_LIMITS } from '@/lib/rate-limit';

// Stripe-Konfiguration zur Laufzeit validieren
function getStripeInstance(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY Umgebungsvariable ist nicht gesetzt');
  }
  
  return new Stripe(secretKey, {
    apiVersion: '2025-08-27.basil',
  });
}

export async function POST(request: NextRequest) {
  try {
    // Rate Limiting für Checkout (wichtig gegen Missbrauch)
    const rateLimitResponse = await applyRateLimit(request, RATE_LIMITS.CHECKOUT);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    console.log('Stripe Checkout Session wird erstellt (Webdesign-Pakete)...');
    
    const stripe = getStripeInstance();
    
    const body = await request.json();
    
    // Input-Validierung
    // customerEmail und customerName sind optional, da sie im Stripe Checkout eingegeben werden können
    // isMonthly kann Boolean oder String sein
    const validation = validateAPIInput(body, {
      packageType: { required: true, type: 'string' },
      // isMonthly wird als Boolean gesendet, aber wir validieren es nicht als String
      customerEmail: { required: false, type: 'email' }, // Optional - wird im Stripe Checkout eingegeben
      customerName: { required: false, type: 'string', minLength: 2, maxLength: 255 }, // Optional - wird im Stripe Checkout eingegeben
      priceId: { required: true, type: 'string' },
      amount: { required: true, type: 'number' },
      currency: { required: false, type: 'string' },
    });

    // Manuelle Validierung für isMonthly (kann Boolean oder String sein)
    if (body.isMonthly === undefined || body.isMonthly === null) {
      return secureResponse(
        { 
          error: 'Bitte füllen Sie alle erforderlichen Felder aus',
          message: 'Bitte wählen Sie ein Zahlungsintervall aus (monatlich oder jährlich).',
          errors: [{ field: 'isMonthly', message: 'Bitte wählen Sie ein Zahlungsintervall aus.' }]
        },
        400
      );
    }

    if (!validation.isValid) {
      // Erstelle benutzerfreundliche Fehlermeldung
      const errorMessages = validation.errors.map(err => err.message).join(' ');
      const friendlyMessage = validation.errors.length === 1
        ? errorMessages
        : `Bitte beantworten Sie alle erforderlichen Fragen: ${errorMessages}`;
      
      return secureResponse(
        { 
          error: 'Bitte füllen Sie alle erforderlichen Felder aus',
          message: friendlyMessage,
          errors: validation.errors 
        },
        400
      );
    }

    const {
      packageType,
      isMonthly,
      customerEmail,
      customerName,
      formData,
      hasRecurringAddons,
      addOnPriceIds,
      incompatibleAddons,
      priceId,
      amount,
      currency
    } = body;

    // customerEmail und customerName sind optional - wenn nicht vorhanden, werden sie im Stripe Checkout eingegeben
    // Konvertiere isMonthly von String zu Boolean für die Session-Konfiguration
    const isMonthlyBool = isMonthly === 'true' || isMonthly === true;

    console.log('Empfangene Daten:', {
      packageType,
      isMonthly,
      customerEmail,
      customerName,
      hasRecurringAddons,
      addOnPriceIds,
      priceId,
      amount,
      currency
    });

    // Validierung: Nur Webdesign-Pakete
    if (!['starterwelle', 'businesswelle', 'erfolgswelle'].includes(packageType)) {
      throw new Error(`Ungültiger Paket-Typ: ${packageType}. Diese Route ist nur für Webdesign-Pakete (StarterWelle, BusinessWelle, ErfolgsWelle) vorgesehen.`);
    }

    // Validierung
    if (!priceId) {
      throw new Error('Price ID ist erforderlich');
    }

    // Stripe Checkout Session erstellen
    // ✅ ERLAUBT: Subscription (monthly/yearly) + One-time Payment in derselben Session
    // ✅ ERLAUBT: Subscription (yearly) + Subscription (yearly) - beide haben dasselbe Intervall
    // ❌ NICHT ERLAUBT: Subscription (monthly) + Subscription (yearly) in derselben Session
    // Add-ons wurden bereits gefiltert, um nur kompatible zu enthalten
    
    // Warnung bei inkompatiblen Add-ons
    if (incompatibleAddons && incompatibleAddons.length > 0) {
      console.warn(`⚠️ Inkompatible Add-ons entfernt: ${incompatibleAddons.join(', ')}`);
    }

    // WICHTIG: Beide (monthly und yearly) sind Subscriptions, nie Payment!
    // Yearly Hauptpakete sind auch Subscriptions in Stripe
    const mainPackageMode = 'subscription' as const;
    
    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'], // Nur Kreditkarte (SEPA muss in Stripe Dashboard aktiviert werden)
      line_items: [
        {
          price: priceId, // Hauptpaket
          quantity: 1,
        },
        // Zusatzoptionen als weitere Positionen (nur kompatible!)
        ...((Array.isArray(addOnPriceIds) ? addOnPriceIds : [])
          .map((addon) => ({ price: addon, quantity: 1 })) as Stripe.Checkout.SessionCreateParams.LineItem[]),
      ],
      // Mode ist immer subscription (monthly oder yearly)
      mode: mainPackageMode,
      metadata: {
        packageType,
        isMonthly: isMonthlyBool.toString(),
        customerName: customerName || '', // Kann leer sein, wird im Checkout eingegeben
        formData: JSON.stringify(formData),
        addOnPriceIds: JSON.stringify(addOnPriceIds || []),
      },
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/buchung/${packageType}?cancelled=true`,
      locale: 'de',
      billing_address_collection: 'required',
      // E-Mail und Name werden im Stripe Checkout eingegeben, wenn nicht bereits vorhanden
      ...(customerEmail && { customer_email: customerEmail }),
      shipping_address_collection: {
        allowed_countries: ['DE', 'AT', 'CH'],
      },
      custom_fields: [
        {
          key: 'company_name',
          label: {
            type: 'custom',
            custom: 'Firmenname'
          },
          type: 'text',
          optional: false, // Pflichtfeld
        },
        {
          key: 'phone',
          label: {
            type: 'custom',
            custom: 'Telefonnummer'
          },
          type: 'text',
          optional: false, // Pflichtfeld
        },
        {
          key: 'tax_id',
          label: {
            type: 'custom',
            custom: 'MwSt-ID-Nummer (USt-IdNr.)'
          },
          type: 'text',
          optional: true, // Optional
        }
      ],
      // MwSt-ID kann auch über tax_id_collection gesammelt werden (für EU)
      tax_id_collection: {
        enabled: true, // Aktiviert automatische MwSt-ID-Erfassung für EU-Länder
      },
    };

    // payment_intent_data NICHT setzen, da mode immer 'subscription' ist (monthly/yearly)

    const session = await stripe.checkout.sessions.create(sessionConfig);

    console.log('Stripe Session erfolgreich erstellt:', session.id);
    
    // Buchungsdaten in Datenbank speichern
    try {
      // Formular-Validierung
      const validation = validateBookingForm(formData);
      if (!validation.isValid) {
        console.error('Formular-Validierung fehlgeschlagen:', validation.errors);
        // Session wurde bereits erstellt, aber Daten sind ungültig
        // In Produktion sollte hier ein Rollback erfolgen
      }

      const bookingData: BookingData = {
        session_id: session.id,
        package_type: packageType,
        is_monthly: isMonthlyBool,
        checkout_mode: 'payment',
        package_price_display: `${amount} €${isMonthlyBool ? ' mtl.' : ''}`,
        currency: currency || 'eur',
        total_amount_cents: Math.round(amount * 100),
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: formData.customerPhone as string || undefined,
        company_name: formData.companyName as string || undefined,
        existing_website: (formData.existingWebsite as string) === 'ja' ? true : false,
        existing_website_url: formData.existingWebsiteUrl as string || undefined,
        target_group: formData.targetGroup as string[] || [],
        design_style: formData.designStyle as string || undefined,
        design_reference_url: formData.designReferenceUrl as string || undefined,
        selected_addons: formData.selectedAddons ? JSON.parse(formData.selectedAddons as string) : undefined,
        message: formData.message as string || undefined,
        raw_form_data: formData,
        status: 'pending'
      };
      
      await saveBooking(bookingData);
      console.log('✅ Buchungsdaten erfolgreich gespeichert');
    } catch (dbError) {
      console.error('❌ Fehler beim Speichern der Buchungsdaten:', dbError);
      // Stripe Session wurde erstellt, aber DB-Speicherung fehlgeschlagen
      // Das ist nicht kritisch, da die Daten in Stripe Metadata gespeichert sind
    }
    
    return secureResponse({ sessionId: session.id });
  } catch (error) {
    console.error('Stripe API Fehler:', error);
    
    // Detaillierte Fehlermeldung für Debugging
    const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('Fehler-Details:', errorMessage);
    console.error('Error Stack:', errorStack);
    
    return secureResponse(
      { 
        error: 'Fehler beim Erstellen der Checkout-Session',
        details: process.env.NODE_ENV !== 'production' ? errorMessage : undefined,
        stack: process.env.NODE_ENV !== 'production' ? errorStack : undefined
      },
      500
    );
  }
}
