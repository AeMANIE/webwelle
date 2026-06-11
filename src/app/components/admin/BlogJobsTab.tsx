'use client';

import { useCallback, useEffect, useState } from 'react';
interface BlogJobRow {
  id: number;
  leadToken: string;
  status: string;
  articleCount: number;
  completedCount: number;
  failedCount: number;
  companyName: string | null;
  industry: string | null;
  articleRows: number;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  queued: 'Warteschlange',
  running: 'Läuft',
  partial: 'Teilweise',
  completed: 'Fertig',
  failed: 'Fehlgeschlagen',
};

function statusBadgeClass(status: string): string {
  switch (status) {
    case 'completed':
      return 'bg-green-500/15 text-green-600';
    case 'running':
    case 'queued':
      return 'bg-yellow-500/15 text-yellow-700';
    case 'partial':
      return 'bg-orange-500/15 text-orange-700';
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

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/blog/jobs');
      const data = await res.json();
      const rows = (data.jobs || []).map((j: Record<string, unknown>) => ({
        id: j.id,
        leadToken: j.leadToken,
        status: j.status,
        articleCount: j.articleCount,
        completedCount: j.completedCount,
        failedCount: j.failedCount,
        companyName: j.companyName,
        industry: j.industry,
        articleRows: j.articleRows,
        createdAt: j.createdAt,
        startedAt: j.startedAt,
        completedAt: j.completedAt,
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
      if (!res.ok) {
        setMessage(data.message || data.error || 'Start fehlgeschlagen');
        return;
      }
      setMessage(`Job #${data.jobId} gestartet (Status: ${data.status})`);
      setLeadToken('');
      await load();
    } finally {
      setStarting(false);
    }
  }

  if (loading) {
    return <p className="py-8 text-center text-muted-foreground">Lade Blog-Jobs…</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-2">Kunden-Blog-Pipeline</h2>
        <p className="text-muted-foreground text-sm mb-4">
          10 SEO-Artikel pro Lead mit Blog-Paket. Admin-Start → n8n-Kette{' '}
          <code className="text-xs">seo-01…06</code>.
        </p>

        <form
          onSubmit={startPipeline}
          className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4"
        >
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium mb-1">Lead-Token</label>
            <input
              type="text"
              value={leadToken}
              onChange={(e) => setLeadToken(e.target.value)}
              placeholder="Funnel-Token (wf_token)"
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
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {starting ? 'Startet…' : 'Pipeline starten'}
          </button>
        </form>
        {message && (
          <p className="mt-2 text-sm text-muted-foreground" role="status">
            {message}
          </p>
        )}
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Jobs ({jobs.length})</h3>
        {jobs.length === 0 ? (
          <p className="text-muted-foreground">Noch keine Blog-Jobs.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="p-3">ID</th>
                  <th className="p-3">Kunde / Branche</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Fortschritt</th>
                  <th className="p-3">Erstellt</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id} className="border-t border-border">
                    <td className="p-3 font-mono text-xs">#{job.id}</td>
                    <td className="p-3">
                      <p className="font-medium">{job.companyName || '—'}</p>
                      <p className="text-muted-foreground text-xs">{job.industry || job.leadToken.slice(0, 12)}…</p>
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
                      <span className="text-muted-foreground text-xs block">
                        {job.articleRows} in DB
                      </span>
                    </td>
                    <td className="p-3 text-muted-foreground text-xs whitespace-nowrap">
                      {new Date(job.createdAt).toLocaleString('de-DE')}
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
