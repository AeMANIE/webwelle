// Stripe public key zur Laufzeit validieren
function getStripePublishableKey(): string {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!key) {
    throw new Error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY Umgebungsvariable ist nicht gesetzt');
  }
  return key;
}

// KEINE Stripe-Imports im initialen Bundle!

// Stripe nur laden wenn Checkout-Button geklickt wird
export const loadStripeOnDemand = async (): Promise<unknown> => {
  if (typeof window === 'undefined') return null;
  
  // Prüfen ob Stripe bereits geladen ist
  if ((window as unknown as { Stripe?: unknown }).Stripe) {
    return (window as unknown as { Stripe: (key: string) => unknown }).Stripe(getStripePublishableKey());
  }
  
  // Dynamisch laden - nur wenn wirklich benötigt
  const { loadStripe } = await import('@stripe/stripe-js');
  return loadStripe(getStripePublishableKey(), { locale: 'de' });
};

// ============================================================================
// WEBDESIGN-PAKETE KONFIGURATION (StarterWelle, BusinessWelle, ErfolgsWelle)
// ============================================================================
// Diese Pakete verwenden das vollständige BookingForm mit allen Feldern

export const WEBDESIGN_PRICE_CONFIG = {
  starterwelle: {
    monthly: {
      priceId: 'price_1SigHuJ8MIbotcdAxsLi9CDM', // StarterWelle monatlich (77€) - LIVE
      amount: 7700, // 77€ in Cent
      currency: 'eur'
    },
    yearly: {
      priceId: 'price_1SigIZJ8MIbotcdALYoAD71T', // StarterWelle jährlich (840€) - LIVE
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
      priceId: 'price_1SOzKaQoIwTqROayXgPNT06d', // BusinessWelle jährlich (1.520€) - korrigierte Price ID
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
      priceId: 'price_1SGX5kQoIwTqROaybEHbhBtv', // ErfolgsWelle jährlich (2.999€)
      amount: 299900, // 2999€ in Cent (korrigiert nach CSV)
      currency: 'eur'
    }
  }
} as const;

// ============================================================================
// KI-AUTOMATISIERUNG-PAKETE KONFIGURATION (FlowWelle, PowerWelle, MeisterWelle)
// ============================================================================
// Diese Pakete haben vereinfachtes Checkout - direkt zu Stripe ohne großes Formular

export const KI_PRICE_CONFIG = {
  flowwelle: {
    monthly: {
      priceId: 'price_1SOz64QoIwTqROayI5oZs86g', // FlowWelle monatlich (99€)
      amount: 9900, // 99€ in Cent
      currency: 'eur'
    },
    yearly: {
      priceId: 'price_1SOz71QoIwTqROaybfQJFcci', // FlowWelle jährlich (990€)
      amount: 99000, // 990€ in Cent
      currency: 'eur'
    }
  },
  powerwelle: {
    monthly: {
      priceId: 'price_1SOzFBQoIwTqROay0GxOscBj', // PowerWelle monatlich (179€)
      amount: 17900, // 179€ in Cent
      currency: 'eur'
    },
    yearly: {
      priceId: 'price_1SOzFqQoIwTqROayV38D0mh5', // PowerWelle jährlich (1.790€)
      amount: 179000, // 1790€ in Cent
      currency: 'eur'
    }
  },
  meisterwelle: {
    monthly: {
      priceId: 'price_1SOzGcQoIwTqROayR6v5oAkR', // MeisterWelle monatlich (249€)
      amount: 24900, // 249€ in Cent
      currency: 'eur'
    },
    yearly: {
      priceId: 'price_1SOzHBQoIwTqROayL8o75ic7', // MeisterWelle jährlich (2.490€)
      amount: 249000, // 2490€ in Cent
      currency: 'eur'
    }
  }
} as const;

// ============================================================================
// AI-VOICE-PAKETE KONFIGURATION (Mini Job, Midi Job, Festangestellt AI-Agent)
// ============================================================================
// Diese Pakete sind monatliche Subscriptions, vereinfachtes Checkout

export const AI_VOICE_PRICE_CONFIG = {
  minijob: {
    monthly: {
      priceId: 'price_1SOvxnQoIwTqROaypfI6ff58', // Mini Job AI-Assistent monatlich (399€)
      amount: 39900, // 399€ in Cent
      currency: 'eur'
    }
  },
  midijob: {
    monthly: {
      priceId: 'price_1SOvyiQoIwTqROaySSNqaqqE', // Midi Job AI-Assistenz monatlich (999€)
      amount: 99900, // 999€ in Cent
      currency: 'eur'
    }
  },
  festangestellt: {
    monthly: {
      priceId: 'price_1SOvzoQoIwTqROayU9iql5tr', // Festangestellt AI-Agent monatlich (1999€)
      amount: 199900, // 1999€ in Cent
      currency: 'eur'
    }
  },
  einrichtungspaket: {
    oneTime: {
      priceId: 'price_1SOyytQoIwTqROayNXuZIxWy', // Einrichtungspaket AI Voice (1499€)
      amount: 149900, // 1499€ in Cent
      currency: 'eur'
    }
  }
} as const;

// Rückwärtskompatibilität: PRICE_CONFIG für bestehenden Code
export const PRICE_CONFIG = {
  ...WEBDESIGN_PRICE_CONFIG,
  ...KI_PRICE_CONFIG,
  ...AI_VOICE_PRICE_CONFIG
};

// Zusatzoptionen (Add-ons) Preis-Konfiguration
export const ADDON_PRICE_CONFIG: Record<string, {
  oneTime?: { priceId: string };
  monthly?: { priceId: string };
  yearly?: { priceId: string };
}> = {
  // Keys müssen mit BookingForm "zusatzfunktionen" übereinstimmen
  'blitz-welle': {
    oneTime: { priceId: 'price_1SI2S6QoIwTqROay7zklRjIQ' }, // 249,99 €
  },
  'logo-welle': {
    oneTime: { priceId: 'price_1SI2T1QoIwTqROayUnmc8Fjm' }, // 299 €
  },
  terminbuchung: {
    monthly: { priceId: 'price_1SI2WFQoIwTqROayiYbscwip' }, // 145,99 € mntl
    yearly: { priceId: 'price_1SI2TuQoIwTqROay124259lI' }, // 1.599 € jährlich (war fälschlicherweise als oneTime)
  },
  'online-shop': {
    monthly: { priceId: 'price_1SI2Z7QoIwTqROay9qWE87Pj' }, // 274,99 € mntl
    yearly: { priceId: 'price_1SI2YAQoIwTqROayxsJwyBJy' }, // 2.999 € jährlich (war fälschlicherweise als oneTime)
  },
  'mitglieder-welle': {
    monthly: { priceId: 'price_1SI2akQoIwTqROayxQ1jSUCl' }, // 219,99 € mntl
    yearly: { priceId: 'price_1SOzMxQoIwTqROayrJt0V0hV' }, // 2.399 € jährlich
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
    monthly: { priceId: 'price_1SI2fVQoIwTqROay2pTT2q2z' }, // 279,99 € mntl
    yearly: { priceId: 'price_1SI2eJQoIwTqROayIDtCsqMD' }, // 2.999 € jährlich (war fälschlicherweise als oneTime)
  },
  'google-my-business': {
    oneTime: { priceId: 'price_1SI2gKQoIwTqROayF1uuJVCZ' }, // 399 €
  },
  visitenkarten: {
    oneTime: { priceId: 'price_1SI2mUQoIwTqROaykbL0F5Tg' }, // 100 €
  },
};

// ============================================================================
// WEBDESIGN-PAKETE: Checkout Session erstellen (mit vollständigem Formular)
// ============================================================================
export async function createWebdesignCheckoutSession(
  packageType: 'starterwelle' | 'businesswelle' | 'erfolgswelle',
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

    // WICHTIG: Stripe Checkout Regeln:
    // ✅ ERLAUBT: Subscription (monatlich ODER jährlich) + One-time Payment in derselben Session
    // ❌ NICHT ERLAUBT: Subscription (monatlich) + Subscription (jährlich) in derselben Session
    // ✅ ERLAUBT: Subscription (jährlich) + Subscription (jährlich) - beide haben dasselbe Intervall!
    // Daher filtern wir Add-ons nach dem Hauptpaket-Intervall:
    // - Hauptpaket monthly (subscription) → monthly subscription-Add-ons UND one-time Add-ons erlaubt ✅
    // - Hauptpaket yearly (subscription) → yearly subscription-Add-ons UND one-time Add-ons erlaubt ✅
    
    const perAddonPaymentField = (formData as Record<string, unknown>)['zusatzzahlung'];
    const perAddonPaymentPreference: Record<string, 'oneTime' | 'monthly' | 'yearly' | undefined> = (perAddonPaymentField as Record<string, 'oneTime' | 'monthly' | 'yearly'>) || {};
    
    // Hauptpaket ist immer subscription (monthly oder yearly), nie payment!
    const mainPackageInterval: 'monthly' | 'yearly' = isMonthly ? 'monthly' : 'yearly';
    
    let hasRecurringAddons = false;
    const incompatibleAddons: string[] = [];
    const compatibleAddons: string[] = [];
    
    const addOnPriceIds = selectedAddons
      .map((key) => {
        const cfg = ADDON_PRICE_CONFIG[key];
        if (!cfg) return { key, priceId: undefined, compatible: false };
        
        const preferred = perAddonPaymentPreference[key];
        
        // Wenn Hauptpaket monthly subscription ist
        if (mainPackageInterval === 'monthly') {
          // ✅ Monthly subscription-Add-ons UND One-time Add-ons sind beide erlaubt!
          // Zuerst prüfe gewünschte Präferenz
          if (preferred === 'monthly' && cfg.monthly?.priceId) {
            hasRecurringAddons = true;
            compatibleAddons.push(key);
            return { key, priceId: cfg.monthly.priceId, compatible: true };
          }
          if (preferred === 'oneTime' && cfg.oneTime?.priceId) {
            compatibleAddons.push(key);
            return { key, priceId: cfg.oneTime.priceId, compatible: true };
          }
          // Fallback: Versuche monthly subscription zuerst, dann one-time
          if (cfg.monthly?.priceId) {
            hasRecurringAddons = true;
            compatibleAddons.push(key);
            return { key, priceId: cfg.monthly.priceId, compatible: true };
          }
          if (cfg.oneTime?.priceId) {
            compatibleAddons.push(key);
            return { key, priceId: cfg.oneTime.priceId, compatible: true };
          }
          // Keine passende Option verfügbar
          incompatibleAddons.push(key);
          return { key, priceId: undefined, compatible: false };
        }
        
        // Wenn Hauptpaket yearly subscription ist
        // ✅ Yearly subscription-Add-ons UND One-time Add-ons sind beide erlaubt!
        // (Beide haben dasselbe yearly Intervall - erlaubt!)
        if (preferred === 'yearly' && cfg.yearly?.priceId) {
          hasRecurringAddons = true;
          compatibleAddons.push(key);
          return { key, priceId: cfg.yearly.priceId, compatible: true };
        }
        if (preferred === 'oneTime' && cfg.oneTime?.priceId) {
          compatibleAddons.push(key);
          return { key, priceId: cfg.oneTime.priceId, compatible: true };
        }
        // Fallback: Versuche yearly subscription zuerst, dann one-time
        if (cfg.yearly?.priceId) {
          hasRecurringAddons = true;
          compatibleAddons.push(key);
          return { key, priceId: cfg.yearly.priceId, compatible: true };
        }
        if (cfg.oneTime?.priceId) {
          compatibleAddons.push(key);
          return { key, priceId: cfg.oneTime.priceId, compatible: true };
        }
        // Monthly subscription Add-on ist nicht kompatibel mit yearly Hauptpaket
        incompatibleAddons.push(key);
        return { key, priceId: undefined, compatible: false };
      })
      .filter((item): item is { key: string; priceId: string; compatible: boolean } => 
        Boolean(item.priceId) && item.compatible
      )
      .map(item => item.priceId);
    
    // Warnung bei inkompatiblen Add-ons
    if (incompatibleAddons.length > 0) {
      console.warn(`⚠️ Inkompatible Add-ons wurden entfernt (${incompatibleAddons.join(', ')}). Hauptpaket ist subscription (${mainPackageInterval}), diese Add-ons haben keine passende Preis-Option.`);
    }

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
        incompatibleAddons: incompatibleAddons.length > 0 ? incompatibleAddons : undefined,
        priceId: WEBDESIGN_PRICE_CONFIG[packageType][isMonthly ? 'monthly' : 'yearly'].priceId,
        amount: WEBDESIGN_PRICE_CONFIG[packageType][isMonthly ? 'monthly' : 'yearly'].amount,
        currency: WEBDESIGN_PRICE_CONFIG[packageType][isMonthly ? 'monthly' : 'yearly'].currency
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('API Fehler:', errorData);
      console.error('Response Status:', response.status);
      // Verwende benutzerfreundliche Fehlermeldung, falls vorhanden
      const errorMessage = errorData.message || errorData.details || errorData.error || 'Bitte füllen Sie alle erforderlichen Felder aus.';
      throw new Error(errorMessage);
    }

    const { sessionId } = await response.json();
    return sessionId;
  } catch (error) {
    console.error('Fehler beim Erstellen der Stripe-Session:', error);
    throw error;
  }
}

// ============================================================================
// KI-AUTOMATISIERUNG-PAKETE: Vereinfachte Checkout Session (direkt zu Stripe)
// ============================================================================
export async function createKICheckoutSession(
  packageType: 'flowwelle' | 'powerwelle' | 'meisterwelle',
  isMonthly: boolean,
  customerEmail?: string,
  customerName?: string
): Promise<string> {
  try {
    const response = await fetch('/api/stripe/create-ki-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        packageType,
        isMonthly,
        customerEmail,
        customerName,
        priceId: KI_PRICE_CONFIG[packageType][isMonthly ? 'monthly' : 'yearly'].priceId,
        amount: KI_PRICE_CONFIG[packageType][isMonthly ? 'monthly' : 'yearly'].amount,
        currency: KI_PRICE_CONFIG[packageType][isMonthly ? 'monthly' : 'yearly'].currency
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('API Fehler:', errorData);
      throw new Error(errorData.details || errorData.error || 'Fehler beim Erstellen der Checkout-Session');
    }

    const { sessionId } = await response.json();
    return sessionId;
  } catch (error) {
    console.error('Fehler beim Erstellen der KI-Stripe-Session:', error);
    throw error;
  }
}

// ============================================================================
// AI-VOICE-PAKETE: Vereinfachte Checkout Session (direkt zu Stripe)
// ============================================================================
export async function createAIVoiceCheckoutSession(
  packageType: 'minijob' | 'midijob' | 'festangestellt' | 'einrichtungspaket',
  customerEmail?: string,
  customerName?: string,
  addEinrichtungspaket?: boolean // Wenn true, wird das Einrichtungspaket als Add-on hinzugefügt
): Promise<string> {
  try {
    // Prüfe ob es das Einrichtungspaket ist (einmalig)
    const isEinrichtungspaket = packageType === 'einrichtungspaket';
    
    // Wenn es ein Hauptpaket ist, kann optional das Einrichtungspaket als Add-on hinzugefügt werden
    const addonPriceIds: string[] = [];
    if (addEinrichtungspaket && !isEinrichtungspaket && AI_VOICE_PRICE_CONFIG.einrichtungspaket.oneTime?.priceId) {
      addonPriceIds.push(AI_VOICE_PRICE_CONFIG.einrichtungspaket.oneTime.priceId);
    }

    const priceId = isEinrichtungspaket
      ? AI_VOICE_PRICE_CONFIG.einrichtungspaket.oneTime!.priceId
      : AI_VOICE_PRICE_CONFIG[packageType as 'minijob' | 'midijob' | 'festangestellt'].monthly.priceId;
    
    const amount = isEinrichtungspaket
      ? AI_VOICE_PRICE_CONFIG.einrichtungspaket.oneTime!.amount
      : AI_VOICE_PRICE_CONFIG[packageType as 'minijob' | 'midijob' | 'festangestellt'].monthly.amount;

    const response = await fetch('/api/stripe/create-ai-voice-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        packageType,
        customerEmail,
        customerName,
        priceId,
        amount,
        currency: 'eur',
        addonPriceIds: addonPriceIds.length > 0 ? addonPriceIds : undefined,
        isEinrichtungspaket,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('API Fehler:', errorData);
      throw new Error(errorData.details || errorData.error || 'Fehler beim Erstellen der Checkout-Session');
    }

    const { sessionId } = await response.json();
    return sessionId;
  } catch (error) {
    console.error('Fehler beim Erstellen der AI-Voice-Stripe-Session:', error);
    throw error;
  }
}

// Rückwärtskompatibilität: Alte Funktion für Webdesign-Pakete
export async function createCheckoutSession(
  packageType: 'starterwelle' | 'businesswelle' | 'erfolgswelle' | 'flowwelle' | 'powerwelle' | 'meisterwelle',
  isMonthly: boolean,
  customerEmail: string,
  customerName: string,
  formData: Record<string, unknown>
) {
  // Prüfe ob es ein KI-Paket ist
  if (packageType === 'flowwelle' || packageType === 'powerwelle' || packageType === 'meisterwelle') {
    return createKICheckoutSession(packageType, isMonthly, customerEmail, customerName);
  }
  
  // Webdesign-Pakete verwenden die vollständige Funktion
  return createWebdesignCheckoutSession(packageType as 'starterwelle' | 'businesswelle' | 'erfolgswelle', isMonthly, customerEmail, customerName, formData);
}
