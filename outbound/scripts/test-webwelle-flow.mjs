#!/usr/bin/env node
/**
 * End-to-end test: analyze webwelle.com → draft → PDF → send email locally.
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { buildAuditPdfBuffer, isPdfBuffer } from './build-audit-pdf.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const cfgText = readFileSync(join(root, 'outbound/ui/config.js'), 'utf8');
const base = cfgText.match(/n8nWebhookBase:\s*'([^']+)'/)?.[1];
const secret = cfgText.match(/apiSecret:\s*'([^']+)'/)?.[1];
if (!base || !secret) throw new Error('config.js: n8nWebhookBase oder apiSecret fehlt');

const TO = process.env.OUTBOUND_TEST_TO || 'info@webwelle.com';
const LOCAL = 'http://localhost:3000';

async function api(path, opts = {}) {
  const url = `${base}/${path}`;
  const res = await fetch(url, {
    method: opts.method || 'GET',
    headers: {
      'X-Outbound-Secret': secret,
      ...(opts.body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || `HTTP ${res.status}`);
  return data;
}

function renderEmailHtml(prospect) {
  const pains = (prospect.offer?.painPoints || []).slice(0, 3).map((p) => `<li>${p}</li>`).join('');
  const benefits = (prospect.offer?.benefits || []).slice(0, 3).map((b) => `<li>${b}</li>`).join('');
  const primary = prospect.offer?.primaryLabel || 'StarterWelle';
  return `<!DOCTYPE html><html lang="de"><body style="font-family:system-ui,sans-serif;color:#334155;max-width:600px;margin:24px auto;">
<h1 style="color:#8C36C9;">${prospect.email?.subject || 'Kurzanalyse'}</h1>
<p>${prospect.email?.greeting || 'Sehr geehrte Damen und Herren,'}</p>
<p>Wir haben <strong>${prospect.domain}</strong> angeschaut:</p><ul>${pains}</ul>
<p><strong>${primary}</strong></p><ul>${benefits}</ul>
<p>Testlauf Outbound-System.</p></body></html>`;
}

console.log('1/4 Analyse https://webwelle.com/ …');
const analyze = await api('outbound-analyze', {
  method: 'POST',
  body: { websiteUrl: 'https://webwelle.com/' },
});
console.log('   prospectId:', analyze.prospectId);

console.log('2/4 Draft laden …');
const draftRes = await fetch(`${base}/outbound-draft?id=${encodeURIComponent(analyze.prospectId)}`, {
  headers: { 'X-Outbound-Secret': secret },
});
const prospect = await draftRes.json();
if (!draftRes.ok) throw new Error(prospect.error || 'draft failed');

const gbp = prospect.googleBusiness || {};
console.log('   Firma:', prospect.company?.name);
console.log('   GBP:', gbp.found ? `${gbp.name} (Score ${gbp.completenessScore}%, match ${gbp.matchScore})` : 'nicht gefunden');
if (gbp.searchAttempts?.length) {
  console.log('   Erste Query:', gbp.searchAttempts[0]?.query);
  for (const a of gbp.searchAttempts.slice(0, 6)) {
    console.log(`   · ${a.query}: ${a.hits} Treffer${a.top ? `, top: ${a.top}` : ''}${a.error ? `, ERR: ${a.error}` : ''}`);
  }
}

console.log('3/4 PDF erzeugen …');
const pdfBuf = await buildAuditPdfBuffer(prospect);
if (!isPdfBuffer(pdfBuf)) throw new Error('PDF ungültig');
const pdfBase64 = pdfBuf.toString('base64');
console.log('   PDF bytes:', pdfBuf.length);

const to = prospect.contacts?.preferredEmail || TO;
const html = renderEmailHtml(prospect);

console.log(`4/4 E-Mail senden an ${to} …`);
const sendRes = await fetch(`${LOCAL}/api/outbound-send`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to,
    subject: prospect.email?.subject || `Test Kurzanalyse webwelle.com`,
    html,
    pdfBase64,
    domain: prospect.domain,
  }),
});
const sendData = await sendRes.json().catch(() => ({}));
if (!sendRes.ok) throw new Error(sendData.error || sendData.hint || `Send HTTP ${sendRes.status}`);

console.log('\n✓ Fertig');
console.log('  Empfänger:', to);
console.log('  GBP-Name:', gbp.name || '–');
console.log('  Upsells:', (prospect.offer?.upsells || []).join(', ') || '–');
