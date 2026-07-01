'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { OUTBOUND_PRODUCTS } from '@/lib/outbound/products';

interface ProspectData {
  dbId?: string;
  id: string;
  domain?: string;
  status?: string;
  company?: {
    name?: string;
    managingDirector?: string;
    city?: string;
    postalCode?: string;
  };
  contacts?: { preferredEmail?: string };
  googleBusiness?: {
    found?: boolean;
    name?: string;
    rating?: number;
    reviewCount?: number;
    address?: string;
    phone?: string;
    completenessScore?: number;
    gaps?: string[];
  };
  technology?: { platform?: string; isPageBuilder?: boolean };
  performance?: { mobileScore?: number; desktopScore?: number };
  offer?: {
    primary?: string;
    alternatives?: string[];
    upsells?: string[];
    painPoints?: string[];
    benefits?: string[];
  };
  email?: {
    subject?: string;
    greeting?: string;
    alternativeLine?: string;
  };
}

interface RowMeta {
  sent_at?: string | null;
  sent_to?: string | null;
  customer_id?: string | null;
  lead_id?: string | null;
}

interface Props {
  prospectId: string;
}

export default function OutboundProspectDetail({ prospectId }: Props) {
  const [prospect, setProspect] = useState<ProspectData | null>(null);
  const [rowMeta, setRowMeta] = useState<RowMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState('');
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);

  const [companyName, setCompanyName] = useState('');
  const [managingDirector, setManagingDirector] = useState('');
  const [preferredEmail, setPreferredEmail] = useState('');
  const [painPoints, setPainPoints] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailGreeting, setEmailGreeting] = useState('');
  const [primaryOffer, setPrimaryOffer] = useState('starterwelle');
  const [altDwa, setAltDwa] = useState(false);
  const [altExecutive, setAltExecutive] = useState(false);
  const [upSeo, setUpSeo] = useState(false);
  const [upBlog, setUpBlog] = useState(false);
  const [upGmb, setUpGmb] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/outbound/prospects/${prospectId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Laden fehlgeschlagen');
      const p = data.prospect as ProspectData;
      setProspect(p);
      setRowMeta(data.row);
      setCompanyName(p.company?.name || '');
      setManagingDirector(p.company?.managingDirector || '');
      setPreferredEmail(p.contacts?.preferredEmail || '');
      setPainPoints((p.offer?.painPoints || []).join('\n'));
      setEmailSubject(p.email?.subject || '');
      setEmailGreeting(p.email?.greeting || '');
      setPrimaryOffer(p.offer?.primary || 'starterwelle');
      setAltDwa((p.offer?.alternatives || []).includes('dwa'));
      setAltExecutive((p.offer?.alternatives || []).includes('executive_ki'));
      setUpSeo((p.offer?.upsells || []).includes('seo_profi'));
      setUpBlog((p.offer?.upsells || []).includes('blog_bundle_10'));
      setUpGmb((p.offer?.upsells || []).includes('gmb_komplett'));
    } catch (e) {
      setStatusMsg(e instanceof Error ? e.message : 'Fehler');
    } finally {
      setLoading(false);
    }
  }, [prospectId]);

  useEffect(() => {
    load();
  }, [load]);

  function collectPatch() {
    const alternatives: string[] = [];
    if (altDwa) alternatives.push('dwa');
    if (altExecutive) alternatives.push('executive_ki');
    const upsells: string[] = [];
    if (upSeo) upsells.push('seo_profi');
    if (upBlog) upsells.push('blog_bundle_10');
    if (upGmb) upsells.push('gmb_komplett');
    return {
      company: { name: companyName.trim(), managingDirector: managingDirector.trim() },
      contacts: { preferredEmail: preferredEmail.trim() },
      email: { subject: emailSubject.trim(), greeting: emailGreeting.trim() },
      offer: { primary: primaryOffer, alternatives, upsells },
      painPoints: painPoints.split('\n').map((s) => s.trim()).filter(Boolean),
    };
  }

  const emailPreviewHtml = useMemo(() => {
    if (!prospect) return '';
    const merged: ProspectData = {
      ...prospect,
      company: { ...prospect.company, name: companyName, managingDirector },
      contacts: { preferredEmail },
      email: { ...prospect.email, subject: emailSubject, greeting: emailGreeting },
      offer: {
        ...prospect.offer,
        primary: primaryOffer,
        alternatives: [
          ...(altDwa ? ['dwa'] : []),
          ...(altExecutive ? ['executive_ki'] : []),
        ],
        upsells: [
          ...(upSeo ? ['seo_profi'] : []),
          ...(upBlog ? ['blog_bundle_10'] : []),
          ...(upGmb ? ['gmb_komplett'] : []),
        ],
        painPoints: painPoints.split('\n').map((s) => s.trim()).filter(Boolean),
      },
    };
    return buildClientEmailPreview(merged);
  }, [prospect, companyName, managingDirector, preferredEmail, emailSubject, emailGreeting, primaryOffer, altDwa, altExecutive, upSeo, upBlog, upGmb, painPoints]);

  async function saveDraft() {
    setSaving(true);
    setStatusMsg('');
    try {
      const res = await fetch(`/api/admin/outbound/prospects/${prospectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patch: collectPatch() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Speichern fehlgeschlagen');
      setStatusMsg('Entwurf gespeichert.');
      await load();
    } catch (e) {
      setStatusMsg(e instanceof Error ? e.message : 'Fehler');
    } finally {
      setSaving(false);
    }
  }

  async function sendMail() {
    if (!preferredEmail.trim()) return alert('Bitte Empfänger-E-Mail eintragen.');
    if (!confirm(`E-Mail wirklich an ${preferredEmail} senden?`)) return;
    setSending(true);
    setStatusMsg('Versand läuft …');
    try {
      const res = await fetch(`/api/admin/outbound/prospects/${prospectId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: preferredEmail.trim(), patch: collectPatch() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Versand fehlgeschlagen');
      setStatusMsg(`Gesendet an ${data.sentTo}`);
      await load();
    } catch (e) {
      setStatusMsg(e instanceof Error ? e.message : 'Fehler');
    } finally {
      setSending(false);
    }
  }

  async function openPdf() {
    setStatusMsg('PDF wird erzeugt …');
    try {
      const res = await fetch(`/api/admin/outbound/prospects/${prospectId}/pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patch: collectPatch() }),
      });
      const data = await res.json();
      if (!res.ok || !data.pdfBase64) throw new Error(data.error || 'PDF fehlgeschlagen');
      const bin = atob(data.pdfBase64);
      const arr = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      const blob = new Blob([arr], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setStatusMsg('PDF geöffnet.');
    } catch (e) {
      setStatusMsg(e instanceof Error ? e.message : 'PDF-Fehler');
    }
  }

  if (loading) return <p className="text-muted-foreground py-8">Lade Prospect …</p>;
  if (!prospect) return <p className="text-red-400 py-8">{statusMsg || 'Prospect nicht gefunden'}</p>;

  const gbp = prospect.googleBusiness;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
        <span className="rounded bg-muted px-2 py-1">{prospect.domain}</span>
        <span className="rounded bg-muted px-2 py-1">Status: {prospect.status}</span>
        {rowMeta?.sent_at && (
          <span className="rounded bg-green-500/20 text-green-400 px-2 py-1">
            Gesendet: {new Date(rowMeta.sent_at).toLocaleString('de-DE')} → {rowMeta.sent_to}
          </span>
        )}
        {rowMeta?.customer_id && <span className="rounded bg-blue-500/20 text-blue-300 px-2 py-1">Kunde verknüpft</span>}
        {rowMeta?.lead_id && <span className="rounded bg-purple-500/20 text-purple-300 px-2 py-1">Funnel-Lead verknüpft</span>}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-xl border border-border bg-card p-5">
          <h3 className="font-semibold text-foreground">Unternehmen & Angebot</h3>
          <label className="block text-sm text-muted-foreground">Firma</label>
          <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2" />
          <label className="block text-sm text-muted-foreground">Geschäftsführer</label>
          <input value={managingDirector} onChange={(e) => setManagingDirector(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2" />
          <label className="block text-sm text-muted-foreground">E-Mail Empfänger *</label>
          <input type="email" value={preferredEmail} onChange={(e) => setPreferredEmail(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2" />

          {gbp?.found ? (
            <div className="text-sm text-muted-foreground rounded-lg bg-muted/40 p-3">
              <strong>Google-Profil:</strong> {gbp.name} · ⭐ {gbp.rating} ({gbp.reviewCount}) · {gbp.completenessScore}%
            </div>
          ) : (
            <div className="text-sm text-amber-500 rounded-lg bg-amber-500/10 p-3">Kein GBP gefunden – GMB-Upsell empfohlen</div>
          )}

          <div className="text-sm text-muted-foreground">
            Tech: {prospect.technology?.platform} · Mobile: {prospect.performance?.mobileScore ?? '–'}
          </div>

          <label className="block text-sm text-muted-foreground">Pain Points</label>
          <textarea value={painPoints} onChange={(e) => setPainPoints(e.target.value)} rows={4} className="w-full rounded-lg border border-border bg-background px-3 py-2" />

          <label className="block text-sm text-muted-foreground">Hauptangebot</label>
          <select value={primaryOffer} onChange={(e) => setPrimaryOffer(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2">
            {OUTBOUND_PRODUCTS.filter((p) => ['starterwelle', 'dwa', 'executive_ki'].includes(p.id)).map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          <div className="space-y-2 text-sm">
            <p className="text-muted-foreground font-medium">Alternativen</p>
            <label className="flex items-center gap-2"><input type="checkbox" checked={altDwa} onChange={(e) => setAltDwa(e.target.checked)} /> Digitale Wachstumsarchitektur</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={altExecutive} onChange={(e) => setAltExecutive(e.target.checked)} /> Executive KI-Systeme</label>
            <p className="text-muted-foreground font-medium pt-2">Upsells</p>
            <label className="flex items-center gap-2"><input type="checkbox" checked={upSeo} onChange={(e) => setUpSeo(e.target.checked)} /> SEO Profi (299 €)</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={upBlog} onChange={(e) => setUpBlog(e.target.checked)} /> 10 Blog-Artikel (499 €)</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={upGmb} onChange={(e) => setUpGmb(e.target.checked)} /> Google My Business Komplett (499 €)</label>
          </div>

          <label className="block text-sm text-muted-foreground">Betreff</label>
          <input value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2" />
          <label className="block text-sm text-muted-foreground">Anrede</label>
          <input value={emailGreeting} onChange={(e) => setEmailGreeting(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2" />
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-foreground">E-Mail-Vorschau</h3>
          <iframe title="E-Mail Vorschau" srcDoc={emailPreviewHtml} className="w-full min-h-[480px] rounded-xl border border-border bg-white" />
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={openPdf} className="rounded-lg border border-border px-4 py-2 text-sm">PDF öffnen</button>
            <button type="button" onClick={saveDraft} disabled={saving} className="rounded-lg border border-border px-4 py-2 text-sm disabled:opacity-50">Speichern</button>
            <button type="button" onClick={sendMail} disabled={sending} className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50">Freigeben & senden</button>
          </div>
          {statusMsg && <p className="text-sm text-muted-foreground">{statusMsg}</p>}
        </div>
      </div>
    </div>
  );
}

function esc(s: unknown): string {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
}

function buildClientEmailPreview(prospect: ProspectData): string {
  const offer = prospect.offer || {};
  const pains = (offer.painPoints || []).slice(0, 3).map((p) => `<li style="margin:8px 0;color:#334155;">${esc(p)}</li>`).join('');
  const benefits = (offer.benefits || []).slice(0, 3).map((b) => `<li style="margin:8px 0;color:#334155;">${esc(b)}</li>`).join('');
  const primary = OUTBOUND_PRODUCTS.find((p) => p.id === (offer.primary || 'starterwelle'));
  let offerHtml = primary ? `<p style="color:#334155;">Mit <strong>${esc(primary.name)}</strong> (${esc(primary.priceLabel)})</p>` : '';
  const ups = (offer.upsells || []).map((id) => OUTBOUND_PRODUCTS.find((p) => p.id === id)).filter(Boolean);
  if (ups.length) {
    offerHtml += '<ul>' + ups.map((u) => `<li>${esc(u!.name)} – ${esc(u!.priceLabel)}</li>`).join('') + '</ul>';
  }
  const email = prospect.email || {};
  return `<!DOCTYPE html><html lang="de"><body style="font-family:system-ui,sans-serif;padding:16px;background:#f1f5f9;">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:24px;">
<h2 style="color:#8C36C9;font-size:18px;">${esc(email.subject)}</h2>
<p style="color:#334155;">${esc(email.greeting)}</p>
<p style="color:#334155;">Wir haben <strong>${esc(prospect.domain)}</strong> angeschaut:</p>
<ul>${pains}</ul>${offerHtml}<ul>${benefits}</ul>
</div></body></html>`;
}
