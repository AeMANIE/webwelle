'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import FunnelShell from '@/components/funnel/FunnelShell';
import LiveAnalysisDashboard from '@/components/funnel/LiveAnalysisDashboard';
import { ShinyButton } from '@/components/ui/shiny-button';

function Funnel5Content() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('t') || '';

  const [lead, setLead] = useState<Record<string, unknown> | null>(null);
  const [research, setResearch] = useState<
    Array<{
      workflow_key: string;
      status: string;
      payload: Record<string, unknown> | null;
      updated_at: string;
    }>
  >([]);
  const [pollCount, setPollCount] = useState(0);

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
    if (!token || pollCount > 60) return;
    const id = setInterval(() => {
      load();
      setPollCount((c) => c + 1);
    }, 2000);
    return () => clearInterval(id);
  }, [token, load, pollCount]);

  if (!token) return <p>Session fehlt.</p>;

  return (
    <FunnelShell step={5} token={token}>
      <LiveAnalysisDashboard
        lead={lead || {}}
        research={research}
        token={token}
        onRefresh={load}
      />
      <div className="mt-8 flex justify-end">
        <ShinyButton
          type="button"
          onClick={() => router.push(`/funnel-6?t=${encodeURIComponent(token)}`)}
        >
          Weiter zur Paketauswahl
        </ShinyButton>
      </div>
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
