import { NextRequest, NextResponse } from 'next/server';
import { directus, isDirectusAvailable } from '@/lib/directus';
import { sendAddonConfirmation } from '@/lib/email-addon-confirmation';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_your_secret_key_here');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      bookingId, 
      addonKey, 
      addonLabel, 
      billing, 
      priceId, 
      amountCents, 
      customerEmail,
      customerName 
    } = body;

    // Validierung
    if (!bookingId || !addonKey || !addonLabel || !billing || !priceId || !amountCents || !customerEmail) {
      return NextResponse.json({ 
        error: 'Alle erforderlichen Felder müssen ausgefüllt sein' 
      }, { status: 400 });
    }

    if (!isDirectusAvailable()) {
      return NextResponse.json({ 
        error: 'Directus nicht verfügbar' 
      }, { status: 503 });
    }

    // Erstelle Stripe Checkout Session
    const checkoutMode = billing === 'monthly' ? 'subscription' : 'payment';
    
    const session = await stripe.checkout.sessions.create({
      mode: checkoutMode,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success?addon=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/customer?cancelled=true`,
      customer_email: customerEmail,
      metadata: {
        booking_id: bookingId,
        addon_key: addonKey,
        addon_label: addonLabel,
        billing: billing,
        customer_name: customerName,
        type: 'addon_order',
      },
    });

    // Speichere Add-on Bestellung in Directus
    const addonOrder = await directus.createAddonOrder(bookingId, {
      addon_key: addonKey,
      addon_label: addonLabel,
      billing: billing as 'oneTime' | 'monthly',
      price_id: priceId,
      amount_cents: amountCents,
      checkout_mode: checkoutMode as 'payment' | 'subscription',
      session_id: session.id,
    });

    if (!addonOrder) {
      return NextResponse.json({ 
        error: 'Fehler beim Speichern der Add-on Bestellung' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      sessionId: session.id,
      url: session.url,
      addonOrderId: addonOrder.id 
    });

  } catch (error) {
    console.error('Add-on Checkout Fehler:', error);
    return NextResponse.json({ 
      error: 'Fehler beim Erstellen der Add-on Checkout Session' 
    }, { status: 500 });
  }
}

// Webhook Handler für Add-on Bestellungen
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, status, stripeData } = body;

    if (!sessionId || !status) {
      return NextResponse.json({ 
        error: 'Session-ID und Status erforderlich' 
      }, { status: 400 });
    }

    if (!isDirectusAvailable()) {
      return NextResponse.json({ 
        error: 'Directus nicht verfügbar' 
      }, { status: 503 });
    }

    // Aktualisiere Add-on Bestellung Status
    await directus.updateAddonOrderStatus(sessionId, status, stripeData);

    // Sende Bestätigungs-E-Mail bei erfolgreicher Zahlung
    if (status === 'paid') {
      try {
        // Hole Add-on Bestellung Details
        const addonOrders = await directus.request<{ data: Array<Record<string, unknown>> }>(
          `webwelle_addon_orders?filter[session_id][_eq]=${sessionId}`
        );

        if (addonOrders.data.length > 0) {
          const order = addonOrders.data[0];
          const booking = await directus.request<{ data: Record<string, unknown> }>(
            `webwelle_bookings/${order.booking_id}`
          );

          await sendAddonConfirmation({
            customerName: String(booking.data.customer_name),
            customerEmail: String(booking.data.customer_email),
            addonLabel: String(order.addon_label),
            addonPrice: `${(Number(order.amount_cents) / 100).toFixed(2)} €`,
            billing: String(order.billing) as 'oneTime' | 'monthly',
            sessionId: String(order.session_id),
            bookingId: String(order.booking_id),
          });
        }
      } catch (emailError) {
        console.error('Fehler beim Senden der Add-on Bestätigungs-E-Mail:', emailError);
        // E-Mail-Fehler sollten den Prozess nicht stoppen
      }
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Add-on Status Update Fehler:', error);
    return NextResponse.json({ 
      error: 'Fehler beim Aktualisieren des Add-on Status' 
    }, { status: 500 });
  }
}
