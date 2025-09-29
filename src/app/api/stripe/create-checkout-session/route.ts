import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { saveBooking, BookingData } from '@/lib/database';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_your_secret_key_here', {
  apiVersion: '2025-08-27.basil',
});

export async function POST(request: NextRequest) {
  try {
    console.log('Stripe Checkout Session wird erstellt...');
    
    const {
      packageType,
      isMonthly,
      customerEmail,
      customerName,
      formData,
      priceId,
      amount,
      currency
    } = await request.json();

    console.log('Empfangene Daten:', {
      packageType,
      isMonthly,
      customerEmail,
      customerName,
      priceId,
      amount,
      currency
    });

    // Validierung
    if (!priceId) {
      throw new Error('Price ID ist erforderlich');
    }
    if (!customerEmail) {
      throw new Error('Kunden-E-Mail ist erforderlich');
    }

    // Stripe Checkout Session erstellen
    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'], // Nur Kreditkarte (SEPA muss in Stripe Dashboard aktiviert werden)
      line_items: [
        {
          price: priceId, // Verwende die echte Price ID
          quantity: 1,
        },
      ],
      mode: isMonthly ? 'subscription' : 'payment',
      customer_email: customerEmail,
      metadata: {
        packageType,
        isMonthly: isMonthly.toString(),
        customerName,
        formData: JSON.stringify(formData),
      },
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3002'}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3002'}/#produkte?cancelled=true`,
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
    
    // Buchungsdaten in Datenbank speichern
    try {
      const bookingData: BookingData = {
        session_id: session.id,
        package_type: packageType,
        is_monthly: isMonthly,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: formData.telefon || undefined,
        company_name: formData.firmenname,
        existing_website: formData.bestehendeWebsite,
        target_group: formData.zielgruppe || [],
        design_style: formData.designStil,
        functions: formData.funktionen || [],
        budget: formData.budget,
        message: formData.nachricht || undefined,
        status: 'pending'
      };
      
      await saveBooking(bookingData);
      console.log('Buchungsdaten erfolgreich gespeichert');
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
    console.error('Fehler-Details:', errorMessage);
    
    return NextResponse.json(
      { 
        error: 'Fehler beim Erstellen der Checkout-Session',
        details: errorMessage 
      },
      { status: 500 }
    );
  }
}
