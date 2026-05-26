import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { saveBooking, BookingData } from '@/lib/database';

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
    console.log('KI-Stripe Checkout Session wird erstellt...');
    
    const stripe = getStripeInstance();
    
    const {
      packageType,
      isMonthly,
      customerEmail,
      customerName,
      priceId,
      amount,
      currency
    } = await request.json();

    console.log('Empfangene KI-Paket Daten:', {
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

    if (!['flowwelle', 'powerwelle', 'meisterwelle'].includes(packageType)) {
      throw new Error('Ungültiger Paket-Typ für KI-Checkout');
    }

    // Stripe Checkout Session erstellen (vereinfacht - ohne Add-ons)
    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      mode: isMonthly ? 'subscription' : 'payment',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        packageType,
        isMonthly: isMonthly.toString(),
        customerName: customerName || '',
        packageCategory: 'ki-automation', // Kennzeichnung für KI-Pakete
      },
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/success?session_id={CHECKOUT_SESSION_ID}&package=${packageType}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/buchung/${packageType}?cancelled=true`,
      locale: 'de',
      billing_address_collection: 'required',
      // E-Mail optional - kann auch in Stripe Checkout eingegeben werden
      ...(customerEmail && { customer_email: customerEmail }),
    };

    // Für Subscriptions: subscription_data
    if (isMonthly) {
      sessionConfig.subscription_data = {
        metadata: {
          packageType,
          customerName: customerName || '',
          packageCategory: 'ki-automation',
        },
      };
    } else {
      // Für one-time payments: payment_intent_data
      sessionConfig.payment_intent_data = {
        metadata: {
          packageType,
          isMonthly: 'false',
          customerName: customerName || '',
          packageCategory: 'ki-automation',
        },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    console.log('KI-Stripe Session erfolgreich erstellt:', session.id);
    
    // Buchungsdaten in Datenbank speichern (vereinfacht - keine Formular-Daten)
    try {
      const bookingData: BookingData = {
        session_id: session.id,
        package_type: packageType as 'flowwelle' | 'powerwelle' | 'meisterwelle',
        is_monthly: isMonthly,
        checkout_mode: isMonthly ? 'subscription' : 'payment',
        package_price_display: `${amount / 100} €${isMonthly ? ' mtl.' : ' jährlich'}`,
        currency: currency || 'eur',
        total_amount_cents: amount,
        customer_name: customerName || undefined,
        customer_email: customerEmail || undefined,
        status: 'pending',
        raw_form_data: {
          packageCategory: 'ki-automation',
          simplifiedCheckout: true,
        }
      };
      
      await saveBooking(bookingData);
      console.log('✅ KI-Buchungsdaten erfolgreich gespeichert');
    } catch (dbError) {
      console.error('❌ Fehler beim Speichern der KI-Buchungsdaten:', dbError);
      // Stripe Session wurde erstellt, aber DB-Speicherung fehlgeschlagen
      // Das ist nicht kritisch, da die Daten in Stripe Metadata gespeichert sind
    }
    
    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error('KI-Stripe API Fehler:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('Fehler-Details:', errorMessage);
    console.error('Error Stack:', errorStack);
    
    return NextResponse.json(
      { 
        error: 'Fehler beim Erstellen der KI-Checkout-Session',
        details: errorMessage,
        stack: errorStack
      },
      { status: 500 }
    );
  }
}

