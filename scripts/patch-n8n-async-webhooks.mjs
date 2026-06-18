#!/usr/bin/env node
/** seo-02..06: async webhook response; seo-01: tolerate chain errors; seo-06: resilient callback. */
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

function setWebhookAsync(wf) {
  for (const node of wf.nodes) {
    if (node.type === 'n8n-nodes-base.webhook' && node.parameters?.responseMode === 'lastNode') {
      node.parameters.responseMode = 'onReceived';
    }
  }
  return wf;
}

function patchSeo01Trigger(wf) {
  const trigger = wf.nodes.find((n) => n.name === 'Code - Trigger seo-02 Chain');
  if (!trigger) return wf;
  const code = trigger.parameters.jsCode || '';
  if (code.includes('seo02TriggerError')) return wf;
  trigger.parameters.jsCode = code.replace(
    'await httpRequest({',
    `let seo02TriggerError = null;
try {
  await httpRequest({`
  ).replace(
    '  timeout: 300000,\n});',
    `  timeout: 300000,\n});
} catch (err) {
  seo02TriggerError = err?.message || String(err);
}
`
  ).replace(
    'return [{ json: { ...j, triggeredSeo02: true,',
    'return [{ json: { ...j, triggeredSeo02: !seo02TriggerError, seo02TriggerError,'
  );
  return wf;
}

function patchSeo06Callback(wf) {
  const node = wf.nodes.find((n) => n.name === 'Code - Dual Sink Blog Callback');
  if (!node) return wf;
  const code = node.parameters.jsCode || '';
  if (code.includes('webwelleCallbackError')) return wf;

  node.parameters.jsCode = code
    .replace(
      "if (sourceType === 'webwelle') {",
      "let webwelleCallbackError = null;\nif (sourceType === 'webwelle') {"
    )
    .replace(
      '  await httpRequest({\n    method: \'POST\',\n    url: base + \'/api/blog/publish\',',
      '  try {\n  await httpRequest({\n    method: \'POST\',\n    url: base + \'/api/blog/publish\','
    )
    .replace(
      '    timeout: 60000,\n  });\n} else {',
      '    timeout: 60000,\n  });\n  } catch (err) {\n    webwelleCallbackError = err?.message || String(err);\n  }\n} else {'
    )
    .replace(
      '  await httpRequest({\n    method: \'POST\',\n    url: base + \'/api/blog/article-ready\',',
      '  try {\n  await httpRequest({\n    method: \'POST\',\n    url: base + \'/api/blog/article-ready\','
    )
    .replace(
      '    timeout: 30000,\n  });\n}\n\nif (idx >= total - 1 && secret) {',
      '    timeout: 30000,\n  });\n  } catch (err) {\n    webwelleCallbackError = err?.message || String(err);\n  }\n}\n\nif (idx >= total - 1 && secret) {'
    )
    .replace(
      'return [{ json: { ...j, webwelleCallbackSent: true, sink: sourceType } }];',
      'return [{ json: { ...j, webwelleCallbackSent: !webwelleCallbackError, webwelleCallbackError, sink: sourceType } }];'
    );

  node.continueOnFail = true;
  return wf;
}

function patchSeo06WebwelleJobTracking(wf) {
  const node = wf.nodes.find((n) => n.name === 'Code - Dual Sink Blog Callback');
  if (!node) return wf;
  let code = node.parameters.jsCode || '';
  if (code.includes('webwelleJobTrackingV2')) return wf;

  code = code.replace(
    '    jobId: j.jobId,\n    prompt_version: promptVersion,',
    '    jobId: j.jobId,\n    articleIndex: idx,\n    keyword,\n    wordCount,\n    prompt_version: promptVersion,'
  );

  const oldJobDone = `if (idx >= total - 1 && secret) {
  const doneBody = JSON.stringify({
    jobId: j.jobId,
    failedCount: j.qa_passed ? 0 : 1,
    n8nExecutionId: j.n8n_execution_id || j.n8nExecutionId || null,
  });
  const doneSig = crypto.createHmac('sha256', secret).update(doneBody).digest('hex');
  await httpRequest({
    method: 'POST',
    url: base + '/api/blog/job-completed',
    headers: { 'Content-Type': 'application/json', 'x-webwelle-signature': doneSig },
    body: doneBody,
    timeout: 30000,
  });
}`;

  const newJobDone = `if (idx >= total - 1) {
  const canComplete = secret || (sourceType === 'webwelle' && apiKey);
  if (canComplete) {
    const doneBody = JSON.stringify({
      jobId: j.jobId,
      failedCount: j.qa_passed ? 0 : 1,
      n8nExecutionId: j.n8n_execution_id || j.n8nExecutionId || null,
    });
    const doneHeaders = { 'Content-Type': 'application/json' };
    if (secret) {
      doneHeaders['x-webwelle-signature'] = crypto.createHmac('sha256', secret).update(doneBody).digest('hex');
    } else if (apiKey) {
      doneHeaders['x-api-key'] = apiKey;
    }
    try {
      await httpRequest({
        method: 'POST',
        url: base + '/api/blog/job-completed',
        headers: doneHeaders,
        body: doneBody,
        timeout: 30000,
      });
    } catch (err) {
      webwelleCallbackError = webwelleCallbackError || err?.message || String(err);
    }
  }
}
// webwelleJobTrackingV2`;

  if (code.includes(oldJobDone)) {
    code = code.replace(oldJobDone, newJobDone);
  }

  node.parameters.jsCode = code;
  return wf;
}

function patchSeo06DualSinkContext(wf) {
  const node = wf.nodes.find((n) => n.name === 'Code - Dual Sink Blog Callback');
  if (!node) return wf;
  if ((node.parameters.jsCode || '').includes('dualSinkContextV3')) return wf;

  node.parameters.jsCode = `const crypto = require('crypto');
const httpRequest = this.helpers.httpRequest.bind(this.helpers);
const ctx =
  $('Code - Parse Lighthouse Result').first().json ||
  $('Code - On Page SEO Checks').first().json ||
  {};
const j = { ...ctx, ...items[0].json };
let webwelleCallbackError = null;
const secret = $env.N8N_WEBHOOK_SECRET;
const apiKey = $env.N8N_API_KEY;
const base = String(j.callbackBaseUrl || '').replace(/\\/$/, '');
const sourceType = j.sourceType || j.source_type || 'client';
const keyword = j.keyword || j.approved_blog_keyword || j.content_brief?.keyword || 'unknown';
let html = String(j.htmlContent || j.draft || '');
html = html.replace(/<img[^>]*>/gi, '');
const wordCount = html.replace(/<[^>]+>/g, ' ').split(/\\s+/).filter(Boolean).length;
const images = Array.isArray(j.images) ? j.images : [];
const promptVersion = j.promptVersion || j.prompt_version || 'blogartikel-v1';
const idx = Number(j.articleIndex ?? 0);
const total = Number(j.articleCount ?? 1);
const qaPassed = j.qa_passed !== false && j.status !== 'qa_failed';

if (!base || !j.jobId) {
  return [{ json: { ...j, webwelleCallbackSkipped: true, callbackReason: !base ? 'no_base' : 'no_jobId' } }];
}

if (sourceType === 'webwelle') {
  if (!apiKey) throw new Error('N8N_API_KEY fehlt');
  if (!html.trim()) {
    webwelleCallbackError = 'empty_html';
  } else {
    const publishMode = j.publishMode || j.publish_mode || 'draft';
    const publishPayload = {
      title: j.title || keyword,
      content: html.includes('<') ? html : \`<article><h1>\${keyword}</h1><p>\${html}</p></article>\`,
      excerpt: j.metaDesc || j.meta_desc || \`Ratgeber: \${keyword}\`,
      meta_description: j.metaDesc || j.meta_desc || \`Ratgeber: \${keyword}\`,
      author: 'WebWelle',
      status: publishMode === 'publish' && qaPassed ? 'published' : 'draft',
      source_type: 'webwelle',
      jobId: j.jobId,
      articleIndex: idx,
      keyword,
      wordCount,
      qa_status: qaPassed ? 'passed' : 'failed',
      prompt_version: promptVersion,
      images,
    };
    try {
      await httpRequest({
        method: 'POST',
        url: base + '/api/blog/publish',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
        body: JSON.stringify(publishPayload),
        timeout: 60000,
      });
    } catch (err) {
      webwelleCallbackError = err?.message || String(err);
    }
  }
} else {
  if (!secret) throw new Error('N8N_WEBHOOK_SECRET fehlt');
  const articlePayload = {
    jobId: j.jobId,
    articleIndex: idx,
    keyword,
    title: j.title || keyword,
    metaDesc: j.metaDesc || j.meta_desc || \`Ratgeber: \${keyword}\`,
    htmlContent: html.includes('<') ? html : \`<article><h1>\${keyword}</h1><p>\${html}</p></article>\`,
    wordCount,
    qaStatus: qaPassed ? 'passed' : 'failed',
    promptVersion,
    images,
  };
  if (!qaPassed) articlePayload.qaFailReason = { checks: j.checks, status: j.status, lighthouse: j.lighthouse_score };
  const bodyString = JSON.stringify(articlePayload);
  const sig = crypto.createHmac('sha256', secret).update(bodyString).digest('hex');
  try {
    await httpRequest({
      method: 'POST',
      url: base + '/api/blog/article-ready',
      headers: { 'Content-Type': 'application/json', 'x-webwelle-signature': sig },
      body: bodyString,
      timeout: 30000,
    });
  } catch (err) {
    webwelleCallbackError = err?.message || String(err);
  }
}

if (idx >= total - 1 && j.jobId) {
  const canComplete = secret || (sourceType === 'webwelle' && apiKey);
  if (canComplete) {
    const doneBody = JSON.stringify({
      jobId: j.jobId,
      failedCount: qaPassed ? 0 : 1,
      n8nExecutionId: j.n8n_execution_id || j.n8nExecutionId || null,
    });
    const doneHeaders = { 'Content-Type': 'application/json' };
    if (secret) {
      doneHeaders['x-webwelle-signature'] = crypto.createHmac('sha256', secret).update(doneBody).digest('hex');
    } else if (apiKey) {
      doneHeaders['x-api-key'] = apiKey;
    }
    try {
      await httpRequest({
        method: 'POST',
        url: base + '/api/blog/job-completed',
        headers: doneHeaders,
        body: doneBody,
        timeout: 30000,
      });
    } catch (err) {
      webwelleCallbackError = webwelleCallbackError || err?.message || String(err);
    }
  }
}

return [{ json: { ...j, webwelleCallbackSent: !webwelleCallbackError, webwelleCallbackError, sink: sourceType } }];
// dualSinkContextV3`;

  node.continueOnFail = true;
  return wf;
}

const WORKFLOWS = [
  { id: 'HbRAuPK4Dd6ekAjd', patch: (wf) => patchSeo01Trigger(setWebhookAsync(wf)) },
  { id: 'q5tqTGRjupy9JKdE', patch: setWebhookAsync },
  { id: '5THEWW5gWbv8cg7p', patch: setWebhookAsync },
  { id: '8BZxLGLZlCggHJ5b', patch: setWebhookAsync },
  {
    id: 'HV16Eux9keNnnJt8',
    patch: (wf) => patchSeo06DualSinkContext(setWebhookAsync(wf)),
  },
];

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
