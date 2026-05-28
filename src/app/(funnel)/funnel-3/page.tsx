'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import FunnelShell from '@/components/funnel/FunnelShell';
import { ShinyButton } from '@/components/ui/shiny-button';
import { DELIVERY_DISCOUNTS, type DeliveryWindow } from '@/lib/funnel/types';

const OPTIONS: { key: DeliveryWindow; label: string; discount: string }[] = [
  { key: '1_month', label: 'Lieferung in 1 Monat', discount: '400 EUR' },
  { key: '2_3_months', label: 'Lieferung in 2–3 Monaten', discount: '200 EUR' },
  { key: '4_14_months', label: 'Lieferung in 4–14 Monaten', discount: '100 EUR' },
  { key: '16_plus_months', label: 'Lieferung ab 16 Monaten', discount: '0 EUR' },
];

function Funnel3Content() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('t') || '';
  const [selected, setSelected] = useState<DeliveryWindow | null>(null);
  const [loading, setLoading] = useState(false);

  async function saveDiscount() {
    if (!selected || !token) return;
    setLoading(true);
    const res = await fetch(`/api/funnel/leads/${token}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ intent: 'discount', deliveryWindow: selected }),
    });
    setLoading(false);
    if (res.ok) router.push(`/funnel-4?t=${encodeURIComponent(token)}`);
  }

  if (!token) {
    return <p className="text-center">Session fehlt. <a href="/">Zur Startseite</a></p>;
  }

  return (
    <FunnelShell step={3} token={token}>
      <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-xl space-y-6">
        <section>
          <h1 className="text-2xl font-bold mb-2">Frühe Datenlieferung wird belohnt</h1>
          <p className="text-muted-foreground text-sm mb-4">
            Wähle, wann du uns deine Inhalte schicken kannst. Je früher, desto größer dein Rabatt.
            Später kannst du deine Analyse im Portal speichern und per E-Mail fortsetzen.
          </p>
          <div className="space-y-3">
            {OPTIONS.map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setSelected(opt.key)}
                className={
                  `w-full text-left p-4 rounded-xl border transition-colors ` +
                  (selected === opt.key
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/40')
                }
              >
                <span className="font-medium">{opt.label}</span>
                <span className="block text-sm text-primary mt-1">Rabatt: {opt.discount}</span>
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Gespeichert als:{' '}
            {selected ? `${DELIVERY_DISCOUNTS[selected] / 100} EUR` : 'noch nicht gewählt'}
          </p>
        </section>

        <ShinyButton
          type="button"
          disabled={!selected || loading}
          onClick={saveDiscount}
          className="w-full"
        >
          {loading ? 'Speichern…' : 'Rabatt sichern'}
        </ShinyButton>
      </div>
    </FunnelShell>
  );
}

export default function Funnel3Page() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Laden…</div>}>
      <Funnel3Content />
    </Suspense>
  );
}
