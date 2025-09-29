import { loadStripe } from '@stripe/stripe-js';

// Stripe public key - sollte aus Umgebungsvariablen kommen
const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_your_publishable_key_here';

export const stripePromise = loadStripe(stripePublishableKey);

// Preis-Konfiguration
export const PRICE_CONFIG = {
  nextjs: {
    monthly: {
      priceId: 'price_1SCfrMQoIwTqROaytxsYCUXq', // Stripe Price ID für monatliche Next.js Zahlung (119€)
      amount: 11900, // 119€ in Cent
      currency: 'eur'
    },
    oneTime: {
      priceId: 'price_1SCfs1QoIwTqROayf5unUmw5', // Stripe Price ID für einmalige Next.js Zahlung
      amount: 249000, // 2490€ in Cent
      currency: 'eur'
    }
  },
  wordpress: {
    monthly: {
      priceId: 'price_wordpress_monthly', // TODO: WordPress monatlich erstellen
      amount: 6500, // 65€ in Cent
      currency: 'eur'
    },
    oneTime: {
      priceId: 'price_wordpress_onetime', // TODO: WordPress einmalig erstellen
      amount: 129000, // 1290€ in Cent
      currency: 'eur'
    }
  }
};

// Stripe Checkout Session erstellen
export async function createCheckoutSession(
  packageType: 'nextjs' | 'wordpress',
  isMonthly: boolean,
  customerEmail: string,
  customerName: string,
  formData: Record<string, unknown>
) {
  try {
    const response = await fetch('/api/stripe/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        packageType,
        isMonthly,
        customerEmail,
        customerName,
        formData,
        priceId: PRICE_CONFIG[packageType][isMonthly ? 'monthly' : 'oneTime'].priceId,
        amount: PRICE_CONFIG[packageType][isMonthly ? 'monthly' : 'oneTime'].amount,
        currency: PRICE_CONFIG[packageType][isMonthly ? 'monthly' : 'oneTime'].currency
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('API Fehler:', errorData);
      throw new Error(errorData.details || 'Fehler beim Erstellen der Checkout-Session');
    }

    const { sessionId } = await response.json();
    return sessionId;
  } catch (error) {
    console.error('Fehler beim Erstellen der Stripe-Session:', error);
    throw error;
  }
}

// Stripe Checkout weiterleiten
export async function redirectToCheckout(sessionId: string) {
  const stripe = await stripePromise;
  
  if (!stripe) {
    throw new Error('Stripe konnte nicht geladen werden');
  }

  const { error } = await stripe.redirectToCheckout({
    sessionId,
  });

  if (error) {
    console.error('Fehler beim Weiterleiten zu Stripe:', error);
    throw error;
  }
}
