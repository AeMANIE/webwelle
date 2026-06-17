import { DWA_SOLUTION_CATALOG } from '@/lib/funnel/dwa';
import { dwaResumePath } from '@/lib/funnel/funnel-kind';

export interface DwaLeadSummaryProps {
  token?: string;
  status?: string;
  industry_normalized?: string | null;
  industry_raw?: string | null;
  project_brief?: string | null;
  project_notes?: string | null;
  solution_selection?: { selectedIds?: string[] } | null;
  zoom_booking_confirmed?: boolean;
  variant?: 'admin' | 'customer';
}

function solutionLabels(selectedIds: string[]): string[] {
  return selectedIds.map(
    (id) => DWA_SOLUTION_CATALOG.find((s) => s.id === id)?.title || id
  );
}

const STATUS_LABELS: Record<string, string> = {
  new: 'Einstieg – Projektbeschreibung ausstehend',
  research_running: 'Projektanalyse läuft / Kontakt ausstehend',
  contact_complete: 'Kontakt erfasst – Bausteine & Zoom ausstehend',
  consultation_requested: 'Anfrage abgeschlossen',
};

export default function DwaLeadSummary({
  token,
  status = 'new',
  industry_normalized,
  industry_raw,
  project_brief,
  project_notes,
  solution_selection,
  zoom_booking_confirmed,
  variant = 'admin',
}: DwaLeadSummaryProps) {
  const brief = project_brief?.trim() || '';
  const notes = project_notes?.trim() || '';
  const selectedIds = solution_selection?.selectedIds || [];
  const labels = solutionLabels(selectedIds);
  const statusHint = STATUS_LABELS[status] || status;
  const resumeHref = token ? dwaResumePath(status, token) : undefined;

  return (
    <div className="space-y-3">
      {(industry_normalized || industry_raw) && (
        <p className="text-sm text-muted-foreground">
          Branche: {industry_normalized || industry_raw}
        </p>
      )}

      <div className="rounded-lg border border-border bg-background/50 p-3 text-sm">
        <p className="font-medium mb-1">Projektbeschreibung</p>
        {brief ? (
          <p className="text-muted-foreground whitespace-pre-wrap">{brief}</p>
        ) : (
          <p className="text-muted-foreground italic">
            {variant === 'customer'
              ? 'Noch keine Projektbeschreibung gespeichert. Bitte in Schritt 2 ergänzen.'
              : 'Noch nicht ausgefüllt – Kunde hat Schritt 2 (Projektbeschreibung) noch nicht abgeschlossen.'}
          </p>
        )}
        {variant === 'customer' && !brief && resumeHref && (
          <a href={resumeHref} className="mt-2 inline-block text-sm text-primary underline">
            Projekt beschreiben (Schritt 2)
          </a>
        )}
      </div>

      <div className="rounded-lg border border-border bg-background/50 p-3 text-sm">
        <p className="font-medium mb-1">Gewählte Bausteine</p>
        {labels.length > 0 ? (
          <ul className="space-y-1 text-muted-foreground">
            {labels.map((label) => (
              <li key={label}>• {label}</li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground italic">Noch keine Bausteine gewählt.</p>
        )}
      </div>

      {notes ? (
        <div className="rounded-lg border border-border bg-background/50 p-3 text-sm">
          <p className="font-medium mb-1">Zusätzliche Hinweise</p>
          <p className="text-muted-foreground whitespace-pre-wrap">{notes}</p>
        </div>
      ) : null}

      <p className="text-sm text-muted-foreground">
        Zoom-Termin:{' '}
        {zoom_booking_confirmed ? 'vom Kunden bestätigt' : 'noch nicht bestätigt'}
        {variant === 'admin' && (
          <span className="ml-2">· Status: {statusHint}</span>
        )}
      </p>
    </div>
  );
}
