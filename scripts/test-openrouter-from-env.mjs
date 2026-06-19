#!/usr/bin/env node
/** Quick OpenRouter smoke test using .env.local (no secrets printed). */
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

async function main() {
  if (!existsSync(envPath)) throw new Error('.env.local fehlt');
  const env = parseEnv(envPath);
  const apiKey = env.OPENROUTER_API_KEY?.trim();
  const model =
    env.OPENROUTER_MODEL?.trim() ||
    env.WEBWELLE_OPENROUTER_MODEL?.trim() ||
    'anthropic/claude-3.5-haiku';

  if (!apiKey) {
    console.error('OPENROUTER_API_KEY fehlt in .env.local (n8n-Coolify braucht denselben Key).');
    process.exit(1);
  }

  console.log('Model:', model);
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://webwelle.com',
      'X-Title': 'WebWelle Blog Pipeline Test',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'user', content: 'Antworte nur mit: OK-TEST' },
      ],
      max_tokens: 20,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    console.error('OpenRouter HTTP', res.status, data.error?.message || data.message || JSON.stringify(data).slice(0, 200));
    process.exit(1);
  }

  const text = data.choices?.[0]?.message?.content?.trim() || '';
  console.log('Status:', res.status);
  console.log('Antwort-Länge:', text.length);
  console.log('Preview:', text.slice(0, 80));
  if (!text) {
    console.error('Leere choices — Modell wechseln (nicht :free).');
    process.exit(1);
  }
  console.log('OpenRouter OK');
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
