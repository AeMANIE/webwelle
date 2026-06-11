'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import FunnelShell from '@/components/funnel/FunnelShell';
import { ShinyButton } from '@/components/ui/shiny-button';
import type { DachMarket } from '@/lib/funnel/types';
import EmailInputAssist, { isEmailSubmitAllowed } from '@/components/funnel/EmailInputAssist';
import {
  emailNeedsTypoConfirmation,
  isPhoneReadyForLiveValidation,
  validateMobileDACH,
  validatePersonName,
  validatePersonNamePair,
  type FieldValidationResult,
} from '@/lib/validation';

function FieldValidationHint({ check }: { check: FieldValidationResult | null }) {
  if (!check?.valid && check?.hint) {
    return (
      <p className="mt-1 flex items-start gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-400">
        <span className="shrink-0">⚠</span>
        {check.hint}
      </p>
    );
  }
  return null;
}

function Funnel4Content() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('t') || '';

  const [market, setMarket] = useState<DachMarket>('DE');
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    companyName: '',
    email: '',
    phone: '',
    postalCode: '',
    city: '',
    street: '',
    houseNumber: '',
  });
  const [streets, setStreets] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const streetJustSelected = useRef(false);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/funnel/leads/${token}`)
      .then((r) => r.json())
      .then((data) => {
        const l = data.lead;
        if (!l) return;
        setMarket(l.market || 'DE');
        setForm((f) => ({
          ...f,
          postalCode: l.postal_code || f.postalCode,
          city: l.city || f.city,
          email: l.email || f.email,
          firstName: l.first_name || f.firstName,
          lastName: l.last_name || f.lastName,
          companyName: l.company_name || f.companyName,
          phone: l.phone || f.phone,
          street: l.street || f.street,
          houseNumber: l.house_number || f.houseNumber,
        }));
      });
  }, [token]);

  useEffect(() => {
    if (form.street.length < 2 || !form.postalCode || !form.city) return;
    if (streetJustSelected.current) {
      streetJustSelected.current = false;
      return;
    }
    const t = setTimeout(() => {
      fetch(
        `/api/address/street?country=${market}&postalCode=${encodeURIComponent(form.postalCode)}&city=${encodeURIComponent(form.city)}&q=${encodeURIComponent(form.street)}`
      )
        .then((r) => r.json())
        .then((d) => setStreets(d.streets || []));
    }, 250);
    return () => clearTimeout(t);
  }, [form.street, form.postalCode, form.city, market]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    const firstNameResult = validatePersonName(form.firstName, 'Vorname');
    if (!firstNameResult.valid) {
      setError(firstNameResult.hint || 'Bitte einen gültigen Vornamen eingeben.');
      return;
    }

    const lastNameResult = validatePersonName(form.lastName, 'Nachname');
    if (!lastNameResult.valid) {
      setError(lastNameResult.hint || 'Bitte einen gültigen Nachnamen eingeben.');
      return;
    }

    const namePairResult = validatePersonNamePair(form.firstName, form.lastName);
    if (!namePairResult.valid) {
      setError(namePairResult.hint || 'Vor- und Nachname dürfen nicht identisch sein.');
      return;
    }

    const phoneResult = validateMobileDACH(form.phone, market);
    if (!phoneResult.valid) {
      setError(phoneResult.hint || 'Bitte eine gültige Handynummer eingeben.');
      return;
    }
    const normalizedEmail = form.email.trim().toLowerCase();
    if (!isEmailSubmitAllowed(normalizedEmail)) {
      setError(
        'Bitte E-Mail vervollständigen (Tab/→) oder Tippfehler in der Domain korrigieren.'
      );
      return;
    }
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/funnel/leads/${token}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        intent: 'contact',
        ...form,
        email: normalizedEmail,
        market,
        confirmEmailTypo: emailNeedsTypoConfirmation(normalizedEmail),
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const d = await res.json();
      setError(d.message || 'Speichern fehlgeschlagen');
      return;
    }
    router.push(`/funnel-5?t=${encodeURIComponent(token)}`);
  }

  const fieldClass =
    'w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:outline-none';
  const firstNameCheck =
    form.firstName.trim().length > 0
      ? validatePersonName(form.firstName, 'Vorname')
      : null;
  const lastNameCheck =
    form.lastName.trim().length > 0
      ? validatePersonName(form.lastName, 'Nachname')
      : null;
  const namePairCheck =
    form.firstName.trim().length > 0 && form.lastName.trim().length > 0
      ? validatePersonNamePair(form.firstName, form.lastName)
      : null;
  const phoneCheck = isPhoneReadyForLiveValidation(form.phone, market)
    ? validateMobileDACH(form.phone, market)
    : null;

  if (!token) return <p>Session fehlt.</p>;

  return (
    <FunnelShell step={4} token={token}>
      <form
        onSubmit={submit}
        autoComplete="on"
        className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-xl"
      >
        <h1 className="text-2xl font-bold mb-2">Kontakt- & Firmendaten</h1>
        <p className="text-muted-foreground text-sm mb-6">
          Diese Daten fragen wir nur ein einziges Mal ab und übernehmen sie später automatisch
          (Angebot, Unterschrift und Zahlung).
        </p>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Vorname</label>
            <input
              required
              name="given-name"
              className={fieldClass}
              value={form.firstName}
              onChange={(e) => {
                setError(null);
                setForm({ ...form, firstName: e.target.value });
              }}
              onInput={(e) => {
                const v = e.currentTarget.value;
                if (v !== form.firstName) setForm((f) => ({ ...f, firstName: v }));
              }}
              autoComplete="given-name"
            />
            <FieldValidationHint check={firstNameCheck} />
          </div>
          <div>
            <label className="text-sm font-medium">Nachname</label>
            <input
              required
              name="family-name"
              className={fieldClass}
              value={form.lastName}
              onChange={(e) => {
                setError(null);
                setForm({ ...form, lastName: e.target.value });
              }}
              onInput={(e) => {
                const v = e.currentTarget.value;
                if (v !== form.lastName) setForm((f) => ({ ...f, lastName: v }));
              }}
              autoComplete="family-name"
            />
            <FieldValidationHint check={lastNameCheck} />
            <FieldValidationHint check={namePairCheck} />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium">Firmenname</label>
            <input
              required
              name="organization"
              className={fieldClass}
              value={form.companyName}
              onChange={(e) => setForm({ ...form, companyName: e.target.value })}
              onInput={(e) => {
                const v = e.currentTarget.value;
                if (v !== form.companyName) setForm((f) => ({ ...f, companyName: v }));
              }}
              autoComplete="organization"
            />
          </div>
          <div className="md:col-span-1">
            <EmailInputAssist
              value={form.email}
              onChange={(email) => setForm({ ...form, email })}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Handynummer</label>
            <input
              required
              type="tel"
              name="tel"
              className={fieldClass}
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              onInput={(e) => {
                const v = e.currentTarget.value;
                if (v !== form.phone) setForm((f) => ({ ...f, phone: v }));
              }}
              placeholder={
                market === 'CH'
                  ? '+41 79 123 45 67'
                  : market === 'AT'
                    ? '+43 664 1234567'
                    : '+49 151 12345678'
              }
              autoComplete="tel"
            />
            <FieldValidationHint check={phoneCheck} />
          </div>
          <div>
            <label className="text-sm font-medium">Postleitzahl</label>
            <input
              required
              name="postal-code"
              className={fieldClass}
              value={form.postalCode}
              onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
              onInput={(e) => {
                const v = e.currentTarget.value;
                if (v !== form.postalCode) setForm((f) => ({ ...f, postalCode: v }));
              }}
              autoComplete="postal-code"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Stadt</label>
            <input
              required
              name="address-level2"
              className={fieldClass}
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              onInput={(e) => {
                const v = e.currentTarget.value;
                if (v !== form.city) setForm((f) => ({ ...f, city: v }));
              }}
              autoComplete="address-level2"
            />
          </div>
          <div className="relative">
            <label className="text-sm font-medium">Straße</label>
            <input
              required
              name="address-line1"
              className={fieldClass}
              value={form.street}
              onChange={(e) => setForm({ ...form, street: e.target.value })}
              onInput={(e) => {
                const v = e.currentTarget.value;
                if (v !== form.street) setForm((f) => ({ ...f, street: v }));
              }}
              autoComplete="address-line1"
            />
            {streets.length > 0 && (
              <ul className="absolute z-20 w-full mt-1 rounded-lg border border-border bg-card shadow-lg max-h-40 overflow-auto">
                {streets.map((s) => (
                  <li key={s}>
                    <button
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm hover:bg-primary/10"
                      onClick={() => {
                        streetJustSelected.current = true;
                        setForm({ ...form, street: s });
                        setStreets([]);
                      }}
                    >
                      {s}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <label className="text-sm font-medium">Hausnummer</label>
            <input
              required
              name="address-line2"
              className={fieldClass}
              value={form.houseNumber}
              onChange={(e) => setForm({ ...form, houseNumber: e.target.value })}
              onInput={(e) => {
                const v = e.currentTarget.value;
                if (v !== form.houseNumber) setForm((f) => ({ ...f, houseNumber: v }));
              }}
              autoComplete="address-line2"
            />
          </div>
        </div>

        {error && <p className="text-amber-400 text-sm mt-4">{error}</p>}

        <ShinyButton
          type="submit"
          disabled={loading}
          className="w-full mt-6"
        >
          {loading ? 'Einen Moment…' : 'Jetzt Ergebnisse ansehen'}
        </ShinyButton>
      </form>
    </FunnelShell>
  );
}

export default function Funnel4Page() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Laden…</div>}>
      <Funnel4Content />
    </Suspense>
  );
}
