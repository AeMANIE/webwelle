'use client';

import { useState } from 'react';
import { Zap } from 'lucide-react';
import { adminFetch } from '@/lib/admin-fetch';

interface Props {
  onStarted?: (jobId: number) => void;
}

export default function BlogGenerateModal({ onStarted }: Props) {
  const [open, setOpen] = useState(false);
  const [keywords, setKeywords] = useState('');
  const [articleCount, setArticleCount] = useState(1);
  const [publishMode, setPublishMode] = useState<'draft' | 'publish'>('draft');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const kw = keywords
      .split('\n')
      .map((k) => k.trim())
      .filter(Boolean);
    if (!kw.length) return;

    setLoading(true);
    setMessage(null);
    setIsError(false);
    try {
      const res = await adminFetch('/api/admin/blog/start-webwelle-pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keywords: kw,
          articleCount: Math.min(articleCount, kw.length),
          publishMode,
          branche: 'Webdesign',
          plz: '87435',
        }),
      });

      const raw = await res.text();
      let data: Record<string, unknown> = {};
      if (raw) {
        try {
          data = JSON.parse(raw) as Record<string, unknown>;
        } catch {
          setMessage(`Server-Antwort ungültig (${res.status})`);
          setIsError(true);
          return;
        }
      }

      if (res.status === 401) {
        setMessage('Session abgelaufen — bitte Admin neu einloggen und erneut versuchen.');
        setIsError(true);
        return;
      }
      if (!res.ok && !data.existingJob) {
        setMessage(
          String(data.message || data.error || `Start fehlgeschlagen (HTTP ${res.status})`)
        );
        setIsError(true);
        return;
      }
      const n8nOk = data.n8nDispatched !== false;
      const warning = data.warning ? String(data.warning) : '';
      if (!n8nOk || warning) {
        setMessage(
          warning ||
            `Job #${data.jobId} angelegt, aber n8n (seo-01) wurde nicht gestartet. Coolify-Env prüfen: N8N_WEBHOOK_SEO_01_URL, N8N_WEBHOOK_SECRET, N8N_BASE_URL.`
        );
        setIsError(true);
        return;
      }
      setMessage(`Job #${data.jobId} gestartet — n8n seo-01 läuft (${data.publishMode || publishMode}).`);
      onStarted?.(Number(data.jobId));
      setOpen(false);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Netzwerkfehler');
      setIsError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setMessage(null);
          setIsError(false);
        }}
        className="flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted/50"
      >
        <Zap className="w-4 h-4" />
        SEO-Artikel generieren
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl">
            <h3 className="text-lg font-semibold mb-4">WebWelle-Blog automatisch generieren</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Keywords (eins pro Zeile)</label>
                <textarea
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  rows={5}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  placeholder="SEO Tipps Kempten&#10;Webdesign Allgäu"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Anzahl Artikel</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={articleCount}
                    onChange={(e) => setArticleCount(Number(e.target.value))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Veröffentlichung</label>
                  <select
                    value={publishMode}
                    onChange={(e) => setPublishMode(e.target.value as 'draft' | 'publish')}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  >
                    <option value="draft">Entwurf (empfohlen)</option>
                    <option value="publish">Direkt live</option>
                  </select>
                </div>
              </div>
              {message && (
                <p className={`text-sm ${isError ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {message}
                </p>
              )}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 text-sm rounded-lg border border-border"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm rounded-lg bg-brand text-brand-foreground disabled:opacity-50"
                >
                  {loading ? 'Startet…' : 'Pipeline starten'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
