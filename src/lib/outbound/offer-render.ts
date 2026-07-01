import { productById } from './products';
import type { N8nProspectDraft } from '../outbound-database';

function esc(s: unknown): string {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
}

export function resolveOffer(prospect: N8nProspectDraft) {
  const offer = (prospect.offer || {}) as Record<string, unknown>;
  const primaryId = String(offer.primary || 'starterwelle');
  return {
    primary: productById(primaryId),
    alternatives: ((offer.alternatives as string[]) || []).map(productById).filter(Boolean),
    upsells: ((offer.upsells as string[]) || []).map(productById).filter(Boolean),
    gbpRecommendation: String(offer.gbpRecommendation || ''),
  };
}

export function renderOfferHtmlBlock(prospect: N8nProspectDraft): string {
  const { primary, alternatives, upsells, gbpRecommendation } = resolveOffer(prospect);
  let html = '';
  if (primary) {
    html += `<p style="margin:12px 0;color:#334155;line-height:1.65;">Mit <strong>${esc(primary.name)}</strong> (${esc(primary.priceLabel)}) ${esc(primary.benefit)}</p>`;
  }
  if (alternatives.length) {
    html += `<p style="color:#334155;font-size:14px;"><strong>Alternativen:</strong> ${alternatives.map((a) => `${esc(a!.name)} (${esc(a!.priceLabel)})`).join(' · ')}</p>`;
  }
  if (upsells.length) {
    html += '<p style="color:#334155;font-size:14px;"><strong>Zusätzlich empfohlen:</strong></p><ul style="margin:0;padding-left:20px;">';
    for (const u of upsells) {
      html += `<li style="margin:6px 0;color:#334155;">${esc(u!.name)} – ${esc(u!.priceLabel)}: ${esc(u!.benefit)}</li>`;
    }
    html += '</ul>';
  }
  if (gbpRecommendation) {
    html += `<p style="color:#b45309;font-size:14px;">${esc(gbpRecommendation)}</p>`;
  }
  const altLine = prospect.email?.alternativeLine;
  if (altLine) {
    html += `<p style="color:#64748b;font-size:14px;">${esc(altLine)}</p>`;
  }
  return html;
}

export function renderOutboundEmailHtml(prospect: N8nProspectDraft): string {
  const zoom = process.env.OUTBOUND_ZOOM_URL
    || 'https://scheduler.zoom.us/aemanie-gmbh/30-minuten-mit-aemanie-gmbh-herr-manie';
  const offer = (prospect.offer || {}) as Record<string, unknown>;
  const pains = ((offer.painPoints as string[]) || []).slice(0, 3).map((p) => `<li style="margin:8px 0;color:#334155;">${esc(p)}</li>`).join('');
  const benefits = ((offer.benefits as string[]) || []).slice(0, 3).map((b) => `<li style="margin:8px 0;color:#334155;">${esc(b)}</li>`).join('');
  const email = prospect.email || {};
  const gbp = prospect.googleBusiness as Record<string, unknown> | undefined;
  const offerBlock = renderOfferHtmlBlock(prospect);
  return `<!DOCTYPE html><html lang="de"><body style="margin:0;background:#f1f5f9;font-family:system-ui,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:24px 16px;">
<div style="background:#fff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
<div style="padding:28px 24px;border-bottom:1px solid #e2e8f0;text-align:center;">
<div style="letter-spacing:.15em;text-transform:uppercase;color:#6699ff;font-size:12px;font-weight:700;">WebWelle</div>
<h1 style="color:#0e141f;font-size:22px;margin:12px 0 0;">${esc(email.subject || 'Kurzanalyse Ihrer Online-Präsenz')}</h1>
</div>
<div style="padding:24px;">
<p style="color:#334155;line-height:1.65;">${esc(email.greeting || 'Sehr geehrte Damen und Herren,')}</p>
<p style="color:#334155;line-height:1.65;">Wir haben <strong>${esc(prospect.domain)}</strong>${gbp?.found ? ' und Ihr Google-Unternehmensprofil' : ''} angeschaut. Drei Punkte sind uns aufgefallen:</p>
<ul>${pains}</ul>
${offerBlock}
<ul>${benefits}</ul>
<p style="text-align:center;margin:28px 0;"><a href="${zoom}" style="display:inline-block;background:#8C36C9;color:#fff;text-decoration:none;font-weight:700;padding:14px 28px;border-radius:999px;">15 Minuten Zoom vereinbaren</a></p>
<p style="color:#64748b;font-size:14px;">Im Anhang: detaillierte Analyse als PDF.</p>
<p style="color:#334155;margin-top:24px;">Mit freundlichen Grüßen<br><strong>Herr Manie, AeManie GmbH, webwelle.com</strong></p>
</div></div></div></body></html>`;
}
