'use client';

import { useEffect, useState } from 'react';
import { getSelectedOptionalItems } from '@/lib/funnel/design-wishes';
import {
  calculateFunnelOfferTotal,
  formatEuro,
  hasBlogSelection,
  labelForPreference,
  normalizeAddonSelection,
  normalizeDesignPreferences,
  INFORMATION_DENSITY_OPTIONS,
  INTERACTIVE_ELEMENT_OPTIONS,
  VISUAL_STYLE_OPTIONS,
  BLOG_BUNDLE_10,
  SEO_PROFI_ADDON,
  BLOG_UNIT_PRICE_CENTS,
  seoProfiIncluded,
} from '@/lib/funnel/packages';

interface EnrichedLead {
  lead: {
    id: string;
    token: string;
    status: string;
    industry_normalized?: string;
    company_name?: string;
    email?: string;
    postal_code?: string;
    city?: string;
    market?: string;
    selected_package?: string;
    existing_website?: boolean | null;
    existing_website_url?: string | null;
    design_reference_urls?: string[];
    addon_selection?: unknown;
    design_preferences?: unknown;
  };
  offer?: { id: string; status: string; total_cents: number; package_type?: string };
  research?: Array<{ workflow_key: string; status: string }>;
  discount?: { delivery_window: string; discount_cents: number };
}

export default function OffersTab() {
  const [items, setItems] = useState<EnrichedLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/funnel-leads');
      const data = await res.json();
      setItems(data.leads || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function sendDocuseal(offerId: string) {
    setActionId(offerId);
    try {
      const res = await fetch(`/api/admin/offers/${offerId}/send-docuseal`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) alert(`DocuSeal gesendet. Link: ${data.signingUrl || 'E-Mail versendet'}`);
      else alert(data.message || data.error || 'Fehler');
      await load();
    } finally {
      setActionId(null);
    }
  }

  async function createCheckout(offerId: string) {
    setActionId(offerId);
    try {
      const res = await fetch(`/api/admin/offers/${offerId}/create-checkout`, { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.url) window.open(data.url, '_blank');
      else alert(data.message || data.error || 'Fehler');
      await load();
    } finally {
      setActionId(null);
    }
  }

  async function startBlogPipeline(leadToken: string) {
    setActionId(`blog-${leadToken}`);
    try {
      const res = await fetch('/api/blog/start-pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadToken }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Blog-Pipeline Job #${data.jobId} gestartet.`);
      } else {
        alert(data.message || data.error || 'Pipeline-Start fehlgeschlagen');
      }
    } finally {
      setActionId(null);
    }
  }

  if (loading) return <p className="py-8 text-center">Lade Leads…</p>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Leads & Angebote ({items.length})</h2>
      {items.length === 0 ? (
        <p className="text-muted-foreground">Noch keine Funnel-Leads.</p>
      ) : (
        <div className="space-y-4">
          {items.map(({ lead, offer, research, discount }) => {
            const addons = normalizeAddonSelection(lead.addon_selection);
            const prefs = normalizeDesignPreferences(lead.design_preferences);
            const selectedOptional = getSelectedOptionalItems(
              prefs.optionalItems,
              prefs.selectedOptionalIds
            );
            const hasNewDesignPrefs =
              prefs.includedItems.length > 0 ||
              selectedOptional.length > 0 ||
              prefs.selectedOptionalIds.length > 0;
            const hasLegacyDesignPrefs = Boolean(
              prefs.interactiveElements || prefs.informationDensity || prefs.visualStyle
            );
            const breakdown = calculateFunnelOfferTotal(addons);
            const designUrls = (lead.design_reference_urls || []).filter(Boolean);

            return (
              <div key={lead.id} className="rounded-xl border border-border bg-card p-5">
                <div className="flex flex-wrap justify-between gap-2 mb-3">
                  <div>
                    <p className="font-semibold">
                      {lead.company_name || lead.industry_normalized || 'Lead'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {lead.email || '–'} · PLZ {lead.postal_code} {lead.city} · {lead.market}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Website:{' '}
                      {lead.existing_website === true ? (
                        lead.existing_website_url ? (
                          <a
                            href={lead.existing_website_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary underline"
                          >
                            {lead.existing_website_url}
                          </a>
                        ) : (
                          'Bestehend (URL fehlt)'
                        )
                      ) : lead.existing_website === false ? (
                        'Neue Website gewünscht'
                      ) : (
                        'Noch nicht angegeben'
                      )}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded bg-muted">{lead.status}</span>
                </div>

                <p className="text-sm mb-3">
                  Research: {research?.filter((r) => r.status === 'done').length || 0} /{' '}
                  {research?.length || 0} Workflows
                  {discount && (
                    <span className="ml-2">
                      · Rabatt: {(discount.discount_cents / 100).toFixed(0)} EUR (
                      {discount.delivery_window})
                    </span>
                  )}
                </p>

                <div className="grid gap-3 md:grid-cols-2 mb-3">
                  <div className="rounded-lg border border-border bg-background/50 p-3 text-sm">
                    <p className="font-medium mb-2">Zusatzpakete</p>
                    {addons.blogMode === 'none' && !addons.seoProfi ? (
                      <p className="text-muted-foreground">Keine gewählt</p>
                    ) : (
                      <ul className="space-y-1 text-muted-foreground">
                        {(addons.seoProfi || seoProfiIncluded(addons)) && (
                          <li>
                            {SEO_PROFI_ADDON.name}
                            {seoProfiIncluded(addons) ? ' (inkl. bei Blog)' : ''}
                          </li>
                        )}
                        {addons.blogMode === 'bundle_10' && <li>{BLOG_BUNDLE_10.name}</li>}
                        {addons.blogMode === 'custom' && (
                          <li>
                            Blog {addons.blogCount}× à {formatEuro(BLOG_UNIT_PRICE_CENTS)}
                          </li>
                        )}
                      </ul>
                    )}
                  </div>
                  <div className="rounded-lg border border-border bg-background/50 p-3 text-sm">
                    <p className="font-medium mb-2">Design-Wünsche</p>
                    {hasNewDesignPrefs ? (
                      <div className="space-y-2 text-muted-foreground">
                        {prefs.includedItems.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                              Inklusive
                            </p>
                            <ul className="space-y-1 mt-1">
                              {prefs.includedItems.map((item) => (
                                <li key={item.id}>• {item.label}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-semibold">Gewählt (optional)</p>
                          {selectedOptional.length > 0 ? (
                            <ul className="space-y-1 mt-1">
                              {selectedOptional.map((item) => (
                                <li key={item.id}>• {item.label}</li>
                              ))}
                            </ul>
                          ) : (
                            <p className="mt-1">Keine optionalen Design-Wünsche</p>
                          )}
                        </div>
                      </div>
                    ) : hasLegacyDesignPrefs ? (
                      <ul className="space-y-1 text-muted-foreground">
                        <li>
                          Interaktiv:{' '}
                          {labelForPreference(
                            INTERACTIVE_ELEMENT_OPTIONS,
                            prefs.interactiveElements
                          )}
                        </li>
                        <li>
                          Dichte:{' '}
                          {labelForPreference(
                            INFORMATION_DENSITY_OPTIONS,
                            prefs.informationDensity
                          )}
                        </li>
                        <li>
                          Stil:{' '}
                          {labelForPreference(VISUAL_STYLE_OPTIONS, prefs.visualStyle)}
                        </li>
                      </ul>
                    ) : (
                      <p className="text-muted-foreground">Noch keine Design-Wünsche</p>
                    )}
                  </div>
                </div>

                {designUrls.length > 0 && (
                  <div className="mb-3 rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">
                    <p className="font-medium mb-1">Lieblings-Webseiten</p>
                    <ul className="space-y-1">
                      {designUrls.map((url) => (
                        <li key={url}>
                          <a
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary underline break-all"
                          >
                            {url}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <p className="text-sm font-semibold text-primary mb-3">
                  Preis-Vorschau: {formatEuro(breakdown.subtotalCents)} (StarterWelle + Add-ons)
                </p>

                {offer ? (
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-sm">
                      Angebot: {offer.package_type} – {(offer.total_cents / 100).toFixed(2)} EUR (
                      {offer.status})
                    </span>
                    <button
                      type="button"
                      disabled={actionId === offer.id}
                      onClick={() => sendDocuseal(offer.id)}
                      className="text-sm px-3 py-1 rounded bg-brand text-brand-foreground"
                    >
                      DocuSeal senden
                    </button>
                    <button
                      type="button"
                      disabled={actionId === offer.id || offer.status !== 'signed'}
                      onClick={() => createCheckout(offer.id)}
                      className="text-sm px-3 py-1 rounded border border-primary text-primary"
                    >
                      Stripe Checkout
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Noch kein Angebot erstellt</p>
                )}
                <div className="flex flex-wrap gap-2 mt-2 items-center">
                  <a
                    href={`/analyse/${lead.token}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-primary underline"
                  >
                    Analyse ansehen
                  </a>
                  {hasBlogSelection(addons) && (
                    <button
                      type="button"
                      disabled={actionId === `blog-${lead.token}`}
                      onClick={() => startBlogPipeline(lead.token)}
                      className="text-xs px-2 py-1 rounded bg-brand text-brand-foreground hover:bg-brand/90"
                    >
                      Blog-Pipeline starten
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
