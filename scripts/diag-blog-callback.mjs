#!/usr/bin/env node
/** Diagnose seo-06 callbacks — prints only non-secret fields. */
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

function getCallbackBaseUrl(env) {
  return (
    env.WEBWELLE_CALLBACK_BASE_URL ||
    env.COOLIFY_URL ||
    (env.COOLIFY_FQDN ? `https://${env.COOLIFY_FQDN}` : undefined) ||
    env.WEBWELLE_APP_BASE_URL ||
    env.NEXT_PUBLIC_APP_URL ||
    env.NEXT_PUBLIC_BASE_URL ||
    'https://webwelle.com'
  ).replace(/\/$/, '');
}

async function main() {
  if (!existsSync(envPath)) throw new Error('.env.local fehlt');
  const env = parseEnv(envPath);
  const apiKey = env.N8N_API_KEY;
  const baseUrl = (env.N8N_BASE_URL || '').replace(/\/$/, '');
  const callbackBase = getCallbackBaseUrl(env);

  console.log('=== Callback-Base (App) ===');
  console.log('resolved:', callbackBase);
  console.log('NEXT_PUBLIC_BASE_URL:', env.NEXT_PUBLIC_BASE_URL || '(unset)');
  console.log('NEXT_PUBLIC_APP_URL:', env.NEXT_PUBLIC_APP_URL || '(unset)');
  console.log('WEBWELLE_CALLBACK_BASE_URL:', env.WEBWELLE_CALLBACK_BASE_URL || '(unset)');
  console.log('COOLIFY_FQDN:', env.COOLIFY_FQDN || '(unset)');
  console.log('N8N_API_KEY set:', Boolean(apiKey?.trim()));
  console.log('N8N_WEBHOOK_SECRET set:', Boolean(env.N8N_WEBHOOK_SECRET?.trim()));

  const res = await fetch(`${baseUrl}/api/v1/executions?workflowId=HV16Eux9keNnnJt8&limit=12&includeData=true`, {
    headers: { 'X-N8N-API-KEY': apiKey, Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`n8n executions ${res.status}`);
  const data = await res.json();

  console.log('\n=== Letzte seo-06 Executions (Dual Sink) ===');
  for (const ex of data.data || []) {
    const run =
      ex.data?.resultData?.runData?.['Code - Dual Sink Blog Callback']?.[0]?.data?.main?.[0]?.[0]
        ?.json;
    if (!run) continue;
    console.log(
      JSON.stringify({
        execId: ex.id,
        status: ex.status,
        started: ex.startedAt,
        jobId: run.jobId,
        sourceType: run.sourceType || run.source_type,
        callbackBaseUrl: run.callbackBaseUrl,
        skipped: run.webwelleCallbackSkipped,
        webwelleCallbackError: run.webwelleCallbackError || null,
        webwelleCallbackSent: run.webwelleCallbackSent,
        llm_error: run.llm_error || null,
        qa_passed: run.qa_passed,
        htmlLen: String(run.htmlContent || run.draft || '').length,
        title: (run.title || '').slice(0, 80),
        keyword: run.keyword || run.approved_blog_keyword,
      })
    );
  }

  const execArg = process.argv[2];
  const mode = process.argv[3];

  if (mode === 'dual' && execArg) {
    console.log(`\n=== Dual Sink raw output exec ${execArg} ===`);
    const detail = await fetch(`${baseUrl}/api/v1/executions/${execArg}?includeData=true`, {
      headers: { 'X-N8N-API-KEY': apiKey, Accept: 'application/json' },
    });
    const ex = await detail.json();
    const runs = ex.data?.resultData?.runData?.['Code - Dual Sink Blog Callback'];
    console.log('run count:', runs?.length ?? 0);
    for (let i = 0; i < (runs?.length ?? 0); i++) {
      const j = runs[i]?.data?.main?.[0]?.[0]?.json;
      console.log(`run[${i}]`, JSON.stringify(j));
      if (runs[i]?.error) console.log(`run[${i}] error:`, runs[i].error.message);
    }
    return;
  }

  if (mode === 'wf') {
    const wf = await fetch(`${baseUrl}/api/v1/workflows/HV16Eux9keNnnJt8`, {
      headers: { 'X-N8N-API-KEY': apiKey, Accept: 'application/json' },
    }).then((r) => r.json());
    const dual = wf.nodes.find((n) => n.name === 'Code - Dual Sink Blog Callback');
    const inbound = Object.entries(wf.connections || {})
      .filter(([, v]) => JSON.stringify(v).includes('Dual Sink'))
      .map(([k]) => k);
    console.log('\n=== seo-06 Workflow ===');
    console.log('inbound to Dual Sink from:', inbound.join(', ') || '(none)');
    console.log('has dualSinkContextV5:', (dual?.parameters?.jsCode || '').includes('dualSinkContextV5'));
    console.log('continueOnFail:', dual?.continueOnFail);
    console.log('dual sink code start:', (dual?.parameters?.jsCode || '').slice(0, 400));
    return;
  }

  if (mode === 'seo04' && execArg) {
    console.log(`\n=== seo-04 Execution ${execArg} — Writer nodes ===`);
    const detail = await fetch(`${baseUrl}/api/v1/executions/${execArg}?includeData=true`, {
      headers: { 'X-N8N-API-KEY': apiKey, Accept: 'application/json' },
    });
    const ex = await detail.json();
    for (const [name, runs] of Object.entries(ex.data?.resultData?.runData || {})) {
      const j = runs?.[0]?.data?.main?.[0]?.[0]?.json;
      if (!j) continue;
      if (!/merge|writer|llm|draft|rewrite|voice|hook|openrouter/i.test(name)) continue;
      const out = {
        jobId: j.jobId,
        htmlLen: String(j.htmlContent || j.draft || '').length,
        title: j.title,
        llm_error: j.llm_error || j.draft_llm_error || null,
        openrouterModel: j.openrouterModel || null,
        preview: (j.draft || j.htmlContent || '').slice(0, 120),
      };
      if (/HTTP - LLM/i.test(name)) {
        out.openrouterError = j.error?.message || j.message || j.error || null;
        out.choicesLen = j.choices?.[0]?.message?.content?.length ?? 0;
        delete out.preview;
      }
      console.log(name, JSON.stringify(out));
    }
    return;
  }

  if (mode === 'dataforseo' && execArg) {
    console.log(`\n=== seo-01 Execution ${execArg} — DataForSEO ===`);
    const detail = await fetch(`${baseUrl}/api/v1/executions/${execArg}?includeData=true`, {
      headers: { 'X-N8N-API-KEY': apiKey, Accept: 'application/json' },
    });
    const ex = await detail.json();
    for (const [name, runs] of Object.entries(ex.data?.resultData?.runData || {})) {
      if (!/DataForSEO|Normalize|discovery/i.test(name)) continue;
      const j = runs?.[0]?.data?.main?.[0]?.[0]?.json;
      if (!j) continue;
      console.log(
        name,
        JSON.stringify({
          status_code: j.status_code,
          message: j.message || j.error || j.discovery_error || null,
          keyword_count: j.keyword_count,
        })
      );
    }
    return;
  }

  const execId = execArg;
  if (execId) {
    console.log(`\n=== seo-06 Execution ${execId} — alle Nodes mit jobId ===`);
    const detail = await fetch(`${baseUrl}/api/v1/executions/${execId}?includeData=true`, {
      headers: { 'X-N8N-API-KEY': apiKey, Accept: 'application/json' },
    });
    const ex = await detail.json();
    for (const [name, runs] of Object.entries(ex.data?.resultData?.runData || {})) {
      const j = runs?.[0]?.data?.main?.[0]?.[0]?.json;
      if (!j) continue;
      console.log(
        name,
        JSON.stringify({
          jobId: j.jobId ?? null,
          skipped: j.webwelleCallbackSkipped ?? null,
          sent: j.webwelleCallbackSent ?? null,
          htmlLen: String(j.htmlContent || j.draft || '').length,
          title: (j.title || '').slice(0, 50),
          qa_passed: j.qa_passed,
          status: j.status,
          sourceType: j.sourceType || j.source_type,
        })
      );
    }
  }

  console.log('\n=== Publish-Endpoint Smoke (401 expected without body) ===');
  const pubUrl = `${callbackBase}/api/blog/publish`;
  try {
    const pubRes = await fetch(pubUrl, { method: 'GET' });
    const pubJson = await pubRes.json();
    console.log('GET', pubUrl, '→', pubRes.status, pubJson.name || pubJson.error);
  } catch (e) {
    console.log('GET', pubUrl, '→ FEHLER:', e.message);
  }
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
