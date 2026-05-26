'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import FunnelShell from '@/components/funnel/FunnelShell';
import { ShinyButton } from '@/components/ui/shiny-button';

const PACKAGES = [
  { id: 'starterwelle', name: 'StarterWelle', desc: 'Professionelle Website zum Festpreis' },
  { id: 'businesswelle', name: 'BusinessWelle', desc: 'Erweitert mit mehr Seiten & SEO' },
  { id: 'erfolgswelle', name: 'ErfolgsWelle', desc: 'Premium mit maximaler Sichtbarkeit' },
];

const MODULES = [
  'Admin-Dashboard',
  'Online-Shop',
  'Terminbuchung',
  'Social-Media-Werbung',
  'SEO-Landingpages',
  'KI-Chatbot / AI-Agent',
  'Mehrsprachige Website',
  'Druckmedien',
];

function Funnel6Content() {
  const searchParams = useSearchParams();
  const token = searchParams.get('t') || '';
  const [selectedPackage, setSelectedPackage] = useState('starterwelle');
  const [modules, setModules] = useState<string[]>([]);
  const [customOffer, setCustomOffer] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/funnel/leads/${token}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.lead?.selected_package) setSelectedPackage(d.lead.selected_package);
      });
  }, [token]);

  function toggleModule(m: string) {
    setModules((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]
    );
  }

  async function submit() {
    setLoading(true);
    const res = await fetch(`/api/funnel/leads/${token}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        intent: 'package',
        packageType: selectedPackage,
        modules,
        wantsCustomOffer: customOffer || modules.length > 0,
      }),
    });
    setLoading(false);
    if (res.ok) {
      if (customOffer || modules.length > 2) {
        await fetch('/api/funnel/offers/request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, packageType: selectedPackage, modules }),
        });
      }
      setDone(true);
    }
  }

  if (!token) return <p>Session fehlt.</p>;

  if (done) {
    return (
      <FunnelShell step={6} token={token}>
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Vielen Dank!</h1>
          <p className="text-muted-foreground">
            {customOffer || modules.length > 0
              ? 'Wir erstellen Ihr individuelles Angebot und senden es per E-Mail zur Unterschrift (DocuSeal). Nach der Signatur erhalten Sie den Zahlungslink.'
              : 'Ihr Paket wurde erfasst. Sie erhalten in Kürze Ihr Angebot per E-Mail.'}
          </p>
        </div>
      </FunnelShell>
    );
  }

  return (
    <FunnelShell step={6} token={token}>
      <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-xl space-y-6">
        <h1 className="text-2xl font-bold">Paket wählen</h1>

        <div className="grid md:grid-cols-3 gap-4">
          {PACKAGES.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setSelectedPackage(p.id);
                setCustomOffer(false);
              }}
              className={
                `p-4 rounded-xl border text-left transition-colors ` +
                (selectedPackage === p.id && !customOffer
                  ? 'border-primary bg-primary/10'
                  : 'border-border')
              }
            >
              <p className="font-bold">{p.name}</p>
              <p className="text-sm text-muted-foreground mt-1">{p.desc}</p>
            </button>
          ))}
        </div>

        <div>
          <h2 className="font-semibold mb-3">Zusatzmodule (optional)</h2>
          <div className="flex flex-wrap gap-2">
            {MODULES.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => toggleModule(m)}
                className={
                  `px-3 py-2 rounded-full text-sm border ` +
                  (modules.includes(m)
                    ? 'border-primary bg-primary/15 text-primary'
                    : 'border-border')
                }
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={customOffer}
            onChange={(e) => setCustomOffer(e.target.checked)}
            className="rounded"
          />
          <span className="text-sm">Individuelles Angebot vom Team anfordern</span>
        </label>

        <ShinyButton type="button" onClick={submit} disabled={loading} className="w-full">
          {loading ? 'Wird gesendet…' : 'Auswahl bestätigen'}
        </ShinyButton>
      </div>
    </FunnelShell>
  );
}

export default function Funnel6Page() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Laden…</div>}>
      <Funnel6Content />
    </Suspense>
  );
}
