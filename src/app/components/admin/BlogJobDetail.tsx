'use client';

import { useCallback, useEffect, useState } from 'react';
import sanitizeHtml from 'sanitize-html';

interface ArticleRow {
  id: number;
  title: string | null;
  keyword: string;
  status: string;
  wordCount: number | null;
  qaStatus: string | null;
  qaFailReason: Record<string, unknown> | null;
  htmlContent: string | null;
  internalNote: string | null;
  customerNote: string | null;
}

interface JobDetail {
  id: number;
  status: string;
  sourceType: string;
  articleCount: number;
  completedCount: number;
  failedCount: number;
  lastCallbackAt: string | null;
  lastErrorAt: string | null;
  errorMessage: string | null;
  n8nExecutionId: string | null;
  pipelineFinishedAt: string | null;
  deliveredAt: string | null;
}

interface Props {
  jobId: number;
  onBack: () => void;
  onRefresh: () => void;
}

const STATUS_LABELS: Record<string, string> = {
  review_pending: 'Review ausstehend',
  approved: 'Freigegeben',
  rejected: 'Abgelehnt',
  failed: 'Fehlgeschlagen',
  draft: 'Entwurf',
};

export default function BlogJobDetail({ jobId, onBack, onRefresh }: Props) {
  const [job, setJob] = useState<JobDetail | null>(null);
  const [articles, setArticles] = useState<ArticleRow[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<ArticleRow | null>(null);
  const [internalNote, setInternalNote] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/blog/jobs/${jobId}`);
      const data = await res.json();
      setJob(data.job);
      setArticles(data.articles || []);
      setStats(data.stats || {});
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    load();
  }, [load]);

  async function reviewArticle(articleId: number, action: 'approve' | 'reject') {
    setMessage(null);
    const res = await fetch('/api/admin/blog/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ articleId, action, internalNote: action === 'reject' ? internalNote : undefined }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error || 'Review fehlgeschlagen');
      return;
    }
    setInternalNote('');
    setSelectedArticle(null);
    await load();
    onRefresh();
  }

  async function deliverToCustomer() {
    setMessage(null);
    const res = await fetch('/api/admin/blog/deliver', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.message || data.error || 'Freigabe fehlgeschlagen');
      return;
    }
    setMessage('An Kunden freigegeben.');
    await load();
    onRefresh();
  }

  async function exportArticle(articleId: number, format: string) {
    setMessage(null);
    const res = await fetch('/api/admin/blog/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ articleId, format }),
    });
    let data: Record<string, unknown> = {};
    try {
      data = await res.json();
    } catch {
      setMessage('Export fehlgeschlagen (keine Antwort vom Server).');
      return;
    }
    if (!res.ok) {
      setMessage(String(data.message || data.error || 'Export fehlgeschlagen'));
      return;
    }
    const exportData = data.export as Record<string, unknown> | undefined;
    const text =
      format === 'export_json'
        ? JSON.stringify(exportData, null, 2)
        : format === 'export_markdown'
          ? String(exportData?.markdown || '')
          : format === 'copy_plain'
            ? String(exportData?.plain || '')
            : String(exportData?.htmlContent || exportData?.content_html || '');
    await navigator.clipboard.writeText(text);
    setMessage(`Export (${format}) in Zwischenablage kopiert.`);
  }

  if (loading) {
    return <p className="py-8 text-center text-muted-foreground">Lade Job-Details…</p>;
  }

  if (!job) {
    return (
      <div>
        <button type="button" onClick={onBack} className="text-sm text-muted-foreground mb-4">
          ← Zurück
        </button>
        <p>Job nicht gefunden.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button type="button" onClick={onBack} className="text-sm text-muted-foreground hover:text-foreground">
        ← Zurück zur Übersicht
      </button>

      <div className="rounded-xl border border-border bg-card p-4 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-lg font-semibold">Job #{job.id}</h3>
          <span className="text-xs rounded-full bg-muted px-2 py-1">{job.sourceType}</span>
        </div>
        <p className="text-sm text-muted-foreground">Status: {job.status}</p>
        <p className="text-sm">
          Fortschritt: {job.completedCount}/{job.articleCount}
          {job.failedCount > 0 && <span className="text-red-600 ml-1">({job.failedCount} fehlgeschlagen)</span>}
        </p>
        {job.lastCallbackAt && (
          <p className="text-xs text-muted-foreground">
            Letzter Callback: {new Date(job.lastCallbackAt).toLocaleString('de-DE')}
          </p>
        )}
        {job.lastErrorAt && (
          <p className="text-xs text-destructive">
            Letzter Fehler: {new Date(job.lastErrorAt).toLocaleString('de-DE')}
          </p>
        )}
        {job.errorMessage && (
          <p className="text-xs text-destructive font-mono break-all">{job.errorMessage}</p>
        )}
        {job.n8nExecutionId && (
          <p className="text-xs text-muted-foreground font-mono">n8n: {job.n8nExecutionId}</p>
        )}
        <div className="flex flex-wrap gap-2 text-xs">
          {Object.entries(stats).map(([k, v]) => (
            <span key={k} className="rounded bg-muted px-2 py-0.5">
              {STATUS_LABELS[k] || k}: {v}
            </span>
          ))}
        </div>
        {job.sourceType === 'client' && job.status === 'ready_for_delivery' && (
          <button
            type="button"
            onClick={deliverToCustomer}
            className="mt-2 bg-brand text-brand-foreground px-4 py-2 rounded-lg text-sm font-medium"
          >
            An Kunden freigeben
          </button>
        )}
      </div>

      {message && <p className="text-sm text-muted-foreground">{message}</p>}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          <h4 className="font-medium">Artikel ({articles.length})</h4>
          {articles.length === 0 ? (
            <p className="text-sm text-muted-foreground">Noch keine Artikel.</p>
          ) : (
            articles.map((a) => (
              <div
                key={a.id}
                className={`rounded-lg border p-3 cursor-pointer transition-colors ${
                  selectedArticle?.id === a.id ? 'border-brand bg-brand/5' : 'border-border'
                }`}
                onClick={() => setSelectedArticle(a)}
              >
                <p className="font-medium text-sm">{a.title || a.keyword}</p>
                <p className="text-xs text-muted-foreground">{a.keyword}</p>
                <span className="text-xs">{STATUS_LABELS[a.status] || a.status}</span>
                {a.wordCount != null && (
                  <span className="text-xs text-muted-foreground ml-2">{a.wordCount} Wörter</span>
                )}
                {a.status === 'failed' && a.qaFailReason?.llm_error != null && (
                  <p className="text-xs text-destructive mt-1 font-mono break-all">
                    {String(a.qaFailReason.llm_error)}
                  </p>
                )}
                {a.status === 'failed' &&
                  a.wordCount != null &&
                  a.wordCount < 50 &&
                  !a.qaFailReason?.llm_error && (
                    <p className="text-xs text-destructive mt-1">
                      OpenRouter-Stub — Modell/Key in n8n prüfen (OPENROUTER_MODEL)
                    </p>
                  )}
              </div>
            ))
          )}
        </div>

        {selectedArticle && (
          <div className="rounded-xl border border-border p-4 space-y-3">
            <h4 className="font-medium">Review: {selectedArticle.title || selectedArticle.keyword}</h4>
            {selectedArticle.htmlContent && (
              <div
                className="prose prose-sm max-w-none max-h-64 overflow-y-auto border rounded p-3 bg-background"
                dangerouslySetInnerHTML={{
                  __html: sanitizeHtml(selectedArticle.htmlContent, {
                    allowedTags: sanitizeHtml.defaults.allowedTags,
                    allowedAttributes: { a: ['href', 'name', 'target', 'rel'] },
                  }),
                }}
              />
            )}
            {selectedArticle.status === 'review_pending' && (
              <>
                <textarea
                  value={internalNote}
                  onChange={(e) => setInternalNote(e.target.value)}
                  placeholder="Interne Notiz (bei Ablehnung)"
                  className="w-full rounded border border-border bg-background px-3 py-2 text-sm min-h-[60px]"
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => reviewArticle(selectedArticle.id, 'approve')}
                    className="bg-green-600 text-white px-3 py-1.5 rounded text-sm"
                  >
                    Freigeben
                  </button>
                  <button
                    type="button"
                    onClick={() => reviewArticle(selectedArticle.id, 'reject')}
                    className="bg-red-600 text-white px-3 py-1.5 rounded text-sm"
                  >
                    Ablehnen
                  </button>
                </div>
              </>
            )}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => exportArticle(selectedArticle.id, 'copy_html')}
                className="text-xs px-2 py-1 rounded border border-border hover:bg-muted"
              >
                HTML kopieren
              </button>
              <button
                type="button"
                onClick={() => exportArticle(selectedArticle.id, 'copy_plain')}
                className="text-xs px-2 py-1 rounded border border-border hover:bg-muted"
              >
                Plain Text
              </button>
              <button
                type="button"
                onClick={() => exportArticle(selectedArticle.id, 'export_json')}
                className="text-xs px-2 py-1 rounded border border-border hover:bg-muted"
              >
                JSON
              </button>
              <button
                type="button"
                onClick={() => exportArticle(selectedArticle.id, 'export_markdown')}
                className="text-xs px-2 py-1 rounded border border-border hover:bg-muted"
              >
                Markdown
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
