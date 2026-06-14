import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const mcp = JSON.parse(readFileSync(join(homedir(), '.cursor/mcp.json'), 'utf8'));
const api = mcp.mcpServers.n8n.env.N8N_API_URL;
const key = mcp.mcpServers.n8n.env.N8N_API_KEY;

for (const file of ['competitor-design-v3.patched.json', 'seo-keywords-v2.patched.json']) {
  const payload = JSON.parse(readFileSync(join(__dirname, '../.n8n-cache', file), 'utf8'));
  const res = await fetch(`${api}/workflows/${payload.workflowId}`, {
    method: 'PUT',
    headers: {
      'X-N8N-API-KEY': key,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: payload.name,
      nodes: payload.nodes,
      connections: payload.connections,
      settings: { executionOrder: payload.settings?.executionOrder ?? 'v1' },
    }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${file} failed: ${res.status} ${text.slice(0, 400)}`);
  console.log(`Deployed ${payload.name} (${payload.workflowId})`);
}
