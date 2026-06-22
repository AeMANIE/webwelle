#!/usr/bin/env node
/**
 * Deploy seo-admin-01, seo-admin-02 + error-handler to n8n.
 * Uses N8N_BASE_URL + N8N_API_KEY from .env.local
 */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const infoDir = join(root, 'info/n8n');
const envPath = join(root, '.env.local');

function parseEnvFile(path) {
  if (!existsSync(path)) throw new Error(`.env.local nicht gefunden: ${path}`);
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

function readCode(name) {
  return readFileSync(join(infoDir, name), 'utf8');
}

function webhookNode({ name, path, respondImmediately = false, position }) {
  return {
    parameters: {
      httpMethod: 'POST',
      path,
      responseMode: respondImmediately ? 'onReceived' : 'lastNode',
      options: {},
    },
    id: randomUUID(),
    name,
    type: 'n8n-nodes-base.webhook',
    typeVersion: 2,
    position,
    webhookId: randomUUID(),
  };
}

function codeNode({ name, jsCode, position }) {
  return {
    parameters: { mode: 'runOnceForAllItems', jsCode },
    id: randomUUID(),
    name,
    type: 'n8n-nodes-base.code',
    typeVersion: 2,
    position,
  };
}

function buildWorkflow({ name, nodes, connections, settings = {} }) {
  return {
    name,
    nodes,
    connections,
    settings: {
      executionOrder: 'v1',
      ...settings,
    },
  };
}

async function listWorkflows(baseUrl, apiKey) {
  const res = await fetch(`${baseUrl}/api/v1/workflows?limit=250`, {
    headers: { 'X-N8N-API-KEY': apiKey, Accept: 'application/json' },
  });
  const data = await res.json();
  return data.data || data;
}

async function createWorkflow(baseUrl, apiKey, body) {
  const res = await fetch(`${baseUrl}/api/v1/workflows`, {
    method: 'POST',
    headers: {
      'X-N8N-API-KEY': apiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`create failed: ${res.status} ${text.slice(0, 400)}`);
  return JSON.parse(text);
}

async function updateWorkflow(baseUrl, apiKey, id, body) {
  const res = await fetch(`${baseUrl}/api/v1/workflows/${id}`, {
    method: 'PUT',
    headers: {
      'X-N8N-API-KEY': apiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`update failed: ${res.status} ${text.slice(0, 400)}`);
  return JSON.parse(text);
}

async function activateWorkflow(baseUrl, apiKey, id) {
  const res = await fetch(`${baseUrl}/api/v1/workflows/${id}/activate`, {
    method: 'POST',
    headers: {
      'X-N8N-API-KEY': apiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: '{}',
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`activate failed: ${res.status} ${text.slice(0, 400)}`);
  return JSON.parse(text);
}

function buildWf1() {
  const webhook = webhookNode({
    name: 'Webhook',
    path: 'seo-admin-01-keyword-discovery',
    position: [0, 0],
  });
  const process = codeNode({
    name: 'Keyword Discovery',
    jsCode: readCode('seo-admin-wf1-code.js'),
    position: [280, 0],
  });
  return buildWorkflow({
    name: 'seo-admin-01-keyword-discovery',
    nodes: [webhook, process],
    connections: {
      Webhook: { main: [[{ node: 'Keyword Discovery', type: 'main', index: 0 }]] },
    },
  });
}

function buildWf2() {
  const webhook = webhookNode({
    name: 'Webhook',
    path: 'seo-admin-02-gap-qualification',
    respondImmediately: true,
    position: [0, 0],
  });
  const process = codeNode({
    name: 'Gap Qualification',
    jsCode: readCode('seo-admin-wf2-code.js'),
    position: [280, 0],
  });
  return buildWorkflow({
    name: 'seo-admin-02-gap-qualification',
    nodes: [webhook, process],
    connections: {
      Webhook: { main: [[{ node: 'Gap Qualification', type: 'main', index: 0 }]] },
    },
  });
}

function buildWf2Error() {
  const trigger = {
    parameters: {},
    id: randomUUID(),
    name: 'Error Trigger',
    type: 'n8n-nodes-base.errorTrigger',
    typeVersion: 1,
    position: [0, 0],
  };
  const report = codeNode({
    name: 'Report Error',
    jsCode: readCode('seo-admin-wf2-error-code.js'),
    position: [280, 0],
  });
  return buildWorkflow({
    name: 'seo-admin-02-error-handler',
    nodes: [trigger, report],
    connections: {
      'Error Trigger': { main: [[{ node: 'Report Error', type: 'main', index: 0 }]] },
    },
  });
}

async function upsertWorkflow(baseUrl, apiKey, existing, spec) {
  const found = existing.find((w) => w.name === spec.name);
  if (found) {
    const updated = await updateWorkflow(baseUrl, apiKey, found.id, spec);
    await activateWorkflow(baseUrl, apiKey, found.id);
    return { id: found.id, name: spec.name, action: 'updated' };
  }
  const created = await createWorkflow(baseUrl, apiKey, spec);
  await activateWorkflow(baseUrl, apiKey, created.id);
  return { id: created.id, name: spec.name, action: 'created' };
}

async function main() {
  const env = parseEnvFile(envPath);
  const apiKey = env.N8N_API_KEY;
  const baseUrl = (env.N8N_BASE_URL || '').replace(/\/$/, '');
  if (!apiKey || !baseUrl) throw new Error('N8N_API_KEY und N8N_BASE_URL in .env.local erforderlich');

  let existing = await listWorkflows(baseUrl, apiKey);

  const errorSpec = buildWf2Error();
  const errorResult = await upsertWorkflow(baseUrl, apiKey, existing, errorSpec);
  console.log(`${errorResult.action}: ${errorResult.name} (${errorResult.id})`);

  existing = await listWorkflows(baseUrl, apiKey);
  const wf2Spec = buildWf2();
  wf2Spec.settings = { executionOrder: 'v1', errorWorkflow: errorResult.id };
  const wf2Result = await upsertWorkflow(baseUrl, apiKey, existing, wf2Spec);
  console.log(`${wf2Result.action}: ${wf2Result.name} (${wf2Result.id})`);

  existing = await listWorkflows(baseUrl, apiKey);
  const wf1Result = await upsertWorkflow(baseUrl, apiKey, existing, buildWf1());
  console.log(`${wf1Result.action}: ${wf1Result.name} (${wf1Result.id})`);

  const seoAdminUrl = `${baseUrl}/webhook/seo-admin-01-keyword-discovery`;
  console.log('');
  console.log('Setze in WebWelle .env.local / Coolify:');
  console.log(`N8N_WEBHOOK_SEO_ADMIN_01_URL=${seoAdminUrl}`);
  console.log('');
  console.log('Setze in n8n-Coolify:');
  console.log('N8N_INTERNAL_WEBHOOK_BASE=http://n8n:5678/webhook');
  console.log('DATAFORSEO_LOGIN / DATAFORSEO_PASSWORD');
  console.log('N8N_WEBHOOK_SECRET (identisch mit WebWelle)');
  console.log('WEBWELLE_CALLBACK_BASE_URL');
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
