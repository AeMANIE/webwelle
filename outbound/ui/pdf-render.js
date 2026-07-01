/**
 * Audit-PDF HTML (gleiche Struktur wie n8n full-pipeline.js → renderPdfHtml)
 */
window.renderAuditPdfHtml = function renderAuditPdfHtml(p) {
  const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const zoom = (window.OUTBOUND_CONFIG && window.OUTBOUND_CONFIG.zoomUrl)
    || 'https://scheduler.zoom.us/aemanie-gmbh/30-minuten-mit-aemanie-gmbh-herr-manie';
  const gbp = p.googleBusiness || {};
  const gbpBlock = gbp.found
    ? `<table>
<tr><th>Profil</th><td>${esc(gbp.name)}</td></tr>
<tr><th>Adresse</th><td>${esc(gbp.address)}</td></tr>
<tr><th>Telefon</th><td>${esc(gbp.phone)}</td></tr>
<tr><th>Bewertung</th><td>${gbp.rating} ⭐ (${gbp.reviewCount} Rezensionen)</td></tr>
<tr><th>Vollständigkeit</th><td>${gbp.completenessScore}%</td></tr>
<tr><th>Fotos</th><td>${gbp.photoCount ?? '–'}</td></tr>
<tr><th>Maps</th><td>${esc(gbp.mapsUrl)}</td></tr></table>
<ul>${(gbp.gaps || []).map((g) => `<li class="warn">${esc(g)}</li>`).join('')}</ul>`
    : '<p class="warn">Kein Google-Unternehmensprofil auffindbar – große Chance für lokalen GMB-Komplettservice.</p>';

  return `<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"><style>
body{font-family:system-ui,sans-serif;color:#0e141f;margin:40px;line-height:1.5;}
h1{color:#8C36C9;font-size:28px;} h2{color:#6699ff;border-bottom:2px solid #e2e8f0;padding-bottom:8px;margin-top:32px;}
.badge{display:inline-block;background:#f5f0fa;color:#8C36C9;padding:4px 12px;border-radius:999px;font-size:12px;}
table{width:100%;border-collapse:collapse;margin:12px 0;} td,th{border:1px solid #e2e8f0;padding:10px;text-align:left;}
.warn{color:#b45309;}
</style></head><body>
<h1>Online-Audit: ${esc(p.company?.name || p.domain)}</h1>
<p><span class="badge">${esc(p.domain)}</span> · ${new Date().toLocaleDateString('de-DE')}</p>
<h2>Kurzfassung</h2><ul>${(p.offer?.painPoints || []).map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
<h2>Unternehmen & Kontakt</h2>
<table><tr><th>Firma</th><td>${esc(p.company?.name)}</td></tr>
<tr><th>GF</th><td>${esc(p.company?.managingDirector)}</td></tr>
<tr><th>E-Mail</th><td>${esc(p.contacts?.preferredEmail)}</td></tr>
<tr><th>Ort</th><td>${esc(p.company?.postalCode)} ${esc(p.company?.city)}</td></tr></table>
<h2>Google-Unternehmensprofil</h2>${gbpBlock}
<h2>Technologie</h2><table>
<tr><th>Plattform</th><td>${esc(p.technology?.platform)} (${Math.round((p.technology?.confidence || 0) * 100)}%)</td></tr>
<tr><th>Baukasten</th><td>${p.technology?.isPageBuilder ? 'Ja' : 'Nein'}</td></tr></table>
<p>${esc(p.technology?.recommendation)}</p>
<h2>Performance</h2><table>
<tr><th>Mobile</th><td>${p.performance?.mobileScore ?? '–'}</td></tr>
<tr><th>Desktop</th><td>${p.performance?.desktopScore ?? '–'}</td></tr>
<tr><th>LCP</th><td>${esc(p.performance?.lcp)}</td></tr></table>
<h2>SEO</h2><p><strong>Title:</strong> ${esc(p.seo?.title)}</p><p><strong>Meta:</strong> ${esc(p.seo?.metaDescription)}</p>
<h2>Empfehlung WebWelle</h2>
${typeof window.renderOfferPdfHtmlBlock === 'function' ? window.renderOfferPdfHtmlBlock(p) : '<p><strong>StarterWelle</strong> – 699 € netto / 24 Monate</p>'}
<p>${esc(zoom)}</p>
<p style="margin-top:48px;color:#64748b;font-size:12px;">WebWelle · AeManie GmbH · webwelle.com</p>
</body></html>`;
};
