'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import LiveAnalysisDashboard from '@/components/funnel/LiveAnalysisDashboard';
import { isFunnelResearchComplete } from '@/lib/funnel/research';

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

  const researchComplete = useMemo(
    () => isFunnelResearchComplete(research),
    [research]
  );

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (researchComplete) return;

    let polls = 0;
    const maxPolls = 60;

    const id = setInterval(() => {
      if (polls >= maxPolls) {
        clearInterval(id);
        return;
      }
      load();
      polls += 1;
    }, 5000);

    return () => clearInterval(id);
  }, [load, researchComplete]);

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
