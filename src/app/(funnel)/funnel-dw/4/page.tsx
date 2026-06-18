'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import FunnelShell from '@/components/funnel/FunnelShell';
import { ShinyButton } from '@/components/ui/shiny-button';
import { useDwaLeadGuard } from '@/components/funnel/useFunnelLeadGuard';
import { ZOOM_SCHEDULER_URL } from '@/lib/payment-success-content';

function FunnelDw4Content() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('t') || '';

  const [lead, setLead] = useState<Record<string, unknown> | null>(null);
  const [leadLoaded, setLeadLoaded] = useState(false);
  const [zoomConfirmed, setZoomConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/funnel/leads/${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.lead) {
          setLead(data.lead);
          if (data.lead.zoom_booking_confirmed) setZoomConfirmed(true);
        }
      })
      .finally(() => setLeadLoaded(true));
  }, [token]);

  useDwaLeadGuard(token, lead, leadLoaded);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!zoomConfirmed) {
      setError('Bitte buchen Sie einen Zoom-Termin und bestätigen Sie die Buchung.');
      return;
    }

    setLoading(true);
    setError(null);
    const res = await fetch(`/api/funnel/leads/${token}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        intent: 'dw-submit',
        zoomBookingConfirmed: true,
      }),
    });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.message || 'Senden fehlgeschlagen');
      return;
    }

    router.push(`/leistungen?submitted=dwa&t=${encodeURIComponent(token)}`);
  }

  if (!token) {
    return (
      <p className="text-center">
        Session fehlt. <a href="/leistungen">Zur Leistungsseite</a>
      </p>
    );
  }

  if (lead?.status === 'consultation_requested') {
    return (
      <FunnelShell step={4} token={token} totalSteps={4}>
        <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-xl text-center space-y-4">
          <h1 className="text-2xl font-bold">Vielen Dank!</h1>
          <p className="text-muted-foreground text-sm">
            Ihre Projektanfrage und Ihr Zoom-Termin wurden übermittelt. Wir melden uns mit der
            Ersteinschätzung.
          </p>
          <a href="/customer?tab=analysis" className="text-primary underline text-sm">
            Zum Kundenportal
          </a>
        </div>
      </FunnelShell>
    );
  }

  return (
    <FunnelShell step={4} token={token} totalSteps={4}>
      <form
        onSubmit={submit}
        className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-xl space-y-6"
      >
        <section className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold mb-2">Termin wählen</h1>
            <p className="text-muted-foreground text-sm">
              Wählen Sie einen passenden Termin für ein gemeinsames Zoom-Gespräch. In 30 Minuten
              klären wir, wie Ihre digitale Wachstumsarchitektur konkret aussehen kann.
            </p>
          </div>

          <a
            href={ZOOM_SCHEDULER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-full rounded-lg border border-primary px-4 py-3 text-sm font-semibold text-primary hover:bg-primary/10 transition-colors"
          >
            Zoom-Termin buchen (öffnet in neuem Tab)
          </a>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={zoomConfirmed}
              onChange={(e) => {
                setError(null);
                setZoomConfirmed(e.target.checked);
              }}
              className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            <span className="text-sm text-foreground">Ich habe einen Zoom-Termin gebucht</span>
          </label>
        </section>

        {error && <p className="text-amber-400 text-sm">{error}</p>}

        <ShinyButton type="submit" disabled={loading} className="w-full">
          {loading ? 'Einen Moment…' : 'Termin bestätigen'}
        </ShinyButton>
      </form>
    </FunnelShell>
  );
}

export default function FunnelDw4Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-muted-foreground">
          Laden…
        </div>
      }
    >
      <FunnelDw4Content />
    </Suspense>
  );
}
