'use client';

import { useState, useCallback, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { createAIVoiceCheckoutSession, loadStripeOnDemand } from '@/lib/stripe';
interface AIVoiceCheckoutProps {
  packageType: 'minijob' | 'midijob' | 'festangestellt' | 'einrichtungspaket';
  packageName: string;
  packageDescription?: string;
  price: number;
  minutes?: number; // Nur für Hauptpakete
  isOneTime?: boolean; // true für Einrichtungspaket
  showEinrichtungspaket?: boolean; // Zeigt Checkbox für Einrichtungspaket bei Hauptpaketen
}

function AIVoiceCheckoutContent({
  packageType,
  packageName,
  price,
  isOneTime = false,
  showEinrichtungspaket = false
}: AIVoiceCheckoutProps) {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCancelledMessage, setShowCancelledMessage] = useState(false);
  const [addEinrichtungspaket, setAddEinrichtungspaket] = useState(false);

  // Prüfe ob der Benutzer von Stripe zurückkommt (cancelled)
  useEffect(() => {
    const cancelledParam = searchParams?.get('cancelled');
    if (cancelledParam === 'true') {
      setShowCancelledMessage(true);
      setTimeout(() => setShowCancelledMessage(false), 5000);
      
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.delete('cancelled');
        window.history.replaceState({}, '', url.toString());
      }
    }
  }, [searchParams]);

  const handleCheckout = useCallback(async () => {
    if (isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const sessionId = await createAIVoiceCheckoutSession(
        packageType,
        undefined, // customerEmail (wird im Stripe Checkout abgefragt)
        undefined, // customerName (wird im Stripe Checkout abgefragt)
        showEinrichtungspaket && !isOneTime ? addEinrichtungspaket : undefined
      );

      const stripe = await loadStripeOnDemand();

      if (!stripe) {
        throw new Error('Stripe konnte nicht geladen werden');
      }

      const { error: stripeError } = await (stripe as { redirectToCheckout: (params: { sessionId: string }) => Promise<{ error?: { message: string } }> }).redirectToCheckout({
        sessionId,
      });

      if (stripeError) {
        throw new Error(stripeError.message);
      }
    } catch (err) {
      console.error('AI-Voice Checkout-Fehler:', err);
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
      setIsLoading(false);
    }
  }, [packageType, isLoading, addEinrichtungspaket, showEinrichtungspaket, isOneTime]);

  return (
    <div className="space-y-4">
      {/* Cancelled Message */}
      {showCancelledMessage && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.726-1.36 3.491 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Zahlung abgebrochen</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>Sie haben die Zahlung abgebrochen. Sie können Ihre Auswahl hier korrigieren und erneut versuchen.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Einrichtungspaket Checkbox (nur bei Hauptpaketen) */}
      {showEinrichtungspaket && !isOneTime && (
        <div className="bg-background border border-border rounded-lg p-4 mb-4">
          <label className="flex items-start cursor-pointer">
            <input
              type="checkbox"
              checked={addEinrichtungspaket}
              onChange={(e) => setAddEinrichtungspaket(e.target.checked)}
              className="mt-1 mr-3 text-primary focus:ring-primary"
            />
            <div>
              <div className="font-semibold text-foreground">Einrichtungspaket hinzufügen</div>
              <div className="text-sm text-muted-foreground">
                Professionelle Einrichtung und Konfiguration (+ 1.499 € einmalig)
              </div>
            </div>
          </label>
        </div>
      )}

      {/* Checkout Button */}
      <button
        onClick={handleCheckout}
        disabled={isLoading}
        className={`w-full bg-primary text-primary-foreground py-3 px-6 rounded-lg hover:bg-primary/90 transition-colors font-semibold ${
          isLoading ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        aria-label={`${packageName} ${isOneTime ? 'buchen' : 'monatlich buchen'}`}
      >
        {isLoading ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <span>Wird geladen...</span>
          </div>
        ) : (
          <>
            {isOneTime ? (
              <>Jetzt buchen ({price} € einmalig) →</>
            ) : (
              <>Jetzt monatlich buchen ({price} €/Monat) →</>
            )}
          </>
        )}
      </button>

      {error && (
        <div className="mt-2 text-sm text-red-500 text-center" role="alert">
          {error}
        </div>
      )}

      {/* Info Text */}
      <p className="text-xs text-muted-foreground text-center">
        Sie werden zur sicheren Stripe-Zahlung weitergeleitet. Ihre Daten werden sicher verarbeitet.
      </p>
    </div>
  );
}

export default function AIVoiceCheckout(props: AIVoiceCheckoutProps) {
  return (
    <Suspense fallback={<div className="text-center py-4">Lade Checkout...</div>}>
      <AIVoiceCheckoutContent {...props} />
    </Suspense>
  );
}

