#!/usr/bin/env node
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
  const apiKey = parseEnv(envPath).OPENROUTER_API_KEY?.trim();
  if (!apiKey) throw new Error('OPENROUTER_API_KEY fehlt');

  const res = await fetch('https://openrouter.ai/api/v1/models?output_modalities=speech', {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  const data = await res.json();
  if (!res.ok) {
    console.error('HTTP', res.status, data);
    process.exit(1);
  }
  for (const m of data.data || []) {
    console.log(m.id);
  }
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
