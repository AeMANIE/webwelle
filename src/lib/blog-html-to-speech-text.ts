import * as cheerio from 'cheerio';
import type { Element } from 'domhandler';

export interface BlogSpeechInput {
  title: string;
  excerpt?: string;
  html: string;
}

const ORDINALS_DE = [
  'Erstens',
  'Zweitens',
  'Drittens',
  'Viertens',
  'Fünftens',
  'Sechstens',
  'Siebtens',
  'Achtes',
  'Neuntens',
  'Zehntens',
];

function normalizeWhitespace(text: string): string {
  return text
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

function inlineText($: cheerio.CheerioAPI, el: Element): string {
  const $el = $(el);
  if ($el.is('a')) {
    return $el.text().trim();
  }
  return $el.text().replace(/\s+/g, ' ').trim();
}

function blockFromElement($: cheerio.CheerioAPI, el: Element): string {
  const tag = el.tagName?.toLowerCase();
  const $el = $(el);

  if (tag === 'h2' || tag === 'h3') {
    const text = inlineText($, el);
    return text ? `${text}\n\n` : '';
  }

  if (tag === 'p') {
    const parts: string[] = [];
    $el.contents().each((_, node) => {
      if (node.type === 'text') {
        const t = $(node).text().replace(/\s+/g, ' ').trim();
        if (t) parts.push(t);
      } else if (node.type === 'tag') {
        const child = node as Element;
        const childTag = child.tagName?.toLowerCase();
        if (childTag === 'br') {
          parts.push('\n');
        } else if (childTag === 'strong' || childTag === 'em' || childTag === 'b' || childTag === 'i') {
          const t = $(child).text().replace(/\s+/g, ' ').trim();
          if (t) parts.push(t);
        } else if (childTag === 'a') {
          const t = $(child).text().replace(/\s+/g, ' ').trim();
          if (t) parts.push(t);
        } else {
          const t = $(child).text().replace(/\s+/g, ' ').trim();
          if (t) parts.push(t);
        }
      }
    });
    const text = parts.join('').replace(/\n+/g, ' ').trim();
    return text ? `${text}\n\n` : '';
  }

  if (tag === 'ul' || tag === 'ol') {
    const items: string[] = [];
    $el.children('li').each((i, li) => {
      const text = $(li).text().replace(/\s+/g, ' ').trim();
      if (!text) return;
      if (tag === 'ol') {
        const label = ORDINALS_DE[i] ?? `Punkt ${i + 1}`;
        items.push(`${label}: ${text}`);
      } else {
        items.push(`Punkt ${i + 1}: ${text}`);
      }
    });
    return items.length ? `${items.join('\n')}\n\n` : '';
  }

  if (tag === 'table') {
    const rows: string[] = [];
    $el.find('tr').each((_, tr) => {
      const cells = $(tr)
        .find('th, td')
        .map((__, cell) => $(cell).text().replace(/\s+/g, ' ').trim())
        .get()
        .filter(Boolean);
      if (cells.length) rows.push(cells.join(': '));
    });
    return rows.length ? `${rows.join('\n')}\n\n` : '';
  }

  if (tag === 'blockquote') {
    const text = $el.text().replace(/\s+/g, ' ').trim();
    return text ? `${text}\n\n` : '';
  }

  const text = $el.text().replace(/\s+/g, ' ').trim();
  return text ? `${text}\n\n` : '';
}

function htmlBodyToSpeechText(html: string): string {
  const $ = cheerio.load(html);
  const parts: string[] = [];

  $('body').length
    ? $('body')
        .children()
        .each((_, el) => {
          const block = blockFromElement($, el);
          if (block) parts.push(block);
        })
  : $.root()
      .children()
      .each((_, el) => {
        const block = blockFromElement($, el);
        if (block) parts.push(block);
      });

  return normalizeWhitespace(parts.join(''));
}

/**
 * Normalizes a hand-written speak script (plain .txt) for TTS.
 * Converts bare list lines (single newlines) into spoken "Erstens/Zweitens" form
 * so Gemini does not skip them inside large blocks.
 */
export function plainTextToSpeechText(raw: string): string {
  const normalized = raw
    .replace(/\u00a0/g, ' ')
    .replace(/\t+/g, ' – ')
    .replace(/\r\n/g, '\n');

  const lines = normalized.split('\n');
  const paragraphs: string[] = [];
  let buffer: string[] = [];

  const flushBuffer = () => {
    if (!buffer.length) return;
    paragraphs.push(formatSpeechLines(buffer));
    buffer = [];
  };

  for (const line of lines) {
    const t = line.trim();
    if (!t) {
      flushBuffer();
      continue;
    }
    buffer.push(t);
  }
  flushBuffer();

  return normalizeWhitespace(paragraphs.join('\n\n'));
}

function formatSpeechLines(lines: string[]): string {
  if (lines.length === 1) return ensureSentenceEnd(lines[0]);

  const { listLines, rest } = extractListPrefix(lines);
  const parts: string[] = [];

  if (listLines.length) {
    parts.push(formatListAsSpeech(listLines));
  }
  if (rest.length) {
    parts.push(formatNonListLines(rest));
  }

  return parts.join(' ');
}

function extractListPrefix(lines: string[]): { listLines: string[]; rest: string[] } {
  if (lines.length < 3) return { listLines: [], rest: lines };

  const listLines: string[] = [];
  const conclusionRe = /^(Dann|Statt|Wenn|Bei|Das|Dieses|Genau|Für|Hier|So|Nicht)\b/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (listLines.length >= 3 && (conclusionRe.test(line) || (line.length > 130 && /[.!?]$/.test(line)))) {
      return { listLines, rest: lines.slice(i) };
    }

    const canBeListItem =
      line.length <= 160 &&
      !line.endsWith(':') &&
      (!/[.!?]$/.test(line) || listLines.length > 0);

    if (canBeListItem && (listLines.length > 0 || i + 2 < lines.length)) {
      listLines.push(line);
      continue;
    }

    if (listLines.length >= 3) {
      return { listLines, rest: lines.slice(i) };
    }

    return { listLines: [], rest: lines };
  }

  return listLines.length >= 3 ? { listLines, rest: [] } : { listLines: [], rest: lines };
}

function formatListAsSpeech(lines: string[]): string {
  return lines
    .map((line, i) => {
      const label = ORDINALS_DE[i] ?? `Punkt ${i + 1}`;
      return `${label}: ${ensureSentenceEnd(line)}`;
    })
    .join(' ');
}

function formatNonListLines(lines: string[]): string {
  if (lines.length === 1) return ensureSentenceEnd(lines[0]);

  const parts: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const cur = lines[i];
    const next = lines[i + 1];

    if (cur.endsWith('?') && next) {
      parts.push(`Frage: ${cur} Antwort: ${ensureSentenceEnd(next)}`);
      i += 2;
      continue;
    }

    if (next && cur.length < 95 && next.length > cur.length && !/[.!?:]$/.test(cur)) {
      parts.push(`${ensureSentenceEnd(cur)} ${next}`);
      i += 2;
      continue;
    }

    parts.push(ensureSentenceEnd(cur));
    i += 1;
  }

  return parts.join(' ');
}

function ensureSentenceEnd(line: string): string {
  if (/[.!?:]$/.test(line)) return line;
  return `${line}.`;
}

/**
 * Converts blog article metadata + HTML body to plain German speech text for TTS.
 * Never includes HTML tags or attribute values.
 */
export function htmlToSpeechText(input: BlogSpeechInput): string {
  const sections: string[] = [];

  const title = input.title.trim();
  if (title) sections.push(`${title}\n\n`);

  const excerpt = input.excerpt?.trim();
  if (excerpt) sections.push(`${excerpt}\n\n`);

  const body = htmlBodyToSpeechText(input.html);
  if (body) sections.push(body);

  return normalizeWhitespace(sections.join(''));
}

/** Split speech text into TTS-safe chunks at paragraph boundaries. */
export function splitSpeechTextForTts(text: string, maxChars = 4000): string[] {
  if (text.length <= maxChars) return [text];

  const paragraphs = text.split(/\n\n+/);
  const chunks: string[] = [];
  let current = '';

  for (const para of paragraphs) {
    const piece = para.trim();
    if (!piece) continue;

    const candidate = current ? `${current}\n\n${piece}` : piece;
    if (candidate.length <= maxChars) {
      current = candidate;
      continue;
    }

    if (current) {
      chunks.push(current);
      current = '';
    }

    if (piece.length <= maxChars) {
      current = piece;
      continue;
    }

    // Hard-split very long paragraphs at sentence boundaries
    let rest = piece;
    while (rest.length > maxChars) {
      const slice = rest.slice(0, maxChars);
      const breakAt = Math.max(slice.lastIndexOf('. '), slice.lastIndexOf('! '), slice.lastIndexOf('? '));
      const cut = breakAt > maxChars * 0.5 ? breakAt + 1 : maxChars;
      chunks.push(rest.slice(0, cut).trim());
      rest = rest.slice(cut).trim();
    }
    if (rest) current = rest;
  }

  if (current) chunks.push(current);
  return chunks.filter(Boolean);
}
