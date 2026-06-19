'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { DashboardPanel } from '../dashboard/DashboardPanel';
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

function KeywordTable({
  rows,
  emptyText,
}: {
  rows: PipelineKeywordRecord[];
  emptyText: string;
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
            <th className="p-2">Volume</th>
            <th className="p-2">Difficulty</th>
            <th className="p-2">Intent</th>
            <th className="p-2">CPC</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${row.keyword}-${index}`} className="border-t border-border">
              <td className="p-2 font-medium">{row.keyword}</td>
              <td className="p-2 text-muted-foreground">{row.volume ?? '—'}</td>
              <td className="p-2 text-muted-foreground">{row.difficulty ?? '—'}</td>
              <td className="p-2 text-muted-foreground">{row.intent ?? '—'}</td>
              <td className="p-2 text-muted-foreground">
                {row.cpc != null ? row.cpc.toFixed(2) : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
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

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/blog/jobs/${jobId}`);
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
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!job || !['queued', 'running'].includes(job.status)) return;
    const timer = window.setInterval(load, 5000);
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
  const isWebwelleManual =
    job.sourceType === 'webwelle' && seo02?.sourceType === 'webwelle';

  return (
    <div className="space-y-6">
      <button type="button" onClick={onBack} className="text-sm text-muted-foreground hover:text-foreground">
        ← Zurück zur Job-Liste
      </button>

      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-xl font-bold">Job #{job.id}</h2>
        <span className="text-xs uppercase tracking-wide text-muted-foreground">{job.sourceType}</span>
        <span
          className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(job.status)}`}
        >
          {STATUS_LABELS[job.status] || job.status}
        </span>
      </div>

      <DashboardPanel title="Eingabe">
        <dl className="grid gap-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-muted-foreground">Branche</dt>
            <dd className="font-medium">{parsed.branche || '—'}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">PLZ</dt>
            <dd className="font-medium">{parsed.plz || '—'}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Manuelle Keywords</dt>
            <dd className="font-medium">
              {parsed.keywords.length ? parsed.keywords.join(', ') : '—'}
            </dd>
          </div>
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
              {seo01.dataforseo_status && (
                <span className="rounded-full bg-muted px-2 py-0.5">
                  DataForSEO: {JSON.stringify(seo01.dataforseo_status)}
                </span>
              )}
            </div>
            {seo01.discovery_error && (
              <p className="text-sm text-red-600">DataForSEO: {seo01.discovery_error}</p>
            )}
            <KeywordTable
              rows={seo01.raw_keywords || []}
              emptyText="Keine Keyword-Liste von seo-01."
            />
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
            <div>
              <h4 className="mb-2 text-sm font-semibold text-primary">Approved Blog-Keywords</h4>
              <KeywordTable
                rows={seo02.approved_blog_keywords || []}
                emptyText="Keine qualifizierten Blog-Keywords."
              />
            </div>
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
          <p className="text-sm text-muted-foreground">
            Noch keine Pipeline-Daten von seo-02. Nach n8n-Patch einen neuen Job starten.
          </p>
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

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/blog/jobs');
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
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const hasActive = jobs.some((j) => ['queued', 'running'].includes(j.status));
    if (!hasActive || selectedJobId) return;
    const timer = window.setInterval(load, 5000);
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
          Ergebnisse von seo-01 (Keyword-Liste) und seo-02 (qualifizierte Blog-Keywords) pro Job.
        </p>
      </div>

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
                const seo01Count = parsed.pipeline?.seo01?.raw_keywords?.length ?? 0;
                const seo02Count = parsed.pipeline?.seo02?.approved_blog_keywords?.length ?? 0;
                return (
                  <tr key={job.id} className="border-t border-border">
                    <td className="p-3 font-mono text-xs">#{job.id}</td>
                    <td className="p-3 text-xs">{job.sourceType}</td>
                    <td className="p-3">
                      <p className="font-medium">
                        {job.companyName || (job.sourceType === 'webwelle' ? 'WebWelle' : '—')}
                      </p>
                      <p className="text-xs text-muted-foreground">{job.industry || '—'}</p>
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
