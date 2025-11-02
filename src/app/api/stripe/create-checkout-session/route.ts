import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { saveBooking, BookingData } from '@/lib/database';
import { validateBookingForm } from '@/lib/validation';

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
    console.log('Stripe Checkout Session wird erstellt (Webdesign-Pakete)...');
    
    const stripe = getStripeInstance();
    
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
    } = await request.json();

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
        isMonthly: isMonthly.toString(),
        customerName,
        formData: JSON.stringify(formData),
        addOnPriceIds: JSON.stringify(addOnPriceIds || []),
      },
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/buchung/${packageType}?cancelled=true`,
      locale: 'de',
      billing_address_collection: 'required',
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
          optional: true,
        },
        {
          key: 'phone',
          label: {
            type: 'custom',
            custom: 'Telefonnummer'
          },
          type: 'text',
          optional: true,
        }
      ],
    };

    // payment_intent_data nur für one-time payments hinzufügen (nicht für subscriptions)
    if (!isMonthly && !hasRecurringAddons) {
      sessionConfig.payment_intent_data = {
        metadata: {
          packageType,
          isMonthly: isMonthly.toString(),
          customerName,
        },
      };
    }

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
        is_monthly: isMonthly,
        checkout_mode: 'payment',
        package_price_display: `${amount} €${isMonthly ? ' mtl.' : ''}`,
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
    
    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error('Stripe API Fehler:', error);
    
    // Detaillierte Fehlermeldung für Debugging
    const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('Fehler-Details:', errorMessage);
    console.error('Error Stack:', errorStack);
    
    return NextResponse.json(
      { 
        error: 'Fehler beim Erstellen der Checkout-Session',
        details: errorMessage,
        stack: errorStack
      },
      { status: 500 }
    );
  }
}
