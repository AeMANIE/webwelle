'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import FunnelShell from '@/components/funnel/FunnelShell';
import { StarterWellePrice } from '@/components/funnel/StarterWellePrice';
import { ShinyButton } from '@/components/ui/shiny-button';
import {
  getSelectedOptionalItems,
  resolveDesignWishes,
} from '@/lib/funnel/design-wishes';
import {
  calculateFunnelOfferTotal,
  formatEuro,
  labelForPreference,
  normalizeAddonSelection,
  normalizeDesignPreferences,
  STARTERWELLE,
  INFORMATION_DENSITY_OPTIONS,
  INTERACTIVE_ELEMENT_OPTIONS,
  VISUAL_STYLE_OPTIONS,
  BLOG_BUNDLE_10,
  SEO_PROFI_ADDON,
  BLOG_UNIT_PRICE_CENTS,
  seoProfiIncluded,
} from '@/lib/funnel/packages';

type ResearchRow = {
  workflow_key: string;
  status: string;
  payload: Record<string, unknown> | null;
};

function Funnel6Content() {
  const searchParams = useSearchParams();
  const token = searchParams.get('t') || '';
  const [lead, setLead] = useState<Record<string, unknown> | null>(null);
  const [research, setResearch] = useState<ResearchRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/funnel/leads/${token}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.lead) setLead(d.lead);
        if (d.research) setResearch(d.research);
      });
  }, [token]);

  const addonSelection = useMemo(
    () => normalizeAddonSelection(lead?.addon_selection),
    [lead?.addon_selection]
  );
  const designPrefs = useMemo(
    () => normalizeDesignPreferences(lead?.design_preferences),
    [lead?.design_preferences]
  );
  const breakdown = useMemo(
    () => calculateFunnelOfferTotal(addonSelection),
    [addonSelection]
  );
  const designUrls = ((lead?.design_reference_urls as string[]) || []).filter(Boolean);

  const resolvedFromResearch = useMemo(() => {
    const competitor = research.find((r) => r.workflow_key === 'competitor_design');
    return resolveDesignWishes(competitor?.payload ?? {});
  }, [research]);

  const includedItems = useMemo(() => {
    if (designPrefs.includedItems.length > 0) return designPrefs.includedItems;
    return resolvedFromResearch.included;
  }, [designPrefs.includedItems, resolvedFromResearch.included]);

  const optionalItems = useMemo(() => {
    if (designPrefs.optionalItems.length > 0) return designPrefs.optionalItems;
    return resolvedFromResearch.optional;
  }, [designPrefs.optionalItems, resolvedFromResearch.optional]);

  const selectedOptionalItems = useMemo(
    () => getSelectedOptionalItems(optionalItems, designPrefs.selectedOptionalIds),
    [optionalItems, designPrefs.selectedOptionalIds]
  );

  const hasLegacyDesignPrefs = Boolean(
    designPrefs.interactiveElements ||
      designPrefs.informationDensity ||
      designPrefs.visualStyle
  );

  const hasNewDesignPrefs =
    includedItems.length > 0 ||
    selectedOptionalItems.length > 0 ||
    designPrefs.selectedOptionalIds.length > 0;

  async function submit() {
    setLoading(true);
    setError(null);
    try {
      const patchRes = await fetch(`/api/funnel/leads/${token}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intent: 'package' }),
      });
      if (!patchRes.ok) {
        const d = await patchRes.json();
        setError(d.message || 'Speichern fehlgeschlagen');
        return;
      }

      const offerRes = await fetch('/api/funnel/offers/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      if (!offerRes.ok) {
        const d = await offerRes.json();
        setError(d.message || 'Angebotsanfrage fehlgeschlagen');
        return;
      }
      setDone(true);
    } catch {
      setError('Verbindungsfehler. Bitte erneut versuchen.');
    } finally {
      setLoading(false);
    }
  }

  if (!token) return <p>Session fehlt.</p>;

  if (done) {
    return (
      <FunnelShell step={6} token={token}>
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Vielen Dank!</h1>
          <p className="text-muted-foreground">
            Wir erstellen Ihr individuelles Angebot auf Basis Ihrer Auswahl und senden es per E-Mail
            zur Unterschrift (DocuSeal). Nach der Signatur erhalten Sie den Zahlungslink.
          </p>
        </div>
      </FunnelShell>
    );
  }

  return (
    <FunnelShell step={6} token={token}>
      <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Ihr Angebot – Zusammenfassung</h1>
          <p className="text-sm text-muted-foreground mt-1">
            StarterWelle Festpaket plus Ihre gewählten Zusatzleistungen und Design-Wünsche.
          </p>
        </div>

        <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-primary">
                {STARTERWELLE.name}
              </p>
              <p className="text-sm text-muted-foreground">{STARTERWELLE.termLabel} · Festpreis</p>
            </div>
            <StarterWellePrice size="md" align="right" />
          </div>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            {STARTERWELLE.features.map((feature) => (
              <li key={feature}>• {feature}</li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-border bg-background/60 p-5 space-y-3">
          <h2 className="font-semibold">Gewählte Zusatzpakete</h2>
          {addonSelection.blogMode === 'none' &&
          !addonSelection.seoProfi ? (
            <p className="text-sm text-muted-foreground">Keine Zusatzpakete gewählt.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {(addonSelection.seoProfi || seoProfiIncluded(addonSelection)) && (
                <li>
                  • {SEO_PROFI_ADDON.name}
                  {seoProfiIncluded(addonSelection)
                    ? ' (inklusive bei Blog-Paket)'
                    : ` – ${formatEuro(SEO_PROFI_ADDON.priceCents)}`}
                </li>
              )}
              {addonSelection.blogMode === 'bundle_10' && (
                <li>• {BLOG_BUNDLE_10.name} – {formatEuro(BLOG_BUNDLE_10.priceCents)}</li>
              )}
              {addonSelection.blogMode === 'custom' && (
                <li>
                  • Blog-Artikel ({addonSelection.blogCount}×) –{' '}
                  {formatEuro(addonSelection.blogCount * BLOG_UNIT_PRICE_CENTS)}
                </li>
              )}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-border bg-background/60 p-5 space-y-4">
          <h2 className="font-semibold">Design-Wünsche</h2>

          {hasNewDesignPrefs ? (
            <>
              <div>
                <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 mb-2">
                  In StarterWelle enthalten
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {includedItems.map((item) => (
                    <li key={item.id}>
                      • {item.label}
                      {item.sourceSnippet && (
                        <span className="block text-xs italic mt-0.5">„{item.sourceSnippet}"</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Gewählte Zusatz-Designwünsche</p>
                {selectedOptionalItems.length > 0 ? (
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {selectedOptionalItems.map((item) => (
                      <li key={item.id}>
                        • {item.label}
                        {item.sourceSnippet && (
                          <span className="block text-xs italic mt-0.5">
                            „{item.sourceSnippet}"
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Keine zusätzlichen Design-Wünsche gewählt.
                  </p>
                )}
              </div>
            </>
          ) : hasLegacyDesignPrefs ? (
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>
                Interaktive Elemente:{' '}
                {labelForPreference(INTERACTIVE_ELEMENT_OPTIONS, designPrefs.interactiveElements)}
              </li>
              <li>
                Informationsdichte:{' '}
                {labelForPreference(INFORMATION_DENSITY_OPTIONS, designPrefs.informationDensity)}
              </li>
              <li>
                Visuelle Gestaltung:{' '}
                {labelForPreference(VISUAL_STYLE_OPTIONS, designPrefs.visualStyle)}
              </li>
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              Noch keine Design-Wünsche gespeichert.
            </p>
          )}

          {designUrls.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Lieblings-Webseiten</p>
              <ul className="space-y-1">
                {designUrls.map((url) => (
                  <li key={url}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-primary underline break-all"
                    >
                      {url}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="rounded-xl border-2 border-primary/40 bg-primary/5 p-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-lg font-bold">
            Geschätzter Gesamtpreis: {formatEuro(breakdown.subtotalCents)}
          </p>
          <p className="text-xs text-muted-foreground">zzgl. MwSt. · individuelles Angebot folgt</p>
        </div>

        {error && (
          <p className="text-sm text-amber-400" role="alert">
            {error}
          </p>
        )}

        <ShinyButton type="button" onClick={submit} disabled={loading} className="w-full">
          {loading ? 'Wird gesendet…' : 'Individuelles Angebot anfordern'}
        </ShinyButton>
      </div>
    </FunnelShell>
  );
}

export default function Funnel6Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">Laden…</div>
      }
    >
      <Funnel6Content />
    </Suspense>
  );
}
