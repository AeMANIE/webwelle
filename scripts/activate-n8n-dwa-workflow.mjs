/**
 * Activates project-solutions-v1 in n8n (reads API creds from ~/.cursor/mcp.json).
 */
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const WORKFLOW_ID = 'VLCZiYJr8NU0Pcr5';
const mcp = JSON.parse(readFileSync(join(homedir(), '.cursor/mcp.json'), 'utf8'));
const apiBase = mcp.mcpServers.n8n.env.N8N_API_URL.replace(/\/$/, '');
const key = mcp.mcpServers.n8n.env.N8N_API_KEY;

const res = await fetch(`${apiBase}/workflows/${WORKFLOW_ID}/activate`, {
  method: 'POST',
  headers: {
    'X-N8N-API-KEY': key,
    'Content-Type': 'application/json',
  },
});

const text = await res.text();
if (!res.ok) {
  console.error('Activate failed:', res.status, text.slice(0, 500));
  process.exit(1);
}

const wf = JSON.parse(text);
console.log('Activated:', wf.name, 'active=', wf.active);
