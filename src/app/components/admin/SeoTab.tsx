'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { DashboardPanel } from '../dashboard/DashboardPanel';
import { adminFetch } from '@/lib/admin-fetch';
import {
  parseBlogJobKeywordData,
  type PipelineKeywordRecord,
} from '@/lib/blog-pipeline-keyword-data';

interface BlogJobRow {
  id: number;
  leadToken: string | null;
  sourceType: string;
  status: string;
  articleCount: number;
  completedCount: number;
  failedCount: number;
  companyName: string | null;
  industry: string | null;
  createdAt: string;
  keywordData: Record<string, unknown> | null;
}

const STATUS_LABELS: Record<string, string> = {
  queued: 'Warteschlange',
  running: 'Läuft',
  pipeline_finished: 'Pipeline fertig',
  awaiting_article_review: 'Review ausstehend',
  ready_for_delivery: 'Bereit zur Auslieferung',
  completed: 'Ausgeliefert',
  failed: 'Fehlgeschlagen',
  cancelled: 'Abgebrochen',
  partial: 'Teilweise',
};

function statusBadgeClass(status: string): string {
  switch (status) {
    case 'completed':
    case 'ready_for_delivery':
      return 'bg-green-500/15 text-green-600';
    case 'running':
    case 'queued':
    case 'pipeline_finished':
    case 'awaiting_article_review':
      return 'bg-yellow-500/15 text-yellow-700';
    case 'failed':
      return 'bg-red-500/15 text-red-600';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

const SEO01_COLUMN_HELP: Array<{ label: string; hint: string }> = [
  {
    label: 'Volume',
    hint: 'Geschätzte monatliche Suchanfragen in Deutschland (DataForSEO Labs).',
  },
  {
    label: 'Difficulty',
    hint: 'Keyword-Schwierigkeit von 0–100 – niedriger bedeutet leichter zu ranken.',
  },
  {
    label: 'Intent',
    hint: 'Suchintention: informational, commercial oder transactional – Blog-Fokus auf informational/commercial.',
  },
  {
    label: 'CPC',
    hint: 'Durchschnittlicher Klickpreis in EUR (Google Ads) – Hinweis auf kommerziellen Wert.',
  },
];

const SEO02_COLUMN_HELP: Array<{ label: string; hint: string }> = [
  {
    label: 'Volume',
    hint: 'Geschätzte monatliche Suchanfragen am gewählten SERP-Standort.',
  },
  {
    label: 'Difficulty',
    hint: 'Keyword-Schwierigkeit von 0–100 – niedriger bedeutet leichter zu ranken.',
  },
  {
    label: 'Score',
    hint: 'Interner Qualitätswert aus Volume, KD, lokaler Lücke und Branchenrelevanz.',
  },
  {
    label: 'Lokal',
    hint: 'Anzahl lokaler .de-Wettbewerber in den Top-10 – weniger = oft bessere Chance.',
  },
  {
    label: 'Ø Wörter',
    hint: 'Durchschnittliche Wortanzahl der Top-3-Rankingseiten (Content-Tiefe der Konkurrenz).',
  },
  {
    label: 'Ø H2',
    hint: 'Durchschnittliche Anzahl H2-Überschriften in den Top-3-Seiten (Struktur der Konkurrenz).',
  },
  {
    label: 'Cluster',
    hint: 'H2-Themen der Konkurrenz als Vorschlag für verwandte Unterthemen im Artikel.',
  },
];

const COLUMN_HELP_LOOKUP: Record<string, string> = Object.fromEntries(
  [...SEO01_COLUMN_HELP, ...SEO02_COLUMN_HELP].map((item) => [item.label, item.hint])
);

function ColumnLegend({ items }: { items: Array<{ label: string; hint: string }> }) {
  return (
    <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
      <p className="mb-1.5 font-medium text-foreground/80">Spaltenhilfe</p>
      <dl className="grid gap-x-4 gap-y-1.5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(({ label, hint }) => (
          <div key={label}>
            <dt className="inline font-medium text-foreground/90">{label}:</dt>{' '}
            <dd className="inline">{hint}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function ColumnHeader({ label }: { label: string }) {
  const hint = COLUMN_HELP_LOOKUP[label];
  return (
    <th className="p-2" title={hint}>
      <span className={hint ? 'cursor-help border-b border-dotted border-muted-foreground/50' : undefined}>
        {label}
      </span>
    </th>
  );
}

function KeywordTable({
  rows,
  emptyText,
  variant = 'basic',
}: {
  rows: PipelineKeywordRecord[];
  emptyText: string;
  variant?: 'basic' | 'approved' | 'skipped';
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyText}</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left">
          <tr>
            <th className="p-2">Keyword</th>
            <ColumnHeader label="Volume" />
            <ColumnHeader label="Difficulty" />
            {variant === 'basic' && (
              <>
                <ColumnHeader label="Intent" />
                <ColumnHeader label="CPC" />
              </>
            )}
            {variant === 'approved' && (
              <>
                <ColumnHeader label="Score" />
                <ColumnHeader label="Lokal" />
                <ColumnHeader label="Ø Wörter" />
                <ColumnHeader label="Ø H2" />
                <ColumnHeader label="Cluster" />
              </>
            )}
            {variant === 'skipped' && <th className="p-2">Grund</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${row.keyword}-${index}`} className="border-t border-border">
              <td className="p-2 font-medium">{row.keyword}</td>
              <td className="p-2 text-muted-foreground">{row.volume ?? '—'}</td>
              <td className="p-2 text-muted-foreground">{row.difficulty ?? '—'}</td>
              {variant === 'basic' && (
                <>
                  <td className="p-2 text-muted-foreground">{row.intent ?? '—'}</td>
                  <td className="p-2 text-muted-foreground">
                    {row.cpc != null ? row.cpc.toFixed(2) : '—'}
                  </td>
                </>
              )}
              {variant === 'approved' && (
                <>
                  <td className="p-2 text-muted-foreground">{row.score ?? '—'}</td>
                  <td className="p-2 text-muted-foreground">{row.localCompetitors ?? '—'}</td>
                  <td className="p-2 text-muted-foreground">{row.avgWordCount ?? '—'}</td>
                  <td className="p-2 text-muted-foreground">{row.avgH2Count ?? '—'}</td>
                  <td className="p-2 text-muted-foreground max-w-[200px] truncate" title={row.keywordCluster}>
                    {row.keywordCluster ?? '—'}
                  </td>
                </>
              )}
              {variant === 'skipped' && (
                <td className="p-2 text-muted-foreground">
                  {row.error || row.status || 'skip'}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SeoResearchForm({ onStarted }: { onStarted?: () => void }) {
  const [branche, setBranche] = useState('');
  const [plz, setPlz] = useState('');
  const [website, setWebsite] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setIsError(false);

    try {
      const res = await adminFetch('/api/admin/blog/start-seo-research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branche: branche.trim(),
          plz: plz.trim(),
          ...(website.trim() ? { website: website.trim() } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok || data.n8nDispatched !== true) {
        setMessage(String(data.message || data.error || 'Start fehlgeschlagen'));
        setIsError(true);
        return;
      }
      setMessage(String(data.message || `Job #${data.jobId} gestartet.`));
      setBranche('');
      setPlz('');
      setWebsite('');
      onStarted?.();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Netzwerkfehler');
      setIsError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardPanel title="Neue Keyword-Research">
      <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Branche</label>
          <input
            value={branche}
            onChange={(e) => setBranche(e.target.value)}
            required
            minLength={2}
            placeholder="z. B. Sanitär"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">PLZ</label>
          <input
            value={plz}
            onChange={(e) => setPlz(e.target.value.replace(/\D/g, '').slice(0, 5))}
            required
            pattern="\d{4,5}"
            placeholder="87435"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium">Website (optional)</label>
          <input
            type="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://ihre-website.de"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-foreground disabled:opacity-50"
          >
            {loading ? 'Wird gestartet…' : 'Research starten'}
          </button>
          {message && (
            <p className={`text-sm ${isError ? 'text-destructive' : 'text-green-700 dark:text-green-400'}`}>
              {message}
            </p>
          )}
        </div>
      </form>
    </DashboardPanel>
  );
}

function SeoJobDetail({
  jobId,
  onBack,
}: {
  jobId: number;
  onBack: () => void;
}) {
  const [job, setJob] = useState<BlogJobRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [retryingSeo02, setRetryingSeo02] = useState(false);
  const [retryMessage, setRetryMessage] = useState<string | null>(null);

  const load = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent === true;
    if (!silent) setLoading(true);
    try {
      const res = await adminFetch(`/api/admin/blog/jobs/${jobId}`);
      if (res.status === 401) return;
      const data = await res.json();
      if (data.job) {
        setJob({
          id: data.job.id,
          leadToken: data.job.leadToken,
          sourceType: data.job.sourceType || 'client',
          status: data.job.status,
          articleCount: data.job.articleCount,
          completedCount: data.job.completedCount,
          failedCount: data.job.failedCount,
          companyName: null,
          industry: null,
          createdAt: data.job.createdAt,
          keywordData: (data.keywordData ?? data.job.keywordData) as Record<string, unknown> | null,
        });
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!job || !['queued', 'running'].includes(job.status)) return;
    const timer = window.setInterval(() => {
      void load({ silent: true });
    }, 5000);
    return () => window.clearInterval(timer);
  }, [job, load]);

  const parsed = useMemo(
    () => parseBlogJobKeywordData(job?.keywordData),
    [job?.keywordData]
  );

  if (loading) {
    return <p className="py-8 text-center text-muted-foreground">Lade SEO-Daten…</p>;
  }

  if (!job) {
    return (
      <div>
        <button type="button" onClick={onBack} className="mb-4 text-sm text-muted-foreground">
          ← Zurück
        </button>
        <p>Job nicht gefunden.</p>
      </div>
    );
  }

  const seo01 = parsed.pipeline?.seo01;
  const seo02 = parsed.pipeline?.seo02;
  const isResearchOnly = parsed.mode === 'seo_research_only';
  const isWebwelleManual =
    job.sourceType === 'webwelle' && seo02?.sourceType === 'webwelle';
  const canRetrySeo02 =
    isResearchOnly &&
    (seo01?.filtered_keywords?.length ?? 0) > 0 &&
    !seo02?.approved_blog_keywords?.length;

  const retrySeo02 = async () => {
    setRetryingSeo02(true);
    setRetryMessage(null);
    try {
      const res = await adminFetch('/api/admin/blog/retry-seo-qualification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRetryMessage(data.message || data.error || 'seo-02 konnte nicht gestartet werden.');
        return;
      }
      setRetryMessage(data.message || 'seo-02 Qualification gestartet.');
      await load({ silent: true });
    } finally {
      setRetryingSeo02(false);
    }
  };

  return (
    <div className="space-y-6">
      <button type="button" onClick={onBack} className="text-sm text-muted-foreground hover:text-foreground">
        ← Zurück zur Job-Liste
      </button>

      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-xl font-bold">Job #{job.id}</h2>
        {isResearchOnly && (
          <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
            Keyword-Research
          </span>
        )}
        <span className="text-xs uppercase tracking-wide text-muted-foreground">{job.sourceType}</span>
        <span
          className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(job.status)}`}
        >
          {STATUS_LABELS[job.status] || job.status}
        </span>
      </div>

      {seo02?.error && (
        <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-600">
          Fehler: {seo02.error}
        </p>
      )}

      <DashboardPanel title="Eingabe">
        <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-muted-foreground">Branche</dt>
            <dd className="font-medium">{parsed.branche || '—'}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">PLZ</dt>
            <dd className="font-medium">{parsed.plz || '—'}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Stadt</dt>
            <dd className="font-medium">{parsed.city || '—'}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Website</dt>
            <dd className="font-medium break-all">{parsed.website || '—'}</dd>
          </div>
          {!isResearchOnly && (
            <div className="sm:col-span-2">
              <dt className="text-muted-foreground">Manuelle Keywords</dt>
              <dd className="font-medium">
                {parsed.keywords.length ? parsed.keywords.join(', ') : '—'}
              </dd>
            </div>
          )}
        </dl>
      </DashboardPanel>

      <DashboardPanel title="A – seo-01 Research (Keyword-Liste)">
        {seo01 ? (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-muted px-2 py-0.5">
                Status: {seo01.status || 'research_done'}
              </span>
              {seo01.recordedAt && (
                <span className="rounded-full bg-muted px-2 py-0.5">
                  {new Date(seo01.recordedAt).toLocaleString('de-DE')}
                </span>
              )}
            {seo01.dataforseo_status && typeof seo01.dataforseo_status === 'object' && (
                <>
                  {((seo01.dataforseo_status as Record<string, unknown>).serp_location != null ||
                    (seo01.dataforseo_status as Record<string, unknown>).location != null) && (
                    <span className="rounded-full bg-muted px-2 py-0.5">
                      SERP:{' '}
                      {String(
                        (seo01.dataforseo_status as Record<string, unknown>).serp_location ??
                          (seo01.dataforseo_status as Record<string, unknown>).location
                      )}
                    </span>
                  )}
                  <span className="rounded-full bg-muted px-2 py-0.5">
                    Relevant:{' '}
                    {String(
                      (seo01.dataforseo_status as Record<string, unknown>).discovered_count ??
                        (seo01.dataforseo_status as Record<string, unknown>).relevance_filtered_count ??
                        '—'
                    )}
                  </span>
                  <span className="rounded-full bg-muted px-2 py-0.5">
                    Pipeline:{' '}
                    {String(
                      (seo01.dataforseo_status as Record<string, unknown>).after_intent_filter ?? '—'
                    )}
                  </span>
                  {Number((seo01.dataforseo_status as Record<string, unknown>).navigational_excluded_count) > 0 && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
                      Navigational ausgeblendet:{' '}
                      {String((seo01.dataforseo_status as Record<string, unknown>).navigational_excluded_count)}
                    </span>
                  )}
                </>
              )}
            </div>
            {seo01.discovery_error && (
              <p className="text-sm text-red-600">DataForSEO: {seo01.discovery_error}</p>
            )}
            <ColumnLegend items={SEO01_COLUMN_HELP} />
            <KeywordTable
              rows={(seo01.raw_keywords || []).filter((r) => r.intent !== 'navigational')}
              emptyText="Keine branchenrelevanten Keywords von seo-01."
            />
            {(seo01.filtered_keywords?.length ?? 0) > 0 &&
              (seo01.filtered_keywords?.length ?? 0) !== (seo01.raw_keywords?.length ?? 0) && (
              <div className="mt-4">
                <h4 className="mb-2 text-sm font-semibold text-primary">
                  Für seo-02 Qualification ({seo01.filtered_keywords?.length} Keywords)
                </h4>
                <KeywordTable
                  rows={seo01.filtered_keywords || []}
                  emptyText=""
                />
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Noch keine Pipeline-Daten von seo-01. Nach n8n-Patch einen neuen Job starten.
          </p>
        )}
      </DashboardPanel>

      <DashboardPanel title="B – seo-02 Qualification (Beste Blog-Keywords)">
        {seo02 ? (
          <div className="space-y-4">
            {isWebwelleManual && (
              <p className="text-sm text-muted-foreground">
                WebWelle: Manuelle Keywords wurden direkt übernommen (Scoring übersprungen).
              </p>
            )}
            {seo02.recordedAt && (
              <p className="text-xs text-muted-foreground">
                Erfasst: {new Date(seo02.recordedAt).toLocaleString('de-DE')}
              </p>
            )}
            {isResearchOnly && <ColumnLegend items={SEO02_COLUMN_HELP} />}
            <div>
              <h4 className="mb-2 text-sm font-semibold text-primary">Approved Blog-Keywords</h4>
              <KeywordTable
                rows={seo02.approved_blog_keywords || []}
                emptyText="Keine qualifizierten Blog-Keywords."
                variant={isResearchOnly ? 'approved' : 'basic'}
              />
            </div>
            {(seo02.skipped_keywords?.length ?? 0) > 0 && (
              <div>
                <h4 className="mb-2 text-sm font-semibold text-muted-foreground">Übersprungen (skip)</h4>
                <KeywordTable
                  rows={seo02.skipped_keywords || []}
                  emptyText=""
                  variant="skipped"
                />
              </div>
            )}
            {(seo02.approved_service_keywords?.length ?? 0) > 0 && (
              <div>
                <h4 className="mb-2 text-sm font-semibold">Service-Keywords</h4>
                <KeywordTable
                  rows={seo02.approved_service_keywords || []}
                  emptyText=""
                />
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Noch keine Pipeline-Daten von seo-02.
              {canRetrySeo02
                ? ' WF2 kann mit den seo-01 Keywords erneut gestartet werden.'
                : ' Nach n8n-Patch einen neuen Job starten.'}
            </p>
            {canRetrySeo02 && (
              <button
                type="button"
                onClick={() => void retrySeo02()}
                disabled={retryingSeo02}
                className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-60"
              >
                {retryingSeo02 ? 'Starte seo-02…' : 'seo-02 Qualification erneut starten'}
              </button>
            )}
            {retryMessage && <p className="text-sm text-muted-foreground">{retryMessage}</p>}
          </div>
        )}
      </DashboardPanel>
    </div>
  );
}

export default function SeoTab() {
  const [jobs, setJobs] = useState<BlogJobRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sourceFilter, setSourceFilter] = useState<'all' | 'client' | 'webwelle'>('all');
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);

  const load = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent === true;
    if (!silent) setLoading(true);
    try {
      const res = await adminFetch('/api/admin/blog/jobs');
      if (res.status === 401) return;
      const data = await res.json();
      const rows = (data.jobs || []).map((j: Record<string, unknown>) => ({
        id: j.id as number,
        leadToken: j.leadToken as string | null,
        sourceType: (j.sourceType as string) || 'client',
        status: j.status as string,
        articleCount: j.articleCount as number,
        completedCount: j.completedCount as number,
        failedCount: j.failedCount as number,
        companyName: j.companyName as string | null,
        industry: j.industry as string | null,
        createdAt: j.createdAt as string,
        keywordData: (j.keywordData as Record<string, unknown> | null) || null,
      }));
      setJobs(rows);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const hasActive = jobs.some((job) => {
      if (!['queued', 'running'].includes(job.status)) return false;
      const parsed = parseBlogJobKeywordData(job.keywordData);
      if (parsed.mode === 'seo_research_only') return true;
      return job.articleCount > 0;
    });
    if (!hasActive || selectedJobId) return;
    const timer = window.setInterval(() => {
      void load({ silent: true });
    }, 5000);
    return () => window.clearInterval(timer);
  }, [jobs, selectedJobId, load]);

  if (selectedJobId) {
    return <SeoJobDetail jobId={selectedJobId} onBack={() => setSelectedJobId(null)} />;
  }

  const filtered =
    sourceFilter === 'all' ? jobs : jobs.filter((j) => j.sourceType === sourceFilter);

  if (loading) {
    return <p className="py-8 text-center text-muted-foreground">Lade SEO-Jobs…</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-1 text-2xl font-bold">SEO-Pipeline</h2>
        <p className="text-sm text-muted-foreground">
          Keyword-Research (Admin) und Blog-Pipeline-Ergebnisse (seo-01 / seo-02) pro Job.
        </p>
      </div>

      <SeoResearchForm onStarted={() => load({ silent: true })} />

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Jobs ({filtered.length})</h3>
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value as 'all' | 'client' | 'webwelle')}
          className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
        >
          <option value="all">Alle</option>
          <option value="client">Kunden</option>
          <option value="webwelle">WebWelle</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="text-muted-foreground">Noch keine Pipeline-Jobs.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="p-3">ID</th>
                <th className="p-3">System</th>
                <th className="p-3">Kunde / Branche</th>
                <th className="p-3">Status</th>
                <th className="p-3">seo-01</th>
                <th className="p-3">seo-02</th>
                <th className="p-3">Erstellt</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((job) => {
                const parsed = parseBlogJobKeywordData(job.keywordData);
                const seo01Count =
                  parsed.pipeline?.seo01?.raw_keywords?.length ??
                  parsed.pipeline?.seo01?.filtered_keywords?.length ??
                  0;
                const seo02Count = parsed.pipeline?.seo02?.approved_blog_keywords?.length ?? 0;
                const isResearchOnly = parsed.mode === 'seo_research_only';
                return (
                  <tr key={job.id} className="border-t border-border">
                    <td className="p-3 font-mono text-xs">#{job.id}</td>
                    <td className="p-3 text-xs">
                      {isResearchOnly ? 'Research' : job.sourceType}
                    </td>
                    <td className="p-3">
                      <p className="font-medium">
                        {parsed.branche ||
                          job.companyName ||
                          (job.sourceType === 'webwelle' ? 'WebWelle' : '—')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {parsed.plz ? `PLZ ${parsed.plz}` : job.industry || '—'}
                      </p>
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(job.status)}`}
                      >
                        {STATUS_LABELS[job.status] || job.status}
                      </span>
                    </td>
                    <td className="p-3 text-xs">{seo01Count > 0 ? `${seo01Count} Keywords` : '—'}</td>
                    <td className="p-3 text-xs">{seo02Count > 0 ? `${seo02Count} approved` : '—'}</td>
                    <td className="p-3 whitespace-nowrap text-xs text-muted-foreground">
                      {new Date(job.createdAt).toLocaleString('de-DE')}
                    </td>
                    <td className="p-3">
                      <button
                        type="button"
                        onClick={() => setSelectedJobId(job.id)}
                        className="text-xs text-brand hover:underline"
                      >
                        Ergebnisse
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
