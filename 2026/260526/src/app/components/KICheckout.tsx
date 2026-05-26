'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { createKICheckoutSession, loadStripeOnDemand, KI_PRICE_CONFIG } from '@/lib/stripe';

interface KICheckoutProps {
  packageType: 'flowwelle' | 'powerwelle' | 'meisterwelle';
  packageName: string;
  packageDescription: string;
  features?: string[];
}

export default function KICheckout({
  packageType,
  packageName,
  packageDescription,
  features = []
}: KICheckoutProps) {
  const searchParams = useSearchParams();
  const [isMonthly, setIsMonthly] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCancelledMessage, setShowCancelledMessage] = useState(false);

  // Prüfe ob der Benutzer von Stripe zurückkommt (cancelled)
  useEffect(() => {
    const cancelledParam = searchParams?.get('cancelled');
    if (cancelledParam === 'true') {
      setShowCancelledMessage(true);
      // Nachricht nach 5 Sekunden ausblenden
      setTimeout(() => setShowCancelledMessage(false), 5000);
      
      // URL-Parameter bereinigen (ohne Reload)
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.delete('cancelled');
        window.history.replaceState({}, '', url.toString());
      }
    }
  }, [searchParams]);

  const prices = {
    monthly: KI_PRICE_CONFIG[packageType].monthly.amount / 100,
    yearly: KI_PRICE_CONFIG[packageType].yearly.amount / 100,
  };

  const handleCheckout = useCallback(async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    setError(null);

    try {
      // Session erstellen
      const sessionId = await createKICheckoutSession(
        packageType,
        isMonthly
      );
      
      // Stripe erst JETZT laden
      const stripe = await loadStripeOnDemand();
      
      if (!stripe) {
        throw new Error('Stripe konnte nicht geladen werden');
      }

      // Zu Stripe Checkout weiterleiten
      const { error: stripeError } = await (stripe as { redirectToCheckout: (params: { sessionId: string }) => Promise<{ error?: { message: string } }> }).redirectToCheckout({
        sessionId,
      });

      if (stripeError) {
        throw new Error(stripeError.message);
      }
    } catch (err) {
      console.error('KI-Checkout-Fehler:', err);
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
      setIsLoading(false);
    }
  }, [packageType, isMonthly, isLoading]);

  return (
    <div className="bg-card rounded-2xl p-8 border border-border space-y-6">
      {/* Cancelled Message */}
      {showCancelledMessage && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.726-1.36 3.491 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Zahlung abgebrochen
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>Sie haben die Zahlung abgebrochen. Sie können Ihre Auswahl hier korrigieren und erneut versuchen.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Paket-Informationen */}
      <div>
        <h3 className="text-2xl font-bold text-foreground mb-2">{packageName}</h3>
        <p className="text-muted-foreground mb-4">{packageDescription}</p>
        
        {features.length > 0 && (
          <ul className="space-y-2 mb-6">
            {features.map((feature, index) => (
              <li key={index} className="flex items-start">
                <svg className="w-5 h-5 text-primary mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-foreground">{feature}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Preis-Auswahl: Monatlich vs. Jährlich */}
      <div className="bg-background rounded-lg p-6 border border-border">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-foreground">Zahlungsintervall</h4>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            type="button"
            onClick={() => setIsMonthly(true)}
            className={`p-4 rounded-lg border-2 transition-all ${
              isMonthly
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-background text-foreground hover:border-primary/50'
            }`}
          >
            <div className="text-2xl font-bold mb-1">Monatlich</div>
            <div className="text-sm font-semibold">{prices.monthly.toFixed(2)} €</div>
            <div className="text-xs text-muted-foreground mt-1">pro Monat</div>
          </button>
          
          <button
            type="button"
            onClick={() => setIsMonthly(false)}
            className={`p-4 rounded-lg border-2 transition-all ${
              !isMonthly
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-background text-foreground hover:border-primary/50'
            }`}
          >
            <div className="text-2xl font-bold mb-1">Jährlich</div>
            <div className="text-sm font-semibold">{prices.yearly.toFixed(2)} €</div>
            <div className="text-xs text-muted-foreground mt-1">
              {(prices.yearly / 12).toFixed(2)} €/Monat
            </div>
            <div className="text-xs text-primary font-semibold mt-1">
              Sie sparen {((prices.monthly * 12) - prices.yearly).toFixed(2)} €
            </div>
          </button>
        </div>
      </div>

      {/* Checkout-Button */}
      <button
        onClick={handleCheckout}
        disabled={isLoading}
        className={`w-full bg-primary text-primary-foreground py-4 px-6 rounded-lg hover:bg-primary/90 transition-colors font-semibold text-lg ${
          isLoading ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        aria-label={`${packageName} ${isMonthly ? 'monatlich' : 'jährlich'} kaufen`}
      >
        {isLoading ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <span>Wird geladen...</span>
          </div>
        ) : (
          <>
            {isMonthly ? 'Monatlich buchen' : 'Jährlich buchen'}
            <span className="ml-2">→</span>
          </>
        )}
      </button>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg" role="alert">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Info-Text */}
      <p className="text-xs text-muted-foreground text-center">
        Sie werden zur sicheren Stripe-Zahlung weitergeleitet. Ihre Daten werden sicher verarbeitet.
      </p>
    </div>
  );
}

