'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import FunnelShell from '@/components/funnel/FunnelShell';
import { ShinyButton } from '@/components/ui/shiny-button';
import { useDwaLeadGuard } from '@/components/funnel/useFunnelLeadGuard';
import { PROJECT_BRIEF_MIN_LENGTH } from '@/lib/funnel/dwa';

function FunnelDw2Content() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('t') || '';
  const [brief, setBrief] = useState('');
  const [lead, setLead] = useState<{ funnel_kind?: string; project_brief?: string } | null>(null);
  const [leadLoaded, setLeadLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/funnel/leads/${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.lead) {
          setLead(data.lead);
          if (data.lead.project_brief) setBrief(String(data.lead.project_brief));
        }
      })
      .finally(() => setLeadLoaded(true));
  }, [token]);

  useDwaLeadGuard(token, lead, leadLoaded);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = brief.trim();
    if (trimmed.length < PROJECT_BRIEF_MIN_LENGTH) {
      setError(
        `Bitte beschreiben Sie Ihr Projekt etwas ausführlicher (mindestens ${PROJECT_BRIEF_MIN_LENGTH} Zeichen).`
      );
      return;
    }

    setLoading(true);
    setError(null);
    const res = await fetch(`/api/funnel/leads/${token}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ intent: 'project-brief', projectBrief: trimmed }),
    });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.message || 'Speichern fehlgeschlagen');
      return;
    }

    router.push(`/funnel-dw/3?t=${encodeURIComponent(token)}`);
  }

  if (!token) {
    return (
      <p className="text-center">
        Session fehlt. <a href="/leistungen">Zur Leistungsseite</a>
      </p>
    );
  }

  const fieldClass =
    'w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:outline-none min-h-[160px] resize-y';

  return (
    <FunnelShell step={2} token={token} totalSteps={4}>
      <form
        onSubmit={submit}
        className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-xl space-y-6"
      >
        <section>
          <h1 className="text-2xl font-bold mb-2">Womit sollen wir Ihnen konkret helfen?</h1>
          <p className="text-muted-foreground text-sm mb-4">
            Beschreiben Sie kurz, welche digitale Struktur Sie aufbauen möchten – gern in Ihren
            eigenen Worten.
          </p>

          <label className="text-sm font-medium" htmlFor="project-brief">
            Projekt & aktuelle Situation
          </label>
          <textarea
            id="project-brief"
            required
            className={`${fieldClass} mt-1`}
            value={brief}
            onChange={(e) => {
              setError(null);
              setBrief(e.target.value);
            }}
            placeholder="Zum Beispiel: bestehende Website wirkt veraltet, Anfragen kommen zufällig, viel manuelle Abstimmung per E-Mail, neues Kundenportal geplant …"
          />
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
            Hilfreich ist, wenn Sie erwähnen, wo heute fehlende Klarheit, Medienbrüche oder
            manuelle Abläufe Wachstum und Effizienz begrenzen.
          </p>
        </section>

        {error && <p className="text-amber-400 text-sm">{error}</p>}

        <ShinyButton type="submit" disabled={loading} className="w-full">
          {loading ? 'Einen Moment…' : 'Projekt analysieren'}
        </ShinyButton>
      </form>
    </FunnelShell>
  );
}

export default function FunnelDw2Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-muted-foreground">
          Laden…
        </div>
      }
    >
      <FunnelDw2Content />
    </Suspense>
  );
}
