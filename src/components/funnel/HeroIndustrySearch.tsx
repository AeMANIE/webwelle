'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShinyButton } from '@/components/ui/shiny-button';
import { ShinyInput } from '@/components/ui/shiny-input';
import { SHINY_SWEEP_PRESETS } from '@/components/ui/shiny-motion';
import { persistLeadToken } from '@/lib/funnel/client';

const PLACEHOLDER =
  'Ihre Branche – z. B. Malerbetrieb, Physiotherapie, Online-Shop …';

export interface HeroIndustrySearchProps {
  /**
   * Ein Funnel für alle Einstiege (Hero + Pakete).
   * `card` = nur schmalere Darstellung im Paket-Kasten, gleicher Ablauf.
   */
  variant?: 'hero' | 'card';
  inputId?: string;
  className?: string;
  /** Nur Tracking (optional), z. B. homepage_hero oder products_businesswelle */
  source?: string;
}

export default function HeroIndustrySearch({
  variant = 'hero',
  inputId = 'hero-industry',
  className,
  source,
}: HeroIndustrySearchProps) {
  const isCard = variant === 'card';
  const router = useRouter();
  const [industry, setIndustry] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<{
    raw: string;
    proposed: string;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);

  const leadSource = source ?? 'homepage_hero';

  useEffect(() => {
    if (!isCard || (!pendingConfirm && !error)) return;
    feedbackRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [pendingConfirm, error, isCard]);

  async function parseApiResponse(res: Response): Promise<Record<string, unknown>> {
    const text = await res.text();
    if (!text) {
      throw new Error('empty_response');
    }
    try {
      return JSON.parse(text) as Record<string, unknown>;
    } catch {
      throw new Error('invalid_json');
    }
  }

  async function startLead(
    trimmed: string,
    acceptNormalized?: string
  ): Promise<boolean> {
    const res = await fetch('/api/funnel/leads/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        industry: trimmed,
        source: leadSource,
        ...(acceptNormalized ? { acceptNormalized } : {}),
      }),
    });

    const data = await parseApiResponse(res);
    if (!res.ok) {
      const msg =
        (typeof data.message === 'string' && data.message) ||
        (typeof data.error === 'string' && data.error) ||
        (res.status === 500
          ? 'Serverfehler – prüfen Sie DATABASE_URL in .env.local und starten Sie den Dev-Server neu.'
          : 'Start fehlgeschlagen');
      setError(msg);
      return false;
    }

    if (data.needsConfirmation && data.proposedNormalized) {
      setPendingConfirm({
        raw: trimmed,
        proposed: String(data.proposedNormalized),
      });
      setError(null);
      return false;
    }

    const token = typeof data.token === 'string' ? data.token : '';
    if (!token) {
      setError('Ungültige Server-Antwort (kein Token).');
      return false;
    }

    persistLeadToken(token);
    router.push(`/funnel-2?t=${encodeURIComponent(token)}`);
    return true;
  }

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    const trimmed = industry.trim();
    if (trimmed.length < 2) {
      setError('Bitte geben Sie Ihre Branche ein (mindestens 2 Zeichen).');
      inputRef.current?.focus();
      return;
    }

    setLoading(true);
    setError(null);
    setPendingConfirm(null);

    try {
      await startLead(trimmed);
    } catch (err) {
      if (err instanceof Error && err.message === 'invalid_json') {
        setError(
          'Server antwortet ungültig (oft fehlt DATABASE_URL). .env.local prüfen und „npm run dev“ neu starten.'
        );
      } else if (err instanceof Error && err.message === 'empty_response') {
        setError('Keine Antwort vom Server. Dev-Server läuft?');
      } else {
        setError('Verbindungsfehler. Bitte erneut versuchen.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function confirmNormalization() {
    if (!pendingConfirm) return;
    setLoading(true);
    setError(null);
    try {
      const ok = await startLead(
        pendingConfirm.raw,
        pendingConfirm.proposed
      );
      if (ok) setPendingConfirm(null);
    } catch (err) {
      if (err instanceof Error && err.message === 'invalid_json') {
        setError(
          'Server antwortet ungültig (oft fehlt DATABASE_URL). .env.local prüfen und „npm run dev“ neu starten.'
        );
      } else {
        setError('Verbindungsfehler. Bitte erneut versuchen.');
      }
    } finally {
      setLoading(false);
    }
  }

  function dismissConfirmation() {
    setPendingConfirm(null);
    setError(null);
    inputRef.current?.focus();
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className={
        className ??
        (isCard
          ? 'w-full relative z-20 isolate'
          : 'mt-2 max-w-xl mx-auto w-full relative z-50')
      }
    >
      <label htmlFor={inputId} className="sr-only">
        Branche
      </label>
      <div
        className={
          isCard
            ? 'relative flex flex-col gap-3 items-stretch'
            : 'relative flex flex-col sm:flex-row gap-3 items-stretch'
        }
      >
        <ShinyInput
          ref={inputRef}
          id={inputId}
          type="text"
          value={industry}
          onChange={(e) => {
            setIndustry(e.target.value);
            if (pendingConfirm) setPendingConfirm(null);
          }}
          placeholder={PLACEHOLDER}
          autoComplete="off"
          disabled={loading}
          sweepConfig={{
            ...SHINY_SWEEP_PRESETS.input,
            paused: loading,
          }}
          wrapperClassName="flex-1"
        />
        <ShinyButton
          type={isCard ? 'button' : 'submit'}
          disabled={loading || Boolean(pendingConfirm)}
          onClick={
            isCard
              ? (e) => {
                  e.preventDefault();
                  void handleSubmit();
                }
              : undefined
          }
          labelClassName={
            loading ? 'uppercase tracking-wide' : '!text-orange-400 uppercase tracking-wide'
          }
          sweepConfig={{
            ...SHINY_SWEEP_PRESETS.button,
            paused: loading,
          }}
          className={
            isCard
              ? 'w-full shrink-0 px-8'
              : 'w-full sm:w-auto sm:min-w-[240px] shrink-0 px-8'
          }
        >
          {loading ? 'Starte…' : 'ANALYSE STARTEN'}
        </ShinyButton>
      </div>

      <div ref={feedbackRef}>
      {pendingConfirm && (
        <div
          className="mt-4 rounded-lg border border-primary/30 bg-[#0c111b] p-4 text-left"
          role="dialog"
          aria-labelledby={`${inputId}-confirm-title`}
        >
          <p
            id={`${inputId}-confirm-title`}
            className="text-sm text-foreground mb-3"
          >
            Für die Analyse nutzen wir:{' '}
            <strong className="text-primary">{pendingConfirm.proposed}</strong>
            . Stimmt das?
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <ShinyButton
              type="button"
              disabled={loading}
              onClick={() => void confirmNormalization()}
              className="w-full sm:flex-1"
            >
              Ja, weiter
            </ShinyButton>
            <button
              type="button"
              disabled={loading}
              onClick={dismissConfirmation}
              className="w-full sm:flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted/30 transition-colors"
            >
              Nein, anpassen
            </button>
          </div>
        </div>
      )}

      {error && !pendingConfirm && (
        <p
          className={`mt-2 text-sm text-amber-400 ${isCard ? 'text-left' : 'text-left sm:text-center'}`}
          role="alert"
        >
          {error}
        </p>
      )}
      </div>
    </form>
  );
}
