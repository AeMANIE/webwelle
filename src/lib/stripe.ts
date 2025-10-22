// Stripe public key - muss aus Umgebungsvariablen kommen
const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
if (!stripePublishableKey) {
  throw new Error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY Umgebungsvariable ist nicht gesetzt');
}

// KEINE Stripe-Imports im initialen Bundle!

// Stripe nur laden wenn Checkout-Button geklickt wird
export const loadStripeOnDemand = async (): Promise<unknown> => {
  if (typeof window === 'undefined') return null;
  
  // Prüfen ob Stripe bereits geladen ist
  if ((window as unknown as { Stripe?: unknown }).Stripe) {
    return (window as unknown as { Stripe: (key: string) => unknown }).Stripe(stripePublishableKey);
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

// Zusatzoptionen (Add-ons) Preis-Konfiguration
export const ADDON_PRICE_CONFIG: Record<string, {
  oneTime?: { priceId: string };
  monthly?: { priceId: string };
}> = {
  // Keys müssen mit BookingForm "zusatzfunktionen" übereinstimmen
  'blitz-welle': {
    oneTime: { priceId: 'price_1SI2S6QoIwTqROay7zklRjIQ' }, // 249,99 €
  },
  'logo-welle': {
    oneTime: { priceId: 'price_1SI2T1QoIwTqROayUnmc8Fjm' }, // 299 €
  },
  terminbuchung: {
    oneTime: { priceId: 'price_1SI2TuQoIwTqROay124259lI' }, // 1.599 €
    monthly: { priceId: 'price_1SI2WFQoIwTqROayiYbscwip' }, // 145,99 € mntl
  },
  'online-shop': {
    oneTime: { priceId: 'price_1SI2YAQoIwTqROayxsJwyBJy' }, // 2.999 €
    monthly: { priceId: 'price_1SI2Z7QoIwTqROay9qWE87Pj' }, // 274,99 € mntl
  },
  'mitglieder-welle': {
    oneTime: { priceId: 'price_1SI2ZsQoIwTqROay53gUCPvq' }, // 2.399 €
    monthly: { priceId: 'price_1SI2akQoIwTqROayxQ1jSUCl' }, // 219,99 € mntl
  },
  'foto-welle-5': {
    oneTime: { priceId: 'price_1SI2buQoIwTqROayOtScLodL' }, // 575 €
  },
  'foto-welle-10': {
    oneTime: { priceId: 'price_1SI2cgQoIwTqROayhymWbiWs' }, // 999 €
  },
  'foto-welle-20': {
    oneTime: { priceId: 'price_1SI2dLQoIwTqROayiKC0lEx3' }, // 1.750 €
  },
  lieferdienst: {
    oneTime: { priceId: 'price_1SI2eJQoIwTqROayIDtCsqMD' }, // 2.999 €
    monthly: { priceId: 'price_1SI2fVQoIwTqROay2pTT2q2z' }, // 279,99 € mntl
  },
  'google-my-business': {
    oneTime: { priceId: 'price_1SI2gKQoIwTqROayF1uuJVCZ' }, // 399 €
  },
  visitenkarten: {
    oneTime: { priceId: 'price_1SI2mUQoIwTqROaykbL0F5Tg' }, // 100 €
  },
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
    // Zusatzoptionen (aus dem Formular) in Price-IDs umwandeln
    const selectedAddonsField = (formData as Record<string, unknown>)['zusatzfunktionen'];
    const selectedAddons = Array.isArray(selectedAddonsField)
      ? (selectedAddonsField as string[])
      : [];

    // Zahlungsart pro Add-on aus dem Formular berücksichtigen, sonst Fallback:
    const perAddonPaymentField = (formData as Record<string, unknown>)['zusatzzahlung'];
    const perAddonPaymentPreference: Record<string, 'oneTime' | 'monthly' | undefined> = (perAddonPaymentField as Record<string, 'oneTime' | 'monthly'>) || {};
    let hasRecurringAddons = false;
    const addOnPriceIds = selectedAddons
      .map((key) => {
        const cfg = ADDON_PRICE_CONFIG[key];
        if (!cfg) return undefined;
        const preferred = perAddonPaymentPreference[key];
        if (preferred === 'monthly') {
          if (cfg.monthly?.priceId) {
            hasRecurringAddons = true;
            return cfg.monthly.priceId;
          }
          return cfg.oneTime?.priceId;
        }
        // default: einmalig
        return cfg.oneTime?.priceId || cfg.monthly?.priceId;
      })
      .filter((v): v is string => Boolean(v));

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
        hasRecurringAddons,
        addOnPriceIds,
        priceId: PRICE_CONFIG[packageType][isMonthly ? 'monthly' : 'yearly'].priceId,
        amount: PRICE_CONFIG[packageType][isMonthly ? 'monthly' : 'yearly'].amount,
        currency: PRICE_CONFIG[packageType][isMonthly ? 'monthly' : 'yearly'].currency
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('API Fehler:', errorData);
      console.error('Response Status:', response.status);
      console.error('Response Headers:', response.headers);
      throw new Error(errorData.details || errorData.error || 'Fehler beim Erstellen der Checkout-Session');
    }

    const { sessionId } = await response.json();
    return sessionId;
  } catch (error) {
    console.error('Fehler beim Erstellen der Stripe-Session:', error);
    throw error;
  }
}

// Diese Funktion wird nicht mehr benötigt - Stripe wird on-demand geladen
