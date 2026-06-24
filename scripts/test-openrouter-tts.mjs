#!/usr/bin/env node
/** Quick TTS smoke test — uses .env.local, no secrets printed. */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const envPath = join(root, '.env.local');
const model = process.argv[2] || 'google/gemini-3.1-flash-tts-preview';
const voice = process.argv[3] || 'Kore';

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
  const apiKey = parseEnv(envPath).OPENROUTER_API_KEY?.trim();
  if (!apiKey) throw new Error('OPENROUTER_API_KEY fehlt');

  const usesPcm = model.startsWith('google/gemini');
  const res = await fetch('https://openrouter.ai/api/v1/audio/speech', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://webwelle.com',
      'X-Title': 'WebWelle Blog Audio Test',
    },
    body: JSON.stringify({
      model,
      input: 'Hallo, dies ist ein kurzer Test der deutschen Sprachausgabe.',
      voice,
      response_format: usesPcm ? 'pcm' : 'mp3',
      ...(usesPcm ? { provider: { google: { language_code: 'de-DE' } } } : {}),
    }),
  });

  console.log('Model:', model);
  console.log('Status:', res.status, res.headers.get('content-type'));
  if (!res.ok) {
    console.error(await res.text());
    process.exit(1);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  console.log('Bytes:', buf.length);
  console.log('TTS OK');
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
