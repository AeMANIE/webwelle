(function () {
  const $ = (id) => document.getElementById(id);
  const show = (el, on) => el.classList.toggle('hidden', !on);

  let prospect = null;

  function isValidPdfBase64(b64) {
    try { return atob(String(b64).slice(0, 32)).startsWith('%PDF'); } catch { return false; }
  }

  function base64ToBlob(b64) {
    const bin = atob(b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return new Blob([arr], { type: 'application/pdf' });
  }

  function openPdfBlob(b64) {
    const url = URL.createObjectURL(base64ToBlob(b64));
    const w = window.open('', '_blank');
    if (w) {
      w.document.title = `WebWelle Audit – ${prospect?.domain || ''}`;
      w.document.body.style.cssText = 'margin:0;height:100vh;overflow:hidden;';
      w.document.body.innerHTML = `<embed src="${url}" type="application/pdf" width="100%" height="100%" style="border:0;" />`;
      return;
    }
    const a = document.createElement('a');
    a.href = url;
    a.download = `WebWelle-Audit-${prospect?.domain || 'Kunde'}.pdf`;
    a.click();
  }

  async function generatePdfBase64(p) {
    try {
      if (typeof window.buildAuditPdfBase64 === 'function') {
        const b64 = window.buildAuditPdfBase64(p);
        if (isValidPdfBase64(b64)) return b64;
      }
    } catch { /* fallback */ }
    try {
      const res = await fetch(`${window.location.origin}/api/outbound-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prospect: p }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.pdfBase64 && isValidPdfBase64(data.pdfBase64)) return data.pdfBase64;
      }
    } catch { /* */ }
    throw new Error('PDF konnte nicht erzeugt werden.');
  }

  function refresh() {
    if (!prospect) return;
    $('previewMeta').textContent = `${prospect.domain || ''} · ${prospect.company?.name || ''}`;
    $('emailPreview').srcdoc = window.renderOutboundEmailHtml(prospect);

    const { primary, alternatives, upsells, gbpRecommendation } = window.resolveOffer(prospect);
    const parts = [];
    if (primary) parts.push(`<li><strong>Hauptangebot:</strong> ${primary.name} (${primary.priceLabel})</li>`);
    for (const a of alternatives) parts.push(`<li>Alternative: ${a.name}</li>`);
    for (const u of upsells) parts.push(`<li>Upsell: ${u.name} (${u.priceLabel})</li>`);
    if (gbpRecommendation) parts.push(`<li style="color:#b45309;">${gbpRecommendation}</li>`);
    $('offerSummary').innerHTML = parts.length ? `<ul>${parts.join('')}</ul>` : '<p>Kein Angebot ausgewählt.</p>';
  }

  function openPdfPrintView() {
    const w = window.open('', '_blank');
    if (!w) return alert('Pop-up blockiert.');
    w.document.write(window.renderAuditPdfHtml(prospect));
    w.document.close();
    setTimeout(() => w.print(), 500);
  }

  async function openPdf() {
    $('btnPdfOpen').disabled = true;
    $('pdfHint').textContent = 'PDF wird erzeugt …';
    try {
      const b64 = await generatePdfBase64(prospect);
      openPdfBlob(b64);
      $('pdfHint').textContent = 'PDF geöffnet.';
    } catch {
      $('pdfHint').textContent = 'PDF fehlgeschlagen – Druckansicht (kein echtes PDF für Versand).';
      openPdfPrintView();
    } finally {
      $('btnPdfOpen').disabled = false;
    }
  }

  try {
    const raw = sessionStorage.getItem('outbound_preview_payload');
    if (!raw) throw new Error('no payload');
    prospect = JSON.parse(raw);
    show($('previewCard'), true);
    refresh();
  } catch {
    show($('previewError'), true);
  }

  $('btnPdfOpen').addEventListener('click', () => { openPdf().catch(() => {}); });
  $('btnPdfPrint').addEventListener('click', openPdfPrintView);
})();
