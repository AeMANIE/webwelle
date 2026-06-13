'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { persistLeadToken } from '@/lib/funnel/client';

const STEPS = [2, 3, 4, 5] as const;

export function FunnelStepper({ current }: { current: number }) {
  return (
    <nav className="flex justify-center gap-2 mb-8 flex-wrap" aria-label="Funnel-Fortschritt">
      {STEPS.map((step) => (
        <span
          key={step}
          className={
            `h-2.5 w-10 rounded-full transition-colors ` +
            (step <= current ? 'bg-primary' : 'bg-muted')
          }
        />
      ))}
    </nav>
  );
}

export default function FunnelShell({
  step,
  children,
  token,
}: {
  step: number;
  children: React.ReactNode;
  token: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (token) persistLeadToken(token);
  }, [token]);

  useEffect(() => {
    if (!ref.current) return;
    gsap.fromTo(
      ref.current,
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }
    );
  }, [step]);

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 text-foreground">
      <p className="text-center text-sm text-muted-foreground mb-3">
        Schritt {step} von 5
      </p>
      <FunnelStepper current={step} />
      <div ref={ref}>{children}</div>
    </main>
  );
}

export function useFunnelToken(): string | null {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get('t');
}
