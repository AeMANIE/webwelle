// Stripe public key - sollte aus Umgebungsvariablen kommen
const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_your_publishable_key_here';

// KEINE Stripe-Imports im initialen Bundle!

// Stripe nur laden wenn Checkout-Button geklickt wird
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const loadStripeOnDemand = async (): Promise<any> => {
  if (typeof window === 'undefined') return null;
  
  // Prüfen ob Stripe bereits geladen ist
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((window as any).Stripe) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (window as any).Stripe(stripePublishableKey);
  }
  
  // Dynamisch laden - nur wenn wirklich benötigt
  const { loadStripe } = await import('@stripe/stripe-js');
  return loadStripe(stripePublishableKey, { locale: 'de' });
};

// Preis-Konfiguration für WebWelle-Pakete
export const PRICE_CONFIG = {
  starterwelle: {
    monthly: {
      priceId: 'price_1SGWPMQoIwTqROaydTqIlX1W', // StarterWelle monatlich (77€)
      amount: 7700, // 77€ in Cent
      currency: 'eur'
    },
    yearly: {
      priceId: 'price_1SGWRJQoIwTqROayqyfkpogg', // StarterWelle jährlich (840€)
      amount: 84000, // 840€ in Cent
      currency: 'eur'
    }
  },
  businesswelle: {
    monthly: {
      priceId: 'price_1SGWwcQoIwTqROayxY5cIBsS', // BusinessWelle monatlich (139€)
      amount: 13900, // 139€ in Cent
      currency: 'eur'
    },
    yearly: {
      priceId: 'price_1SGWxJQoIwTqROayweTQw8CD', // BusinessWelle jährlich (1.520€)
      amount: 152000, // 1520€ in Cent
      currency: 'eur'
    }
  },
  erfolgswelle: {
    monthly: {
      priceId: 'price_1SGX48QoIwTqROaybDtPgQIX', // ErfolgsWelle monatlich (278€)
      amount: 27800, // 278€ in Cent
      currency: 'eur'
    },
    yearly: {
      priceId: 'price_1SGX5kQoIwTqROaybEHbhBtv', // ErfolgsWelle jährlich (3.289€)
      amount: 328900, // 3289€ in Cent
      currency: 'eur'
    }
  },
  // AI-Agent Pakete
  flowwelle: {
    monthly: {
      priceId: 'price_flowwelle_monthly', // FlowWelle monatlich (99€) - TODO: Echte Stripe Price ID
      amount: 9900, // 99€ in Cent
      currency: 'eur'
    },
    yearly: {
      priceId: 'price_flowwelle_yearly', // FlowWelle jährlich (990€) - TODO: Echte Stripe Price ID
      amount: 99000, // 990€ in Cent
      currency: 'eur'
    }
  },
  powerwelle: {
    monthly: {
      priceId: 'price_powerwelle_monthly', // PowerWelle monatlich (179€) - TODO: Echte Stripe Price ID
      amount: 17900, // 179€ in Cent
      currency: 'eur'
    },
    yearly: {
      priceId: 'price_powerwelle_yearly', // PowerWelle jährlich (1.790€) - TODO: Echte Stripe Price ID
      amount: 179000, // 1790€ in Cent
      currency: 'eur'
    }
  },
  meisterwelle: {
    monthly: {
      priceId: 'price_meisterwelle_monthly', // MeisterWelle monatlich (249€) - TODO: Echte Stripe Price ID
      amount: 24900, // 249€ in Cent
      currency: 'eur'
    },
    yearly: {
      priceId: 'price_meisterwelle_yearly', // MeisterWelle jährlich (2.490€) - TODO: Echte Stripe Price ID
      amount: 249000, // 2490€ in Cent
      currency: 'eur'
    }
  }
};

// Stripe Checkout Session erstellen
export async function createCheckoutSession(
  packageType: 'starterwelle' | 'businesswelle' | 'erfolgswelle' | 'flowwelle' | 'powerwelle' | 'meisterwelle',
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
        priceId: PRICE_CONFIG[packageType][isMonthly ? 'monthly' : 'yearly'].priceId,
        amount: PRICE_CONFIG[packageType][isMonthly ? 'monthly' : 'yearly'].amount,
        currency: PRICE_CONFIG[packageType][isMonthly ? 'monthly' : 'yearly'].currency
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

// Diese Funktion wird nicht mehr benötigt - Stripe wird on-demand geladen
