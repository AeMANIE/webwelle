#!/usr/bin/env node
/**
 * Push outbound workflow JSON to n8n API (create or update by name).
 * Reads API creds from ~/.cursor/mcp.json (same as activate-n8n-dwa-workflow.mjs).
 *
 * Usage:
 *   node outbound/scripts/sync-outbound-workflows.mjs
 *   node outbound/scripts/sync-outbound-workflows.mjs --activate
 */
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { homedir } from 'os';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const wfDir = join(root, 'n8n', 'workflows');
const activate = process.argv.includes('--activate');

function loadMcp() {
  const mcp = JSON.parse(readFileSync(join(homedir(), '.cursor/mcp.json'), 'utf8'));
  const n8n = mcp.mcpServers?.n8n?.env;
  if (!n8n?.N8N_API_URL || !n8n?.N8N_API_KEY) {
    throw new Error('N8N_API_URL / N8N_API_KEY in ~/.cursor/mcp.json fehlt');
  }
  let base = n8n.N8N_API_URL.replace(/\/$/, '');
  base = base.replace(/\/api\/v1$/, '');
  return { base, key: n8n.N8N_API_KEY };
}

async function api(base, key, method, path, body) {
  const res = await fetch(`${base}/api/v1${path}`, {
    method,
    headers: {
      'X-N8N-API-KEY': key,
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${path} ${res.status}: ${text.slice(0, 400)}`);
  return text ? JSON.parse(text) : null;
}

const { base, key } = loadMcp();
const existing = await api(base, key, 'GET', '/workflows?limit=100');
const byName = new Map((existing.data || existing).map((w) => [w.name, w]));

for (const file of readdirSync(wfDir).filter((f) => f === 'outbound-v1.json')) {
  const wf = JSON.parse(readFileSync(join(wfDir, file), 'utf8'));
  const payload = {
    name: wf.name,
    nodes: wf.nodes,
    connections: wf.connections,
    settings: wf.settings || {},
    staticData: wf.staticData || null,
  };

  const found = byName.get(wf.name);
  if (found) {
    await api(base, key, 'PUT', `/workflows/${found.id}`, payload);
    console.log('Updated:', wf.name, found.id);
    if (activate) {
      await api(base, key, 'POST', `/workflows/${found.id}/activate`);
      console.log('  Activated');
    }
  } else {
    const created = await api(base, key, 'POST', '/workflows', payload);
    console.log('Created:', wf.name, created.id);
    byName.set(wf.name, created);
    if (activate) {
      await api(base, key, 'POST', `/workflows/${created.id}/activate`);
      console.log('  Activated');
    }
  }
}

console.log('Done. Webhooks: outbound-analyze, outbound-status, outbound-draft, outbound-draft-update, outbound-send');
