'use client';

import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import IndustryDetailPanel from '@/components/funnel/IndustryDetailPanel';
import {
  hasValidIndustryDetail,
  isGenericIndustry,
  leadRequiresIndustryDetail,
} from '@/lib/funnel/industry';
import type { DachMarket } from '@/lib/funnel/types';

export type FunnelIndustryLead = {
  industry_normalized?: string;
  industry_raw?: string;
  industry_detail?: string;
  market?: DachMarket;
};

export type FunnelIndustryFieldsHandle = {
  canProceed: () => boolean;
  ensureReady: () => Promise<{ ok: boolean; message?: string }>;
};

type FunnelIndustryFieldsProps = {
  token: string;
  leadLoaded: boolean;
  lead: FunnelIndustryLead | null;
  onLeadUpdate: (patch: FunnelIndustryLead) => void;
  onCanProceedChange?: (canProceed: boolean) => void;
  inputId?: string;
  showDetailPanel?: boolean;
};

const FunnelIndustryFields = forwardRef<FunnelIndustryFieldsHandle, FunnelIndustryFieldsProps>(
  function FunnelIndustryFields(
    {
      token,
      leadLoaded,
      lead,
      onLeadUpdate,
      onCanProceedChange,
      inputId = 'funnel-industry',
      showDetailPanel = true,
    },
    ref
  ) {
    const [industryInput, setIndustryInput] = useState('');
    const [industryDetail, setIndustryDetail] = useState('');
    const [industrySaving, setIndustrySaving] = useState(false);
    const [industryError, setIndustryError] = useState<string | null>(null);
    const [industryPendingConfirm, setIndustryPendingConfirm] = useState<{
      raw: string;
      proposed: string;
    } | null>(null);

    const market: DachMarket = lead?.market || 'DE';

    useEffect(() => {
      if (!leadLoaded || !lead) return;
      setIndustryInput((lead.industry_raw || lead.industry_normalized || '').trim());
      if (lead.industry_detail) {
        setIndustryDetail(String(lead.industry_detail));
      }
    }, [leadLoaded, lead?.industry_raw, lead?.industry_normalized, lead?.industry_detail]);

    const needsIndustryDetail = leadLoaded
      ? isGenericIndustry(
          lead?.industry_normalized,
          lead?.industry_raw ?? industryInput,
          lead?.industry_detail
        )
      : false;

    const canProceed =
      leadLoaded &&
      Boolean(lead?.industry_normalized?.trim()) &&
      (!needsIndustryDetail || hasValidIndustryDetail(industryDetail));

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
          onLeadUpdate({
            industry_normalized: data.lead.industry_normalized,
            industry_raw: data.lead.industry_raw,
            industry_detail: data.lead.industry_detail,
            market: data.lead.market,
          });
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

    async function ensureReady(): Promise<{ ok: boolean; message?: string }> {
      if (!lead?.industry_normalized?.trim()) {
        return {
          ok: false,
          message: 'Bitte übernehmen Sie zuerst Ihre Branche.',
        };
      }

      const leadForCheck = {
        industry_normalized: lead.industry_normalized,
        industry_raw: lead.industry_raw ?? industryInput,
        industry_detail: industryDetail,
      };

      if (leadRequiresIndustryDetail(leadForCheck)) {
        if (!hasValidIndustryDetail(industryDetail)) {
          return {
            ok: false,
            message:
              'Bitte wählen Sie einen Vorschlag oder beschreiben Sie konkret, was Sie anbieten.',
          };
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
          return {
            ok: false,
            message: detailData.message || 'Branchen-Details konnten nicht gespeichert werden.',
          };
        }
      }

      return { ok: true };
    }

    useImperativeHandle(ref, () => ({
      canProceed: () => canProceed,
      ensureReady,
    }));

    useEffect(() => {
      onCanProceedChange?.(canProceed);
    }, [canProceed, onCanProceedChange]);

    return (
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Ihre Branche</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Damit wir Ihre Ausgangssituation besser einordnen und die Analyse auf Ihr geschäftliches
          Umfeld abstimmen können.
        </p>
        <input
          id={inputId}
          aria-label="Ihre Branche"
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
              Meinten Sie <strong>{industryPendingConfirm.proposed}</strong>?
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
        {industryError && <p className="text-amber-400 text-sm mt-2">{industryError}</p>}

        {showDetailPanel && (
          <IndustryDetailPanel
            token={token}
            industryNormalized={lead?.industry_normalized ?? null}
            industryRaw={lead?.industry_raw ?? industryInput}
            industryDetail={industryDetail}
            savedIndustryDetail={lead?.industry_detail}
            market={market}
            onDetailChange={setIndustryDetail}
            onDetailSaved={(detail) => {
              onLeadUpdate({ industry_detail: detail });
            }}
          />
        )}

        {needsIndustryDetail && !hasValidIndustryDetail(industryDetail) && (
          <p className="text-xs text-muted-foreground mt-2">
            Bitte zuerst Ihre Branche konkretisieren.
          </p>
        )}
      </div>
    );
  }
);

export default FunnelIndustryFields;
