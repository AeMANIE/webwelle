'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import FunnelShell from '@/components/funnel/FunnelShell';
import { ShinyButton } from '@/components/ui/shiny-button';
import { DELIVERY_DISCOUNTS, type DeliveryWindow } from '@/lib/funnel/types';
import { funnelResumeUrl } from '@/lib/funnel/client';

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
  const [copied, setCopied] = useState(false);

  const resumeLink =
    typeof window !== 'undefined'
      ? `${window.location.origin}${funnelResumeUrl(token, 3)}`
      : '';

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

  function copyLink() {
    void navigator.clipboard.writeText(resumeLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!token) {
    return <p className="text-center">Session fehlt. <a href="/">Zur Startseite</a></p>;
  }

  return (
    <FunnelShell step={3} token={token}>
      <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-xl space-y-8">
        <section>
          <h1 className="text-2xl font-bold mb-2">Deine Session ist gespeichert</h1>
          <p className="text-muted-foreground mb-4">
            Du kannst später mit diesem Link weitermachen:
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              readOnly
              value={resumeLink}
              className="flex-1 text-xs rounded-lg border border-border bg-background px-3 py-2 min-h-[44px]"
            />
            <button
              type="button"
              onClick={copyLink}
              className="px-4 py-2.5 rounded-lg border border-primary text-primary text-sm font-medium min-h-[44px] shrink-0"
            >
              {copied ? 'Kopiert!' : 'Link kopieren'}
            </button>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">Frühe Datenlieferung wird belohnt</h2>
          <p className="text-muted-foreground text-sm mb-4">
            Wähle, wann du uns deine Inhalte schicken kannst. Je früher, desto größer dein Rabatt.
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
