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
const PCM_BYTES_PER_SAMPLE = 2;
/** Gemini truncates long single requests — split at paragraph boundaries. */
const GEMINI_CHUNK_MAX_CHARS = 2_800;
/** Crossfade between PCM sections (seconds) — smoother than hard pause. */
const CHUNK_CROSSFADE_SEC = 0.12;
/** ~25 chars/sec for German; fail if shorter than this ratio. */
const MIN_SECONDS_PER_CHAR = 1 / 25;
const CHUNK_MIN_COVERAGE_RATIO = 0.8;

function usesPcmOutput(model: string): boolean {
  return model.startsWith('google/gemini');
}

function maxCharsForModel(model: string): number {
  if (usesPcmOutput(model)) return GEMINI_CHUNK_MAX_CHARS;
  return 2500;
}

function pcmDurationSec(pcm: Buffer): number {
  return pcm.length / (PCM_SAMPLE_RATE * PCM_CHANNELS * PCM_BYTES_PER_SAMPLE);
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function mp3DurationSec(mp3Path: string): number {
  const out = execSync(
    `ffprobe -v error -show_entries format=duration -of csv=p=0 "${mp3Path}"`,
    { encoding: 'utf-8' },
  ).trim();
  return Number.parseFloat(out);
}

function assertChunkCoverage(chunkText: string, pcm: Buffer, index: string): void {
  const duration = pcmDurationSec(pcm);
  const minSec = chunkText.length * MIN_SECONDS_PER_CHAR * CHUNK_MIN_COVERAGE_RATIO;
  if (duration < minSec) {
    throw new Error(
      `Abschnitt ${index} zu kurz (${formatDuration(duration)} für ${chunkText.length} Zeichen, min. ${formatDuration(minSec)}).`,
    );
  }
  console.log(`    → ${formatDuration(duration)} Audio`);
}

async function synthesizeChunkEnsured(
  apiKey: string,
  model: string,
  voice: string,
  language: string,
  text: string,
  label: string,
): Promise<Buffer[]> {
  const pcm = await synthesizeChunk(apiKey, model, voice, language, text);
  const minSec = text.length * MIN_SECONDS_PER_CHAR * CHUNK_MIN_COVERAGE_RATIO;

  if (pcmDurationSec(pcm) >= minSec || text.length < 500) {
    assertChunkCoverage(text, pcm, label);
    return [pcm];
  }

  console.log(`    ⚠ Abschnitt ${label} unvollständig — wird halbiert und erneut synthetisiert`);
  const parts = splitSpeechTextForTts(text, Math.max(400, Math.ceil(text.length / 2)));
  if (parts.length < 2) {
    assertChunkCoverage(text, pcm, label);
    return [pcm];
  }

  const buffers: Buffer[] = [];
  for (let i = 0; i < parts.length; i++) {
    const sub = await synthesizeChunkEnsured(
      apiKey,
      model,
      voice,
      language,
      parts[i],
      `${label}.${i + 1}`,
    );
    buffers.push(...sub);
  }
  return buffers;
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

  return Buffer.from(await res.arrayBuffer());
}

function trimPcmSilence(inputPath: string, outputPath: string) {
  execSync(
    `ffmpeg -y -f s16le -ar ${PCM_SAMPLE_RATE} -ac ${PCM_CHANNELS} -i "${inputPath}" ` +
      `-af "silenceremove=start_periods=1:start_silence=0.04:start_threshold=-45dB:detection=peak,` +
      `areverse,silenceremove=start_periods=1:start_silence=0.04:start_threshold=-45dB:detection=peak,areverse" ` +
      `-f s16le -ar ${PCM_SAMPLE_RATE} -ac ${PCM_CHANNELS} "${outputPath}"`,
    { stdio: 'ignore' },
  );
}

function buildCrossfadeFilter(partCount: number): string {
  if (partCount <= 1) return '';
  let filter = `[0][1]acrossfade=d=${CHUNK_CROSSFADE_SEC}:c1=tri:c2=tri[a1]`;
  for (let i = 2; i < partCount; i++) {
    const prev = `a${i - 1}`;
    const out = i === partCount - 1 ? 'out' : `a${i}`;
    filter += `;[${prev}][${i}]acrossfade=d=${CHUNK_CROSSFADE_SEC}:c1=tri:c2=tri[${out}]`;
  }
  return filter;
}

function concatPcmWithCrossfade(partPaths: string[], outputPcmPath: string) {
  if (partPaths.length === 1) {
    writeFileSync(outputPcmPath, readFileSync(partPaths[0]));
    return;
  }

  const trimmedPaths: string[] = [];
  for (let i = 0; i < partPaths.length; i++) {
    const trimmed = join(TMP_DIR, `trim-${Date.now()}-${i}.pcm`);
    trimPcmSilence(partPaths[i], trimmed);
    trimmedPaths.push(trimmed);
  }

  const inputs = trimmedPaths
    .map((p) => `-f s16le -ar ${PCM_SAMPLE_RATE} -ac ${PCM_CHANNELS} -i "${p}"`)
    .join(' ');
  const filter = buildCrossfadeFilter(trimmedPaths.length);

  try {
    execSync(
      `ffmpeg -y ${inputs} -filter_complex "${filter}" -map "[out]" ` +
        `-f s16le -ar ${PCM_SAMPLE_RATE} -ac ${PCM_CHANNELS} "${outputPcmPath}"`,
      { stdio: 'ignore' },
    );
  } finally {
    for (const p of trimmedPaths) {
      if (existsSync(p)) rmSync(p);
    }
  }
}

function pcmBufferToMp3File(pcm: Buffer, mp3Path: string) {
  const pcmPath = mp3Path.replace(/\.mp3$/, '.pcm');
  writeFileSync(pcmPath, pcm);
  try {
    execSync(
      `ffmpeg -y -f s16le -ar ${PCM_SAMPLE_RATE} -ac ${PCM_CHANNELS} -i "${pcmPath}" -codec:a libmp3lame -qscale:a 3 "${mp3Path}"`,
      { stdio: 'ignore' },
    );
  } finally {
    if (existsSync(pcmPath)) rmSync(pcmPath);
  }
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
    const chunkLimit = maxCharsForModel(
      env.OPENROUTER_TTS_MODEL?.trim() || 'google/gemini-3.1-flash-tts-preview',
    );
    const chunks = splitSpeechTextForTts(speechText, chunkLimit);
    console.log(`Abschnitte: ${chunks.length} (max. ${chunkLimit} Zeichen)`);
    chunks.forEach((c, i) => console.log(`  ${i + 1}: ${c.length} Zeichen`));
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

  const chunkLimit = maxCharsForModel(model);
  const chunks = splitSpeechTextForTts(speechText, chunkLimit);
  const mode =
    chunks.length === 1 ? 'ein Durchgang' : `${chunks.length} Abschnitte mit Crossfade`;
  console.log(`TTS: ${mode} (Model: ${model}, Voice: ${voice}, Sprache: ${language})`);

  const pcmParts: Buffer[] = [];
  const mp3PartPaths: string[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const partPath = join(TMP_DIR, `${meta.slug}-part-${i + 1}.${usesPcmOutput(model) ? 'pcm' : 'mp3'}`);
    if (!force && existsSync(partPath) && readFileSync(partPath).length > 0) {
      console.log(`  Abschnitt ${i + 1}/${chunks.length} — vorhanden, übersprungen`);
      if (usesPcmOutput(model)) pcmParts.push(readFileSync(partPath));
      else mp3PartPaths.push(partPath);
      continue;
    }
    console.log(`  Abschnitt ${i + 1}/${chunks.length} (${chunks[i].length} Zeichen)…`);
    const partBuffers = await synthesizeChunkEnsured(
      apiKey,
      model,
      voice,
      language,
      chunks[i],
      `${i + 1}/${chunks.length}`,
    );
    for (const buf of partBuffers) {
      pcmParts.push(buf);
    }
    if (usesPcmOutput(model)) {
      writeFileSync(partPath, partBuffers.length === 1 ? partBuffers[0] : Buffer.concat(partBuffers));
    }
    else mp3PartPaths.push(partPath);
  }

  const outputPath = join(AUDIO_DIR, `${meta.slug}.mp3`);
  if (usesPcmOutput(model)) {
    const pcmPartPaths = pcmParts.map((buf, i) => {
      const p = join(TMP_DIR, `${meta.slug}-merge-${i + 1}.pcm`);
      writeFileSync(p, buf);
      return p;
    });
    const mergedPcmPath = join(TMP_DIR, `${meta.slug}-merged.pcm`);
    try {
      concatPcmWithCrossfade(pcmPartPaths, mergedPcmPath);
      pcmBufferToMp3File(readFileSync(mergedPcmPath), outputPath);
    } finally {
      for (const p of [...pcmPartPaths, mergedPcmPath]) {
        if (existsSync(p)) rmSync(p);
      }
    }
  } else if (mp3PartPaths.length === 1) {
    writeFileSync(outputPath, readFileSync(mp3PartPaths[0]));
  } else {
    concatMp3WithFfmpeg(mp3PartPaths, outputPath);
  }

  const totalDuration = mp3DurationSec(outputPath);
  const minDuration = speechText.length * MIN_SECONDS_PER_CHAR * 0.9;
  console.log(`  Gesamtdauer: ${formatDuration(totalDuration)} (Minimum erwartet: ${formatDuration(minDuration)})`);
  if (totalDuration < minDuration) {
    throw new Error(
      `MP3 zu kurz (${formatDuration(totalDuration)}) — nicht der ganze Artikel wurde gesprochen. ` +
        'Erneut mit --force generieren.',
    );
  }

  for (let i = 0; i < chunks.length; i++) {
    const ext = usesPcmOutput(model) ? 'pcm' : 'mp3';
    const p = join(TMP_DIR, `${meta.slug}-part-${i + 1}.${ext}`);
    if (existsSync(p)) rmSync(p);
  }

  const audioUrl = `/blog-audio/${meta.slug}.mp3?v=${Date.now()}`;
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
