'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import LiveAnalysisDashboard from '@/components/funnel/LiveAnalysisDashboard';

function AnalyseContent() {
  const params = useParams();
  const token = params.token as string;
  const [lead, setLead] = useState<Record<string, unknown> | null>(null);
  const [research, setResearch] = useState<
    Array<{
      workflow_key: string;
      status: string;
      payload: Record<string, unknown> | null;
      updated_at: string;
    }>
  >([]);

  const load = useCallback(() => {
    fetch(`/api/funnel/leads/${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.lead) setLead(data.lead);
        if (data.research) setResearch(data.research);
      });
  }, [token]);

  useEffect(() => {
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, [load]);

  return (
    <div className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <LiveAnalysisDashboard lead={lead || {}} research={research} token={token} onRefresh={load} />
      </div>
    </div>
  );
}

export default function AnalysePage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Laden…</div>}>
      <AnalyseContent />
    </Suspense>
  );
}
