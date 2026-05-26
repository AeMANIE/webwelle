'use client';

import { useMemo, useState } from 'react';

type ResearchItem = {
  workflow_key: string;
  status: string;
  payload: Record<string, unknown> | null;
  updated_at: string;
};

export default function LiveAnalysisDashboard({
  lead,
  research,
  token,
  onRefresh,
}: {
  lead: {
    industry_normalized?: string;
    industry_raw?: string;
    postal_code?: string;
    city?: string;
    market?: string;
  };
  research: ResearchItem[];
  token: string;
  onRefresh: () => void;
}) {
  const [tab, setTab] = useState<'seo' | 'design' | 'performance' | 'recommendation'>('seo');

  const byKey = useMemo(() => {
    const map: Record<string, ResearchItem> = {};
    for (const r of research) map[r.workflow_key] = r;
    return map;
  }, [research]);

  const competitors =
    (byKey.competitor_design?.payload?.discoveredCompetitors as Array<Record<string, unknown>>) ||
    (byKey.industry_questions?.payload?.discoveredCompetitors as Array<Record<string, unknown>>) ||
    [];

  const seoPayload = byKey.seo_keywords?.payload || {};
  const perfPayload = byKey.site_performance?.payload || {};
  const questionsPayload = byKey.industry_questions?.payload || {};

  const competitorCount = competitors.length;
  const targetCount = 10;
  const progress = Math.min(100, Math.round((competitorCount / targetCount) * 100));

  const keywords =
    (seoPayload.keywords as Array<{ keyword?: string; cluster?: string; volume?: number }>) ||
    (seoPayload.clusters as Array<{ keyword?: string; cluster?: string; volume?: number }>) ||
    [];

  const gaps = (seoPayload.gaps as string[]) || (seoPayload.opportunities as string[]) || [];

  const recommendations =
    (questionsPayload.upsell_opportunities as Array<{ label: string; description?: string }>) ||
    (questionsPayload.recommendations as Array<{ label: string; description?: string }>) ||
    [];

  const lastUpdate = research.reduce((max, r) => {
    const t = new Date(r.updated_at).getTime();
    return t > max ? t : max;
  }, 0);

  return (
    <div className="space-y-6">
      <header className="rounded-xl border border-border bg-card p-6">
        <h1 className="text-2xl font-bold">
          Live-Analyse: Top {targetCount}
        </h1>
        <p className="text-muted-foreground mt-1">
          {lead.industry_normalized || lead.industry_raw} · PLZ {lead.postal_code} ·{' '}
          {lead.market || 'DE'}
          {lead.city ? ` · ${lead.city}` : ''}
        </p>
        <div className="mt-4 flex flex-wrap gap-4 items-center text-sm">
          <span>
            {competitorCount} / {targetCount} Websites
          </span>
          <span className="text-muted-foreground">
            Stand:{' '}
            {lastUpdate
              ? new Date(lastUpdate).toLocaleString('de-DE')
              : 'wird geladen…'}
          </span>
          <div className="flex-1 min-w-[120px] h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <button
            type="button"
            onClick={onRefresh}
            className="text-primary underline text-sm"
          >
            Analyse aktualisieren
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Dauerhafter Link:{' '}
          <a
            href={`/analyse/${token}`}
            className="text-primary break-all"
          >
            {typeof window !== 'undefined' ? window.location.origin : ''}/analyse/{token}
          </a>
        </p>
      </header>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {competitors.slice(0, 10).map((c, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4">
            <p className="font-semibold text-sm truncate">
              {(c.name as string) || (c.title as string) || `Wettbewerber ${i + 1}`}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {(c.domain as string) || (c.url as string) || ''}
            </p>
            {c.mobileScore != null && (
              <p className="text-xs text-primary mt-2">Mobile {String(c.mobileScore)}</p>
            )}
          </div>
        ))}
        {competitorCount === 0 && (
          <p className="col-span-full text-muted-foreground text-sm py-8 text-center">
            Analyse läuft… Ergebnisse erscheinen in Kürze.
          </p>
        )}
      </div>

      <div className="flex gap-2 flex-wrap border-b border-border pb-2">
        {(
          [
            ['seo', 'SEO'],
            ['design', 'Design'],
            ['performance', 'Performance'],
            ['recommendation', 'Empfehlung'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={
              `px-4 py-2 rounded-lg text-sm font-medium ` +
              (tab === key ? 'bg-primary text-primary-foreground' : 'bg-muted')
            }
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'seo' && (
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h2 className="font-semibold">SEO-Signale</h2>
          <p className="text-xs text-muted-foreground">
            Provider: {(seoPayload.provider as string) || 'n8n'}
          </p>
          {keywords.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground">
                    <th className="pb-2">Keyword</th>
                    <th className="pb-2">Cluster</th>
                    <th className="pb-2">Volumen</th>
                  </tr>
                </thead>
                <tbody>
                  {keywords.slice(0, 15).map((k, i) => (
                    <tr key={i} className="border-t border-border">
                      <td className="py-2">{k.keyword}</td>
                      <td className="py-2">{k.cluster}</td>
                      <td className="py-2">{k.volume ?? '–'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Keywords werden geladen…</p>
          )}
          {gaps.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-2">Mögliche Lücken</h3>
              <div className="flex flex-wrap gap-2">
                {gaps.map((g) => (
                  <span key={g} className="px-3 py-1 rounded-full bg-primary/15 text-xs">
                    {g}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'design' && (
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="font-semibold mb-4">Design-Analyse</h2>
          <pre className="text-xs whitespace-pre-wrap text-muted-foreground max-h-64 overflow-auto">
            {JSON.stringify(byKey.competitor_design?.payload || {}, null, 2)}
          </pre>
        </div>
      )}

      {tab === 'performance' && (
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="font-semibold mb-4">Performance</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {Object.entries(perfPayload.sites as Record<string, unknown> || perfPayload).slice(0, 6).map(([k, v]) => (
              <div key={k} className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm font-medium truncate">{k}</p>
                <p className="text-2xl font-bold text-primary mt-1">
                  {typeof v === 'object' && v && 'score' in (v as object)
                    ? String((v as { score: number }).score)
                    : '–'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'recommendation' && (
        <div className="rounded-xl border border-border bg-card p-6 space-y-3">
          <h2 className="font-semibold">Empfehlung & Paket-Module</h2>
          {recommendations.length > 0 ? (
            recommendations.map((r, i) => (
              <div key={i} className="p-4 rounded-lg border border-primary/30 bg-primary/5">
                <p className="font-medium">{r.label}</p>
                {r.description && (
                  <p className="text-sm text-muted-foreground mt-1">{r.description}</p>
                )}
              </div>
            ))
          ) : (
            <ul className="text-sm space-y-2 text-muted-foreground list-disc pl-5">
              <li>Website StarterWelle</li>
              <li>SEO-Landingpages</li>
              <li>Admin-Dashboard / Backend</li>
              <li>Online-Shop oder Terminbuchung</li>
              <li>Social-Media & KI-Automatisierung</li>
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
