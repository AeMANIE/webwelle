'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import FunnelShell from '@/components/funnel/FunnelShell';
import { ShinyButton } from '@/components/ui/shiny-button';
import { SolutionSelectionCard } from '@/components/funnel/SolutionSelectionCard';
import { useDwaLeadGuard } from '@/components/funnel/useFunnelLeadGuard';
import {
  DWA_SOLUTION_CATALOG,
  defaultSelectedSolutionIds,
  normalizeDwaSolutions,
} from '@/lib/funnel/dwa';
import { ZOOM_SCHEDULER_URL } from '@/lib/payment-success-content';
import { CUSTOMER_FREE_TEXT_LIMITS } from '@/lib/funnel/input-limits';
import type { DwaSolutionItem } from '@/lib/funnel/types';

function FunnelDw4Content() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('t') || '';

  const [lead, setLead] = useState<Record<string, unknown> | null>(null);
  const [leadLoaded, setLeadLoaded] = useState(false);
  const [research, setResearch] = useState<
    Array<{ workflow_key: string; status: string; payload: Record<string, unknown> | null }>
  >([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [initializedSelection, setInitializedSelection] = useState(false);
  const [projectNotes, setProjectNotes] = useState('');
  const [zoomConfirmed, setZoomConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pollCount, setPollCount] = useState(0);

  const load = useCallback(() => {
    if (!token) return;
    fetch(`/api/funnel/leads/${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.lead) {
          setLead(data.lead);
          if (data.lead.project_notes) setProjectNotes(String(data.lead.project_notes));
          if (data.lead.zoom_booking_confirmed) setZoomConfirmed(true);
        }
        if (data.research) setResearch(data.research);
      })
      .finally(() => setLeadLoaded(true));
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  useDwaLeadGuard(token, lead, leadLoaded);

  const projectResearch = research.find((r) => r.workflow_key === 'project_solutions');
  const researchDone = projectResearch?.status === 'done';

  useEffect(() => {
    if (!token || researchDone) return;
    if (pollCount > 40) return;
    const t = setTimeout(() => {
      load();
      setPollCount((c) => c + 1);
    }, 3000);
    return () => clearTimeout(t);
  }, [token, researchDone, pollCount, load]);

  const solutions: DwaSolutionItem[] = useMemo(() => {
    const fromN8n = normalizeDwaSolutions(projectResearch?.payload);
    return fromN8n.length > 0 ? fromN8n : DWA_SOLUTION_CATALOG;
  }, [projectResearch?.payload]);

  useEffect(() => {
    if (initializedSelection || solutions.length === 0) return;
    const stored = lead?.solution_selection as { selectedIds?: string[] } | undefined;
    if (stored?.selectedIds?.length) {
      setSelectedIds(stored.selectedIds);
    } else if (projectResearch?.payload) {
      setSelectedIds(defaultSelectedSolutionIds(solutions));
    }
    setInitializedSelection(true);
  }, [initializedSelection, solutions, lead, projectResearch?.payload]);

  function toggleSolution(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function persistSelection(ids: string[]) {
    await fetch(`/api/funnel/leads/${token}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ intent: 'solution-selection', selectedIds: ids }),
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!zoomConfirmed) {
      setError('Bitte buchen Sie einen Zoom-Termin und bestätigen Sie die Buchung.');
      return;
    }
    if (selectedIds.length === 0) {
      setError('Bitte wählen Sie mindestens einen passenden Baustein aus.');
      return;
    }

    setLoading(true);
    setError(null);
    const res = await fetch(`/api/funnel/leads/${token}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        intent: 'dw-submit',
        selectedIds,
        projectNotes: projectNotes.trim(),
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

  const notesLimit = CUSTOMER_FREE_TEXT_LIMITS.project_notes;
  const notesLength = projectNotes.trim().length;

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

  const fieldClass =
    'w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:outline-none min-h-[100px] resize-y';

  return (
    <FunnelShell step={4} token={token} totalSteps={4}>
      <form
        onSubmit={submit}
        className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-xl space-y-8"
      >
        <section className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              Passende Bausteine auswählen & Gesprächstermin sichern
            </h1>
            <p className="text-muted-foreground text-sm">
              Auf Basis Ihrer Angaben haben wir einige Bausteine vorausgewählt, die gut zu Ihrem
              Vorhaben passen. Passen Sie die Auswahl gern an.
            </p>
          </div>

          {!researchDone && (
            <p className="text-xs text-muted-foreground animate-pulse">
              Projektanalyse läuft – Sie können die Vorschläge bereits anpassen.
            </p>
          )}

          <div className="space-y-3">
            {solutions.map((solution) => (
              <SolutionSelectionCard
                key={solution.id}
                title={solution.title}
                description={solution.description}
                recommended={solution.recommended}
                selected={selectedIds.includes(solution.id)}
                onToggle={() => {
                  const next = selectedIds.includes(solution.id)
                    ? selectedIds.filter((id) => id !== solution.id)
                    : [...selectedIds, solution.id];
                  setSelectedIds(next);
                  void persistSelection(next);
                }}
              />
            ))}
          </div>
        </section>

        <section>
          <label className="text-sm font-medium" htmlFor="project-notes">
            Gibt es noch etwas, das wir unbedingt wissen sollten?
          </label>
          <textarea
            id="project-notes"
            maxLength={notesLimit.max}
            className={`${fieldClass} mt-1`}
            value={projectNotes}
            onChange={(e) => setProjectNotes(e.target.value)}
            placeholder="Z. B. interne Deadlines, besondere Anforderungen, bestehende Systeme …"
          />
          <p className="text-xs text-muted-foreground mt-2">
            {notesLength.toLocaleString('de-DE')} / {notesLimit.max.toLocaleString('de-DE')} Zeichen
          </p>
        </section>

        <section className="space-y-4 pt-4 border-t border-border">
          <div>
            <h2 className="text-lg font-semibold mb-1">Direkt einen Zoom-Termin wählen</h2>
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
            <span className="text-sm text-foreground">
              Ich habe einen Zoom-Termin gebucht
            </span>
          </label>
        </section>

        {error && <p className="text-amber-400 text-sm">{error}</p>}

        <ShinyButton type="submit" disabled={loading} className="w-full">
          {loading ? 'Einen Moment…' : 'Projekt senden & Zoom-Termin bestätigen'}
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
