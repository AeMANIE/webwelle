'use client';

import { useState, useCallback } from 'react';
import { createCheckoutSession, loadStripeOnDemand } from '@/lib/stripe';

interface StripeCheckoutProps {
  packageType: 'starterwelle' | 'businesswelle' | 'erfolgswelle' | 'flowwelle' | 'powerwelle' | 'meisterwelle';
  isMonthly: boolean;
  customerEmail: string;
  customerName: string;
  formData: Record<string, unknown>;
  children: React.ReactNode;
  className?: string;
}

export default function StripeCheckout({
  packageType,
  isMonthly,
  customerEmail,
  customerName,
  formData,
  children,
  className = ''
}: StripeCheckoutProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = useCallback(async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    setError(null);

    try {
      // Session erstellen
      const sessionId = await createCheckoutSession(
        packageType,
        isMonthly,
        customerEmail,
        customerName,
        formData
      );
      
      // Stripe erst JETZT laden
      const stripe = await loadStripeOnDemand();
      
      if (!stripe) {
        throw new Error('Stripe konnte nicht geladen werden');
      }

      // Zu Stripe Checkout weiterleiten
      const { error } = await (stripe as { redirectToCheckout: (params: { sessionId: string }) => Promise<{ error?: { message: string } }> }).redirectToCheckout({
        sessionId,
      });

      if (error) {
        throw new Error(error.message);
      }
    } catch (err) {
      console.error('Checkout-Fehler:', err);
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
    } finally {
      setIsLoading(false);
    }
  }, [packageType, isMonthly, customerEmail, customerName, formData, isLoading]);

  return (
    <button
      onClick={handleCheckout}
      disabled={isLoading}
      className={`${className} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
      aria-label={`${packageType} ${isMonthly ? 'monatlich' : 'jährlich'} kaufen`}
    >
      {isLoading ? (
        <div className="flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span>Wird geladen...</span>
        </div>
      ) : (
        children
      )}
      {error && (
        <div className="mt-2 text-sm text-red-500" role="alert">
          {error}
        </div>
      )}
    </button>
  );
}
