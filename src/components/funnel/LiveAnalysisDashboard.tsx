'use client';

import { useEffect, useMemo, useState } from 'react';

type ResearchItem = {
  workflow_key: string;
  status: string;
  payload: Record<string, unknown> | null;
  updated_at: string;
};

type TabKey = 'seo' | 'design' | 'performance' | 'recommendation';

type KeywordRow = {
  keyword?: string;
  cluster?: string;
  volume?: number | string | null;
};

type CompetitorRow = {
  name?: string;
  title?: string;
  domain?: string;
  websiteUrl?: string;
  url?: string;
  palette?: string[];
  layoutPattern?: string;
  typography?: string;
  designScore?: number;
  strengths?: string[];
  weaknesses?: string[];
  mobileScore?: number | null;
  desktopScore?: number | null;
  performanceScore?: number | null;
  accessibilityScore?: number | null;
  bestPracticesScore?: number | null;
  lighthouseSeoScore?: number | null;
  narrative?: string;
  psiNote?: string;
};

const TARGET_WEBSITES = 5;

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function normalizeSites(value: unknown): CompetitorRow[] {
  if (Array.isArray(value)) return value as CompetitorRow[];
  if (value && typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).filter(
      (site): site is CompetitorRow => Boolean(site && typeof site === 'object')
    );
  }
  return [];
}

function scoreTone(score?: number | null) {
  if (score == null) return 'text-muted-foreground';
  if (score >= 90) return 'text-emerald-500';
  if (score >= 70) return 'text-amber-500';
  return 'text-red-500';
}

function ScorePill({ label, score }: { label: string; score?: number | null }) {
  return (
    <div className="rounded-xl border border-border bg-background/70 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${scoreTone(score)}`}>
        {score == null ? 'offen' : Math.round(score)}
      </p>
    </div>
  );
}

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
    design_reference_urls?: string[];
  };
  research: ResearchItem[];
  token: string;
  onRefresh: () => void;
}) {
  const [tab, setTab] = useState<TabKey>('seo');
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [designUrls, setDesignUrls] = useState<string[]>(['', '', '']);
  const [designSaving, setDesignSaving] = useState(false);
  const [designMessage, setDesignMessage] = useState<string | null>(null);

  const byKey = useMemo(() => {
    const map: Record<string, ResearchItem> = {};
    for (const r of research) map[r.workflow_key] = r;
    return map;
  }, [research]);

  const designPayload = byKey.competitor_design?.payload || {};
  const seoPayload = byKey.seo_keywords?.payload || {};
  const perfPayload = byKey.site_performance?.payload || {};
  const questionsPayload = byKey.industry_questions?.payload || {};

  const competitors = (
    asArray<CompetitorRow>(designPayload.competitors).length
      ? asArray<CompetitorRow>(designPayload.competitors)
      : asArray<CompetitorRow>(questionsPayload.discoveredCompetitors).length
        ? asArray<CompetitorRow>(questionsPayload.discoveredCompetitors)
        : asArray<CompetitorRow>(questionsPayload.competitors)
  ).slice(0, TARGET_WEBSITES);

  const performanceSites = normalizeSites(perfPayload.sites).slice(0, TARGET_WEBSITES);
  const receivedSites = Math.min(
    TARGET_WEBSITES,
    Number(perfPayload.receivedSites || performanceSites.length || competitors.length || 0)
  );
  const progress = Math.min(100, Math.round((receivedSites / TARGET_WEBSITES) * 100));

  const keywords = asArray<KeywordRow>(seoPayload.keywords).length
    ? asArray<KeywordRow>(seoPayload.keywords)
    : asArray<KeywordRow>(seoPayload.clusters);

  const gaps = (
    asArray<string>(seoPayload.gaps).length
      ? asArray<string>(seoPayload.gaps)
      : asArray<string>(seoPayload.opportunities)
  ).slice(0, 8);

  const recommendations = asArray<{ label: string; description?: string }>(
    questionsPayload.upsell_opportunities
  ).length
    ? asArray<{ label: string; description?: string }>(questionsPayload.upsell_opportunities)
    : asArray<{ label: string; description?: string }>(questionsPayload.recommendations);

  const lastUpdate = research.reduce((max, r) => {
    const time = new Date(r.updated_at).getTime();
    return time > max ? time : max;
  }, 0);

  useEffect(() => {
    const urls = (lead.design_reference_urls || []).slice(0, 3);
    setDesignUrls([urls[0] || '', urls[1] || '', urls[2] || '']);
  }, [lead.design_reference_urls]);

  async function saveResume() {
    setSaving(true);
    setSaveMessage(null);
    try {
      window.localStorage.setItem(
        'webwelle:funnel-resume',
        JSON.stringify({ token, savedAt: new Date().toISOString() })
      );
      const res = await fetch(`/api/funnel/leads/${token}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intent: 'save-resume' }),
      });
      const data = await res.json().catch(() => ({}));
      setSaveMessage(data.message || 'Analyse wurde gespeichert.');
    } catch {
      setSaveMessage('Analyse wurde lokal gespeichert. E-Mail konnte nicht gesendet werden.');
    } finally {
      setSaving(false);
    }
  }

  async function saveDesignReferences() {
    setDesignSaving(true);
    setDesignMessage(null);
    const urls = designUrls.map((url) => url.trim()).filter(Boolean).slice(0, 3);
    try {
      const res = await fetch(`/api/funnel/leads/${token}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intent: 'design-preferences', urls }),
      });
      const data = await res.json();
      if (!res.ok) {
        setDesignMessage(data.message || 'Lieblings-Webseiten konnten nicht gespeichert werden.');
        return;
      }
      setDesignMessage('Lieblings-Webseiten gespeichert.');
      onRefresh();
    } catch {
      setDesignMessage('Verbindungsfehler beim Speichern.');
    } finally {
      setDesignSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-border bg-card p-6 shadow-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">Funnel 6</p>
            <h1 className="text-2xl font-bold">Live-Analyse: Top {TARGET_WEBSITES}</h1>
            <p className="text-muted-foreground mt-1">
              {lead.industry_normalized || lead.industry_raw} · PLZ {lead.postal_code} ·{' '}
              {lead.market || 'DE'}
              {lead.city ? ` · ${lead.city}` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={saveResume}
            disabled={saving}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
          >
            {saving ? 'Speichert...' : 'Analyse speichern und später fortsetzen'}
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-4 items-center text-sm">
          <span>
            {receivedSites} / {TARGET_WEBSITES} Websites
          </span>
          <span className="text-muted-foreground">
            Stand:{' '}
            {lastUpdate ? new Date(lastUpdate).toLocaleString('de-DE') : 'wird geladen...'}
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
        {saveMessage && (
          <p className="mt-3 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary">
            {saveMessage}
          </p>
        )}
      </header>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {competitors.map((competitor, index) => (
          <div key={`${competitor.domain}-${index}`} className="rounded-xl border border-border bg-card p-4">
            <p className="font-semibold text-sm truncate">
              {competitor.name || competitor.title || `Wettbewerber ${index + 1}`}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {competitor.domain || competitor.websiteUrl || competitor.url || ''}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Analyseplatz {index + 1} von {TARGET_WEBSITES}
            </p>
          </div>
        ))}
        {competitors.length === 0 && (
          <p className="col-span-full text-muted-foreground text-sm py-8 text-center">
            Analyse läuft... Ergebnisse erscheinen in Kürze.
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
        <div className="rounded-2xl border border-border bg-card p-6 space-y-6">
          <div>
            <h2 className="text-xl font-semibold">SEO-Signale</h2>
            <p className="text-sm text-muted-foreground">
              Diese Begriffe zeigen, wonach Kunden suchen und wo Ihre neue Website sichtbar werden kann.
            </p>
          </div>
          {keywords.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {keywords.slice(0, 12).map((keyword, index) => (
                <div key={`${keyword.keyword}-${index}`} className="rounded-xl border border-border bg-background/70 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground" title="Keyword: Suchbegriff, den Menschen bei Google eingeben.">
                    Keyword
                  </p>
                  <p className="mt-1 font-semibold">{keyword.keyword || 'Keyword wird ausgewertet'}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-primary/10 px-2 py-1 text-primary" title="Cluster: Themen-Gruppe, zu der dieses Keyword gehört.">
                      {keyword.cluster || 'Cluster offen'}
                    </span>
                    <span className="rounded-full bg-muted px-2 py-1" title="Volumen: grobe Nachfrage bzw. Suchinteresse für das Keyword.">
                      Volumen {keyword.volume ?? 'offen'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Keywords werden geladen...</p>
          )}
          {gaps.length > 0 && (
            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5">
              <h3 className="text-lg font-bold mb-2">Mögliche Lücken</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Diese Themen sollten wir sichtbar besetzen, damit Wettbewerber nicht allein davon profitieren.
              </p>
              <div className="flex flex-wrap gap-2">
                {gaps.map((gap) => (
                  <span key={gap} className="px-3 py-1.5 rounded-full bg-primary/15 text-sm font-medium">
                    {gap}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5">
            <p className="text-sm font-semibold text-amber-500">SEO Profi Zusatzpaket · zzgl. 69 EUR</p>
            <h3 className="mt-1 text-lg font-bold">Tiefere Keyword-Recherche für echte Wettbewerbsfähigkeit</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Wir prüfen stärkere Hauptkeywords, profitable Nischenbegriffe und Blog-Themen. Diese Begriffe
              können später direkt in Ihre Website, Landingpages und Blogartikel einfließen.
            </p>
          </div>
        </div>
      )}

      {tab === 'design' && (
        <div className="rounded-2xl border border-border bg-card p-6 space-y-6">
          <div>
            <h2 className="text-xl font-semibold">Design-Analyse</h2>
            <p className="text-sm text-muted-foreground">
              Wir schauen, welche visuellen Muster in Ihrer Branche funktionieren und wo Ihre Website besser werden kann.
            </p>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {competitors.map((competitor, index) => (
              <div key={`${competitor.websiteUrl}-${index}`} className="rounded-2xl border border-border bg-background/70 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{competitor.name || competitor.domain || `Wettbewerber ${index + 1}`}</p>
                    <p className="text-xs text-muted-foreground">{competitor.websiteUrl || competitor.url || competitor.domain}</p>
                  </div>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                    Design {competitor.designScore ?? 'offen'}/5
                  </span>
                </div>
                {asArray<string>(competitor.palette).length > 0 && (
                  <div className="mt-4 flex gap-2">
                    {asArray<string>(competitor.palette).slice(0, 6).map((color) => (
                      <span
                        key={color}
                        className="h-7 w-7 rounded-full border border-border"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                )}
                <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                  <p><span className="text-muted-foreground">Layout:</span> {competitor.layoutPattern || 'nicht erkannt'}</p>
                  <p><span className="text-muted-foreground">Typografie:</span> {competitor.typography || 'nicht erkannt'}</p>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium">Stärken</p>
                    <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                      {asArray<string>(competitor.strengths).slice(0, 3).map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Chancen</p>
                    <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                      {asArray<string>(competitor.weaknesses).slice(0, 3).map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5">
            <h3 className="font-semibold">Ihre Lieblings-Webseiten</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Speichern Sie bis zu 3 Design-Beispiele. Wir nutzen sie später als Stilrichtung im Kundenportal und Angebot.
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {designUrls.map((url, index) => (
                <input
                  key={index}
                  value={url}
                  onChange={(event) => {
                    const next = [...designUrls];
                    next[index] = event.target.value;
                    setDesignUrls(next);
                  }}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  placeholder={`https://beispiel-${index + 1}.de`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={saveDesignReferences}
              disabled={designSaving}
              className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              {designSaving ? 'Speichert...' : 'Lieblings-Webseiten speichern'}
            </button>
            {designMessage && <p className="mt-2 text-sm text-primary">{designMessage}</p>}
          </div>
          {typeof designPayload.recommendation === 'string' && designPayload.recommendation && (
            <div className="rounded-2xl border border-border bg-background/70 p-5">
              <p className="text-sm font-semibold">Design-Empfehlung</p>
              <p className="mt-2 text-sm text-muted-foreground">{designPayload.recommendation}</p>
            </div>
          )}
        </div>
      )}

      {tab === 'performance' && (
        <div className="rounded-2xl border border-border bg-card p-6 space-y-6">
          <div>
            <h2 className="text-xl font-semibold">Performance & Google PageSpeed</h2>
            <p className="text-sm text-muted-foreground">
              Schnelle Webseiten werden besser erlebt, führen häufiger zu Anfragen und sind ein wichtiges Signal für Google.
              Unser Ziel: Ihre neue WebWelle-Seite technisch so aufzubauen, dass starke Scores über 90 erreichbar sind.
            </p>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {performanceSites.map((site, index) => (
              <div key={`${site.domain}-${index}`} className="rounded-2xl border border-border bg-background/70 p-5">
                <p className="font-semibold">{site.name || site.domain || `Website ${index + 1}`}</p>
                <p className="text-xs text-muted-foreground">{site.websiteUrl || site.url}</p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <ScorePill label="Handy" score={site.mobileScore ?? site.performanceScore} />
                  <ScorePill label="Desktop" score={site.desktopScore} />
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <ScorePill label="SEO" score={site.lighthouseSeoScore} />
                  <ScorePill label="A11y" score={site.accessibilityScore} />
                  <ScorePill label="Best" score={site.bestPracticesScore} />
                </div>
                {(site.narrative || site.psiNote) && (
                  <p className="mt-3 text-sm text-muted-foreground">{site.narrative || site.psiNote}</p>
                )}
              </div>
            ))}
            {performanceSites.length === 0 && (
              <p className="text-sm text-muted-foreground">Performance-Daten werden geladen...</p>
            )}
          </div>
        </div>
      )}

      {tab === 'recommendation' && (
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <h2 className="text-xl font-semibold">Empfehlung & Paket-Module</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              ['Website StarterWelle', 'Der schnelle Einstieg: klare Struktur, lokale Sichtbarkeit und ein professioneller erster Eindruck.'],
              ['SEO-Landingpages', 'Gezielte Seiten für Leistungen und Orte, damit Google und Kunden Ihr Angebot besser verstehen.'],
              ['Admin-Dashboard / Backend', 'Inhalte, Anfragen und Abläufe lassen sich selbst verwalten, statt jedes Mal Entwicklung zu brauchen.'],
              ['Online-Shop oder Terminbuchung', 'Direkte Buchungen oder Verkäufe reduzieren Rückfragen und bringen mehr Umsatz aus Besuchern.'],
              ['Social-Media & KI-Automatisierung', 'Regelmäßige Inhalte und smarte Automationen sparen Zeit und halten Kundenkontakte warm.'],
              ['Blog-Paket 5 oder 10 Artikel', 'Blogartikel beantworten echte Kundenfragen und bauen langfristig Google-Reichweite auf.'],
            ].map(([label, description]) => (
              <div key={label} className="rounded-2xl border border-primary/30 bg-primary/5 p-5">
                <p className="font-semibold">{label}</p>
                <p className="mt-2 text-sm text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
          {recommendations.length > 0 && (
            <div className="rounded-2xl border border-border bg-background/70 p-5">
              <p className="font-semibold">Aus der Branchenanalyse</p>
              <div className="mt-3 space-y-3">
                {recommendations.slice(0, 4).map((recommendation, index) => (
                  <div key={`${recommendation.label}-${index}`}>
                    <p className="text-sm font-medium">{recommendation.label}</p>
                    {recommendation.description && (
                      <p className="text-sm text-muted-foreground">{recommendation.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
