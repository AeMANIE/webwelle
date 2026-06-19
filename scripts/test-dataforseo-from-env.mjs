#!/usr/bin/env node
/** Smoke-test DataForSEO Basic Auth — reads DATAFORSEO_LOGIN/PASSWORD from env or .env.local */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const envPath = join(root, '.env.local');

function parseEnv(path) {
  const env = { ...process.env };
  if (!existsSync(path)) return env;
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
  const env = parseEnv(envPath);
  const login = env.DATAFORSEO_LOGIN?.trim();
  const password = env.DATAFORSEO_PASSWORD?.trim();
  if (!login || !password) {
    console.error('DATAFORSEO_LOGIN + DATAFORSEO_PASSWORD fehlen (n8n-Coolify oder .env.local)');
    process.exit(1);
  }
  const auth = Buffer.from(`${login}:${password}`).toString('base64');
  const res = await fetch('https://api.dataforseo.com/v3/appendix/user_data', {
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text.slice(0, 200) };
  }
  const code = json?.tasks?.[0]?.status_code ?? json?.status_code ?? res.status;
  const msg = json?.tasks?.[0]?.status_message ?? json?.status_message ?? '';
  console.log('HTTP', res.status, 'status_code', code, msg || '');
  if (code === 20000) {
    const bal = json?.tasks?.[0]?.result?.[0]?.money?.balance;
    console.log('OK — DataForSEO Auth funktioniert.', bal != null ? `Balance: ${bal}` : '');
    return;
  }
  console.error('FEHLER — prüfe Login/Passwort unter https://app.dataforseo.com/api-access');
  process.exit(1);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
