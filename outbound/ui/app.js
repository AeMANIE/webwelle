(function () {
  const cfg = window.OUTBOUND_CONFIG || {};
  const base = (cfg.n8nWebhookBase || '').replace(/\/$/, '');
  const secret = cfg.apiSecret || '';

  const $ = (id) => document.getElementById(id);
  const show = (el, on) => el.classList.toggle('hidden', !on);

  let prospectId = null;
  let draft = null;
  let pdfGenerating = false;

  if (!base || base.includes('DEINE-N8N')) {
    show($('configWarning'), true);
  }

  function headers(json = true) {
    const h = { 'X-Outbound-Secret': secret };
    if (json) h['Content-Type'] = 'application/json';
    return h;
  }

  async function api(path, opts = {}) {
    const url = `${base}/${path}${opts.query ? `?${new URLSearchParams(opts.query)}` : ''}`;
    const res = await fetch(url, {
      method: opts.method || 'GET',
      headers: headers(opts.body !== undefined),
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = data.error || data.message || data.hint || `HTTP ${res.status}`;
      throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
    return data;
  }

  function setStatus(el, msg, type = 'info') {
    el.textContent = msg;
    el.className = `status ${type}`;
    show(el, true);
  }

  function mergeDraftWithForm() {
    const patch = collectPatch();
    return {
      ...draft,
      company: { ...draft.company, ...patch.company },
      contacts: { ...draft.contacts, ...patch.contacts },
      googleBusiness: { ...draft.googleBusiness, ...patch.googleBusiness },
      email: { ...draft.email, ...patch.email },
      offer: {
        ...draft.offer,
        ...patch.offer,
        painPoints: patch.painPoints,
      },
    };
  }

  function isLocalUi() {
    return /localhost|127\.0\.0\.1/.test(window.location.hostname);
  }

  function localSendUrl() {
    if (cfg.localSendUrl) return cfg.localSendUrl;
    if (cfg.useLocalSend === false) return null;
    if (isLocalUi()) return `${window.location.origin}/api/outbound-send`;
    return null;
  }

  function isValidPdfBase64(b64) {
    try {
      return atob(String(b64).slice(0, 32)).startsWith('%PDF');
    } catch {
      return false;
    }
  }

  function base64ToBlob(b64, mime = 'application/pdf') {
    const bin = atob(b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return new Blob([arr], { type: mime });
  }

  function openPdfBlob(b64) {
    const blob = base64ToBlob(b64);
    const url = URL.createObjectURL(blob);
    const w = window.open('', '_blank');
    if (w) {
      w.document.title = `WebWelle Audit – ${draft?.domain || ''}`;
      w.document.body.style.cssText = 'margin:0;height:100vh;overflow:hidden;';
      w.document.body.innerHTML = `<embed src="${url}" type="application/pdf" width="100%" height="100%" style="border:0;" />`;
      return;
    }
    const a = document.createElement('a');
    a.href = url;
    a.download = `WebWelle-Audit-${draft?.domain || 'Kunde'}.pdf`;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  async function generatePdfBase64(prospect) {
    try {
      if (typeof window.buildAuditPdfBase64 === 'function') {
        const b64 = window.buildAuditPdfBase64(prospect);
        if (isValidPdfBase64(b64)) return b64;
      }
    } catch { /* Server-Fallback */ }
    if (isLocalUi()) {
      try {
        const res = await fetch(`${window.location.origin}/api/outbound-pdf`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prospect }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.pdfBase64 && isValidPdfBase64(data.pdfBase64)) return data.pdfBase64;
        }
      } catch { /* */ }
    }
    throw new Error('PDF konnte nicht erzeugt werden – npm run outbound:ui neu starten.');
  }

  function refreshEmailPreview() {
    if (!draft || typeof window.renderOutboundEmailHtml !== 'function') return;
    const merged = mergeDraftWithForm();
    $('emailPreview').srcdoc = window.renderOutboundEmailHtml(merged);
  }

  function openPreviewTab() {
    if (!draft) return alert('Kein Entwurf geladen.');
    sessionStorage.setItem('outbound_preview_payload', JSON.stringify(mergeDraftWithForm()));
    window.open('preview.html', '_blank', 'noopener');
  }

  function bindOfferChangeRefresh() {
    const ids = ['altDwa', 'altExecutive', 'upSeo', 'upBlog', 'upGmb', 'primaryOffer', 'painPoints', 'emailSubject', 'emailGreeting'];
    for (const id of ids) {
      const el = $(id);
      if (!el) continue;
      el.addEventListener('change', refreshEmailPreview);
      el.addEventListener('input', refreshEmailPreview);
    }
  }

  async function checkLocalServer() {
    if (!isLocalUi() || cfg.useLocalSend === false) return;
    try {
      const r = await fetch(`${window.location.origin}/api/health`);
      if (!r.ok) throw new Error('no health');
      const d = await r.json();
      if (!d.send) {
        const el = $('configWarning');
        el.innerHTML = 'SMTP fehlt in <code>.env.local</code> – E-Mail-Versand nicht möglich. PDF funktioniert trotzdem.';
        show(el, true);
      }
    } catch {
      const el = $('configWarning');
      el.innerHTML = 'Für <strong>E-Mail-Versand</strong>: <code>npm run outbound:ui</code> nutzen (nicht <code>npx serve</code>). <strong>PDF</strong> funktioniert im Browser.';
      show(el, true);
    }
  }

  function openPdfPrintView() {
    const w = window.open('', '_blank');
    if (!w) return alert('Pop-up blockiert – bitte erlauben.');
    w.document.write(window.renderAuditPdfHtml(mergeDraftWithForm()));
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 500);
  }

  async function ensurePdfBase64(force = false) {
    const merged = mergeDraftWithForm();
    if (!force && draft?._pdfBase64 && isValidPdfBase64(draft._pdfBase64)) {
      return draft._pdfBase64;
    }
    if (pdfGenerating) throw new Error('PDF wird bereits erzeugt …');
    pdfGenerating = true;
    try {
      const b64 = await generatePdfBase64(merged);
      draft._pdfBase64 = b64;
      $('pdfHint').textContent = 'PDF bereit – „PDF öffnen“ klicken.';
      return b64;
    } finally {
      pdfGenerating = false;
    }
  }

  async function startAnalyze() {
    const websiteUrl = $('websiteUrl').value.trim();
    if (!websiteUrl) return alert('Bitte Website-URL eingeben.');
    $('btnAnalyze').disabled = true;
    setStatus($('analyzeStatus'), 'Analyse läuft … (kann 1–3 Minuten dauern)', 'info');

    try {
      const res = await api('outbound-analyze', {
        method: 'POST',
        body: {
          websiteUrl,
          googleMapsUrl: $('googleMapsUrl').value.trim() || undefined,
          industryHint: $('industryHint').value.trim() || undefined,
        },
      });
      prospectId = res.prospectId;
      await loadDraft();
      show($('stepReview'), true);
      setStatus($('analyzeStatus'), `Fertig – Prospect ${prospectId}`, 'ok');
    } catch (e) {
      setStatus($('analyzeStatus'), `Fehler: ${e.message}`, 'err');
    } finally {
      $('btnAnalyze').disabled = false;
    }
  }

  function fillForm(p) {
    draft = p;
    draft._pdfBase64 = p.pdfBase64 || null;
    $('prospectIdLabel').textContent = p.id;
    $('statusLabel').textContent = p.status;
    $('companyName').value = p.company?.name || '';
    $('managingDirector').value = p.company?.managingDirector || '';
    $('preferredEmail').value = p.contacts?.preferredEmail || '';
    $('gbpScore').value = p.googleBusiness?.completenessScore ?? '';
    $('gbpMapsUrl').value = p.googleBusiness?.mapsUrl || '';
    const g = p.googleBusiness || {};
    if (g.found) {
      $('gbpBlock').innerHTML = `<strong>Google-Profil:</strong> ${g.name || '–'} · ⭐ ${g.rating ?? '–'} (${g.reviewCount ?? 0} Rez.)<br>${g.address || ''}${g.phone ? `<br>Tel. Maps: ${g.phone}` : ''}`;
    } else {
      $('gbpBlock').innerHTML = '<strong>Google-Profil:</strong> <span style="color:#b45309">Nicht auffindbar – Verkaufsargument GMB-Komplettservice</span>';
    }
    $('techBlock').innerHTML = `<strong>Technologie:</strong> ${p.technology?.platform || '–'} · Baukasten: ${p.technology?.isPageBuilder ? 'Ja' : 'Nein'}`;
    $('perfBlock').innerHTML = `<strong>Performance:</strong> Mobile ${p.performance?.mobileScore ?? '–'} · Desktop ${p.performance?.desktopScore ?? '–'}`;
    $('painPoints').value = (p.offer?.painPoints || []).join('\n');
    $('emailSubject').value = p.email?.subject || '';
    $('emailGreeting').value = p.email?.greeting || '';
    $('primaryOffer').value = p.offer?.primary || 'starterwelle';
    $('altDwa').checked = (p.offer?.alternatives || []).includes('dwa');
    $('altExecutive').checked = (p.offer?.alternatives || []).includes('executive_ki');
    $('upSeo').checked = (p.offer?.upsells || []).includes('seo_profi');
    $('upBlog').checked = (p.offer?.upsells || []).includes('blog_bundle_10');
    $('upGmb').checked = (p.offer?.upsells || []).includes('gmb_komplett');

    const iframe = $('emailPreview');
    if (typeof window.renderOutboundEmailHtml === 'function') {
      iframe.srcdoc = window.renderOutboundEmailHtml(p);
    } else if (p.email?.html) {
      iframe.srcdoc = p.email.html;
    }

    $('pdfHint').textContent = 'PDF wird im Browser erzeugt – „PDF öffnen“ oder „Vorschau öffnen“.';
  }

  async function loadDraft() {
    const p = await api('outbound-draft', { query: { id: prospectId } });
    fillForm(p);
  }

  function collectPatch() {
    const painPoints = $('painPoints').value.split('\n').map((s) => s.trim()).filter(Boolean);
    const alternatives = [];
    if ($('altDwa').checked) alternatives.push('dwa');
    if ($('altExecutive').checked) alternatives.push('executive_ki');
    const upsells = [];
    if ($('upSeo').checked) upsells.push('seo_profi');
    if ($('upBlog').checked) upsells.push('blog_bundle_10');
    if ($('upGmb').checked) upsells.push('gmb_komplett');
    return {
      company: {
        name: $('companyName').value.trim(),
        managingDirector: $('managingDirector').value.trim(),
      },
      contacts: { preferredEmail: $('preferredEmail').value.trim() },
      googleBusiness: {
        completenessScore: Number($('gbpScore').value) || 0,
        mapsUrl: $('gbpMapsUrl').value.trim(),
      },
      email: {
        subject: $('emailSubject').value.trim(),
        greeting: $('emailGreeting').value.trim(),
      },
      offer: {
        primary: $('primaryOffer').value,
        alternatives,
        upsells,
      },
      painPoints,
    };
  }

  async function saveDraft() {
    if (!prospectId) return;
    $('btnSave').disabled = true;
    try {
      const patch = collectPatch();
      if (draft._pdfBase64) patch.pdfBase64 = draft._pdfBase64;
      await api('outbound-draft-update', {
        method: 'POST',
        query: { id: prospectId },
        body: { patch },
      });
      setStatus($('reviewStatus'), 'Entwurf gespeichert.', 'ok');
      await loadDraft();
      refreshEmailPreview();
    } catch (e) {
      setStatus($('reviewStatus'), `Speichern fehlgeschlagen: ${e.message}`, 'err');
    } finally {
      $('btnSave').disabled = false;
    }
  }

  async function sendMail() {
    if (!prospectId) return;
    const to = $('preferredEmail').value.trim();
    if (!to) return alert('Bitte Empfänger-E-Mail eintragen.');
    if (!confirm(`E-Mail wirklich an ${to} senden?`)) return;

    $('btnSend').disabled = true;
    try {
      setStatus($('reviewStatus'), 'PDF wird erzeugt …', 'info');
      const pdfBase64 = await ensurePdfBase64(true);
      const patch = { ...collectPatch(), pdfBase64 };
      await api('outbound-draft-update', {
        method: 'POST',
        query: { id: prospectId },
        body: { patch },
      });

      const merged = mergeDraftWithForm();
      const emailHtml = typeof window.renderOutboundEmailHtml === 'function'
        ? window.renderOutboundEmailHtml(merged)
        : (draft.email?.html || '');

      const payload = {
        to,
        subject: $('emailSubject').value.trim(),
        html: emailHtml,
        pdfBase64,
        domain: draft.domain,
      };

      const local = localSendUrl();
      setStatus($('reviewStatus'), local ? 'Versand über lokalen Mac (SMTP) …' : 'Versand über n8n …', 'info');

      if (local) {
        const res = await fetch(local, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const hint = data.hint ? ` ${data.hint}` : '';
          throw new Error(`${data.error || 'send_failed'}${hint}`);
        }
      } else {
        await api('outbound-send', {
          method: 'POST',
          query: { id: prospectId },
          body: payload,
        });
      }

      setStatus($('reviewStatus'), `Gesendet an ${to}`, 'ok');
      $('statusLabel').textContent = 'sent';
    } catch (e) {
      let msg = e.message;
      if (msg.includes('smtp_not_configured')) {
        msg = 'SMTP fehlt: npm run outbound:ui starten (liest .env.local) – nicht npx serve.';
      }
      setStatus($('reviewStatus'), `Versand fehlgeschlagen: ${msg}`, 'err');
    } finally {
      $('btnSend').disabled = false;
    }
  }

  async function openPdf() {
    if (!draft) return alert('Kein Entwurf geladen.');
    $('btnPdfOpen').disabled = true;
    $('pdfHint').textContent = 'PDF wird erzeugt …';
    try {
      const b64 = await ensurePdfBase64(true);
      openPdfBlob(b64);
      $('pdfHint').textContent = 'PDF geöffnet.';
    } catch (e) {
      $('pdfHint').textContent = 'HTML-Druckansicht – für E-Mail-Versand wird echtes PDF benötigt (npm run outbound:ui).';
      openPdfPrintView();
    } finally {
      $('btnPdfOpen').disabled = false;
    }
  }

  $('btnAnalyze').addEventListener('click', () => { startAnalyze().catch(() => {}); });
  $('btnSave').addEventListener('click', () => { saveDraft().catch(() => {}); });
  $('btnSend').addEventListener('click', () => { sendMail().catch(() => {}); });
  $('btnPreviewOpen').addEventListener('click', openPreviewTab);
  $('btnPdfOpen').addEventListener('click', () => { openPdf().catch(() => {}); });
  $('btnPdfPrint').addEventListener('click', () => { openPdfPrintView(); });
  bindOfferChangeRefresh();
  checkLocalServer();
})();
