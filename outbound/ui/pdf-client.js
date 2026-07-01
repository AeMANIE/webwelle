/**
 * Audit-PDF im Browser (jsPDF) – funktioniert immer, kein Server nötig.
 */
window.buildAuditPdfBase64 = function buildAuditPdfBase64(prospect) {
  if (!window.jspdf?.jsPDF) {
    throw new Error('jsPDF nicht geladen – Seite neu laden.');
  }
  const { jsPDF } = window.jspdf;
  const p = prospect || {};
  const g = p.googleBusiness || {};
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const margin = 18;
  const maxW = 210 - margin * 2;
  let y = margin;

  function safe(s) {
    return String(s ?? '')
      .replace(/\u20ac/g, ' EUR')
      .replace(/[\u2013\u2014]/g, '-');
  }

  function ensureSpace(h = 10) {
    if (y + h > 285) {
      doc.addPage();
      y = margin;
    }
  }

  function heading(title) {
    ensureSpace(12);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(102, 153, 255);
    doc.text(safe(title), margin, y);
    y += 7;
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

  function bullet(text) {
    para(`• ${text}`);
  }

  function field(label, value) {
    if (value === undefined || value === null || value === '') return;
    para(`${label}: ${value}`);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(140, 54, 201);
  const title = safe(`Online-Audit: ${p.company?.name || p.domain || 'Kunde'}`);
  const titleLines = doc.splitTextToSize(title, maxW);
  doc.text(titleLines, margin, y);
  y += titleLines.length * 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(safe(`${p.domain || ''} · ${new Date().toLocaleDateString('de-DE')}`), margin, y);
  y += 10;

  heading('Kurzfassung');
  for (const pain of p.offer?.painPoints || []) bullet(pain);

  heading('Unternehmen & Kontakt');
  field('Firma', p.company?.name);
  field('GF', p.company?.managingDirector);
  field('E-Mail', p.contacts?.preferredEmail);
  field('Ort', [p.company?.postalCode, p.company?.city].filter(Boolean).join(' '));

  heading('Google-Unternehmensprofil');
  if (g.found) {
    field('Profil', g.name);
    field('Adresse', g.address);
    field('Telefon', g.phone);
    if (g.rating != null) field('Bewertung', `${g.rating} (${g.reviewCount || 0} Rezensionen)`);
    field('Vollständigkeit', g.completenessScore != null ? `${g.completenessScore}%` : '');
    for (const gap of (g.gaps || []).slice(0, 5)) bullet(gap);
  } else {
    para('Kein Google-Profil auffindbar – GMB-Komplettservice empfohlen.', 11, [180, 83, 9]);
  }

  heading('Technologie');
  field('Plattform', p.technology?.platform);
  field('Baukasten', p.technology?.isPageBuilder ? 'Ja' : 'Nein');
  if (p.technology?.recommendation) para(p.technology.recommendation);

  heading('Performance');
  field('Mobile Score', p.performance?.mobileScore);
  field('Desktop Score', p.performance?.desktopScore);
  field('LCP', p.performance?.lcp);

  heading('SEO');
  field('Title', p.seo?.title);
  field('Meta', p.seo?.metaDescription);

  heading('Empfehlung WebWelle');
  if (typeof window.renderOfferPdfSection === 'function') {
    y = window.renderOfferPdfSection(doc, p, margin, maxW, y);
  } else {
    para('StarterWelle – 699 EUR netto / 24 Monate');
    para('Professioneller React-Auftritt inkl. SEO-Basis, Rechtstexten und Hosting.');
  }

  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('WebWelle · AeManie GmbH · webwelle.com', 105, 290, { align: 'center' });

  const buf = doc.output('arraybuffer');
  const bytes = new Uint8Array(buf);
  let bin = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  const b64 = btoa(bin);
  if (!b64 || !atob(b64.slice(0, 24)).startsWith('%PDF')) {
    throw new Error('PDF-Erzeugung fehlgeschlagen');
  }
  return b64;
};
