import PDFDocument from 'pdfkit';
import { resolveOffer } from './offer-render';
import type { N8nProspectDraft } from '../outbound-database';

function line(doc: InstanceType<typeof PDFDocument>, label: string, value: unknown) {
  const v = String(value || '').trim();
  if (!v) return;
  doc.fontSize(11).fillColor('#0e141f').text(`${label}: ${v}`, { width: 500 });
}

export function buildAuditPdfBuffer(prospect: N8nProspectDraft): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const p = prospect;
    const g = (p.googleBusiness || {}) as Record<string, unknown>;
    const offer = (p.offer || {}) as Record<string, unknown>;
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks: Buffer[] = [];

    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const company = p.company || {};
    doc.fontSize(22).fillColor('#8C36C9').text(`Online-Audit: ${company.name || p.domain || 'Kunde'}`);
    doc.moveDown(0.2);
    doc.fontSize(10).fillColor('#64748b').text(`${p.domain || ''} · ${new Date().toLocaleDateString('de-DE')}`);
    doc.moveDown();

    doc.fontSize(14).fillColor('#6699ff').text('Kurzfassung');
    doc.moveDown(0.3);
    for (const pain of (offer.painPoints as string[]) || []) {
      doc.fontSize(11).fillColor('#0e141f').text(`• ${pain}`, { width: 500, indent: 8 });
    }
    doc.moveDown();

    doc.fontSize(14).fillColor('#6699ff').text('Unternehmen & Kontakt');
    doc.moveDown(0.3);
    line(doc, 'Firma', company.name);
    line(doc, 'GF', company.managingDirector);
    line(doc, 'E-Mail', p.contacts?.preferredEmail);
    line(doc, 'Ort', [company.postalCode, company.city].filter(Boolean).join(' '));
    doc.moveDown();

    doc.fontSize(14).fillColor('#6699ff').text('Google-Unternehmensprofil');
    doc.moveDown(0.3);
    if (g.found) {
      line(doc, 'Profil', g.name);
      line(doc, 'Adresse', g.address);
      line(doc, 'Telefon', g.phone);
      if (g.rating != null) line(doc, 'Bewertung', `${g.rating} (${g.reviewCount || 0} Rezensionen)`);
      line(doc, 'Vollständigkeit', g.completenessScore != null ? `${g.completenessScore}%` : '');
      for (const gap of ((g.gaps as string[]) || []).slice(0, 5)) {
        doc.fontSize(10).fillColor('#b45309').text(`• ${gap}`, { width: 500, indent: 8 });
      }
      doc.fillColor('#0e141f');
    } else {
      doc.fontSize(11).fillColor('#b45309').text('Kein Google-Profil auffindbar – GMB-Komplettservice empfohlen.', { width: 500 });
      doc.fillColor('#0e141f');
    }
    doc.moveDown();

    const tech = p.technology as Record<string, unknown> | undefined;
    doc.fontSize(14).fillColor('#6699ff').text('Technologie');
    doc.moveDown(0.3);
    line(doc, 'Plattform', tech?.platform);
    line(doc, 'Baukasten', tech?.isPageBuilder ? 'Ja' : 'Nein');
    if (tech?.recommendation) doc.fontSize(11).text(String(tech.recommendation), { width: 500 });
    doc.moveDown();

    const perf = p.performance as Record<string, unknown> | undefined;
    doc.fontSize(14).fillColor('#6699ff').text('Performance');
    doc.moveDown(0.3);
    line(doc, 'Mobile Score', perf?.mobileScore);
    line(doc, 'Desktop Score', perf?.desktopScore);
    line(doc, 'LCP', perf?.lcp);
    doc.moveDown();

    const seo = p.seo as Record<string, unknown> | undefined;
    doc.fontSize(14).fillColor('#6699ff').text('SEO');
    doc.moveDown(0.3);
    line(doc, 'Title', seo?.title);
    line(doc, 'Meta', seo?.metaDescription);
    doc.moveDown();

    doc.fontSize(14).fillColor('#6699ff').text('Empfehlung WebWelle');
    doc.moveDown(0.3);
    const { primary, alternatives, upsells, gbpRecommendation } = resolveOffer(p);
    if (primary) {
      doc.fontSize(11).fillColor('#0e141f').text(`${primary.name} – ${primary.priceLabel}`);
      doc.text(primary.benefit, { width: 500 });
    }
    if (alternatives.length) {
      doc.moveDown(0.2).text('Alternativen:', { width: 500 });
      for (const a of alternatives) doc.fontSize(10).text(`• ${a!.name} – ${a!.priceLabel}`, { width: 500 });
    }
    if (upsells.length) {
      doc.moveDown(0.2).fontSize(11).text('Zusätzlich empfohlen:', { width: 500 });
      for (const u of upsells) doc.fontSize(10).text(`• ${u!.name} – ${u!.priceLabel}`, { width: 500 });
    }
    if (gbpRecommendation) doc.fontSize(10).fillColor('#b45309').text(gbpRecommendation, { width: 500 });

    doc.moveDown(2);
    doc.fontSize(9).fillColor('#64748b').text('WebWelle · AeManie GmbH · webwelle.com', { align: 'center' });
    doc.end();
  });
}

export function isPdfBuffer(buf: Buffer): boolean {
  return Buffer.isBuffer(buf) && buf.length > 500 && buf.subarray(0, 5).toString() === '%PDF-';
}
