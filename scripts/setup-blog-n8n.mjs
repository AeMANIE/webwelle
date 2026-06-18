#!/usr/bin/env node
/**
 * Activates blog seo-01..04 + seo-06 workflows and ensures .env.local blog URLs.
 * Uses N8N_BASE_URL + N8N_API_KEY from .env.local (no secrets printed).
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const envPath = join(root, '.env.local');

const WORKFLOW_IDS = [
  { id: 'HbRAuPK4Dd6ekAjd', name: 'seo-01' },
  { id: 'q5tqTGRjupy9JKdE', name: 'seo-02' },
  { id: '5THEWW5gWbv8cg7p', name: 'seo-03' },
  { id: '8BZxLGLZlCggHJ5b', name: 'seo-04' },
  { id: 'HV16Eux9keNnnJt8', name: 'seo-06' },
];

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

function ensureEnvKeys(env) {
  const base = (env.N8N_BASE_URL || '').replace(/\/$/, '');
  if (!base) throw new Error('N8N_BASE_URL fehlt in .env.local');

  const updates = {};
  if (!env.N8N_WEBHOOK_SEO_01_URL?.trim()) {
    updates.N8N_WEBHOOK_SEO_01_URL = `${base}/webhook/seo-01-research-project-setup-discovery`;
  }
  if (!env.N8N_INTERNAL_WEBHOOK_BASE?.trim()) {
    updates.N8N_INTERNAL_WEBHOOK_BASE = `${base}/webhook`;
  }
  console.warn(
    'Wichtig: N8N_INTERNAL_WEBHOOK_BASE auch in der n8n-Instanz-Env setzen (Coolify n8n-App), nicht nur in .env.local.'
  );
  if (!env.N8N_WEBHOOK_BLOG_ORCHESTRATOR_URL?.trim() && updates.N8N_WEBHOOK_SEO_01_URL) {
    updates.N8N_WEBHOOK_BLOG_ORCHESTRATOR_URL = updates.N8N_WEBHOOK_SEO_01_URL;
  }

  if (Object.keys(updates).length === 0) return env;

  let content = readFileSync(envPath, 'utf8');
  if (!content.endsWith('\n')) content += '\n';
  content += '\n# Blog-Pipeline (auto setup-blog-n8n.mjs)\n';
  for (const [k, v] of Object.entries(updates)) {
    content += `${k}=${v}\n`;
    env[k] = v;
  }
  writeFileSync(envPath, content, 'utf8');
  console.log('Env ergänzt:', Object.keys(updates).join(', '));
  return env;
}

async function activateWorkflow(baseUrl, apiKey, workflowId) {
  const url = `${baseUrl.replace(/\/$/, '')}/api/v1/workflows/${workflowId}/activate`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'X-N8N-API-KEY': apiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: '{}',
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text.slice(0, 200) };
  }
  return { ok: res.ok, status: res.status, active: json.active, name: json.name };
}

async function main() {
  const env = ensureEnvKeys(parseEnvFile(envPath));
  const apiKey = env.N8N_API_KEY;
  const baseUrl = env.N8N_BASE_URL;
  if (!apiKey) throw new Error('N8N_API_KEY fehlt in .env.local');

  const required = ['N8N_WEBHOOK_SECRET', 'OPENROUTER_API_KEY'];
  const missing = required.filter((k) => !env[k]?.trim());
  if (missing.length) {
    console.warn('Hinweis: noch nicht in .env.local:', missing.join(', '));
  }

  console.log('Aktiviere Blog-Workflows…');
  let allOk = true;
  for (const wf of WORKFLOW_IDS) {
    const result = await activateWorkflow(baseUrl, apiKey, wf.id);
    const status = result.ok && result.active ? 'aktiv' : `Fehler HTTP ${result.status}`;
    console.log(`  ${wf.name} (${wf.id}): ${status}${result.name ? ` — ${result.name}` : ''}`);
    if (!result.ok || !result.active) allOk = false;
  }

  if (!allOk) process.exit(1);
  console.log('Fertig — alle Blog-Workflows aktiv.');
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
