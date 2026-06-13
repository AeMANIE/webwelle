'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import FunnelShell from '@/components/funnel/FunnelShell';
import LiveAnalysisDashboard from '@/components/funnel/LiveAnalysisDashboard';
import { isFunnelResearchComplete } from '@/lib/funnel/research';
import { loadStripeOnDemand } from '@/lib/stripe';

function Funnel5Content() {
  const searchParams = useSearchParams();
  const token = searchParams.get('t') || '';
  const staffAdminPreview = searchParams.get('view') === 'admin';

  const [lead, setLead] = useState<Record<string, unknown> | null>(null);
  const [research, setResearch] = useState<
    Array<{
      workflow_key: string;
      status: string;
      payload: Record<string, unknown> | null;
      updated_at: string;
    }>
  >([]);
  const researchComplete = useMemo(
    () => isFunnelResearchComplete(research),
    [research]
  );

  const [pollCount, setPollCount] = useState(0);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!token) return;
    fetch(`/api/funnel/leads/${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.lead) setLead(data.lead);
        if (data.research) setResearch(data.research);
      });
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!token || researchComplete) return;

    let polls = 0;
    const maxPolls = 60;

    const id = setInterval(() => {
      if (polls >= maxPolls) {
        clearInterval(id);
        return;
      }
      load();
      polls += 1;
      setPollCount(polls);
    }, 2000);

    return () => clearInterval(id);
  }, [token, load, researchComplete]);

  const startCheckout = useCallback(async () => {
    if (!token || checkoutLoading) return;

    setCheckoutLoading(true);
    setCheckoutError(null);

    try {
      const res = await fetch('/api/funnel/checkout/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Checkout konnte nicht gestartet werden.');
      }

      if (data.url) {
        window.location.href = data.url;
        return;
      }

      if (data.sessionId) {
        const stripe = await loadStripeOnDemand();
        if (!stripe) {
          throw new Error('Stripe konnte nicht geladen werden.');
        }

        const { error } = await (
          stripe as {
            redirectToCheckout: (params: { sessionId: string }) => Promise<{ error?: { message: string } }>;
          }
        ).redirectToCheckout({ sessionId: data.sessionId });

        if (error) {
          throw new Error(error.message);
        }
        return;
      }

      throw new Error('Keine Checkout-Session erhalten.');
    } catch (error) {
      setCheckoutError(
        error instanceof Error ? error.message : 'Checkout konnte nicht gestartet werden.'
      );
      setCheckoutLoading(false);
    }
  }, [token, checkoutLoading]);

  if (!token) return <p>Session fehlt.</p>;

  return (
    <FunnelShell step={5} token={token}>
      <LiveAnalysisDashboard
        lead={lead || {}}
        research={research}
        token={token}
        onRefresh={load}
        pollCount={pollCount}
        maxPolls={60}
        viewMode={staffAdminPreview ? 'auto' : 'customer'}
        showContinueCta={!staffAdminPreview}
        onContinue={startCheckout}
        continueLoading={checkoutLoading}
        continueError={checkoutError}
        continueLabel="Jetzt bezahlen"
      />
    </FunnelShell>
  );
}

export default function Funnel5Page() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Laden…</div>}>
      <Funnel5Content />
    </Suspense>
  );
}
