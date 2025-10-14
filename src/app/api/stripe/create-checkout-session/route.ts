import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
// import { saveBooking, BookingData } from '@/lib/database'; // Temporär deaktiviert

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_your_secret_key_here', {
  apiVersion: '2025-08-27.basil',
});

// Prüfe Stripe-Konfiguration
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('WARNUNG: STRIPE_SECRET_KEY ist nicht gesetzt!');
}

export async function POST(request: NextRequest) {
  try {
    console.log('Stripe Checkout Session wird erstellt...');
    
    const {
      packageType,
      isMonthly,
      customerEmail,
      customerName,
      formData,
      hasRecurringAddons,
      addOnPriceIds,
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

    // Validierung
    if (!priceId) {
      throw new Error('Price ID ist erforderlich');
    }

    // Stripe Checkout Session erstellen

    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'], // Nur Kreditkarte (SEPA muss in Stripe Dashboard aktiviert werden)
      line_items: [
        {
          price: priceId, // Hauptpaket
          quantity: 1,
        },
        // Zusatzoptionen als weitere Positionen
        ...((Array.isArray(addOnPriceIds) ? addOnPriceIds : [])
          .map((addon) => ({ price: addon, quantity: 1 })) as Stripe.Checkout.SessionCreateParams.LineItem[]),
      ],
      // Wenn irgendein Add-on monatlich ist ODER Hauptpaket auf monthly steht -> subscription
      mode: (isMonthly || hasRecurringAddons) ? 'subscription' : 'payment',
      metadata: {
        packageType,
        isMonthly: isMonthly.toString(),
        customerName,
        formData: JSON.stringify(formData),
        addOnPriceIds: JSON.stringify(addOnPriceIds || []),
      },
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/#produkte?cancelled=true`,
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

    // payment_intent_data nur für one-time payments hinzufügen
    if (!isMonthly) {
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
    
    // Buchungsdaten in Datenbank speichern (temporär deaktiviert für Debugging)
    try {
      console.log('Datenbank-Speicherung temporär deaktiviert für Debugging');
      // const bookingData: BookingData = {
      //   session_id: session.id,
      //   package_type: packageType,
      //   is_monthly: isMonthly,
      //   customer_name: customerName,
      //   customer_email: customerEmail,
      //   customer_phone: formData.telefon || undefined,
      //   company_name: formData.firmenname,
      //   existing_website: formData.bestehendeWebsite,
      //   target_group: formData.zielgruppe || [],
      //   design_style: formData.designStil,
      //   functions: formData.funktionen || [],
      //   budget: formData.budget,
      //   message: formData.nachricht || undefined,
      //   status: 'pending'
      // };
      
      // await saveBooking(bookingData);
      // console.log('Buchungsdaten erfolgreich gespeichert');
    } catch (dbError) {
      console.error('Fehler beim Speichern der Buchungsdaten:', dbError);
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
