'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import FunnelShell from '@/components/funnel/FunnelShell';
import { ShinyButton } from '@/components/ui/shiny-button';
import type { DachMarket } from '@/lib/funnel/types';

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
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/funnel/leads/${token}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        intent: 'contact',
        ...form,
        market,
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

  if (!token) return <p>Session fehlt.</p>;

  return (
    <FunnelShell step={4} token={token}>
      <form
        onSubmit={submit}
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
              className={fieldClass}
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Nachname</label>
            <input
              required
              className={fieldClass}
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium">Firmenname</label>
            <input
              required
              className={fieldClass}
              value={form.companyName}
              onChange={(e) => setForm({ ...form, companyName: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium">E-Mail</label>
            <input
              type="email"
              required
              className={fieldClass}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Telefon</label>
            <input
              required
              className={fieldClass}
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Postleitzahl</label>
            <input
              required
              className={fieldClass}
              value={form.postalCode}
              onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Stadt</label>
            <input
              required
              className={fieldClass}
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
            />
          </div>
          <div className="relative">
            <label className="text-sm font-medium">Straße</label>
            <input
              required
              className={fieldClass}
              value={form.street}
              onChange={(e) => setForm({ ...form, street: e.target.value })}
              autoComplete="street-address"
            />
            {streets.length > 0 && (
              <ul className="absolute z-20 w-full mt-1 rounded-lg border border-border bg-card shadow-lg max-h-40 overflow-auto">
                {streets.map((s) => (
                  <li key={s}>
                    <button
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm hover:bg-primary/10"
                      onClick={() => {
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
              className={fieldClass}
              value={form.houseNumber}
              onChange={(e) => setForm({ ...form, houseNumber: e.target.value })}
            />
          </div>
        </div>

        {error && <p className="text-amber-400 text-sm mt-4">{error}</p>}

        <ShinyButton type="submit" disabled={loading} className="w-full mt-6">
          {loading ? 'Speichern…' : 'Daten sichern'}
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
