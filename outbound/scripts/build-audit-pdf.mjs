/**
 * Audit-PDF mit pdfkit (serverseitig auf dem Mac – zuverlässig, kein leeres Canvas-PDF).
 */
import PDFDocument from 'pdfkit';
import { renderOfferPdfLines } from '../lib/offer-render-core.mjs';

function line(doc, label, value) {
  const v = String(value || '').trim();
  if (!v) return;
  doc.fontSize(11).fillColor('#0e141f').text(`${label}: ${v}`, { width: 500 });
}

export function buildAuditPdfBuffer(prospect) {
  return new Promise((resolve, reject) => {
    const p = prospect || {};
    const g = p.googleBusiness || {};
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks = [];

    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(22).fillColor('#8C36C9').text(`Online-Audit: ${p.company?.name || p.domain || 'Kunde'}`);
    doc.moveDown(0.2);
    doc.fontSize(10).fillColor('#64748b').text(`${p.domain || ''} · ${new Date().toLocaleDateString('de-DE')}`);
    doc.moveDown();

    doc.fontSize(14).fillColor('#6699ff').text('Kurzfassung');
    doc.moveDown(0.3);
    for (const pain of p.offer?.painPoints || []) {
      doc.fontSize(11).fillColor('#0e141f').text(`• ${pain}`, { width: 500, indent: 8 });
    }
    doc.moveDown();

    doc.fontSize(14).fillColor('#6699ff').text('Unternehmen & Kontakt');
    doc.moveDown(0.3);
    line(doc, 'Firma', p.company?.name);
    line(doc, 'GF', p.company?.managingDirector);
    line(doc, 'E-Mail', p.contacts?.preferredEmail);
    line(doc, 'Ort', [p.company?.postalCode, p.company?.city].filter(Boolean).join(' '));
    doc.moveDown();

    doc.fontSize(14).fillColor('#6699ff').text('Google-Unternehmensprofil');
    doc.moveDown(0.3);
    if (g.found) {
      line(doc, 'Profil', g.name);
      line(doc, 'Adresse', g.address);
      line(doc, 'Telefon', g.phone);
      if (g.rating != null) {
        line(doc, 'Bewertung', `${g.rating} (${g.reviewCount || 0} Rezensionen)`);
      }
      line(doc, 'Vollständigkeit', g.completenessScore != null ? `${g.completenessScore}%` : '');
      for (const gap of (g.gaps || []).slice(0, 5)) {
        doc.fontSize(10).fillColor('#b45309').text(`• ${gap}`, { width: 500, indent: 8 });
      }
      doc.fillColor('#0e141f');
    } else {
      doc.fontSize(11).fillColor('#b45309').text(
        'Kein Google-Profil auffindbar – GMB-Komplettservice empfohlen.',
        { width: 500 },
      );
      doc.fillColor('#0e141f');
    }
    doc.moveDown();

    doc.fontSize(14).fillColor('#6699ff').text('Technologie');
    doc.moveDown(0.3);
    line(doc, 'Plattform', p.technology?.platform);
    line(doc, 'Baukasten', p.technology?.isPageBuilder ? 'Ja' : 'Nein');
    if (p.technology?.recommendation) {
      doc.fontSize(11).text(p.technology.recommendation, { width: 500 });
    }
    doc.moveDown();

    doc.fontSize(14).fillColor('#6699ff').text('Performance');
    doc.moveDown(0.3);
    line(doc, 'Mobile Score', p.performance?.mobileScore);
    line(doc, 'Desktop Score', p.performance?.desktopScore);
    line(doc, 'LCP', p.performance?.lcp);
    doc.moveDown();

    doc.fontSize(14).fillColor('#6699ff').text('SEO');
    doc.moveDown(0.3);
    line(doc, 'Title', p.seo?.title);
    line(doc, 'Meta', p.seo?.metaDescription);
    doc.moveDown();

    doc.fontSize(14).fillColor('#6699ff').text('Empfehlung WebWelle');
    doc.moveDown(0.3);
    renderOfferPdfLines(doc, p, (text, size = 11, bold = false, color = '#0e141f') => {
      if (bold) doc.fontSize(size).fillColor(color).text(text, { width: 500, continued: false });
      else doc.fontSize(size).fillColor(color).text(text, { width: 500 });
      doc.moveDown(0.2);
    });

    doc.moveDown(2);
    doc.fontSize(9).fillColor('#64748b').text('WebWelle · AeManie GmbH · webwelle.com', { align: 'center' });

    doc.end();
  });
}

export function isPdfBuffer(buf) {
  return Buffer.isBuffer(buf) && buf.length > 500 && buf.subarray(0, 5).toString() === '%PDF-';
}
