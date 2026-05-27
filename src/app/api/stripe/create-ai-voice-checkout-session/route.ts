import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { saveBooking, BookingData } from '@/lib/database';

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
    console.log('Stripe Checkout Session wird erstellt (AI-Voice-Pakete)...');
    const stripe = getStripeInstance();

    const {
      packageType,
      customerEmail,
      customerName,
      priceId,
      amount,
      currency,
      addonPriceIds,
      isEinrichtungspaket
    } = await request.json();

    // Validierung
    if (!priceId) {
      return NextResponse.json(
        { error: 'Price ID ist erforderlich' },
        { status: 400 }
      );
    }

    if (!['minijob', 'midijob', 'festangestellt', 'einrichtungspaket'].includes(packageType)) {
      return NextResponse.json(
        { error: 'Ungültiger Pakettyp' },
        { status: 400 }
      );
    }

    console.log(`📦 Pakettyp: ${packageType}`);
    console.log(`💰 Preis: ${amount / 100} ${currency.toUpperCase()}`);
    if (addonPriceIds && addonPriceIds.length > 0) {
      console.log(`➕ Add-ons: ${addonPriceIds.length}`);
    }

    // Bestimme Mode: Einrichtungspaket = payment, Hauptpakete = subscription
    const mode: 'subscription' | 'payment' = isEinrichtungspaket ? 'payment' : 'subscription';

    // Stripe Checkout Session erstellen
    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId, // Hauptpaket oder Einrichtungspaket
          quantity: 1,
        },
        // Einrichtungspaket als Add-on (wenn bei Hauptpaket gebucht)
        ...((Array.isArray(addonPriceIds) ? addonPriceIds : [])
          .map((addon) => ({ price: addon, quantity: 1 })) as Stripe.Checkout.SessionCreateParams.LineItem[]),
      ],
      mode,
      metadata: {
        packageType,
        customerName: customerName || 'N/A',
        packageCategory: 'ai-voice', // Mark as AI-Voice package
        isEinrichtungspaket: isEinrichtungspaket?.toString() || 'false',
        addonPriceIds: JSON.stringify(addonPriceIds || []),
      },
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/ai-voice?cancelled=true`,
      locale: 'de',
      billing_address_collection: 'required',
      customer_email: customerEmail || undefined,
    };

    const session = await stripe.checkout.sessions.create(sessionConfig);

    console.log(`✅ Stripe Checkout Session erstellt: ${session.id}`);

    // Buchungsdaten für später speichern (wird im Webhook bestätigt)
    // Hier nur als Preview speichern, final wird im Webhook gespeichert
    const previewBookingData: BookingData = {
      session_id: session.id,
      package_type: packageType as 'minijob' | 'midijob' | 'festangestellt',
      is_monthly: !isEinrichtungspaket, // Hauptpakete sind monatlich
      checkout_mode: mode,
      package_price_display: `${amount / 100} €`,
      currency: currency || 'eur',
      total_amount_cents: amount,
      customer_name: customerName || undefined,
      customer_email: customerEmail || undefined,
      status: 'pending' as const,
    };

    // Nur Preview speichern - final wird im Webhook gespeichert
    try {
      await saveBooking(previewBookingData);
      console.log('📝 Buchungsvorschau gespeichert');
    } catch (saveError) {
      console.warn('⚠️ Fehler beim Speichern der Buchungsvorschau:', saveError);
      // Nicht kritisch, Webhook wird final speichern
    }

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error('❌ Fehler beim Erstellen der AI-Voice-Checkout-Session:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
    return NextResponse.json(
      { 
        error: 'Fehler beim Erstellen der Checkout-Session',
        details: errorMessage 
      },
      { status: 500 }
    );
  }
}

