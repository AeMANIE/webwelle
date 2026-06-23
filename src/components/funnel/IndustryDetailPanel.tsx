'use client';

import { useEffect, useState } from 'react';
import {
  hasValidIndustryDetail,
  INDUSTRY_DETAIL_MIN_LENGTH,
  isGenericIndustry,
} from '@/lib/funnel/industry';
import { CUSTOMER_FREE_TEXT_LIMITS } from '@/lib/funnel/input-limits';
import type { DachMarket } from '@/lib/funnel/types';

export interface IndustryDetailPanelProps {
  token: string;
  industryNormalized: string | null;
  industryRaw: string | null;
  industryDetail: string;
  market: DachMarket;
  onDetailChange: (detail: string) => void;
  onDetailSaved?: (detail: string) => void;
  onSavingChange?: (saving: boolean) => void;
}

export default function IndustryDetailPanel({
  token,
  industryNormalized,
  industryRaw,
  industryDetail,
  market,
  onDetailChange,
  onDetailSaved,
  onSavingChange,
}: IndustryDetailPanelProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [followUpQuestion, setFollowUpQuestion] = useState(
    'Welche Leistung bieten Sie konkret an?'
  );
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [selectedChip, setSelectedChip] = useState<string | null>(null);

  const needsDetail = isGenericIndustry(
    industryNormalized,
    industryRaw,
    industryDetail
  );

  useEffect(() => {
    if (!needsDetail) {
      setSuggestions([]);
      return;
    }

    const industry = (industryNormalized || industryRaw || '').trim();
    if (industry.length < 2) return;

    let cancelled = false;
    setLoadingSuggestions(true);

    fetch('/api/funnel/industry-suggestions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ industry, market }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (Array.isArray(data.suggestions)) {
          setSuggestions(data.suggestions);
        }
        if (typeof data.followUpQuestion === 'string' && data.followUpQuestion) {
          setFollowUpQuestion(data.followUpQuestion);
        }
      })
      .catch(() => {
        if (!cancelled) setSuggestions([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingSuggestions(false);
      });

    return () => {
      cancelled = true;
    };
  }, [needsDetail, industryNormalized, industryRaw, market]);

  useEffect(() => {
    if (industryDetail && suggestions.includes(industryDetail)) {
      setSelectedChip(industryDetail);
    } else if (!industryDetail) {
      setSelectedChip(null);
    }
  }, [industryDetail, suggestions]);

  async function persistDetail(detail: string) {
    const trimmed = detail.trim();
    if (!hasValidIndustryDetail(trimmed)) return false;

    setSaving(true);
    setSaveError(null);
    onSavingChange?.(true);
    try {
      const res = await fetch(`/api/funnel/leads/${token}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intent: 'industry-detail', industryDetail: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveError(data.message || 'Speichern fehlgeschlagen.');
        return false;
      }
      onDetailChange(trimmed);
      onDetailSaved?.(trimmed);
      return true;
    } catch {
      setSaveError('Verbindungsfehler. Bitte erneut versuchen.');
      return false;
    } finally {
      setSaving(false);
      onSavingChange?.(false);
    }
  }

  async function selectChip(label: string) {
    setSelectedChip(label);
    onDetailChange(label);
    await persistDetail(label);
  }

  async function handleFreeTextBlur() {
    if (!hasValidIndustryDetail(industryDetail)) return;
    if (selectedChip === industryDetail.trim()) return;
    setSelectedChip(null);
    await persistDetail(industryDetail);
  }

  const detailLimit = CUSTOMER_FREE_TEXT_LIMITS.industry_detail;
  const detailLength = industryDetail.trim().length;

  if (!needsDetail) return null;

  const detailValid = hasValidIndustryDetail(industryDetail);

  return (
    <section
      className="mb-6 rounded-xl border border-primary/35 bg-primary/5 p-4 md:p-5"
      aria-labelledby="industry-detail-heading"
    >
      <h2 id="industry-detail-heading" className="text-lg font-semibold mb-1">
        Ihre Branche ist sehr allgemein
      </h2>
      <p className="text-sm text-muted-foreground mb-4">{followUpQuestion}</p>

      {loadingSuggestions && (
        <p className="text-xs text-muted-foreground mb-3">Vorschläge werden geladen…</p>
      )}

      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {suggestions.map((label) => (
            <button
              key={label}
              type="button"
              disabled={saving}
              onClick={() => void selectChip(label)}
              className={
                `px-3 py-2 rounded-full text-sm border min-h-[44px] transition-colors ` +
                (selectedChip === label
                  ? 'border-primary bg-primary/20 text-primary font-medium'
                  : 'border-border hover:border-primary/50')
              }
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <label htmlFor="industry-detail-input" className="block text-sm font-medium mb-2">
        Oder in eigenen Worten beschreiben
      </label>
      <input
        id="industry-detail-input"
        value={industryDetail}
        maxLength={detailLimit.max}
        onChange={(e) => {
          setSelectedChip(null);
          onDetailChange(e.target.value);
          setSaveError(null);
        }}
        onBlur={() => void handleFreeTextBlur()}
        disabled={saving}
        placeholder="z. B. Gebäudereinigung für Büros, Elektroinstallation, Online-Shop für Sportartikel …"
        className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm"
      />
      <p className="text-xs text-muted-foreground mt-2">
        {detailLength.toLocaleString('de-DE')} / {detailLimit.max.toLocaleString('de-DE')} Zeichen ·
        mindestens {INDUSTRY_DETAIL_MIN_LENGTH} Zeichen
        {detailValid ? (
          <span className="text-emerald-500 ml-2">✓ Ausreichend konkret</span>
        ) : null}
      </p>

      {saveError && (
        <p className="text-amber-400 text-sm mt-2" role="alert">
          {saveError}
        </p>
      )}
    </section>
  );
}
