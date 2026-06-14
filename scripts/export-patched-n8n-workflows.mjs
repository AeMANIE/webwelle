import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const { ensureOwnSiteNodes } = await import('./patch-n8n-own-site-workflows.mjs');

const TARGETS = [
  {
    input: join(__dirname, '../.n8n-cache/competitor-design-v3.json'),
    output: join(__dirname, '../.n8n-cache/competitor-design-v3.patched.json'),
    evidenceTarget: 'Fetch Evidence Per Site',
  },
  {
    input: join(__dirname, '../.n8n-cache/seo-keywords-v2.json'),
    output: join(__dirname, '../.n8n-cache/seo-keywords-v2.patched.json'),
    evidenceTarget: 'Run SEO Crawl And LLM',
  },
];

for (const target of TARGETS) {
  const workflow = JSON.parse(readFileSync(target.input, 'utf8'));
  const patched = ensureOwnSiteNodes(workflow, target.evidenceTarget);
  writeFileSync(
    target.output,
    JSON.stringify({
      workflowId: workflow.id,
      name: workflow.name,
      nodes: patched.nodes,
      connections: patched.connections,
      settings: workflow.settings,
    })
  );
  console.log('Wrote', target.output);
}
