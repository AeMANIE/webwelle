'use client';

import { lazy, Suspense } from 'react';

// Lazy load Stripe nur wenn benötigt
const StripeCheckout = lazy(() => import('./StripeCheckout'));

interface LazyStripeProps {
  packageType: 'starterwelle' | 'businesswelle' | 'erfolgswelle';
  isMonthly: boolean;
  customerEmail: string;
  customerName: string;
  formData: Record<string, unknown>;
  children: React.ReactNode;
  className?: string;
}

export default function LazyStripe(props: LazyStripeProps) {
  return (
    <Suspense fallback={
      <div className={`${props.className} opacity-50 cursor-not-allowed`}>
        <div className="flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span>Lade Zahlungssystem...</span>
        </div>
      </div>
    }>
      <StripeCheckout {...props} />
    </Suspense>
  );
}
