'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import FunnelShell from '@/components/funnel/FunnelShell';
import IndustryDetailPanel from '@/components/funnel/IndustryDetailPanel';
import { ShinyButton } from '@/components/ui/shiny-button';
import {
  hasValidIndustryDetail,
  isGenericIndustry,
  leadRequiresIndustryDetail,
} from '@/lib/funnel/industry';
import { marketLabel, validatePostalCode } from '@/lib/funnel/market';
import type { DachMarket } from '@/lib/funnel/types';

function Funnel2Content() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('t') || '';

  const [lead, setLead] = useState<{
    industry_normalized?: string;
    industry_raw?: string;
    industry_detail?: string;
    market?: DachMarket;
    market_auto_detected?: boolean;
    postal_code?: string;
    city?: string;
  } | null>(null);
  const [industryDetail, setIndustryDetail] = useState('');
  const [leadLoaded, setLeadLoaded] = useState(false);
  const [market, setMarket] = useState<DachMarket>('DE');
  const [postalCode, setPostalCode] = useState('');
  const [city, setCity] = useState('');
  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [marketManual, setMarketManual] = useState(false);
  const [industryInput, setIndustryInput] = useState('');
  const [industrySaving, setIndustrySaving] = useState(false);
  const [industryError, setIndustryError] = useState<string | null>(null);
  const [industryPendingConfirm, setIndustryPendingConfirm] = useState<{
    raw: string;
    proposed: string;
  } | null>(null);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/funnel/leads/${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.lead) return;
        setLead(data.lead);
        setIndustryInput(
          (data.lead.industry_raw || data.lead.industry_normalized || '').trim()
        );
        if (data.lead.market) {
          setMarket(data.lead.market);
        }
        if (data.lead.postal_code) setPostalCode(String(data.lead.postal_code));
        if (data.lead.city) setCity(String(data.lead.city));
        if (data.lead.industry_detail) {
          setIndustryDetail(String(data.lead.industry_detail));
        }
      })
      .finally(() => setLeadLoaded(true));
  }, [token]);

  const needsIndustryDetail = leadLoaded
    ? isGenericIndustry(
        lead?.industry_normalized,
        lead?.industry_raw ?? industryInput,
        industryDetail
      )
    : false;

  const canStartAnalysis =
    !needsIndustryDetail || hasValidIndustryDetail(industryDetail);

  async function saveIndustry(acceptNormalized?: string) {
    const trimmed = industryInput.trim();
    if (trimmed.length < 2) {
      setIndustryError('Bitte geben Sie Ihre Branche ein (mindestens 2 Zeichen).');
      return;
    }

    setIndustrySaving(true);
    setIndustryError(null);
    setIndustryPendingConfirm(null);

    try {
      const res = await fetch(`/api/funnel/leads/${token}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intent: 'update-industry',
          industry: trimmed,
          ...(acceptNormalized ? { acceptNormalized } : {}),
        }),
      });
      const data = await res.json();

      if (data.needsConfirmation && data.proposedNormalized) {
        setIndustryPendingConfirm({
          raw: trimmed,
          proposed: String(data.proposedNormalized),
        });
        return;
      }

      if (!res.ok) {
        setIndustryError(data.message || 'Branche konnte nicht gespeichert werden.');
        return;
      }

      if (data.lead) {
        setLead(data.lead);
        setIndustryInput(
          (data.lead.industry_raw || data.lead.industry_normalized || '').trim()
        );
        if (
          isGenericIndustry(
            data.lead.industry_normalized,
            data.lead.industry_raw,
            data.lead.industry_detail
          )
        ) {
          setIndustryDetail(data.lead.industry_detail || '');
        } else {
          setIndustryDetail('');
        }
      }
    } catch {
      setIndustryError('Verbindungsfehler. Bitte erneut versuchen.');
    } finally {
      setIndustrySaving(false);
    }
  }

  async function confirmIndustryNormalization() {
    if (!industryPendingConfirm) return;
    await saveIndustry(industryPendingConfirm.proposed);
    setIndustryPendingConfirm(null);
  }

  const showCountryPicker =
    leadLoaded && (!lead?.market_auto_detected || marketManual);

  useEffect(() => {
    if (!postalCode || !validatePostalCode(market, postalCode)) return;
    const t = setTimeout(() => {
      fetch(`/api/address/postal-code?country=${market}&postalCode=${postalCode}`)
        .then((r) => r.json())
        .then((data) => {
          const list = (data.localities || []).map((l: { city: string }) => l.city);
          setCities(list);
          if (list.length === 1) setCity(list[0]);
        });
    }, 300);
    return () => clearTimeout(t);
  }, [postalCode, market]);

  async function submit() {
    if (!validatePostalCode(market, postalCode)) {
      setError('Bitte eine gültige Postleitzahl eingeben.');
      return;
    }
    if (!city.trim()) {
      setError('Bitte Stadt wählen oder eingeben.');
      return;
    }

    const leadForCheck = {
      industry_normalized: lead?.industry_normalized,
      industry_raw: lead?.industry_raw ?? industryInput,
      industry_detail: industryDetail,
    };

    setLoading(true);
    setError(null);

    if (leadRequiresIndustryDetail(leadForCheck)) {
      if (!hasValidIndustryDetail(industryDetail)) {
        setLoading(false);
        setError(
          'Bitte wählen Sie einen Vorschlag oder beschreiben Sie konkret, was Sie anbieten.'
        );
        return;
      }

      const detailRes = await fetch(`/api/funnel/leads/${token}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intent: 'industry-detail',
          industryDetail: industryDetail.trim(),
        }),
      });
      if (!detailRes.ok) {
        const detailData = await detailRes.json();
        setLoading(false);
        setError(detailData.message || 'Branchen-Details konnten nicht gespeichert werden.');
        return;
      }
    }

    const res = await fetch(`/api/funnel/leads/${token}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        intent: 'geo',
        market,
        postalCode,
        city,
        marketChosenManually: marketManual || !lead?.market_auto_detected,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.message || 'Speichern fehlgeschlagen');
      return;
    }
    router.push(`/funnel-3?t=${encodeURIComponent(token)}`);
  }

  if (!token) {
    return (
      <p className="text-center text-muted-foreground">
        Kein Session-Token. Bitte starten Sie auf der{' '}
        <a href="/" className="text-primary underline">
          Startseite
        </a>
        .
      </p>
    );
  }

  return (
    <FunnelShell step={2} token={token}>
      <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-xl">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Ihre Branche & Region</h1>
        <div className="mb-6">
          <label htmlFor="funnel2-industry" className="block text-sm font-medium mb-2">
            Ihre Branche
          </label>
          <input
            id="funnel2-industry"
            value={industryInput}
            onChange={(e) => {
              setIndustryInput(e.target.value);
              setIndustryPendingConfirm(null);
              setIndustryError(null);
            }}
            disabled={!leadLoaded || industrySaving}
            className="w-full rounded-lg border border-border bg-background px-4 py-3 mb-2"
            placeholder="z. B. Maler, Physiotherapie, Online-Shop …"
          />
          {leadLoaded && lead?.industry_normalized && (
            <p className="text-xs text-muted-foreground">
              Für die Analyse verwendet:{' '}
              <strong className="text-foreground">{lead.industry_normalized}</strong>
            </p>
          )}
          <button
            type="button"
            onClick={() => saveIndustry()}
            disabled={!leadLoaded || industrySaving}
            className="mt-3 text-sm text-primary underline hover:no-underline disabled:opacity-50"
          >
            {industrySaving ? 'Wird gespeichert…' : 'Branche übernehmen'}
          </button>
          {industryPendingConfirm && (
            <div className="mt-4 rounded-lg border border-primary/40 bg-primary/5 px-4 py-3 text-sm">
              <p className="mb-2">
                Meinten Sie{' '}
                <strong>{industryPendingConfirm.proposed}</strong>?
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={confirmIndustryNormalization}
                  disabled={industrySaving}
                  className="text-primary font-medium underline hover:no-underline"
                >
                  Ja, übernehmen
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const raw = industryPendingConfirm.raw;
                    setIndustryPendingConfirm(null);
                    void saveIndustry(raw);
                  }}
                  disabled={industrySaving}
                  className="text-muted-foreground underline hover:no-underline"
                >
                  Nein, meine Eingabe behalten
                </button>
              </div>
            </div>
          )}
          {industryError && (
            <p className="text-amber-400 text-sm mt-2">{industryError}</p>
          )}
        </div>

        {leadLoaded && lead?.market_auto_detected && !marketManual && (
          <p className="text-sm text-muted-foreground mb-4 rounded-lg border border-border bg-background/50 px-4 py-3">
            Markt:{' '}
            <strong className="text-foreground">{marketLabel(market)}</strong>
            <span className="block text-xs mt-1">
              Automatisch anhand Ihrer Verbindung erkannt – Preise und Analyse für
              den DACH-Markt. Die Erkennung kann bei VPN oder Mobilfunk abweichen.
            </span>
            <button
              type="button"
              onClick={() => setMarketManual(true)}
              className="mt-2 text-xs text-primary underline hover:no-underline"
            >
              Stimmt nicht? Land selbst wählen
            </button>
          </p>
        )}

        {showCountryPicker && (
          <>
            <p className="text-sm mb-4">
              In welchem Land sind Sie tätig? (Preise und Analyse richten sich nach
              DACH-Markt)
            </p>
            <div className="grid grid-cols-3 gap-3 mb-6">
              {(['DE', 'AT', 'CH'] as DachMarket[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMarket(m)}
                  className={
                    `py-3 rounded-lg border font-medium transition-colors ` +
                    (market === m
                      ? 'border-primary bg-primary/15 text-primary'
                      : 'border-border hover:border-primary/50')
                  }
                >
                  {marketLabel(m)}
                </button>
              ))}
            </div>
          </>
        )}

        {!leadLoaded && (
          <p className="text-sm text-muted-foreground mb-4">Laden…</p>
        )}

        <label className="block text-sm font-medium mb-2">Postleitzahl</label>
        <input
          value={postalCode}
          onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, '').slice(0, market === 'DE' ? 5 : 4))}
          className="w-full rounded-lg border border-border bg-background px-4 py-3 mb-4"
          placeholder={market === 'DE' ? '87437' : '1010'}
        />

        <label className="block text-sm font-medium mb-2">Stadt</label>
        {cities.length > 1 ? (
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-4 py-3 mb-6"
          >
            <option value="">Stadt wählen…</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        ) : (
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-4 py-3 mb-6"
            placeholder="Stadt"
          />
        )}

        <IndustryDetailPanel
          token={token}
          industryNormalized={lead?.industry_normalized ?? null}
          industryRaw={lead?.industry_raw ?? industryInput}
          industryDetail={industryDetail}
          market={market}
          onDetailChange={setIndustryDetail}
          onDetailSaved={(detail) => {
            setLead((prev) => (prev ? { ...prev, industry_detail: detail } : prev));
          }}
        />

        {error && <p className="text-amber-400 text-sm mb-4">{error}</p>}

        <ShinyButton
          type="button"
          onClick={submit}
          disabled={loading || !canStartAnalysis}
          className="w-full"
        >
          {loading ? 'Analyse wird gestartet…' : 'Analyse starten'}
        </ShinyButton>
        {needsIndustryDetail && !canStartAnalysis && (
          <p className="text-xs text-muted-foreground text-center mt-2">
            Bitte zuerst Ihre Branche konkretisieren.
          </p>
        )}
      </div>
    </FunnelShell>
  );
}

export default function Funnel2Page() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Laden…</div>}>
      <Funnel2Content />
    </Suspense>
  );
}
