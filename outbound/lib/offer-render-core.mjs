import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const productsPath = join(__dirname, '../config/products.json');

let _products = null;
export function getProducts() {
  if (!_products) {
    _products = JSON.parse(readFileSync(productsPath, 'utf8')).products;
  }
  return _products;
}

export function productById(id) {
  return getProducts().find((p) => p.id === id) || null;
}

export function resolveOffer(prospect) {
  const offer = prospect?.offer || {};
  const primaryId = offer.primary || 'starterwelle';
  return {
    primary: productById(primaryId),
    alternatives: (offer.alternatives || []).map(productById).filter(Boolean),
    upsells: (offer.upsells || []).map(productById).filter(Boolean),
    gbpRecommendation: offer.gbpRecommendation || '',
  };
}

export function renderOfferHtmlBlock(prospect) {
  const { primary, alternatives, upsells, gbpRecommendation } = resolveOffer(prospect);
  const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
  let html = '';
  if (primary) {
    html += `<p style="margin:12px 0;"><strong>${esc(primary.name)}</strong> – ${esc(primary.priceLabel)}<br><span style="color:#64748b;font-size:14px;">${esc(primary.benefit)}</span></p>`;
  }
  if (alternatives.length) {
    html += '<p style="margin:12px 0;font-size:14px;color:#334155;"><strong>Alternativen:</strong></p><ul style="margin:0;padding-left:20px;">';
    for (const a of alternatives) {
      html += `<li style="margin:6px 0;">${esc(a.name)} – ${esc(a.priceLabel)}</li>`;
    }
    html += '</ul>';
  }
  if (upsells.length) {
    html += '<p style="margin:12px 0;font-size:14px;color:#334155;"><strong>Zusätzlich empfohlen:</strong></p><ul style="margin:0;padding-left:20px;">';
    for (const u of upsells) {
      html += `<li style="margin:6px 0;">${esc(u.name)} – ${esc(u.priceLabel)}: ${esc(u.benefit)}</li>`;
    }
    html += '</ul>';
  }
  if (gbpRecommendation) {
    html += `<p style="margin:12px 0;color:#b45309;font-size:14px;">${esc(gbpRecommendation)}</p>`;
  }
  return html;
}

export function renderOfferPdfLines(doc, prospect, lineFn) {
  const { primary, alternatives, upsells, gbpRecommendation } = resolveOffer(prospect);
  if (primary) {
    lineFn(`${primary.name} – ${primary.priceLabel}`);
    if (primary.benefit) lineFn(primary.benefit, 10);
  }
  if (alternatives.length) {
    lineFn('Alternativen:', 11, true);
    for (const a of alternatives) lineFn(`• ${a.name} – ${a.priceLabel}`, 10);
  }
  if (upsells.length) {
    lineFn('Zusätzlich empfohlen:', 11, true);
    for (const u of upsells) lineFn(`• ${u.name} – ${u.priceLabel}`, 10);
  }
  if (gbpRecommendation) lineFn(gbpRecommendation, 10, false, '#b45309');
}
