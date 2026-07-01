/**
 * Angebots-Rendering für UI (Browser) – Produkte aus products.json.
 */
window.OUTBOUND_PRODUCTS = [
  { id: 'starterwelle', name: 'StarterWelle', priceLabel: '699 € netto / 24 Monate', benefit: 'Professioneller React-Auftritt ohne Baukasten-Kompromisse – planbar und klar kalkuliert.' },
  { id: 'dwa', name: 'Digitale Wachstumsarchitektur', priceLabel: 'individuelles Angebot', benefit: 'Für Unternehmen, die über eine Onepage hinaus Funnels, Portale und Automatisierung brauchen.' },
  { id: 'executive_ki', name: 'Executive KI-Systeme', priceLabel: 'individuelles Angebot', benefit: 'KI-gestützte Vorbereitung von Kommunikation, Angeboten und Entscheidungsunterlagen auf C-Level.' },
  { id: 'seo_profi', name: 'SEO Profi Zusatzpaket', priceLabel: '299 € netto', benefit: 'Keyword-Strategie, OnPage-Optimierung und laufendes Monitoring für mehr Google-Sichtbarkeit.' },
  { id: 'blog_bundle_10', name: '10 Blog-Artikel Paket', priceLabel: '499 € netto', benefit: 'SEO-optimierte Fachartikel für dauerhaft mehr organischen Traffic.' },
  { id: 'gmb_komplett', name: 'Google My Business Komplettservice', priceLabel: '499 € netto einmalig', benefit: '3 KI-Fotos, 3 optimierte Google-Posts, Produkte einpflegen, Buchungen aktivieren.' },
  { id: 'branding', name: 'Branding & Logo', priceLabel: '199 € netto', benefit: '4 Logo-Entwürfe zur Auswahl für einen professionellen ersten Eindruck.' },
  { id: 'animation', name: 'Animationspaket', priceLabel: '999 € netto', benefit: 'Scroll-Animationen und Übergänge für mehr Wirkung ohne Ladezeit-Einbußen.' },
];

window.productById = function productById(id) {
  return window.OUTBOUND_PRODUCTS.find((p) => p.id === id) || null;
};

window.resolveOffer = function resolveOffer(prospect) {
  const offer = prospect?.offer || {};
  return {
    primary: window.productById(offer.primary || 'starterwelle'),
    alternatives: (offer.alternatives || []).map(window.productById).filter(Boolean),
    upsells: (offer.upsells || []).map(window.productById).filter(Boolean),
    gbpRecommendation: offer.gbpRecommendation || '',
  };
};

window.renderOfferHtml = function renderOfferHtml(prospect) {
  const { primary, alternatives, upsells, gbpRecommendation } = window.resolveOffer(prospect);
  const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
  let html = '';
  if (primary) {
    html += `<p style="margin:12px 0;color:#334155;line-height:1.65;">Mit <strong>${esc(primary.name)}</strong> (${esc(primary.priceLabel)}) ${esc(primary.benefit)}</p>`;
  }
  if (alternatives.length) {
    html += `<p style="color:#334155;font-size:14px;"><strong>Alternativen:</strong> ${alternatives.map((a) => `${esc(a.name)} (${esc(a.priceLabel)})`).join(' · ')}</p>`;
  }
  if (upsells.length) {
    html += '<p style="color:#334155;font-size:14px;"><strong>Zusätzlich empfohlen:</strong></p><ul style="margin:0;padding-left:20px;">';
    for (const u of upsells) {
      html += `<li style="margin:6px 0;color:#334155;">${esc(u.name)} – ${esc(u.priceLabel)}: ${esc(u.benefit)}</li>`;
    }
    html += '</ul>';
  }
  if (gbpRecommendation) {
    html += `<p style="color:#b45309;font-size:14px;">${esc(gbpRecommendation)}</p>`;
  }
  if (prospect.email?.alternativeLine) {
    html += `<p style="color:#64748b;font-size:14px;">${esc(prospect.email.alternativeLine)}</p>`;
  }
  return html;
};

window.renderOutboundEmailHtml = function renderOutboundEmailHtml(prospect) {
  const L = { pageBg: '#f1f5f9', card: '#fff', heading: '#0e141f', body: '#334155', muted: '#64748b', border: '#e2e8f0', brand: '#8C36C9' };
  const zoom = (window.OUTBOUND_CONFIG && window.OUTBOUND_CONFIG.zoomUrl)
    || 'https://scheduler.zoom.us/aemanie-gmbh/30-minuten-mit-aemanie-gmbh-herr-manie';
  const pains = (prospect.offer?.painPoints || []).slice(0, 3).map((p) => `<li style="margin:8px 0;color:${L.body};">${p}</li>`).join('');
  const benefits = (prospect.offer?.benefits || []).slice(0, 3).map((b) => `<li style="margin:8px 0;color:${L.body};">${b}</li>`).join('');
  const offerBlock = window.renderOfferHtml(prospect);
  return `<!DOCTYPE html><html lang="de"><body style="margin:0;background:${L.pageBg};font-family:system-ui,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:24px 16px;">
<div style="background:${L.card};border:1px solid ${L.border};border-radius:16px;overflow:hidden;">
<div style="padding:28px 24px;border-bottom:1px solid ${L.border};text-align:center;">
<div style="letter-spacing:.15em;text-transform:uppercase;color:#6699ff;font-size:12px;font-weight:700;">WebWelle</div>
<h1 style="color:${L.heading};font-size:22px;margin:12px 0 0;">${prospect.email?.subject || 'Kurzanalyse Ihrer Online-Präsenz'}</h1>
</div>
<div style="padding:24px;">
<p style="color:${L.body};line-height:1.65;">${prospect.email?.greeting || 'Sehr geehrte Damen und Herren,'}</p>
<p style="color:${L.body};line-height:1.65;">Wir haben <strong>${prospect.domain}</strong>${prospect.googleBusiness?.found ? ' und Ihr Google-Unternehmensprofil' : ''} angeschaut. Drei Punkte sind uns aufgefallen:</p>
<ul>${pains}</ul>
${offerBlock}
<ul>${benefits}</ul>
<p style="text-align:center;margin:28px 0;"><a href="${zoom}" style="display:inline-block;background:${L.brand};color:#fff;text-decoration:none;font-weight:700;padding:14px 28px;border-radius:999px;">15 Minuten Zoom vereinbaren</a></p>
<p style="color:${L.muted};font-size:14px;">Im Anhang: detaillierte Analyse als PDF.</p>
<p style="color:${L.body};margin-top:24px;">Mit freundlichen Grüßen<br><strong>Herr Manie, AeManie GmbH, webwelle.com</strong></p>
</div></div></div></body></html>`;
};

window.renderOfferPdfSection = function renderOfferPdfSection(doc, prospect, margin, maxW, startY) {
  const { primary, alternatives, upsells, gbpRecommendation } = window.resolveOffer(prospect);
  let y = startY;

  function safe(s) {
    return String(s ?? '').replace(/\u20ac/g, ' EUR').replace(/[\u2013\u2014]/g, '-');
  }
  function ensureSpace(h = 10) {
    if (y + h > 285) { doc.addPage(); y = margin; }
  }
  function para(text, size = 11, rgb = [14, 20, 31]) {
    if (!text) return;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(size);
    doc.setTextColor(rgb[0], rgb[1], rgb[2]);
    const lines = doc.splitTextToSize(safe(text), maxW);
    for (const line of lines) {
      ensureSpace(6);
      doc.text(line, margin, y);
      y += 5;
    }
    y += 2;
  }

  if (primary) para(`${primary.name} – ${primary.priceLabel}`);
  if (primary?.benefit) para(primary.benefit);
  if (alternatives.length) {
    para('Alternativen:', 11, [14, 20, 31]);
    for (const a of alternatives) para(`• ${a.name} – ${a.priceLabel}`, 10);
  }
  if (upsells.length) {
    para('Zusätzlich empfohlen:', 11, [14, 20, 31]);
    for (const u of upsells) para(`• ${u.name} – ${u.priceLabel}`, 10);
  }
  if (gbpRecommendation) para(gbpRecommendation, 10, [180, 83, 9]);
  return y;
};

window.renderOfferPdfHtmlBlock = function renderOfferPdfHtmlBlock(prospect) {
  const { primary, alternatives, upsells, gbpRecommendation } = window.resolveOffer(prospect);
  const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
  let html = '';
  if (primary) html += `<p><strong>${esc(primary.name)}</strong> – ${esc(primary.priceLabel)}<br>${esc(primary.benefit)}</p>`;
  if (alternatives.length) {
    html += '<p><strong>Alternativen:</strong></p><ul>' + alternatives.map((a) => `<li>${esc(a.name)} – ${esc(a.priceLabel)}</li>`).join('') + '</ul>';
  }
  if (upsells.length) {
    html += '<p><strong>Zusätzlich empfohlen:</strong></p><ul>' + upsells.map((u) => `<li>${esc(u.name)} – ${esc(u.priceLabel)}: ${esc(u.benefit)}</li>`).join('') + '</ul>';
  }
  if (gbpRecommendation) html += `<p class="warn">${esc(gbpRecommendation)}</p>`;
  return html;
};
