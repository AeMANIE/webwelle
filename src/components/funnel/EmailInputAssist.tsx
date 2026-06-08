'use client';

import { useEffect, useRef } from 'react';
import {
  emailNeedsTypoConfirmation,
  getInlineEmailCompletion,
  validateEmail,
} from '@/lib/validation';

const inputClass =
  'relative z-10 w-full rounded-lg border border-border bg-transparent px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:outline-none';

export interface EmailInputAssistProps {
  value: string;
  onChange: (value: string) => void;
  onTypoResolvedChange?: (resolved: boolean) => void;
  id?: string;
  required?: boolean;
}

export default function EmailInputAssist({
  value,
  onChange,
  onTypoResolvedChange,
  id = 'funnel-email',
  required = true,
}: EmailInputAssistProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const completion = getInlineEmailCompletion(value);
  const targetEmail = value.trim().toLowerCase();
  const emailValid = targetEmail ? validateEmail(targetEmail) : false;
  const needsTypoConfirm = emailNeedsTypoConfirmation(value);

  useEffect(() => {
    onTypoResolvedChange?.(!needsTypoConfirm);
  }, [needsTypoConfirm, onTypoResolvedChange]);

  function acceptCompletion() {
    if (!completion) return;
    onChange(completion.full);
    requestAnimationFrame(() => {
      const el = inputRef.current;
      if (el) {
        // Für `input[type="email"]` ist das Setzen von selectionStart/Ende in manchen
        // Browsern nicht erlaubt (InvalidStateError). Daher robust:
        // - versuchen, per setSelectionRange Cursor ans Ende zu setzen
        // - wenn das fehlschlägt, mindestens focus setzen
        try {
          if (typeof el.setSelectionRange === 'function') {
            el.setSelectionRange(completion.full.length, completion.full.length);
          }
        } catch {
          // no-op: Cursorposition ist nicht kritisch
        }
        el.focus();
      }
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!completion) return;

    if (e.key === 'Tab') {
      e.preventDefault();
      acceptCompletion();
      return;
    }

    if (e.key === 'ArrowRight') {
      const el = inputRef.current;
      if (!el) return;
      const atEnd = el.selectionStart === value.length && el.selectionEnd === value.length;
      if (atEnd) {
        e.preventDefault();
        acceptCompletion();
      }
    }
  }

  function handleBlur() {
    if (!completion || !inputRef.current) return;
    const el = inputRef.current;
    const atEnd = el.selectionStart === value.length;
    if (!atEnd) return;

    if (needsTypoConfirm && completion.full !== value.trim().toLowerCase()) {
      onChange(completion.full);
    }
  }

  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium">
        E-Mail
      </label>

      <div className="relative mt-0 rounded-lg border border-border bg-background focus-within:ring-2 focus-within:ring-primary">
        {completion?.suffix ? (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-0 flex items-center overflow-hidden whitespace-pre px-4 py-2.5 text-sm"
          >
            <span className="invisible max-w-full truncate">{value}</span>
            <span className="text-muted-foreground/55 shrink-0">{completion.suffix}</span>
          </div>
        ) : null}

        <input
          ref={inputRef}
          id={id}
          type="email"
          required={required}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          className={inputClass}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
        />
      </div>

      {completion?.suffix && (
        <p className="mt-1.5 text-xs text-muted-foreground">
          <kbd className="rounded border border-border px-1 py-0.5 text-[10px]">Tab</kbd>
          {' '}oder{' '}
          <kbd className="rounded border border-border px-1 py-0.5 text-[10px]">→</kbd>
          {' '}
          zum Übernehmen — Sie können jederzeit weiter tippen und korrigieren.
        </p>
      )}

      {emailValid && !needsTypoConfirm && (
        <p className="mt-1 text-xs text-muted-foreground">
          Portal-Link wird an{' '}
          <span className="font-semibold text-foreground">{targetEmail}</span> gesendet.
        </p>
      )}

      {needsTypoConfirm && !emailValid && completion && (
        <p className="mt-1 text-xs text-amber-400/90">
          Domain prüfen — Vorschlag im Feld mit Tab übernehmen oder manuell anpassen.
        </p>
      )}
    </div>
  );
}

export function isEmailSubmitAllowed(email: string): boolean {
  const trimmed = email.trim().toLowerCase();
  if (!validateEmail(trimmed)) return false;
  if (emailNeedsTypoConfirmation(trimmed)) return false;
  return true;
}
