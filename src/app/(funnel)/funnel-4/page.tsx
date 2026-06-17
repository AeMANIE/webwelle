'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import FunnelShell from '@/components/funnel/FunnelShell';
import FunnelContactForm from '@/components/funnel/FunnelContactForm';

function Funnel4Content() {
  const searchParams = useSearchParams();
  const token = searchParams.get('t') || '';

  if (!token) return <p>Session fehlt.</p>;

  return (
    <FunnelShell step={4} token={token}>
      <FunnelContactForm
        token={token}
        title="Ihre Kontaktdaten"
        description="Diese Angaben fragen wir nur einmal ab. Wir nutzen sie später für Ihr Angebot, die Freigabe und die weitere Abstimmung."
        submitLabel="Jetzt Ergebnisse ansehen"
        successPath={`/funnel-5?t=${encodeURIComponent(token)}`}
      />
    </FunnelShell>
  );
}

export default function Funnel4Page() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Laden…</div>}>
      <Funnel4Content />
    </Suspense>
  );
}
