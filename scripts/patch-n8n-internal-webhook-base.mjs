#!/usr/bin/env node
/** Patch seo-01..04 chain nodes: resolve N8N_INTERNAL_WEBHOOK_BASE with fallbacks. */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const envPath = join(root, '.env.local');

function parseEnv(path) {
  const env = {};
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i === -1) continue;
    env[t.slice(0, i)] = t.slice(i + 1);
  }
  return env;
}

const RESOLVE_FN = `function resolveInternalWebhookBase(payload, webhookNodeName) {
  const trim = (s) => String(s || '').replace(/\\\/+$/, '');
  const fromPayload = trim(payload?._internalWebhookBase);
  if (fromPayload) return fromPayload.endsWith('/webhook') ? fromPayload : fromPayload + '/webhook';
  const direct = trim($env.N8N_INTERNAL_WEBHOOK_BASE);
  if (direct) return direct.endsWith('/webhook') ? direct : direct + '/webhook';
  const baseUrl = trim($env.N8N_BASE_URL);
  if (baseUrl) return baseUrl + '/webhook';
  const webhookUrl = trim($env.WEBHOOK_URL);
  if (webhookUrl) {
    const u = webhookUrl.replace(/\\\/+$/, '');
    return (u.includes('/webhook') ? u.split('/webhook')[0] : u) + '/webhook';
  }
  if (webhookNodeName) {
    try {
      const wh = $(webhookNodeName).first()?.json;
      const host = wh?.headers?.['x-forwarded-host'] || wh?.headers?.host;
      const proto = wh?.headers?.['x-forwarded-proto'] || 'https';
      if (host) return \`\${proto}://\${String(host).split(',')[0].trim()}/webhook\`;
    } catch (_) {}
  }
  throw new Error('N8N_INTERNAL_WEBHOOK_BASE fehlt — in n8n-Env: N8N_INTERNAL_WEBHOOK_BASE=https://<host>/webhook');
}`;

const PATCHES = [
  {
    id: 'HbRAuPK4Dd6ekAjd',
    name: 'seo-01',
    node: 'Code - Trigger seo-02 Chain',
    webhookNode: 'Webhook - Receive Research Request',
    targetPath: 'seo-02-keyword-qualification',
    extraBody: `project_id: j.project_id || 'test-project',
    raw_keywords,
    jobId: j.jobId,
    leadToken: j.token,
    callbackBaseUrl: j.callbackBaseUrl,
    articleCount: j.articleCount || 10,
    test_mode: j.test_mode,`,
    preamble: `const funnelKw = Array.isArray(j.keywords) ? j.keywords : [];
const discovered = (j.root_keywords || []).map((k) => ({ keyword: k, difficulty: 25, volume: 200, intent: 'informational', cpc: 1.5 }));
const raw_keywords = funnelKw.length
  ? funnelKw.map((k) => (typeof k === 'object' && k ? { keyword: String(k.keyword || k), difficulty: Number(k.difficulty ?? 25), volume: Number(k.volume ?? 200), intent: String(k.intent || 'informational'), cpc: Number(k.cpc ?? 1.5) } : { keyword: String(k), difficulty: 25, volume: 200, intent: 'informational', cpc: 1.5 }))
  : discovered;`,
    returnExtra: 'triggeredSeo02: true, raw_keywords_count: raw_keywords.length',
  },
  {
    id: 'q5tqTGRjupy9JKdE',
    name: 'seo-02',
    node: 'Code - Chain Blog Articles seo-03',
    webhookNode: 'Webhook - Receive Qualification Request',
    targetPath: 'seo-03-blog-brief-builder',
    loop: true,
  },
  {
    id: '5THEWW5gWbv8cg7p',
    name: 'seo-03',
    node: 'Code - Trigger seo-04 Chain',
    webhookNode: 'Webhook - Receive Blog Brief Request',
    targetPath: 'seo-04-blog-writer-rewriter',
    extraBody: `project_id: j.project_id,
    content_brief: j.content_brief,
    jobId: j.jobId,
    leadToken: j.leadToken || j.token,
    callbackBaseUrl: j.callbackBaseUrl,
    articleCount: j.articleCount,
    articleIndex: j.articleIndex,
    approved_blog_keyword: j.approved_blog_keyword,
    test_mode: j.test_mode,
    sourceType: j.sourceType || j.source_type || 'client',
    publishMode: j.publishMode || j.publish_mode || 'draft',
    promptVersion: j.promptVersion || j.prompt_version,`,
    returnExtra: 'triggeredSeo04: true',
  },
  {
    id: '8BZxLGLZlCggHJ5b',
    name: 'seo-04',
    node: 'Code - Trigger seo-06 Chain',
    webhookNode: 'Webhook - Receive Blog Draft Request',
    targetPath: 'seo-06-qa-publishing-indexing',
    extraBody: `project_id: j.project_id,
    draft: j.draft,
    htmlContent: j.htmlContent,
    title: j.title || j.content_brief?.keyword,
    keyword: j.content_brief?.keyword || j.approved_blog_keyword,
    jobId: j.jobId,
    leadToken: j.leadToken || j.token,
    callbackBaseUrl: j.callbackBaseUrl,
    articleCount: j.articleCount,
    articleIndex: j.articleIndex,
    sourceType: j.sourceType || j.source_type || 'client',
    publishMode: j.publishMode || j.publish_mode || 'draft',
    promptVersion: j.promptVersion || j.prompt_version || 'blogartikel-v1',
    images: j.images || [],
    page_type: 'blog',
    test_mode: j.test_mode,`,
    returnExtra: 'triggeredSeo06: true',
  },
];

function buildLoopCode(p) {
  return `${RESOLVE_FN}
const httpRequest = this.helpers.httpRequest.bind(this.helpers);
const j = items[0].json;
const base = resolveInternalWebhookBase(j, '${p.webhookNode}');
const limit = Number(j.articleCount || 10);
const blogs = (j.approved_blog_keywords || []).slice(0, limit);
let triggered = 0;
for (let i = 0; i < blogs.length; i++) {
  const kw = blogs[i];
  const keyword = typeof kw === 'object' ? String(kw.keyword || kw) : String(kw);
  await httpRequest({
    method: 'POST',
    url: base + '/${p.targetPath}',
    body: JSON.stringify({
      project_id: j.project_id,
      approved_blog_keyword: keyword,
      jobId: j.jobId,
      leadToken: j.leadToken || j.token,
      callbackBaseUrl: j.callbackBaseUrl,
      articleCount: limit,
      articleIndex: i,
      test_mode: j.test_mode,
      sourceType: j.sourceType || j.source_type || 'client',
      publishMode: j.publishMode || j.publish_mode || 'draft',
      promptVersion: j.promptVersion || j.prompt_version,
      _internalWebhookBase: base,
    }),
    headers: { 'Content-Type': 'application/json' },
    timeout: 600000,
  });
  triggered++;
}
return [{ json: { ...j, blog_chain_triggered: triggered, service_keywords: j.approved_service_keywords || [], _internalWebhookBase: base } }];`;
}

function buildSimpleCode(p) {
  return `${RESOLVE_FN}
const httpRequest = this.helpers.httpRequest.bind(this.helpers);
const j = items[0].json;
const base = resolveInternalWebhookBase(j, '${p.webhookNode}');
${p.preamble || ''}
await httpRequest({
  method: 'POST',
  url: base + '/${p.targetPath}',
  body: JSON.stringify({
    ${p.extraBody}
    _internalWebhookBase: base,
  }),
  headers: { 'Content-Type': 'application/json' },
  timeout: 300000,
});
return [{ json: { ...j, ${p.returnExtra}, _internalWebhookBase: base } }];`;
}

async function main() {
  if (!existsSync(envPath)) throw new Error('.env.local fehlt');
  const env = parseEnv(envPath);
  const apiKey = env.N8N_API_KEY;
  const baseUrl = (env.N8N_BASE_URL || '').replace(/\/$/, '');
  if (!apiKey || !baseUrl) throw new Error('N8N_API_KEY / N8N_BASE_URL fehlt');

  for (const p of PATCHES) {
    const getRes = await fetch(`${baseUrl}/api/v1/workflows/${p.id}`, {
      headers: { 'X-N8N-API-KEY': apiKey, Accept: 'application/json' },
    });
    if (!getRes.ok) throw new Error(`${p.name} GET ${getRes.status}`);
    const wf = await getRes.json();
    const jsCode = p.loop ? buildLoopCode(p) : buildSimpleCode(p);
    const node = wf.nodes.find((n) => n.name === p.node);
    if (!node) throw new Error(`${p.name}: Node ${p.node} nicht gefunden`);
    node.parameters.jsCode = jsCode;

    const putRes = await fetch(`${baseUrl}/api/v1/workflows/${p.id}`, {
      method: 'PUT',
      headers: {
        'X-N8N-API-KEY': apiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        name: wf.name,
        nodes: wf.nodes,
        connections: wf.connections,
        settings: wf.settings,
      }),
    });
    const text = await putRes.text();
    if (!putRes.ok) throw new Error(`${p.name} PUT ${putRes.status}: ${text.slice(0, 300)}`);

    const actRes = await fetch(`${baseUrl}/api/v1/workflows/${p.id}/activate`, {
      method: 'POST',
      headers: { 'X-N8N-API-KEY': apiKey, 'Content-Type': 'application/json' },
      body: '{}',
    });
    console.log(`${p.name}: patched ${p.node} — aktiv: ${actRes.ok}`);
  }

  console.log('Hinweis: Setze in n8n-Env (Coolify):');
  console.log(`N8N_INTERNAL_WEBHOOK_BASE=${baseUrl}/webhook`);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
