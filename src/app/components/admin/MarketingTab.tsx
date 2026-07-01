'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface ProspectListItem {
  id: string;
  externalId: string;
  domain: string;
  companyName: string | null;
  preferredEmail: string | null;
  status: string;
  sentAt: string | null;
  sentTo: string | null;
  upsells: string[];
  customerId: string | null;
  leadId: string | null;
  createdAt: string;
}

const STATUS_LABEL: Record<string, string> = {
  analyzing: 'Analyse',
  draft: 'Entwurf',
  sent: 'Gesendet',
  replied: 'Antwort',
  lost: 'Verloren',
  bounced: 'Bounce',
};

export default function MarketingTab() {
  const router = useRouter();
  const [items, setItems] = useState<ProspectListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeMsg, setAnalyzeMsg] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (search.trim()) params.set('search', search.trim());
      const res = await fetch(`/api/admin/outbound/prospects?${params}`);
      const data = await res.json();
      if (res.ok) setItems(data.prospects || []);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    load();
  }, [load]);

  async function startAnalyze(e: React.FormEvent) {
    e.preventDefault();
    if (!websiteUrl.trim()) return;
    setAnalyzing(true);
    setAnalyzeMsg('Analyse läuft (1–3 Min.) …');
    try {
      const res = await fetch('/api/admin/outbound/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          websiteUrl: websiteUrl.trim(),
          googleMapsUrl: googleMapsUrl.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Analyse fehlgeschlagen');
      setAnalyzeMsg(`Fertig – ${data.domain}`);
      setWebsiteUrl('');
      router.push(`/admin/marketing/${data.prospectId}`);
    } catch (err) {
      setAnalyzeMsg(err instanceof Error ? err.message : 'Fehler');
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Neue Kaltakquise analysieren</h2>
        <form onSubmit={startAnalyze} className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="block text-sm text-muted-foreground mb-1">Website-URL *</label>
            <input
              type="url"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://beispiel-firma.de"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1">Google-Maps-Link (optional)</label>
            <input
              type="url"
              value={googleMapsUrl}
              onChange={(e) => setGoogleMapsUrl(e.target.value)}
              placeholder="https://maps.google.com/..."
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={analyzing}
              className="rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground disabled:opacity-50"
            >
              {analyzing ? 'Analyse …' : 'Analyse starten'}
            </button>
          </div>
        </form>
        {analyzeMsg && <p className="mt-3 text-sm text-muted-foreground">{analyzeMsg}</p>}
      </section>

      <section>
        <div className="flex flex-wrap gap-3 mb-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="">Alle Status</option>
            <option value="draft">Entwurf</option>
            <option value="sent">Gesendet</option>
            <option value="analyzing">Analyse</option>
          </select>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Domain, Firma, E-Mail …"
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm flex-1 min-w-[200px]"
          />
          <button type="button" onClick={load} className="rounded-lg border border-border px-3 py-2 text-sm">
            Aktualisieren
          </button>
        </div>

        {loading ? (
          <p className="text-muted-foreground py-8 text-center">Lade Prospects …</p>
        ) : items.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center">Noch keine Outbound-Prospects.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Domain / Firma</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Gesendet</th>
                  <th className="px-4 py-3 font-medium">Empfänger</th>
                  <th className="px-4 py-3 font-medium">Verknüpft</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p.id} className="border-t border-border hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{p.domain}</div>
                      <div className="text-muted-foreground">{p.companyName || '–'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs ${p.status === 'sent' ? 'bg-green-500/20 text-green-400' : 'bg-muted text-muted-foreground'}`}>
                        {STATUS_LABEL[p.status] || p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {p.sentAt ? new Date(p.sentAt).toLocaleString('de-DE') : '–'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{p.sentTo || p.preferredEmail || '–'}</td>
                    <td className="px-4 py-3">
                      {p.customerId && <span className="text-xs bg-blue-500/20 text-blue-300 rounded px-2 py-0.5 mr-1">Kunde</span>}
                      {p.leadId && <span className="text-xs bg-purple-500/20 text-purple-300 rounded px-2 py-0.5">Lead</span>}
                      {!p.customerId && !p.leadId && '–'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => router.push(`/admin/marketing/${p.id}`)}
                        className="text-primary hover:underline"
                      >
                        Öffnen
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
