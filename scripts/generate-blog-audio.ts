#!/usr/bin/env tsx
/**
 * Generate blog article MP3s locally via OpenRouter TTS (Option B).
 * Not run in Docker/Coolify deploy — execute on Mac only.
 *
 * Usage:
 *   npm run blog:audio -- --slug=my-article-slug
 *   npm run blog:audio -- --all
 *   npm run blog:audio -- --slug=my-article-slug --dry-run
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import {
  htmlToSpeechText,
  plainTextToSpeechText,
  splitSpeechTextForTts,
} from '../src/lib/blog-html-to-speech-text';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT_DIR = join(root, 'src/content/blog');
const SPEECH_DIR = join(CONTENT_DIR, 'speech');
const MANIFEST_PATH = join(CONTENT_DIR, 'posts.json');
const AUDIO_DIR = join(root, 'public/blog-audio');
const TMP_DIR = join(AUDIO_DIR, '.tmp');
const ENV_PATH = join(root, '.env.local');

interface GitBlogMeta {
  slug: string;
  htmlFile: string;
  title: string;
  excerpt?: string;
  audioUrl?: string;
}

function parseEnv(path: string): Record<string, string> {
  const env: Record<string, string> = {};
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i === -1) continue;
    env[t.slice(0, i)] = t.slice(i + 1);
  }
  return env;
}

function parseArgs(argv: string[]) {
  let slug: string | undefined;
  let all = false;
  let dryRun = false;
  let force = false;

  for (const arg of argv) {
    if (arg === '--all') all = true;
    else if (arg === '--dry-run') dryRun = true;
    else if (arg === '--force') force = true;
    else if (arg.startsWith('--slug=')) slug = arg.slice('--slug='.length).trim();
  }

  return { slug, all, dryRun, force };
}

function resolveSpeechText(meta: GitBlogMeta): { text: string; source: string } {
  const speechPath = join(SPEECH_DIR, `${meta.slug}.txt`);
  if (existsSync(speechPath)) {
    return {
      text: plainTextToSpeechText(readFileSync(speechPath, 'utf-8')),
      source: `speech/${meta.slug}.txt`,
    };
  }

  const htmlPath = join(CONTENT_DIR, meta.htmlFile);
  const html = readFileSync(htmlPath, 'utf-8');
  return {
    text: htmlToSpeechText({
      title: meta.title,
      excerpt: meta.excerpt,
      html,
    }),
    source: meta.htmlFile,
  };
}

function loadManifest(): GitBlogMeta[] {
  const raw = readFileSync(MANIFEST_PATH, 'utf-8');
  const parsed = JSON.parse(raw) as GitBlogMeta[];
  if (!Array.isArray(parsed)) throw new Error('posts.json ist kein Array');
  return parsed;
}

function saveManifest(posts: GitBlogMeta[]) {
  writeFileSync(MANIFEST_PATH, `${JSON.stringify(posts, null, 2)}\n`, 'utf-8');
}

function ensureFfmpeg() {
  try {
    execSync('ffmpeg -version', { stdio: 'ignore' });
  } catch {
    throw new Error('ffmpeg nicht gefunden. Installieren: brew install ffmpeg');
  }
}

const PCM_SAMPLE_RATE = 24000;
const PCM_CHANNELS = 1;

function usesPcmOutput(model: string): boolean {
  return model.startsWith('google/gemini');
}

function buildTtsRequestBody(
  model: string,
  voice: string,
  text: string,
  language: string,
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    model,
    input: text,
    voice,
    response_format: usesPcmOutput(model) ? 'pcm' : 'mp3',
  };

  if (usesPcmOutput(model)) {
    body.provider = { google: { language_code: language } };
  }

  return body;
}

function pcmBufferToMp3(pcm: Buffer): Buffer {
  const pcmPath = join(TMP_DIR, `chunk-${Date.now()}-${Math.random().toString(36).slice(2)}.pcm`);
  const mp3Path = pcmPath.replace('.pcm', '.mp3');
  mkdirSync(TMP_DIR, { recursive: true });
  writeFileSync(pcmPath, pcm);
  try {
    execSync(
      `ffmpeg -y -f s16le -ar ${PCM_SAMPLE_RATE} -ac ${PCM_CHANNELS} -i "${pcmPath}" -codec:a libmp3lame -qscale:a 3 "${mp3Path}"`,
      { stdio: 'ignore' },
    );
    return readFileSync(mp3Path);
  } finally {
    if (existsSync(pcmPath)) rmSync(pcmPath);
    if (existsSync(mp3Path)) rmSync(mp3Path);
  }
}

async function synthesizeChunk(
  apiKey: string,
  model: string,
  voice: string,
  language: string,
  text: string,
): Promise<Buffer> {
  const res = await fetch('https://openrouter.ai/api/v1/audio/speech', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://webwelle.com',
      'X-Title': 'WebWelle Blog Audio',
    },
    body: JSON.stringify(buildTtsRequestBody(model, voice, text, language)),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`OpenRouter TTS HTTP ${res.status}: ${errText.slice(0, 300)}`);
  }

  const raw = Buffer.from(await res.arrayBuffer());
  return usesPcmOutput(model) ? pcmBufferToMp3(raw) : raw;
}

function concatMp3WithFfmpeg(partPaths: string[], outputPath: string) {
  const listFile = join(TMP_DIR, `concat-${Date.now()}.txt`);
  const listContent = partPaths.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join('\n');
  writeFileSync(listFile, listContent, 'utf-8');

  try {
    execSync(
      `ffmpeg -y -f concat -safe 0 -i "${listFile}" -codec:a libmp3lame -qscale:a 3 "${outputPath}"`,
      { stdio: 'inherit' },
    );
  } finally {
    if (existsSync(listFile)) rmSync(listFile);
  }
}

async function generateForPost(
  meta: GitBlogMeta,
  env: Record<string, string>,
  dryRun: boolean,
  force: boolean,
): Promise<void> {
  const htmlPath = join(CONTENT_DIR, meta.htmlFile);
  const speechPath = join(SPEECH_DIR, `${meta.slug}.txt`);
  if (!existsSync(speechPath) && !existsSync(htmlPath)) {
    throw new Error(`Weder speech/${meta.slug}.txt noch ${meta.htmlFile} gefunden`);
  }

  const { text: speechText, source } = resolveSpeechText(meta);

  console.log(`\n=== ${meta.slug} ===`);
  console.log(`Quelle: ${source}`);
  console.log(`Sprechtext: ${speechText.length} Zeichen`);

  if (dryRun) {
    console.log('--- Vorschau (erste 800 Zeichen) ---');
    console.log(speechText.slice(0, 800));
    if (speechText.length > 800) console.log('…');
    return;
  }

  const apiKey = env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) throw new Error('OPENROUTER_API_KEY fehlt in .env.local');

  const model =
    env.OPENROUTER_TTS_MODEL?.trim() || 'google/gemini-3.1-flash-tts-preview';
  const voice = env.OPENROUTER_TTS_VOICE?.trim() || 'Kore';
  const language = env.OPENROUTER_TTS_LANGUAGE?.trim() || 'de-DE';

  ensureFfmpeg();
  mkdirSync(TMP_DIR, { recursive: true });
  mkdirSync(AUDIO_DIR, { recursive: true });

  const chunks = splitSpeechTextForTts(speechText, 2500);
  console.log(`TTS-Chunks: ${chunks.length} (Model: ${model}, Voice: ${voice}, Sprache: ${language})`);

  const partPaths: string[] = [];
  for (let i = 0; i < chunks.length; i++) {
    const partPath = join(TMP_DIR, `${meta.slug}-part-${i + 1}.mp3`);
    if (!force && existsSync(partPath) && readFileSync(partPath).length > 0) {
      console.log(`  Chunk ${i + 1}/${chunks.length} — vorhanden, übersprungen`);
      partPaths.push(partPath);
      continue;
    }
    console.log(`  Chunk ${i + 1}/${chunks.length} (${chunks[i].length} Zeichen)…`);
    const audio = await synthesizeChunk(apiKey, model, voice, language, chunks[i]);
    writeFileSync(partPath, audio);
    partPaths.push(partPath);
  }

  const outputPath = join(AUDIO_DIR, `${meta.slug}.mp3`);
  if (partPaths.length === 1) {
    writeFileSync(outputPath, readFileSync(partPaths[0]));
  } else {
    concatMp3WithFfmpeg(partPaths, outputPath);
  }

  for (const p of partPaths) {
    if (existsSync(p)) rmSync(p);
  }

  const audioUrl = `/blog-audio/${meta.slug}.mp3`;
  const manifest = loadManifest();
  const idx = manifest.findIndex((p) => p.slug === meta.slug);
  if (idx === -1) throw new Error(`Slug nicht in posts.json: ${meta.slug}`);
  manifest[idx] = { ...manifest[idx], audioUrl };
  saveManifest(manifest);

  console.log(`✓ Gespeichert: ${outputPath}`);
  console.log(`✓ posts.json audioUrl: ${audioUrl}`);
}

async function main() {
  const { slug, all, dryRun, force } = parseArgs(process.argv.slice(2));

  if (!slug && !all) {
    console.error(
      'Verwendung: npm run blog:audio -- --slug=<slug> | --all [--dry-run] [--force]',
    );
    process.exit(1);
  }

  if (!dryRun && !existsSync(ENV_PATH)) {
    throw new Error('.env.local fehlt (OPENROUTER_API_KEY benötigt)');
  }

  const env = existsSync(ENV_PATH) ? parseEnv(ENV_PATH) : {};
  const manifest = loadManifest();

  const targets = all
    ? manifest
    : manifest.filter((p) => p.slug === slug);

  if (!targets.length) {
    throw new Error(slug ? `Slug nicht gefunden: ${slug}` : 'Keine Artikel in posts.json');
  }

  for (const meta of targets) {
    await generateForPost(meta, env, dryRun, force);
  }

  if (!dryRun) {
    const tmpFiles = existsSync(TMP_DIR) ? readdirSync(TMP_DIR) : [];
    if (tmpFiles.length === 0) {
      try {
        rmSync(TMP_DIR, { recursive: true, force: true });
      } catch {
        /* ignore */
      }
    }
  }

  console.log('\nFertig.');
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
