'use client';

import { useEffect, useState } from 'react';

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

  if (loading) return <p className="py-8 text-center">Lade Leads…</p>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Leads & Angebote ({items.length})</h2>
      {items.length === 0 ? (
        <p className="text-muted-foreground">Noch keine Funnel-Leads.</p>
      ) : (
        <div className="space-y-4">
          {items.map(({ lead, offer, research, discount }) => (
            <div key={lead.id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex flex-wrap justify-between gap-2 mb-3">
                <div>
                  <p className="font-semibold">
                    {lead.company_name || lead.industry_normalized || 'Lead'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {lead.email || '–'} · PLZ {lead.postal_code} {lead.city} · {lead.market}
                  </p>
                </div>
                <span className="text-xs px-2 py-1 rounded bg-muted">{lead.status}</span>
              </div>
              <p className="text-sm mb-2">
                Research: {research?.filter((r) => r.status === 'done').length || 0} /{' '}
                {research?.length || 0} Workflows
                {discount && (
                  <span className="ml-2">
                    · Rabatt: {(discount.discount_cents / 100).toFixed(0)} EUR (
                    {discount.delivery_window})
                  </span>
                )}
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
                    className="text-sm px-3 py-1 rounded bg-primary text-primary-foreground"
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
              <a
                href={`/analyse/${lead.token}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-primary underline mt-2 inline-block"
              >
                Analyse ansehen
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
