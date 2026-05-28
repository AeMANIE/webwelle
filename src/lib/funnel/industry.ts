/** Bekannte Schreibweisen → einheitliche Form (nur exakte Keys, kein Fuzzy-Match) */
const SYNONYMS: Record<string, string> = {
  handwerker: 'Handwerker',
  handwerk: 'Handwerker',
  handwrk: 'Handwerker',
  handwerck: 'Handwerker',
  bau: 'Bauunternehmen',
  baufirma: 'Bauunternehmen',
  bauunternehmen: 'Bauunternehmen',
  makler: 'Immobilienmakler',
  immobilienmakler: 'Immobilienmakler',
  immobilien: 'Immobilienmakler',
  markler: 'Immobilienmakler',
  autohändler: 'Autohändler',
  autohandler: 'Autohändler',
  autohaus: 'Autohändler',
  kfz: 'Autohändler',
  'kfz händler': 'Autohändler',
  zahnarzt: 'Zahnarzt',
  zahnärzte: 'Zahnarzt',
  arzt: 'Arztpraxis',
  praxis: 'Arztpraxis',
  restaurant: 'Restaurant',
  gastronomie: 'Restaurant',
  friseur: 'Friseur',
  friseursalon: 'Friseur',
  steuerberater: 'Steuerberater',
  steuer: 'Steuerberater',
  hausmeister: 'Hausmeister',
  hausmster: 'Hausmeister',
  hausmeiter: 'Hausmeister',
  prcsis: 'Arztpraxis',
  praxsis: 'Arztpraxis',
  physiotherapie: 'Physiotherapeut',
  physiotherapeut: 'Physiotherapeut',
  maler: 'Maler',
  malerei: 'Maler',
  malerbetrieb: 'Maler',
  anstreicher: 'Maler',
  online: 'Einzelhandel',
  'online-shop': 'Einzelhandel',
};

const BLOCKLIST = new Set(['test', 'asdf', 'xxx', '123', '1234', 'abc', 'none', 'keine']);

/** Erkennt offensichtlich sinnlose Eingaben anhand struktureller Merkmale */
function isLikelyNonsense(input: string): boolean {
  const s = input.trim().toLowerCase();
  if (/^\d+$/.test(s)) return true;
  if (/^[^a-zA-ZäöüÄÖÜß\s-]+$/.test(s)) return true;
  if (/^(.)\1{3,}/.test(s)) return true;
  if (s.length > 4 && !/[aeiouäöü]/i.test(s)) return true;
  return false;
}

/** Verwechslungsgefahr bei Tippfehler-Korrektur (1 Zeichen Unterschied, andere Branche) */
const FUZZY_DENY_PAIRS = new Set([
  'maler|makler',
  'makler|maler',
]);

const CONFIDENCE_CONFIRM_THRESHOLD = 0.85;
const OPENROUTER_FALLBACK_MODEL = 'openai/gpt-4o-mini';

/** System-Prompt für OpenRouter – Hauptsprache Deutsch (DACH-Freitext) */
export const OPENROUTER_INDUSTRY_SYSTEM_PROMPT = `Du korrigierst Branchen-Eingaben für Webdesign-Analysen im DACH-Raum.

Sprache:
- Hauptsprache der Kunden ist Deutsch. Antworte ausschließlich auf Deutsch.
- Eingaben sind deutsche Branchenbegriffe (Freitext). Nicht ins Englische übersetzen.
- Keine Verwechslung mit englischen Wörtern (z. B. „maler“ = Maler/Anstrich, nicht „broker“/Makler; „haus“ ≠ engl. „house“-Kontext erfinden).

Regeln:
- Korrigiere Tippfehler und unübliche Schreibweise (z. B. hausmster → Hausmeister, prcsis → Arztpraxis).
- Die Branche darf NICHT in eine völlig andere Branche umgedeutet werden.
- „maler“ / Maler = Anstrich/Malerbetrieb, NIEMALS Makler oder Immobilien.
- Kurze, präzise Branchenbezeichnung (1–5 Wörter), Substantiv auf Deutsch.

Antworte NUR mit JSON: {"normalized":"...","confidence":0.0-1.0,"valid":true|false}`;

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

function maxTypoDistance(lower: string): number {
  if (lower.length >= 9) return 3;
  if (lower.length >= 6) return 2;
  return 1;
}

/** Tippfehler nahe bekannter Schreibweisen (z. B. handwrk → Handwerker) */
function matchClosestSynonym(lower: string): string | null {
  if (lower.length < 4) return null;

  const maxDist = maxTypoDistance(lower);
  let bestValue: string | null = null;
  let bestDist = maxDist + 1;

  for (const [key, value] of Object.entries(SYNONYMS)) {
    if (FUZZY_DENY_PAIRS.has(`${lower}|${key}`)) continue;
    const d = levenshtein(lower, key);
    if (d <= maxDist && d < bestDist) {
      bestDist = d;
      bestValue = value;
    }
  }

  return bestValue;
}

export interface IndustryNormalizeResult {
  raw: string;
  normalized: string;
  confidence: number;
  suggestions: string[];
  blocked: boolean;
  needsConfirmation: boolean;
}

/** KI-/Fuzzy-Ergebnis ablehnen, wenn es keine erkennbare Korrektur der Eingabe ist */
export function isPlausibleIndustryNormalization(
  raw: string,
  normalized: string
): boolean {
  if (industryCompareKey(raw) === industryCompareKey(normalized)) return true;

  const rawLower = raw.toLowerCase().trim();
  const normLower = normalized.toLowerCase().trim();
  if (!rawLower || !normLower) return false;

  if (normLower.includes(rawLower) || rawLower.includes(normLower)) return true;
  if (FUZZY_DENY_PAIRS.has(`${rawLower}|${normLower}`)) return false;

  const maxLen = Math.max(rawLower.length, normLower.length);
  const dist = levenshtein(rawLower, normLower);
  const maxAllowed = Math.max(2, Math.floor(maxLen * 0.45));
  return dist <= maxAllowed;
}

export function industryCompareKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss');
}

/** Nur bei niedriger Confidence und sichtbar geänderter Schreibweise */
export function needsIndustryConfirmation(result: IndustryNormalizeResult): boolean {
  if (result.blocked) return false;
  if (result.confidence >= CONFIDENCE_CONFIRM_THRESHOLD) return false;
  return industryCompareKey(result.raw) !== industryCompareKey(result.normalized);
}

function getOpenRouterModels(): string[] {
  const primary =
    process.env.WEBWELLE_OPENROUTER_MODEL ||
    process.env.OPENROUTER_MODEL ||
    OPENROUTER_FALLBACK_MODEL;
  return [...new Set([primary, OPENROUTER_FALLBACK_MODEL])];
}

/**
 * Lokale Vorstufe: Synonyme + Freitext. Kein Mapping auf eine feste Branchenliste.
 */
export function normalizeIndustry(input: string): IndustryNormalizeResult {
  const raw = input.trim();
  const lower = raw.toLowerCase();

  if (raw.length < 2 || BLOCKLIST.has(lower)) {
    return {
      raw,
      normalized: raw,
      confidence: 0,
      suggestions: [],
      blocked: true,
      needsConfirmation: false,
    };
  }

  if (SYNONYMS[lower]) {
    const normalized = SYNONYMS[lower];
    const result: IndustryNormalizeResult = {
      raw,
      normalized,
      confidence: 0.95,
      suggestions: [],
      blocked: false,
      needsConfirmation: false,
    };
    result.needsConfirmation = needsIndustryConfirmation(result);
    return result;
  }

  const typoSynonym = matchClosestSynonym(lower);
  if (typoSynonym) {
    const result: IndustryNormalizeResult = {
      raw,
      normalized: typoSynonym,
      confidence: 0.88,
      suggestions: [],
      blocked: false,
      needsConfirmation: false,
    };
    result.needsConfirmation = needsIndustryConfirmation(result);
    return result;
  }

  if (isLikelyNonsense(raw)) {
    return {
      raw,
      normalized: raw,
      confidence: 0,
      suggestions: [],
      blocked: true,
      needsConfirmation: false,
    };
  }

  return {
    raw,
    normalized: raw,
    confidence: 0.55,
    suggestions: [],
    blocked: false,
    needsConfirmation: false,
  };
}

function parseOpenRouterJson(content: string): {
  normalized?: string;
  confidence?: number;
  valid?: boolean;
} | null {
  const stripped = content.replace(/```json\n?|\n?```/g, '').trim();
  const candidates = [stripped];
  const brace = stripped.match(/\{[\s\S]*\}/);
  if (brace) candidates.push(brace[0]);

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate) as {
        normalized?: string;
        confidence?: number;
        valid?: boolean;
      };
      if (parsed.normalized?.trim()) {
        return {
          normalized: parsed.normalized.trim(),
          confidence: parsed.confidence,
          valid: parsed.valid !== false,
        };
      }
    } catch {
      /* nächster Kandidat */
    }
  }
  return null;
}

async function callOpenRouterNormalize(
  raw: string,
  model: string,
  apiKey: string,
  signal: AbortSignal
): Promise<IndustryNormalizeResult | null> {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    signal,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer':
        process.env.WEBWELLE_PUBLIC_APP_URL ||
        process.env.NEXT_PUBLIC_APP_URL ||
        'https://webwelle.com',
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content: OPENROUTER_INDUSTRY_SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: `Branche des Kunden (deutsch, Freitext): "${raw}"`,
        },
      ],
      temperature: 0.1,
      max_tokens: 120,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.warn(`OpenRouter industry (${model}):`, res.status, errText);
    return null;
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) return null;

  const parsed = parseOpenRouterJson(content);
  if (!parsed?.normalized) return null;

  const normalized = parsed.normalized;
  if (!isPlausibleIndustryNormalization(raw, normalized)) {
    console.warn('OpenRouter industry: implausible', raw, '→', normalized);
    return null;
  }
  const confidence = Math.min(1, Math.max(0, parsed.confidence ?? 0.82));
  const result: IndustryNormalizeResult = {
    raw,
    normalized,
    confidence,
    suggestions: [],
    blocked: false,
    needsConfirmation: false,
  };
  result.needsConfirmation = needsIndustryConfirmation(result);
  return result;
}

/**
 * Grammatik/Rechtschreibung per OpenRouter (wenn OPENROUTER_API_KEY gesetzt).
 * Fallback-Modell, falls Free-Modelle (404) nicht verfügbar sind.
 */
export async function normalizeIndustryWithOpenRouter(
  input: string
): Promise<IndustryNormalizeResult | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;

  const raw = input.trim();
  const local = normalizeIndustry(raw);
  if (local.blocked) return local;

  const controller = new AbortController();
  const timeoutMs = parseInt(process.env.OPENROUTER_TIMEOUT_MS || '20000', 10);
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    for (const model of getOpenRouterModels()) {
      const ai = await callOpenRouterNormalize(
        raw,
        model,
        apiKey,
        controller.signal
      );
      if (ai) return ai;
    }
    return local;
  } catch (err) {
    console.warn('OpenRouter industry normalize error:', err);
    return local;
  } finally {
    clearTimeout(timer);
  }
}

/** Lokale + KI-Normalisierung für Lead-Start und Funnel-2-Nachkorrektur */
export async function resolveIndustryNormalization(
  industryInput: string,
  acceptNormalized?: string
): Promise<IndustryNormalizeResult> {
  const raw = industryInput.trim();

  if (acceptNormalized && acceptNormalized.trim().length >= 2) {
    return {
      raw,
      normalized: acceptNormalized.trim(),
      confidence: 1,
      suggestions: [],
      blocked: false,
      needsConfirmation: false,
    };
  }

  let result = normalizeIndustry(raw);
  if (result.blocked) return result;

  const ai = await normalizeIndustryWithOpenRouter(raw);
  result = mergeIndustryNormalization(result, ai);

  if (industryCompareKey(result.raw) === industryCompareKey(result.normalized)) {
    const typoRetry = normalizeIndustry(raw);
    if (industryCompareKey(typoRetry.normalized) !== industryCompareKey(typoRetry.raw)) {
      result = typoRetry;
    }
  }

  return result;
}

/** OpenRouter-Ergebnis bevorzugen, sonst lokales Freitext-Ergebnis */
export function mergeIndustryNormalization(
  local: IndustryNormalizeResult,
  ai: IndustryNormalizeResult | null
): IndustryNormalizeResult {
  if (!ai || ai.blocked) return local;

  const aiChanged =
    industryCompareKey(ai.raw) !== industryCompareKey(ai.normalized);

  if (
    aiChanged &&
    ai.confidence >= 0.5 &&
    isPlausibleIndustryNormalization(ai.raw, ai.normalized)
  ) {
    return ai;
  }
  if (
    ai.confidence >= local.confidence &&
    isPlausibleIndustryNormalization(ai.raw, ai.normalized)
  ) {
    return ai;
  }
  return local;
}

// ─── Generische Branchen (Funnel-2 Präzisierung) ───────────────────────────

export const INDUSTRY_DETAIL_MIN_LENGTH = 8;

/** Normalisierte Bezeichnungen, die trotz Synonym-Mapping noch zu allgemein sind */
const GENERIC_NORMALIZED_LABELS = new Set([
  'handwerker',
  'handwerk',
  'dienstleister',
  'dienstleistung',
  'dienstleistungen',
  'gewerbe',
  'unternehmen',
  'firma',
  'betrieb',
  'beratung',
  'consulting',
  'handel',
  'einzelhandel',
  'service',
  'services',
  'freiberufler',
  'selbstaendig',
  'selbststaendig',
  'gewerbetreibender',
  'einzelunternehmen',
  'allgemein',
  'diverse',
  'verschiedenes',
  'sonstiges',
  'sonstige',
  'gewerbebetrieb',
  'dienstleistungsunternehmen',
]);

const GENERIC_INDUSTRY_TERMS = new Set([
  ...GENERIC_NORMALIZED_LABELS,
  'dienstleistungsbetrieb',
  'dienstleistungsfirma',
  'firmen',
  'betriebe',
  'unternehmer',
  'selbstandig',
  'selbständig',
  'freelancer',
  'agentur',
  'agenturen',
  'business',
  'gewerbe',
  'branche',
  'industrie',
  'wirtschaft',
  'verkauf',
  'handel',
  'online',
  'shop',
  'web',
  'internet',
  'it',
  'tech',
]);

const GENERIC_INDUSTRY_PATTERNS: RegExp[] = [
  /^(dienstleist|gewerbe|unternehmen|firmen?|betrieb|selbststaend|selbstaend|freiberuf)/i,
  /^(allgemein|sonstig|divers|verschied)/i,
];

/** Statische Vorschläge wenn OpenRouter nicht erreichbar */
const FALLBACK_SUGGESTIONS: Record<string, string[]> = {
  dienstleister: [
    'Gebäudereinigung',
    'IT-Support & EDV',
    'Steuerberatung',
    'Marketing-Agentur',
    'Handwerksmeister (Elektro)',
  ],
  dienstleistung: [
    'Gebäudereinigung',
    'Hausmeisterservice',
    'Buchhaltung',
    'Personalberatung',
    'Event-Service',
  ],
  handwerker: [
    'Elektriker',
    'Sanitär & Heizung',
    'Malerbetrieb',
    'Dachdecker',
    'Schreinerei',
  ],
  handwerk: [
    'Elektriker',
    'Malerbetrieb',
    'Schreinerei',
    'Metallbau',
    'Fliesenleger',
  ],
  gewerbe: [
    'Einzelhandel',
    'Gastronomie',
    'Handwerksbetrieb',
    'Dienstleister vor Ort',
    'Online-Shop',
  ],
  unternehmen: [
    'B2B-Dienstleister',
    'Produktion',
    'Einzelhandel',
    'Gastronomie',
    'Handwerk',
  ],
  firma: [
    'Beratung',
    'Handel',
    'Handwerk',
    'Gastronomie',
    'Dienstleistung vor Ort',
  ],
  betrieb: [
    'Handwerksbetrieb',
    'Gastronomie',
    'Einzelhandel',
    'Produktion',
    'Dienstleistung',
  ],
  beratung: [
    'Unternehmensberatung',
    'Steuerberatung',
    'IT-Beratung',
    'HR-Beratung',
    'Marketing-Beratung',
  ],
  handel: [
    'Einzelhandel',
    'Online-Shop',
    'Großhandel',
    'Autohandel',
    'Lebensmittelhandel',
  ],
  default: [
    'Gebäudereinigung',
    'Handwerksbetrieb',
    'Gastronomie',
    'Einzelhandel',
    'Online-Shop',
  ],
};

export const OPENROUTER_INDUSTRY_SUGGEST_PROMPT = `Du hilfst bei der Konkretisierung vager Branchenangaben für Webdesign-Analysen im DACH-Raum.

Sprache: Deutsch. Vorschläge als kurze Substantiv-Phrasen (2–4 Wörter), konkret und suchbar.

Regeln:
- Der Kunde hat einen ALLGEMEINEN Begriff genannt (z. B. Dienstleister, Handwerk, Firma).
- Liefere 4–5 plausible SPEZIFISCHE Unter-Branchen/Gewerke – keine einzelne „richtige“ Branche erfinden.
- Keine Duplikate, keine englischen Begriffe.

Antworte NUR mit JSON:
{"generic":true,"suggestions":["...","..."],"question":"Welche Dienstleistung bieten Sie konkret an?"}`;

export function hasValidIndustryDetail(detail: string | null | undefined): boolean {
  const t = detail?.trim() || '';
  return t.length >= INDUSTRY_DETAIL_MIN_LENGTH;
}

export function isGenericIndustry(
  normalized: string | null | undefined,
  raw?: string | null,
  detail?: string | null
): boolean {
  if (hasValidIndustryDetail(detail)) return false;

  const norm = (normalized || raw || '').trim();
  const rawInput = (raw || normalized || '').trim();
  if (!norm && !rawInput) return false;

  const normKey = industryCompareKey(norm);
  const rawKey = industryCompareKey(rawInput);

  for (const key of [normKey, rawKey]) {
    if (!key) continue;
    if (GENERIC_INDUSTRY_TERMS.has(key)) return true;
    if (GENERIC_NORMALIZED_LABELS.has(key)) return true;
    const synonymTarget = SYNONYMS[key];
    if (synonymTarget && GENERIC_NORMALIZED_LABELS.has(industryCompareKey(synonymTarget))) {
      return true;
    }
    for (const pattern of GENERIC_INDUSTRY_PATTERNS) {
      if (pattern.test(key)) return true;
    }
    const wordCount = key.split(' ').filter(Boolean).length;
    if (wordCount === 1 && key.length <= 14 && GENERIC_INDUSTRY_TERMS.has(key)) {
      return true;
    }
  }

  return false;
}

export function leadRequiresIndustryDetail(lead: {
  industry_normalized?: string | null;
  industry_raw?: string | null;
  industry_detail?: string | null;
}): boolean {
  return isGenericIndustry(
    lead.industry_normalized,
    lead.industry_raw,
    lead.industry_detail
  );
}

export function buildIndustryForResearch(
  normalized: string | null | undefined,
  detail: string | null | undefined,
  raw?: string | null
): string {
  const base = (normalized || raw || '').trim();
  const d = detail?.trim() || '';
  if (base && d) return `${base} – ${d}`;
  return d || base;
}

export function getFallbackIndustrySuggestions(
  normalized: string | null | undefined,
  raw?: string | null
): string[] {
  const keys = [
    industryCompareKey(normalized || ''),
    industryCompareKey(raw || ''),
  ].filter(Boolean);

  for (const key of keys) {
    if (FALLBACK_SUGGESTIONS[key]) return [...FALLBACK_SUGGESTIONS[key]];
    const synonym = SYNONYMS[key];
    if (synonym) {
      const synKey = industryCompareKey(synonym);
      if (FALLBACK_SUGGESTIONS[synKey]) return [...FALLBACK_SUGGESTIONS[synKey]];
    }
  }
  return [...FALLBACK_SUGGESTIONS.default];
}

export interface IndustrySuggestResult {
  generic: boolean;
  suggestions: string[];
  followUpQuestion: string;
  source: 'openrouter' | 'fallback' | 'local';
}

function parseSuggestJson(content: string): {
  generic?: boolean;
  suggestions?: string[];
  question?: string;
} | null {
  const stripped = content.replace(/```json\n?|\n?```/g, '').trim();
  const candidates = [stripped];
  const brace = stripped.match(/\{[\s\S]*\}/);
  if (brace) candidates.push(brace[0]);

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate) as {
        generic?: boolean;
        suggestions?: string[];
        question?: string;
      };
      if (Array.isArray(parsed.suggestions) && parsed.suggestions.length > 0) {
        return parsed;
      }
    } catch {
      /* next */
    }
  }
  return null;
}

export async function suggestIndustryDetails(
  industry: string,
  market?: string
): Promise<IndustrySuggestResult> {
  const raw = industry.trim();
  const localGeneric = isGenericIndustry(raw, raw);
  const fallback = getFallbackIndustrySuggestions(raw, raw);
  const defaultQuestion = 'Welche Leistung bieten Sie konkret an?';

  if (!localGeneric) {
    return {
      generic: false,
      suggestions: [],
      followUpQuestion: defaultQuestion,
      source: 'local',
    };
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return {
      generic: true,
      suggestions: fallback,
      followUpQuestion: defaultQuestion,
      source: 'fallback',
    };
  }

  const timeoutMs = parseInt(process.env.OPENROUTER_SUGGEST_TIMEOUT_MS || '5000', 10);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    for (const model of getOpenRouterModels()) {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer':
            process.env.WEBWELLE_PUBLIC_APP_URL ||
            process.env.NEXT_PUBLIC_APP_URL ||
            'https://webwelle.com',
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: OPENROUTER_INDUSTRY_SUGGEST_PROMPT },
            {
              role: 'user',
              content: `Vager Branchenbegriff: "${raw}"${market ? `\nMarkt: ${market}` : ''}`,
            },
          ],
          temperature: 0.3,
          max_tokens: 220,
        }),
      });

      if (!res.ok) continue;

      const data = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = data.choices?.[0]?.message?.content;
      if (!content) continue;

      const parsed = parseSuggestJson(content);
      if (!parsed?.suggestions?.length) continue;

      const suggestions = parsed.suggestions
        .map((s) => String(s).trim())
        .filter((s) => s.length >= 3 && s.length <= 80)
        .slice(0, 6);

      if (suggestions.length === 0) continue;

      return {
        generic: parsed.generic !== false,
        suggestions,
        followUpQuestion: parsed.question?.trim() || defaultQuestion,
        source: 'openrouter',
      };
    }
  } catch (err) {
    console.warn('OpenRouter industry suggest error:', err);
  } finally {
    clearTimeout(timer);
  }

  return {
    generic: true,
    suggestions: fallback,
    followUpQuestion: defaultQuestion,
    source: 'fallback',
  };
}
