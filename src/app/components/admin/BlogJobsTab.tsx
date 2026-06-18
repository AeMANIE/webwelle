'use client';

import { useCallback, useEffect, useState } from 'react';
import BlogJobDetail from './BlogJobDetail';

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
  articleRows: number;
  createdAt: string;
  lastCallbackAt: string | null;
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

export default function BlogJobsTab() {
  const [jobs, setJobs] = useState<BlogJobRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [leadToken, setLeadToken] = useState('');
  const [forceResearch, setForceResearch] = useState(false);
  const [starting, setStarting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [sourceFilter, setSourceFilter] = useState<'all' | 'client' | 'webwelle'>('all');
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/blog/jobs');
      const data = await res.json();
      const rows = (data.jobs || []).map((j: Record<string, unknown>) => ({
        id: j.id,
        leadToken: j.leadToken,
        sourceType: j.sourceType || 'client',
        status: j.status,
        articleCount: j.articleCount,
        completedCount: j.completedCount,
        failedCount: j.failedCount,
        companyName: j.companyName,
        industry: j.industry,
        articleRows: j.articleRows,
        createdAt: j.createdAt,
        lastCallbackAt: j.lastCallbackAt,
      }));
      setJobs(rows);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function startPipeline(e: React.FormEvent) {
    e.preventDefault();
    const token = leadToken.trim();
    if (!token) return;

    setStarting(true);
    setMessage(null);
    try {
      const res = await fetch('/api/blog/start-pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadToken: token, forceResearch }),
      });
      const data = await res.json();
      if (!res.ok && !data.existingJob) {
        setMessage(data.message || data.error || 'Start fehlgeschlagen');
        return;
      }
      setMessage(
        data.existingJob
          ? `Bestehender Job #${data.jobId}`
          : `Job #${data.jobId} gestartet (${data.status})`
      );
      setLeadToken('');
      await load();
    } finally {
      setStarting(false);
    }
  }

  if (selectedJobId) {
    return (
      <BlogJobDetail
        jobId={selectedJobId}
        onBack={() => setSelectedJobId(null)}
        onRefresh={load}
      />
    );
  }

  const filtered =
    sourceFilter === 'all' ? jobs : jobs.filter((j) => j.sourceType === sourceFilter);

  if (loading) {
    return <p className="py-8 text-center text-muted-foreground">Lade Blog-Jobs…</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-2">Blog-Pipeline</h2>
        <p className="text-muted-foreground text-sm mb-4">
          Kunden-Blog (System B) und WebWelle-Blog (System A) — n8n-Kette seo-01…06.
        </p>

        <form
          onSubmit={startPipeline}
          className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4"
        >
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium mb-1">Lead-Token (Kunden-Pipeline)</label>
            <input
              type="text"
              value={leadToken}
              onChange={(e) => setLeadToken(e.target.value)}
              placeholder="Funnel-Token"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <label className="flex items-center gap-2 text-sm pb-2">
            <input
              type="checkbox"
              checked={forceResearch}
              onChange={(e) => setForceResearch(e.target.checked)}
            />
            Research überspringen
          </label>
          <button
            type="submit"
            disabled={starting || !leadToken.trim()}
            className="bg-brand text-brand-foreground px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {starting ? 'Startet…' : 'Kunden-Pipeline starten'}
          </button>
        </form>
        {message && (
          <p className="mt-2 text-sm text-muted-foreground" role="status">
            {message}
          </p>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
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
          <p className="text-muted-foreground">Noch keine Blog-Jobs.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="p-3">ID</th>
                  <th className="p-3">System</th>
                  <th className="p-3">Kunde / Branche</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Fortschritt</th>
                  <th className="p-3">Erstellt</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((job) => (
                  <tr key={job.id} className="border-t border-border">
                    <td className="p-3 font-mono text-xs">#{job.id}</td>
                    <td className="p-3 text-xs">{job.sourceType}</td>
                    <td className="p-3">
                      <p className="font-medium">{job.companyName || (job.sourceType === 'webwelle' ? 'WebWelle' : '—')}</p>
                      <p className="text-muted-foreground text-xs">
                        {job.industry || (job.leadToken ? `${job.leadToken.slice(0, 12)}…` : '—')}
                      </p>
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(job.status)}`}
                      >
                        {STATUS_LABELS[job.status] || job.status}
                      </span>
                    </td>
                    <td className="p-3">
                      {job.completedCount}/{job.articleCount}
                      {job.failedCount > 0 && (
                        <span className="text-red-600 ml-1">({job.failedCount} fehlgeschlagen)</span>
                      )}
                    </td>
                    <td className="p-3 text-muted-foreground text-xs whitespace-nowrap">
                      {new Date(job.createdAt).toLocaleString('de-DE')}
                    </td>
                    <td className="p-3">
                      <button
                        type="button"
                        onClick={() => setSelectedJobId(job.id)}
                        className="text-xs text-brand hover:underline"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
