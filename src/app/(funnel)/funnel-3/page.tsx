'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import FunnelShell from '@/components/funnel/FunnelShell';
import { ShinyButton } from '@/components/ui/shiny-button';

type WebsiteChoice = 'existing' | 'new' | null;

function Funnel3Content() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('t') || '';
  const [choice, setChoice] = useState<WebsiteChoice>(null);
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/funnel/leads/${token}`)
      .then((r) => r.json())
      .then((data) => {
        const lead = data.lead;
        if (!lead) return;
        if (lead.existing_website === true) {
          setChoice('existing');
          if (lead.existing_website_url) {
            setWebsiteUrl(String(lead.existing_website_url));
          }
        } else if (lead.existing_website === false) {
          setChoice('new');
        }
      });
  }, [token]);

  async function saveWebsiteIntent() {
    if (!choice || !token) return;

    if (choice === 'existing' && !websiteUrl.trim()) {
      setError('Bitte geben Sie die Adresse Ihrer aktuellen Website ein.');
      return;
    }

    setLoading(true);
    setError(null);

    const res = await fetch(`/api/funnel/leads/${token}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        intent: 'website-intent',
        hasExistingWebsite: choice === 'existing',
        existingWebsiteUrl: choice === 'existing' ? websiteUrl.trim() : undefined,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.message || 'Speichern fehlgeschlagen');
      return;
    }

    router.push(`/funnel-4?t=${encodeURIComponent(token)}`);
  }

  if (!token) {
    return (
      <p className="text-center">
        Session fehlt. <a href="/">Zur Startseite</a>
      </p>
    );
  }

  const canSubmit =
    choice === 'new' || (choice === 'existing' && websiteUrl.trim().length > 0);

  return (
    <FunnelShell step={3} token={token}>
      <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-xl space-y-6">
        <section>
          <h1 className="text-2xl font-bold mb-2">Haben Sie bereits eine Website?</h1>
          <p className="text-muted-foreground text-sm mb-4">
            Das hilft uns, Ihre Analyse und unser Angebot besser auf Sie zuzuschneiden.
          </p>

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => {
                setChoice('existing');
                setError(null);
              }}
              className={
                `w-full text-left p-4 rounded-xl border transition-colors ` +
                (choice === 'existing'
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/40')
              }
            >
              <span className="font-medium">Ja, ich habe bereits eine Website</span>
              <span className="block text-sm text-muted-foreground mt-1">
                Wir analysieren Ihre bestehende Präsenz und zeigen Verbesserungspotenzial.
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setChoice('new');
                setWebsiteUrl('');
                setError(null);
              }}
              className={
                `w-full text-left p-4 rounded-xl border transition-colors ` +
                (choice === 'new'
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/40')
              }
            >
              <span className="font-medium">Nein, ich möchte eine neue Website</span>
              <span className="block text-sm text-muted-foreground mt-1">
                Wir planen Ihren neuen Online-Auftritt von Grund auf.
              </span>
            </button>
          </div>

          {choice === 'existing' && (
            <div className="mt-4">
              <label htmlFor="funnel3-website-url" className="block text-sm font-medium mb-2">
                Adresse Ihrer aktuellen Website
              </label>
              <input
                id="funnel3-website-url"
                type="url"
                value={websiteUrl}
                onChange={(e) => {
                  setWebsiteUrl(e.target.value);
                  setError(null);
                }}
                placeholder="https://ihre-website.de"
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                autoComplete="url"
              />
            </div>
          )}

          {error && (
            <p className="mt-3 text-sm text-amber-400" role="alert">
              {error}
            </p>
          )}
        </section>

        <ShinyButton
          type="button"
          disabled={!canSubmit || loading}
          onClick={saveWebsiteIntent}
          className="w-full"
        >
          {loading ? 'Speichern…' : 'Weiter'}
        </ShinyButton>
      </div>
    </FunnelShell>
  );
}

export default function Funnel3Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">Laden…</div>
      }
    >
      <Funnel3Content />
    </Suspense>
  );
}
