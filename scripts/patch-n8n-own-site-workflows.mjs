/**
 * Patches competitor-design-v3 and seo-keywords-v2 for Funnel-3 own-site analysis.
 * Usage: N8N_API_URL=... N8N_API_KEY=... node scripts/patch-n8n-own-site-workflows.mjs
 */

const WORKFLOWS = [
  { id: 'bZoVtgwefEh78IMI', name: 'competitor-design-v3', evidenceTarget: 'Fetch Evidence Per Site' },
  { id: '9M8lo3OsPCxs5q68', name: 'seo-keywords-v2', evidenceTarget: 'Run SEO Crawl And LLM' },
];

const NORMALIZE_JS = String.raw`const crypto = require('crypto');
const item = items[0].json;
const sigHeader = item.headers?.['x-webwelle-signature'] || item.headers?.['X-Webwelle-Signature'];
const secret = item._webwelleN8nWebhookSecret || 'dev-n8n-secret';
let raw = typeof item.rawBody === 'string' ? item.rawBody : '';
if (!raw && item.body !== undefined) {
  raw = typeof item.body === 'string' ? item.body : JSON.stringify(item.body);
}
if (!raw) raw = '{}';
const candidateStrings = new Set([raw]);
if (item.body && typeof item.body === 'object') {
  candidateStrings.add(JSON.stringify(item.body));
  const keys = Object.keys(item.body).sort();
  const sorted = {};
  for (const k of keys) sorted[k] = item.body[k];
  candidateStrings.add(JSON.stringify(sorted));
}
let verified = false;
for (const s of candidateStrings) {
  const expectedHex = crypto.createHmac('sha256', secret).update(s).digest('hex');
  if (sigHeader && sigHeader === expectedHex) {
    verified = true;
    break;
  }
}
if (!verified) {
  throw new Error('Ungueltige oder fehlende x-webwelle-signature');
}
let body;
try {
  body = JSON.parse(raw);
} catch {
  body = item.body && typeof item.body === 'object' ? item.body : {};
}
const leadId = body.leadId || '';
const token = body.token || '';
const industry = (body.industry || 'Dienstleister').trim();
const postalCode = (body.postalCode || '').trim();
const market = (body.market || 'DE').trim();
const callbackBaseUrl = String(body.callbackBaseUrl || '').replace(/\/$/, '');
if (!leadId) throw new Error('leadId fehlt');

const existingWebsite = body.existingWebsite === true;
const existingWebsiteUrl = String(body.existingWebsiteUrl || '').trim();
const isOwnSiteSupplement = body.isOwnSiteSupplement === true;

function hasHttpScheme(url) {
  const lower = String(url).trim().toLowerCase();
  return lower.startsWith('http://') || lower.startsWith('https://');
}

function stripWwwHost(host) {
  const h = String(host).trim().toLowerCase();
  return h.startsWith('www.') ? h.slice(4) : h;
}

function withHttpsScheme(url) {
  const s = String(url).trim();
  return hasHttpScheme(s) ? s : 'https://' + s;
}

function normalizeOwnSite(c, fallbackName) {
  const source = c && typeof c === 'object' ? c : {};
  const websiteUrl = String(source.websiteUrl || source.url || existingWebsiteUrl || '').trim();
  if (!websiteUrl) return null;
  let domain = stripWwwHost(String(source.domain || '').trim());
  if (!domain) {
    try {
      domain = stripWwwHost(new URL(withHttpsScheme(websiteUrl)).hostname);
    } catch {
      return null;
    }
  }
  const normalizedUrl = withHttpsScheme(websiteUrl);
  return {
    name: String(source.name || fallbackName || domain).slice(0, 200),
    domain,
    websiteUrl: normalizedUrl,
    isOwnSite: true,
  };
}

let ownSite = normalizeOwnSite(body.ownSite, 'Ihre Website');
if (!ownSite && existingWebsite && existingWebsiteUrl) {
  ownSite = normalizeOwnSite({ websiteUrl: existingWebsiteUrl, name: 'Ihre Website' }, 'Ihre Website');
}

if (!isOwnSiteSupplement && !postalCode) throw new Error('postalCode fehlt');
if (isOwnSiteSupplement && !ownSite) throw new Error('ownSite fehlt fuer Own-Site-Supplement');

return [{
  json: {
    leadId,
    token,
    industry,
    postalCode,
    market,
    callbackBaseUrl,
    existingWebsite,
    existingWebsiteUrl,
    ownSite,
    isOwnSiteSupplement,
  },
}];`;

const PREPARE_OWN_SITE_JS = String.raw`const row = items[0].json;
if (!row.ownSite || !row.ownSite.websiteUrl) {
  throw new Error('ownSite fehlt fuer Own-Site-Supplement');
}
const own = {
  ...row.ownSite,
  isOwnSite: true,
  name: row.ownSite.name || 'Ihre Website',
};
return [{
  json: {
    ...row,
    competitors: [own],
    discoverMeta: {
      source: 'own_site',
      picked: 1,
      placesCount: 0,
      cseUsed: false,
    },
  },
}];`;

const DISCOVER_INJECT_SNIPPET = String.raw`
let norm = {};
try {
  norm = $('Normalize And Verify HMAC').first().json || {};
} catch {
  norm = {};
}
if (norm.ownSite && norm.ownSite.websiteUrl && !norm.isOwnSiteSupplement) {
  const own = { ...norm.ownSite, isOwnSite: true, name: norm.ownSite.name || 'Ihre Website' };
  const filtered = top.filter((c) => c.domain !== own.domain);
  top = [own, ...filtered].slice(0, 5);
}
`;

function patchDiscoverAndFilter(code) {
  if (code.includes('norm.ownSite && norm.ownSite.websiteUrl')) return code;
  return code.replace(
    /const top = uniq\.slice\(0, \d+\);/,
    (match) => match.replace('const top', 'let top') + `\n${DISCOVER_INJECT_SNIPPET}`
  );
}

function patchSignDesignCallback(code) {
  if (code.includes('isOwnSiteSupplement')) return code;
  return code.replace(
    'competitors: (parsed.competitors || []).slice(0, 5),',
    `competitors: (parsed.competitors || []).slice(0, 5).map((c) => {
    if (!normalizedInput.isOwnSiteSupplement) return c;
    return { ...c, isOwnSite: true, name: c.name || 'Ihre Website' };
  }),`
  ).replace(
    'partial: Boolean(parsed.partial),',
    'partial: Boolean(parsed.partial),\n  isOwnSiteSupplement: Boolean(normalizedInput.isOwnSiteSupplement),'
  );
}

function patchSignSeoCallback(code) {
  if (code.includes('isOwnSiteSupplement')) return code;
  return code.replace(
    'perSite: row.perSite || [],',
    `perSite: (row.perSite || []).map((entry) => ({
    ...entry,
    isOwnSite: Boolean(normalizedInput.isOwnSiteSupplement),
  })),`
  ).replace(
    'gaps: row.gaps || [],',
    'gaps: row.gaps || [],\n  isOwnSiteSupplement: Boolean(normalizedInput.isOwnSiteSupplement),'
  );
}

function ensureOwnSiteNodes(workflow, evidenceTarget) {
  const nodes = workflow.nodes;
  const connections = { ...workflow.connections };

  const normalize = nodes.find((n) => n.name === 'Normalize And Verify HMAC');
  if (normalize) {
    normalize.parameters.jsCode = NORMALIZE_JS;
  }

  const discover = nodes.find((n) => n.name === 'Discover And Filter');
  if (discover?.parameters?.jsCode) {
    discover.parameters.jsCode = patchDiscoverAndFilter(discover.parameters.jsCode);
  }

  const signDesign = nodes.find((n) => n.name === 'Sign Callback Payload');
  if (signDesign?.parameters?.jsCode) {
    signDesign.parameters.jsCode = patchSignDesignCallback(signDesign.parameters.jsCode);
  }

  const signSeo = nodes.find((n) => n.name === 'Sign SEO Callback');
  if (signSeo?.parameters?.jsCode) {
    signSeo.parameters.jsCode = patchSignSeoCallback(signSeo.parameters.jsCode);
  }

  if (!nodes.find((n) => n.name === 'If Own Site Supplement')) {
    nodes.push({
      parameters: {
        conditions: {
          options: { caseSensitive: true, leftValue: '', typeValidation: 'loose' },
          conditions: [
            {
              id: 'cond-own-site-supplement',
              leftValue: '={{ $json.isOwnSiteSupplement }}',
              rightValue: true,
              operator: { type: 'boolean', operation: 'equals' },
            },
            {
              id: 'cond-own-site-present',
              leftValue: '={{ Boolean($json.ownSite && $json.ownSite.websiteUrl) }}',
              rightValue: true,
              operator: { type: 'boolean', operation: 'equals' },
            },
          ],
          combinator: 'and',
        },
        options: {},
      },
      id: 'if-own-site-supplement',
      name: 'If Own Site Supplement',
      type: 'n8n-nodes-base.if',
      typeVersion: 2,
      position: [360, 128],
    });

    nodes.push({
      parameters: { mode: 'runOnceForAllItems', jsCode: PREPARE_OWN_SITE_JS },
      id: 'prepare-own-site-competitors',
      name: 'Prepare Own Site Competitors',
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      position: [600, 256],
    });

    connections['Normalize And Verify HMAC'] = {
      main: [[{ node: 'If Own Site Supplement', type: 'main', index: 0 }]],
    };
    connections['If Own Site Supplement'] = {
      main: [
        [{ node: 'Prepare Own Site Competitors', type: 'main', index: 0 }],
        [{ node: 'Geocode PLZ', type: 'main', index: 0 }],
      ],
    };
    connections['Prepare Own Site Competitors'] = {
      main: [[{ node: evidenceTarget, type: 'main', index: 0 }]],
    };
  }

  return { nodes, connections };
}

export { ensureOwnSiteNodes };

async function main() {
  const apiUrl = process.env.N8N_API_URL;
  const apiKey = process.env.N8N_API_KEY;
  if (!apiUrl || !apiKey) {
    throw new Error('N8N_API_URL und N8N_API_KEY erforderlich');
  }

  for (const target of WORKFLOWS) {
    const res = await fetch(`${apiUrl}/workflows/${target.id}`, {
      headers: { 'X-N8N-API-KEY': apiKey },
    });
    if (!res.ok) throw new Error(`Fetch ${target.name} failed: ${res.status}`);
    const workflow = await res.json();

    const patched = ensureOwnSiteNodes(workflow, target.evidenceTarget);
    const putRes = await fetch(`${apiUrl}/workflows/${target.id}`, {
      method: 'PUT',
      headers: {
        'X-N8N-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: workflow.name,
        nodes: patched.nodes,
        connections: patched.connections,
        settings: { executionOrder: workflow.settings?.executionOrder ?? 'v1' },
      }),
    });
    if (!putRes.ok) {
      const text = await putRes.text();
      throw new Error(`Update ${target.name} failed: ${putRes.status} ${text}`);
    }
    console.log(`Patched ${target.name} (${target.id})`);
  }
}

import { fileURLToPath } from 'node:url';

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
