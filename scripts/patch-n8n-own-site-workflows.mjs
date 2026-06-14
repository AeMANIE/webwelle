/**
 * Patches competitor-design-v3 and seo-keywords-v2 for Funnel-3 own-site analysis.
 * Own site is prepended to competitor discovery — never analyzed alone.
 * Usage: N8N_API_URL=... N8N_API_KEY=... node scripts/patch-n8n-own-site-workflows.mjs
 */

const WORKFLOWS = [
  { id: 'bZoVtgwefEh78IMI', name: 'competitor-design-v3', evidenceTarget: 'Fetch Evidence Per Site' },
  { id: '9M8lo3OsPCxs5q68', name: 'seo-keywords-v2', evidenceTarget: 'Run SEO Crawl And LLM' },
];

const SUPPLEMENT_NODE_NAMES = ['If Own Site Supplement', 'Prepare Own Site Competitors'];

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
if (!postalCode) throw new Error('postalCode fehlt');

const existingWebsite = body.existingWebsite === true;
const existingWebsiteUrl = String(body.existingWebsiteUrl || '').trim();

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
  },
}];`;

const DISCOVER_INJECT_SNIPPET = String.raw`
let norm = {};
try {
  norm = $('Normalize And Verify HMAC').first().json || {};
} catch {
  norm = {};
}
if (norm.ownSite && norm.ownSite.websiteUrl) {
  const own = { ...norm.ownSite, isOwnSite: true, name: norm.ownSite.name || 'Ihre Website' };
  const filtered = top.filter((c) => c.domain !== own.domain);
  top = [own, ...filtered].slice(0, 5);
}
`;

const SIGN_DESIGN_OWN_SITE_MAP = String.raw`competitors: (parsed.competitors || []).slice(0, 5).map((c) => {
    const own = normalizedInput.ownSite;
    if (!own || !own.domain) return c;
    const domain = String(c.domain || '').toLowerCase();
    const ownDomain = String(own.domain || '').toLowerCase();
    if (domain && ownDomain && domain === ownDomain) {
      return { ...c, isOwnSite: true, name: c.name || own.name || 'Ihre Website' };
    }
    return c;
  }),`;

const SIGN_SEO_OWN_SITE_MAP = String.raw`perSite: (row.perSite || []).map((entry) => {
    const own = normalizedInput.ownSite;
    if (!own || !own.domain) return entry;
    const domain = String(entry.domain || '').toLowerCase();
    const ownDomain = String(own.domain || '').toLowerCase();
    if (domain && ownDomain && domain === ownDomain) {
      return { ...entry, isOwnSite: true };
    }
    return entry;
  }),`;

function patchDiscoverAndFilter(code) {
  let next = code;
  if (next.includes('!norm.isOwnSiteSupplement')) {
    next = next.replace(/\s*&&\s*!norm\.isOwnSiteSupplement/g, '');
  }
  if (next.includes('norm.ownSite && norm.ownSite.websiteUrl')) return next;
  return next.replace(
    /const top = uniq\.slice\(0, \d+\);/,
    (match) => match.replace('const top', 'let top') + `\n${DISCOVER_INJECT_SNIPPET}`
  );
}

function patchSignDesignCallback(code) {
  if (code.includes('ownDomain === ownDomain')) return code;
  if (code.includes(SIGN_DESIGN_OWN_SITE_MAP.trim().slice(0, 40))) return code;
  return code
    .replace(
      /competitors: \(parsed\.competitors \|\| \[\]\)\.slice\(0, 5\)(?:\.map\([\s\S]*?\))?,\s*/,
      `${SIGN_DESIGN_OWN_SITE_MAP}\n  `
    )
    .replace(/\s*isOwnSiteSupplement: Boolean\(normalizedInput\.isOwnSiteSupplement\),?\n?/g, '\n');
}

function patchSignSeoCallback(code) {
  if (code.includes('ownDomain === ownDomain')) return code;
  if (code.includes('normalizedInput.ownSite')) return code;
  return code
    .replace(
      /perSite: row\.perSite \|\| \[\],/,
      SIGN_SEO_OWN_SITE_MAP
    )
    .replace(/\s*isOwnSiteSupplement: Boolean\(normalizedInput\.isOwnSiteSupplement\),?\n?/g, '\n');
}

function removeSupplementShortcut(nodes, connections) {
  const hasShortcut = nodes.some((n) => SUPPLEMENT_NODE_NAMES.includes(n.name));
  if (!hasShortcut) {
    return { nodes, connections };
  }

  const filteredNodes = nodes.filter((n) => !SUPPLEMENT_NODE_NAMES.includes(n.name));
  const nextConnections = { ...connections };

  for (const name of SUPPLEMENT_NODE_NAMES) {
    delete nextConnections[name];
  }

  nextConnections['Normalize And Verify HMAC'] = {
    main: [[{ node: 'Geocode PLZ', type: 'main', index: 0 }]],
  };

  return { nodes: filteredNodes, connections: nextConnections };
}

function ensureOwnSiteNodes(workflow) {
  let nodes = workflow.nodes;
  let connections = { ...workflow.connections };

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

  ({ nodes, connections } = removeSupplementShortcut(nodes, connections));

  if (!connections['Normalize And Verify HMAC']) {
    connections['Normalize And Verify HMAC'] = {
      main: [[{ node: 'Geocode PLZ', type: 'main', index: 0 }]],
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

    const patched = ensureOwnSiteNodes(workflow);
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
