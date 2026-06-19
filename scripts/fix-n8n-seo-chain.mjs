#!/usr/bin/env node
/** Fix SEO chain handoffs: preserve jobId/callbackBaseUrl/sourceType through Set nodes. */
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

const SEO01_VALIDATE_CODE = `const j = items[0].json.body && typeof items[0].json.body === 'object' ? items[0].json.body : items[0].json;
const branche = String(j.branche || j.industry || j.industryForResearch || '').trim();
const plz = String(j.plz || j.postalCode || '').trim();
const land = String(j.land || j.market || j.country || 'DE').trim().toUpperCase();
const test_mode = Boolean(j.test_mode);
if (!branche) throw new Error('branche fehlt');
if (!plz) throw new Error('plz fehlt');
if (!['DE','AT','CH'].includes(land)) throw new Error('land muss DE/AT/CH sein');
return [{json:{...items[0].json, branche, plz, land, test_mode, input_hash: \`\${branche}|\${plz}|\${land}\`, jobId: j.jobId, token: j.token || j.leadToken, callbackBaseUrl: j.callbackBaseUrl, articleCount: Number(j.articleCount || 10), keywords: j.keywords || [], companyName: j.companyName, sourceType: j.sourceType || j.source_type || 'client', publishMode: j.publishMode || j.publish_mode || 'draft', promptVersion: j.promptVersion || j.prompt_version}}];`;

const SEO01_TRIGGER_CODE = `${RESOLVE_FN}
const httpRequest = this.helpers.httpRequest.bind(this.helpers);
const validated = $('Code - Validate Research Input').first().json;
const j = { ...validated, ...items[0].json };
const base = resolveInternalWebhookBase(j, 'Webhook - Receive Research Request');
const funnelKw = Array.isArray(j.keywords) ? j.keywords : [];
const discovered = (j.root_keywords || []).map((k) => ({ keyword: k, difficulty: 25, volume: 200, intent: 'informational', cpc: 1.5 }));
const raw_keywords = funnelKw.length
  ? funnelKw.map((k) => (typeof k === 'object' && k ? { keyword: String(k.keyword || k), difficulty: Number(k.difficulty ?? 25), volume: Number(k.volume ?? 200), intent: String(k.intent || 'informational'), cpc: Number(k.cpc ?? 1.5) } : { keyword: String(k), difficulty: 25, volume: 200, intent: 'informational', cpc: 1.5 }))
  : discovered;
await httpRequest({
  method: 'POST',
  url: base + '/seo-02-keyword-qualification',
  body: JSON.stringify({
    project_id: j.project_id || 'test-project',
    raw_keywords,
    jobId: j.jobId,
    leadToken: j.token,
    callbackBaseUrl: j.callbackBaseUrl,
    articleCount: j.articleCount || 10,
    test_mode: j.test_mode,
    sourceType: j.sourceType || j.source_type || 'client',
    publishMode: j.publishMode || j.publish_mode || 'draft',
    promptVersion: j.promptVersion || j.prompt_version,
    _internalWebhookBase: base,
  }),
  headers: { 'Content-Type': 'application/json' },
  timeout: 300000,
});
return [{ json: { ...j, triggeredSeo02: true, raw_keywords_count: raw_keywords.length, _internalWebhookBase: base } }];`;

const SEO02_CHAIN_CODE = `${RESOLVE_FN}
const httpRequest = this.helpers.httpRequest.bind(this.helpers);
const load = $('Code - Load Unqualified Keywords').first().json;
const scored = $('Code - Compute Blog Score').first().json;
const j = { ...load, ...scored, ...items[0].json };
const base = resolveInternalWebhookBase(j, 'Webhook - Receive Qualification Request');
const limit = Math.max(1, Number(j.articleCount || 1));
const sourceType = j.sourceType || j.source_type || 'client';
let blogs = (scored.approved_blog_keywords || j.approved_blog_keywords || []).slice(0, limit);
if (sourceType === 'webwelle' && Array.isArray(j.keywords) && j.keywords.length) {
  blogs = j.keywords.slice(0, limit).map((k) =>
    typeof k === 'object' && k ? { keyword: String(k.keyword || k) } : { keyword: String(k) }
  );
}
let triggered = 0;
for (let i = 0; i < blogs.length; i++) {
  const kw = blogs[i];
  const keyword = typeof kw === 'object' ? String(kw.keyword || kw) : String(kw);
  await httpRequest({
    method: 'POST',
    url: base + '/seo-03-blog-brief-builder',
    body: JSON.stringify({
      project_id: j.project_id,
      approved_blog_keyword: keyword,
      jobId: j.jobId,
      leadToken: j.leadToken || j.token,
      callbackBaseUrl: j.callbackBaseUrl,
      articleCount: limit,
      articleIndex: i,
      test_mode: j.test_mode,
      sourceType,
      publishMode: j.publishMode || j.publish_mode || 'draft',
      promptVersion: j.promptVersion || j.prompt_version,
      keywords: j.keywords,
      _internalWebhookBase: base,
    }),
    headers: { 'Content-Type': 'application/json' },
    timeout: 600000,
  });
  triggered++;
}
return [{ json: { ...j, blog_chain_triggered: triggered, approved_blog_keywords: blogs, _internalWebhookBase: base } }];`;

const SEO02_LOAD_CODE = `const b = items[0].json.body && typeof items[0].json.body === 'object' ? items[0].json.body : items[0].json;
const project_id = b.project_id || 'test-project';
const sourceType = b.sourceType || b.source_type || 'client';
let raw_keywords = b.raw_keywords;
if ((!raw_keywords || !raw_keywords.length) && Array.isArray(b.keywords)) {
  raw_keywords = b.keywords.map((k) => (typeof k === 'object' && k ? { keyword: String(k.keyword || k), difficulty: Number(k.difficulty ?? 25), volume: Number(k.volume ?? 200), intent: String(k.intent || 'informational'), cpc: Number(k.cpc ?? 1.5) } : { keyword: String(k), difficulty: 25, volume: 200, intent: 'informational', cpc: 1.5 }));
}
if ((!raw_keywords || !raw_keywords.length) && sourceType !== 'webwelle') {
  raw_keywords = [{ keyword: 'photovoltaik muenchen', difficulty: 22, volume: 240, intent: 'commercial', cpc: 4.2 }, { keyword: 'was kostet photovoltaik', difficulty: 28, volume: 590, intent: 'informational', cpc: 1.5 }];
}
if ((!raw_keywords || !raw_keywords.length) && sourceType === 'webwelle') {
  throw new Error('webwelle job: keywords fehlen im seo-02 Payload');
}
return [{ json: {
  ...b,
  project_id,
  raw_keywords,
  test_mode: Boolean(b.test_mode),
  jobId: b.jobId,
  leadToken: b.leadToken || b.token,
  callbackBaseUrl: b.callbackBaseUrl,
  articleCount: Number(b.articleCount || 1),
  keywords: b.keywords || raw_keywords,
  sourceType,
  publishMode: b.publishMode || b.publish_mode || 'draft',
  promptVersion: b.promptVersion || b.prompt_version,
} }];`;

const SEO03_CLUSTER_CODE = `const b = items[0].json.body && typeof items[0].json.body==='object' ? items[0].json.body : items[0].json;
const approved_blog_keyword = String(b.approved_blog_keyword || b.keyword || '').trim();
if (!approved_blog_keyword) throw new Error('approved_blog_keyword fehlt');
const cluster = [approved_blog_keyword];
return [{json:{...b, approved_blog_keyword, cluster, project_id:b.project_id||'test-project', test_mode:Boolean(b.test_mode), jobId:b.jobId, leadToken:b.leadToken||b.token, callbackBaseUrl:b.callbackBaseUrl, articleCount:b.articleCount, articleIndex:b.articleIndex, sourceType:b.sourceType||b.source_type||'client', publishMode:b.publishMode||b.publish_mode||'draft', promptVersion:b.promptVersion||b.prompt_version}}];`;

const SEO03_TRIGGER_CODE = `${RESOLVE_FN}
const httpRequest = this.helpers.httpRequest.bind(this.helpers);
const ctx = $('Code - Build Keyword Cluster').first().json;
const j = { ...ctx, ...items[0].json };
const base = resolveInternalWebhookBase(j, 'Webhook - Receive Blog Brief Request');

await httpRequest({
  method: 'POST',
  url: base + '/seo-04-blog-writer-rewriter',
  body: JSON.stringify({
    project_id: j.project_id,
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
    promptVersion: j.promptVersion || j.prompt_version,
    _internalWebhookBase: base,
  }),
  headers: { 'Content-Type': 'application/json' },
  timeout: 300000,
});
return [{ json: { ...j, triggeredSeo04: true, _internalWebhookBase: base } }];`;

const SEO04_TRIGGER_CODE = `${RESOLVE_FN}
const httpRequest = this.helpers.httpRequest.bind(this.helpers);
const ctx = $('Code - Merge Rewrite LLM').first().json;
const j = { ...ctx, ...items[0].json };
const dedupeKey = \`seo06:\${j.jobId}:\${j.articleIndex ?? 0}\`;
const sd = $getWorkflowStaticData('global');
const now = Date.now();
if (sd[dedupeKey] && now - sd[dedupeKey] < 3600000) {
  return [{ json: { ...j, triggeredSeo06: false, seo06DedupeSkipped: true } }];
}
sd[dedupeKey] = now;
const base = resolveInternalWebhookBase(j, 'Webhook - Receive Blog Draft Request');

await httpRequest({
  method: 'POST',
  url: base + '/seo-06-qa-publishing-indexing',
  body: JSON.stringify({
    project_id: j.project_id,
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
    test_mode: j.test_mode,
    llm_error: j.llm_error || null,
    _internalWebhookBase: base,
  }),
  headers: { 'Content-Type': 'application/json' },
  timeout: 300000,
});
return [{ json: { ...j, triggeredSeo06: true, _internalWebhookBase: base } }];`;

const OPENROUTER_MODEL_DEFAULT = 'anthropic/claude-3.5-haiku';
const OPENROUTER_MODEL_FALLBACKS = ['openai/gpt-4o-mini', 'google/gemini-2.0-flash-001'];

const OPENROUTER_MODEL_RESOLVE_FN = `function resolveOpenRouterModel() {
  const blocked = /gemma-2-9b-it|:free$/i;
  const raw = String($env.OPENROUTER_MODEL || $env.WEBWELLE_OPENROUTER_MODEL || '').trim();
  if (raw && !blocked.test(raw)) return raw;
  return '${OPENROUTER_MODEL_DEFAULT}';
}
function resolveOpenRouterMaxTokens(kind) {
  const fromEnv = Number($env.OPENROUTER_MAX_TOKENS || $env.WEBWELLE_OPENROUTER_MAX_TOKENS || 0);
  if (fromEnv > 0) return Math.min(Math.max(fromEnv, 512), 8192);
  return kind === 'rewrite' ? 2800 : 3500;
}`;

const SEO04_VOICE_CONTEXT_CODE = `${OPENROUTER_MODEL_RESOLVE_FN}
const b = items[0].json.body && typeof items[0].json.body === 'object' ? items[0].json.body : items[0].json;
const brief = b.content_brief || { keyword: b.approved_blog_keyword || 'Blog', target_words: 1800 };
const voice = b.brand_voice || { voice: 'klar, direkt', humor: 'leicht', stories: ['Kundenbeispiel'], opinions: ['ehrliche Bewertung'], stats: ['bis zu 30% Ersparnis'], proof_points: ['regionale Erfahrung'], forbidden_phrases: ['revolutionaer'], preferred_phrases: ['praxisnah'] };
const model = resolveOpenRouterModel();
const keyword = String(brief.keyword || b.approved_blog_keyword || 'Blog');
const targetWords = Number(brief.target_words || 1800);
const openrouterDraftBody = {
  model,
  max_tokens: resolveOpenRouterMaxTokens('draft'),
  temperature: 0.7,
  messages: [
    { role: 'system', content: 'Du bist ein deutscher SEO-Ratgeber-Autor (Prompt blogartikel-v1). Schreibe einen vollstaendigen Blogartikel als HTML mit h1, h2, h3, p, ul, ol, li, strong, em, a, blockquote. KEINE img-Tags. Mindestens 1200 Woerter. Klar, praxisnah, E-E-A-T.' },
    { role: 'user', content: 'Schreibe Blog-Draft zu: ' + keyword + '. Ziel: ' + targetWords + ' Woerter. Markenstimme: ' + JSON.stringify(voice) },
  ],
};
return [{ json: {
  ...b,
  project_id: b.project_id || 'test-project',
  content_brief: brief,
  brand_voice: voice,
  openrouterModel: model,
  openrouterDraftBody,
  test_mode: Boolean(b.test_mode),
  jobId: b.jobId,
  leadToken: b.leadToken || b.token,
  callbackBaseUrl: b.callbackBaseUrl,
  articleCount: b.articleCount,
  articleIndex: b.articleIndex,
  approved_blog_keyword: b.approved_blog_keyword,
  sourceType: b.sourceType || b.source_type || 'client',
  publishMode: b.publishMode || b.publish_mode || 'draft',
  promptVersion: b.promptVersion || b.prompt_version || 'blogartikel-v1',
} }];`;

const SEO04_VALIDATE_HOOK_CODE = `${OPENROUTER_MODEL_RESOLVE_FN}
function parseOpenRouter(res) {
  if (!res || typeof res !== 'object') return { text: '', error: 'OPENROUTER: leere Antwort' };
  if (res.error) {
    const msg = typeof res.error === 'string' ? res.error : (res.error.message || JSON.stringify(res.error));
    return { text: '', error: 'OPENROUTER: ' + msg };
  }
  const text = String(res.choices?.[0]?.message?.content || res.message?.content || '').trim();
  if (text) return { text, error: null };
  const hint = res.message || (res.status ? 'HTTP ' + res.status : '') || 'choices leer';
  return { text: '', error: 'OPENROUTER: ' + hint };
}
const j = $('Code - Build Voice Humor Stories Opinions Stats Context').first().json;
const llmRaw = $('HTTP - LLM Draft Generation').first()?.json || {};
const draftParsed = parseOpenRouter(llmRaw);
const kw = j.content_brief?.keyword || j.approved_blog_keyword || 'Blog';
const draft = draftParsed.text || ('Hook: ' + kw + ' – Entwurf folgt.');
const weak = !draftParsed.text || draft.length < 200;
let htmlContent = draft.includes('<') ? draft : '<article><h1>' + kw + '</h1><p>' + draft.replace(/\\n\\n/g, '</p><p>').replace(/\\n/g, '<br>') + '</p></article>';
htmlContent = htmlContent.replace(/<img[^>]*>/gi, '');
const model = j.openrouterModel || resolveOpenRouterModel();
const openrouterRewriteBody = {
  model,
  max_tokens: resolveOpenRouterMaxTokens('rewrite'),
  temperature: 0.5,
  messages: [
    { role: 'system', content: 'Ueberarbeite den Artikel gemaess blogartikel-v1. HTML ohne img-Tags. Erlaubt: h1-h3, p, ul, ol, li, strong, em, a, blockquote.' },
    { role: 'user', content: 'Markenstimme: ' + JSON.stringify(j.brand_voice || {}) + '\\n\\nArtikel:\\n' + draft },
  ],
};
return [{ json: {
  ...j,
  draft,
  htmlContent,
  title: kw,
  weak_hook: weak,
  draft_llm_error: draftParsed.error,
  openrouterRewriteBody,
  promptVersion: j.promptVersion || j.prompt_version || 'blogartikel-v1',
} }];`;

const SEO04_MERGE_CODE = `function parseOpenRouter(res) {
  if (!res || typeof res !== 'object') return { text: '', error: 'OPENROUTER: leere Antwort' };
  if (res.error) {
    const msg = typeof res.error === 'string' ? res.error : (res.error.message || JSON.stringify(res.error));
    return { text: '', error: 'OPENROUTER: ' + msg };
  }
  const text = String(res.choices?.[0]?.message?.content || res.message?.content || '').trim();
  if (text) return { text, error: null };
  const hint = res.message || (res.status ? 'HTTP ' + res.status : '') || 'choices leer';
  return { text: '', error: 'OPENROUTER: ' + hint };
}
let wh = {};
try {
  const raw = $('Webhook - Receive Blog Draft Request').first().json;
  wh = raw.body && typeof raw.body === 'object' ? raw.body : raw;
} catch (_) {}
const hook = $('Code - Validate First 50 Words Hook').first()?.json || {};
const rewriteParsed = parseOpenRouter($('HTTP - LLM Rewrite With Voice').first()?.json);
const keyword = hook.content_brief?.keyword || hook.approved_blog_keyword || wh.approved_blog_keyword || 'Blog';
let llm_error = hook.draft_llm_error || rewriteParsed.error || null;
let raw = rewriteParsed.text || hook.draft || '';
if (!raw) {
  llm_error = llm_error || 'OPENROUTER leer — OPENROUTER_API_KEY und OPENROUTER_MODEL in n8n-Coolify prüfen';
  raw = 'Hook: ' + keyword + ' – Entwurf folgt.';
}
const htmlContent = raw.includes('<') ? raw : '<article><h1>' + keyword + '</h1><p>' + raw + '</p></article>';
return [{ json: {
  ...hook,
  ...wh,
  title: hook.title || keyword,
  draft: raw,
  htmlContent,
  llm_error,
  keyword,
  jobId: hook.jobId || wh.jobId,
  callbackBaseUrl: hook.callbackBaseUrl || wh.callbackBaseUrl,
  articleCount: hook.articleCount ?? wh.articleCount,
  articleIndex: hook.articleIndex ?? wh.articleIndex,
  sourceType: hook.sourceType || hook.source_type || wh.sourceType || wh.source_type || 'client',
  publishMode: hook.publishMode || hook.publish_mode || wh.publishMode || wh.publish_mode || 'draft',
  promptVersion: hook.promptVersion || hook.prompt_version || wh.promptVersion || wh.prompt_version,
} }];`;

const OPENROUTER_HTTP_HEADERS = {
  headerParameters: {
    parameters: [
      { name: 'Authorization', value: '=Bearer {{ $env.OPENROUTER_API_KEY }}' },
      { name: 'Content-Type', value: 'application/json' },
      { name: 'HTTP-Referer', value: '=https://webwelle.com' },
      { name: 'X-Title', value: '=WebWelle Blog Pipeline' },
    ],
  },
};

const SEO06_ONPAGE_CODE = `const whRaw = $('Webhook - Receive QA Request').first().json;
const handoff = whRaw.body && typeof whRaw.body === 'object' ? whRaw.body : whRaw;
const j = { ...handoff, ...(items[0].json || {}) };
const html = String(j.htmlContent || j.draft || '');
const keyword = String(j.keyword || j.approved_blog_keyword || j.content_brief?.keyword || '');
const checks = {
  h1: /<h1[^>]*>/i.test(html),
  keyword100: keyword.length > 0 && html.toLowerCase().includes(keyword.toLowerCase().slice(0, Math.min(20, keyword.length))),
  internal_links: /href=["']\\//i.test(html),
  external_links: /href=["']https?:/i.test(html),
  faq: /faq|häufig/i.test(html),
  meta: Boolean(j.metaDesc || j.meta_desc || j.meta_description),
};
const wordCount = html.replace(/<[^>]+>/g, ' ').split(/\\s+/).filter(Boolean).length;
const stubOnly = /Entwurf folgt\\./i.test(html) && wordCount < 50;
const qa_passed = !j.llm_error && !stubOnly && Object.values(checks).filter(Boolean).length >= 4 && wordCount >= 400;
return [{ json: {
  ...j,
  htmlContent: html,
  draft: j.draft || html,
  title: j.title || keyword || 'Blog',
  keyword,
  wordCount,
  checks,
  qa_passed,
  llm_error: j.llm_error || (stubOnly ? 'OPENROUTER Stub — kein echter Artikeltext' : null),
  sourceType: j.sourceType || j.source_type || 'client',
} }];`;

const SEO06_PARSE_LH_CODE = `const whRaw = $('Webhook - Receive QA Request').first().json;
const handoff = whRaw.body && typeof whRaw.body === 'object' ? whRaw.body : whRaw;
const prev = $('Code - On Page SEO Checks').first().json;
const j = { ...handoff, ...prev, ...(items[0].json || {}) };
let lighthouse_score = 0.5;
try {
  const lh = $('HTTP - PageSpeed Lighthouse Audit').first().json;
  lighthouse_score = lh?.lighthouseResult?.categories?.seo?.score
    ?? lh?.lighthouseResult?.categories?.performance?.score
    ?? lh?.seo_score
    ?? 0.5;
} catch (_) {}
const qa_passed = j.qa_passed !== false && Number(lighthouse_score) >= 0.5;
return [{ json: {
  ...j,
  lighthouse_score,
  qa_passed,
  status: qa_passed ? 'qa_passed' : 'qa_failed',
  sourceType: j.sourceType || j.source_type || 'client',
} }];`;

async function api(method, path, body, apiKey, baseUrl) {
  const res = await fetch(`${baseUrl}/api/v1${path}`, {
    method,
    headers: {
      'X-N8N-API-KEY': apiKey,
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${path} ${res.status}: ${text.slice(0, 400)}`);
  return text ? JSON.parse(text) : null;
}

const DATAFORSEO_AUTH_HEADER =
  "={{ 'Basic ' + Buffer.from(($env.DATAFORSEO_LOGIN || '') + ':' + ($env.DATAFORSEO_PASSWORD || '')).toString('base64') }}";

const SEO01_SEED_SERVICES_CODE = `const prior = $('Code - Resolve Target Area From Zip').first().json;
const pg = items[0].json;
const j = { ...prior, ...pg, project_id: pg.project_id || pg.id || prior.project_id };
const base = j.branche_normalized || String(j.branche || '').toLowerCase();
const seed_services = [base, \`\${base} service\`, \`\${base} angebot\`];
return [{ json: { ...j, seed_services } }];`;

const SEO01_NORMALIZE_KEYWORD_CODE = `const j = $('Code - Generate Root Keyword Matrix').first().json;
const k = $('HTTP - DataForSEO Keyword Research').first().json || {};
const q = $('HTTP - DataForSEO Questions Suggestions').first().json || {};
const r = $('HTTP - DataForSEO Related Suggestions').first().json || {};
const apiStatus = (x) => x?.tasks?.[0]?.status_code ?? x?.status_code ?? null;
const apiMessage = (x) => x?.tasks?.[0]?.status_message ?? x?.status_message ?? x?.message ?? x?.error ?? null;
const httpErr = (x) => (typeof x?.message === 'object' ? x.message?.message : x?.message) || null;
const hasErr = [k, q, r].some((x) => apiStatus(x) === 40100 || /401|not authorized/i.test(String(httpErr(x) || apiMessage(x) || '')));
const discovery_error = hasErr
  ? (httpErr(k) || httpErr(q) || httpErr(r) || apiMessage(k) || apiMessage(q) || apiMessage(r) || 'dataforseo_auth_failed')
  : null;
return [{ json: {
  ...j,
  keyword_count: (j.root_keywords || []).length,
  dataforseo_status: { keyword: apiStatus(k), questions: apiStatus(q), related: apiStatus(r) },
  status: hasErr ? 'fix_queued' : 'research_done',
  discovery_error,
} }];`;

function patchDataForSeoHttpNodes(wf) {
  for (const name of [
    'HTTP - DataForSEO Keyword Research',
    'HTTP - DataForSEO Questions Suggestions',
    'HTTP - DataForSEO Related Suggestions',
  ]) {
    const node = wf.nodes.find((n) => n.name === name);
    if (!node?.parameters?.headerParameters?.parameters) continue;
    const auth = node.parameters.headerParameters.parameters.find((p) => p.name === 'Authorization');
    if (auth) auth.value = DATAFORSEO_AUTH_HEADER;
  }
}

function patchSeo01(wf) {
  const validate = wf.nodes.find((n) => n.name === 'Code - Validate Research Input');
  const trigger = wf.nodes.find((n) => n.name === 'Code - Trigger seo-02 Chain');
  const seed = wf.nodes.find((n) => n.name === 'Code - Generate Seed Services');
  const normalizeKw = wf.nodes.find((n) => n.name === 'Code - Normalize Keyword Payload');
  if (!validate || !trigger) throw new Error('seo-01: expected nodes missing');

  validate.parameters.jsCode = SEO01_VALIDATE_CODE;
  trigger.parameters.jsCode = SEO01_TRIGGER_CODE;
  if (seed) seed.parameters.jsCode = SEO01_SEED_SERVICES_CODE;
  if (normalizeKw) normalizeKw.parameters.jsCode = SEO01_NORMALIZE_KEYWORD_CODE;
  patchDataForSeoHttpNodes(wf);

  const hasMerge = wf.nodes.some((n) => n.name === 'Merge - Wait DataForSEO');
  if (!hasMerge) {
    wf.nodes.push({
      id: 'w1n-merge',
      name: 'Merge - Wait DataForSEO',
      type: 'n8n-nodes-base.merge',
      typeVersion: 3,
      position: [1180, 0],
      parameters: { mode: 'combine', combineBy: 'combineAll', options: {} },
    });
  }

  wf.connections['HTTP - DataForSEO Keyword Research'] = {
    main: [[{ node: 'Merge - Wait DataForSEO', type: 'main', index: 0 }]],
  };
  wf.connections['HTTP - DataForSEO Questions Suggestions'] = {
    main: [[{ node: 'Merge - Wait DataForSEO', type: 'main', index: 1 }]],
  };
  wf.connections['HTTP - DataForSEO Related Suggestions'] = {
    main: [[{ node: 'Merge - Wait DataForSEO', type: 'main', index: 2 }]],
  };
  wf.connections['Merge - Wait DataForSEO'] = {
    main: [[{ node: 'Code - Normalize Keyword Payload', type: 'main', index: 0 }]],
  };

  return wf;
}

function patchSeo02(wf) {
  const load = wf.nodes.find((n) => n.name === 'Code - Load Unqualified Keywords');
  const chain = wf.nodes.find((n) => n.name === 'Code - Chain Blog Articles seo-03');
  const setNode = wf.nodes.find((n) => n.name === 'Set - Output For Workflow 3 And 5');
  if (!load || !chain || !setNode) throw new Error('seo-02: expected nodes missing');

  load.parameters.jsCode = SEO02_LOAD_CODE;
  chain.parameters.jsCode = SEO02_CHAIN_CODE;

  setNode.parameters.assignments.assignments = [
    { id: 'a', name: 'project_id', type: 'string', value: "={{ $('Code - Compute Blog Score').first().json.project_id }}" },
    {
      id: 'b',
      name: 'approved_blog_keywords',
      type: 'array',
      value: "={{ $('Code - Compute Blog Score').first().json.approved_blog_keywords }}",
    },
    {
      id: 'c',
      name: 'approved_service_keywords',
      type: 'array',
      value: "={{ $('Code - Compute Blog Score').first().json.approved_service_keywords }}",
    },
    { id: 'd', name: 'status', type: 'string', value: 'qualified' },
  ];

  wf.connections['Code - Compute Blog Score'] = {
    main: [
      [
        { node: 'Postgres - Push Ambiguous Keyword To Fix Queue', type: 'main', index: 0 },
        { node: 'Postgres - Insert Approved Blog Keywords', type: 'main', index: 0 },
        { node: 'Postgres - Insert Approved Service Keywords', type: 'main', index: 0 },
        { node: 'Set - Output For Workflow 3 And 5', type: 'main', index: 0 },
      ],
    ],
  };
  delete wf.connections['Postgres - Insert Approved Blog Keywords'];
  delete wf.connections['Postgres - Insert Approved Service Keywords'];
  delete wf.connections['Postgres - Push Ambiguous Keyword To Fix Queue'];

  return wf;
}

function patchSeo03(wf) {
  const cluster = wf.nodes.find((n) => n.name === 'Code - Build Keyword Cluster');
  const trigger = wf.nodes.find((n) => n.name === 'Code - Trigger seo-04 Chain');
  if (!cluster || !trigger) throw new Error('seo-03: expected nodes missing');

  cluster.parameters.jsCode = SEO03_CLUSTER_CODE;
  trigger.parameters.jsCode = SEO03_TRIGGER_CODE;
  return wf;
}

function patchSeo06(wf) {
  const onPage = wf.nodes.find((n) => n.name === 'Code - On Page SEO Checks');
  const parseLh = wf.nodes.find((n) => n.name === 'Code - Parse Lighthouse Result');
  if (onPage) onPage.parameters.jsCode = SEO06_ONPAGE_CODE;
  if (parseLh) parseLh.parameters.jsCode = SEO06_PARSE_LH_CODE;
  return wf;
}

function patchSeo04(wf) {
  const trigger = wf.nodes.find((n) => n.name === 'Code - Trigger seo-06 Chain');
  const merge = wf.nodes.find((n) => n.name === 'Code - Merge Rewrite LLM');
  const voice = wf.nodes.find((n) => n.name === 'Code - Build Voice Humor Stories Opinions Stats Context');
  const validateHook = wf.nodes.find((n) => n.name === 'Code - Validate First 50 Words Hook');
  const draftHttp = wf.nodes.find((n) => n.name === 'HTTP - LLM Draft Generation');
  const rewriteHttp = wf.nodes.find((n) => n.name === 'HTTP - LLM Rewrite With Voice');
  if (!trigger) throw new Error('seo-04: expected nodes missing');

  trigger.parameters.jsCode = SEO04_TRIGGER_CODE;
  if (merge) merge.parameters.jsCode = SEO04_MERGE_CODE;
  if (voice) voice.parameters.jsCode = SEO04_VOICE_CONTEXT_CODE;
  if (validateHook) validateHook.parameters.jsCode = SEO04_VALIDATE_HOOK_CODE;

  for (const httpNode of [draftHttp, rewriteHttp]) {
    if (!httpNode) continue;
    httpNode.parameters.sendHeaders = true;
    httpNode.parameters.headerParameters = OPENROUTER_HTTP_HEADERS.headerParameters;
    httpNode.parameters.specifyBody = 'json';
    httpNode.parameters.sendBody = true;
    httpNode.parameters.options = { ...(httpNode.parameters.options || {}), ignoreResponseCode: true, timeout: 120000 };
    if (httpNode.name === 'HTTP - LLM Draft Generation') {
      httpNode.parameters.jsonBody = '={{ $json.openrouterDraftBody }}';
    } else {
      httpNode.parameters.jsonBody = '={{ $json.openrouterRewriteBody }}';
    }
  }
  return wf;
}

async function saveAndActivate(wf, apiKey, baseUrl) {
  await api(
    'PUT',
    `/workflows/${wf.id}`,
    { name: wf.name, nodes: wf.nodes, connections: wf.connections, settings: wf.settings },
    apiKey,
    baseUrl
  );
  await api('POST', `/workflows/${wf.id}/activate`, {}, apiKey, baseUrl);
}

const WORKFLOWS = [
  { id: 'HbRAuPK4Dd6ekAjd', patch: patchSeo01 },
  { id: 'q5tqTGRjupy9JKdE', patch: patchSeo02 },
  { id: '5THEWW5gWbv8cg7p', patch: patchSeo03 },
  { id: '8BZxLGLZlCggHJ5b', patch: patchSeo04 },
  { id: 'HV16Eux9keNnnJt8', patch: patchSeo06 },
];

async function main() {
  if (!existsSync(envPath)) throw new Error('.env.local fehlt');
  const env = parseEnv(envPath);
  const apiKey = env.N8N_API_KEY;
  const baseUrl = (env.N8N_BASE_URL || '').replace(/\/$/, '');
  if (!apiKey || !baseUrl) throw new Error('N8N_API_KEY / N8N_BASE_URL fehlt');

  for (const { id, patch } of WORKFLOWS) {
    const wf = await api('GET', `/workflows/${id}`, null, apiKey, baseUrl);
    const patched = patch(wf);
    await saveAndActivate(patched, apiKey, baseUrl);
    console.log(`patched + activated: ${patched.name} (${id})`);
  }
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
