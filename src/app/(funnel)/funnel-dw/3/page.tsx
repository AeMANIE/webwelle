'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import FunnelShell from '@/components/funnel/FunnelShell';
import FunnelContactForm from '@/components/funnel/FunnelContactForm';
import { useDwaLeadGuard } from '@/components/funnel/useFunnelLeadGuard';

function FunnelDw3Content() {
  const searchParams = useSearchParams();
  const token = searchParams.get('t') || '';
  const [lead, setLead] = useState<{ funnel_kind?: string } | null>(null);
  const [leadLoaded, setLeadLoaded] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/funnel/leads/${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.lead) setLead(data.lead);
      })
      .finally(() => setLeadLoaded(true));
  }, [token]);

  useDwaLeadGuard(token, lead, leadLoaded);

  if (!token) {
    return (
      <p className="text-center">
        Session fehlt. <a href="/leistungen">Zur Leistungsseite</a>
      </p>
    );
  }

  return (
    <FunnelShell step={3} token={token} totalSteps={4}>
      <FunnelContactForm
        token={token}
        title="Wohin dürfen wir Ihre Ersteinschätzung schicken?"
        description="Mit Ihren Kontaktdaten können wir Ihr Projekt zuordnen und Ihnen eine fundierte Ersteinschätzung zurückgeben."
        submitLabel="Analyse-Ergebnis & Termin wählen"
        footerNote="Ihre Angaben verwenden wir ausschließlich zur Einschätzung und Vorbereitung eines möglichen Erstgesprächs."
        successPath={`/funnel-dw/4?t=${encodeURIComponent(token)}`}
        showMarketPicker
      />
    </FunnelShell>
  );
}

export default function FunnelDw3Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-muted-foreground">
          Laden…
        </div>
      }
    >
      <FunnelDw3Content />
    </Suspense>
  );
}
