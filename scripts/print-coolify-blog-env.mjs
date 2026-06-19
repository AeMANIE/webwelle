#!/usr/bin/env node
/**
 * Prints Coolify env checklist for Blog Pipeline System 1 (no secrets).
 * Run locally after .env.local is configured; copy keys/values into Coolify UI.
 */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const envPath = join(root, '.env.local');

function parseEnv(path) {
  if (!existsSync(path)) return {};
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

const env = parseEnv(envPath);
const base = (env.N8N_BASE_URL || 'https://<n8n-host>').replace(/\/$/, '');

console.log(`
=== Coolify: WebWelle-App (webwelle.com) ===
N8N_BASE_URL=${base}
N8N_WEBHOOK_SEO_01_URL=${env.N8N_WEBHOOK_SEO_01_URL || `${base}/webhook/seo-01-research-project-setup-discovery`}
N8N_WEBHOOK_SECRET=<gleich wie n8n>
N8N_API_KEY=<gesetzt: ${env.N8N_API_KEY ? 'ja lokal' : 'NEIN'}> — MUSS identisch in n8n sein
NEXT_PUBLIC_BASE_URL=https://webwelle.com

=== Coolify: n8n-App (PFLICHT für Callbacks + Writer) ===
N8N_BASE_URL=${base}
N8N_INTERNAL_WEBHOOK_BASE=${base}/webhook
N8N_WEBHOOK_SECRET=<identisch mit WebWelle>
N8N_API_KEY=<IDENTISCH mit WebWelle-App — für seo-06 → /api/blog/publish>
OPENROUTER_API_KEY=<PFLICHT für seo-04 — gesetzt: ${env.OPENROUTER_API_KEY ? 'ja lokal' : 'NEIN'}>
OPENROUTER_MODEL=anthropic/claude-3.5-haiku
# OPENROUTER_MAX_TOKENS=3500  # bei 402 Credit-Limit in n8n setzen (Default im Workflow: Draft 3500, Rewrite 2800)
# NICHT google/gemma-2-9b-it:free — OpenRouter 404, Pipeline liefert nur Stubs
DATAFORSEO_LOGIN=<PFLICHT n8n seo-01/03 — gesetzt: ${env.DATAFORSEO_LOGIN ? 'ja lokal' : 'NEIN'}>
DATAFORSEO_PASSWORD=<PFLICHT n8n seo-01/03 — gesetzt: ${env.DATAFORSEO_PASSWORD ? 'ja lokal' : 'NEIN'}>
GOOGLE_PAGESPEED_API_KEY=<optional>

Diagnose: node scripts/diag-blog-callback.mjs [execId] [wf|dual|seo04]
Danach: BEIDE Apps redeployen.
Live-Check: GET /api/admin/blog/pipeline-env-check (Admin eingeloggt)
`);
