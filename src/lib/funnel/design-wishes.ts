export type DesignWishTier = 'included' | 'optional';
export type DesignWishSource = 'recommendation' | 'summary';

export interface DesignWishItem {
  id: string;
  label: string;
  description?: string;
  tier: DesignWishTier;
  sourceSnippet?: string;
  source?: DesignWishSource;
}

export interface ResolvedDesignWishes {
  included: DesignWishItem[];
  optional: DesignWishItem[];
  fromStructuredPayload: boolean;
}

interface CatalogEntry {
  id: string;
  label: string;
  description: string;
  tier: DesignWishTier;
  keywords: string[];
}

export const DESIGN_FEATURE_CATALOG: CatalogEntry[] = [
  {
    id: 'navigation',
    label: 'Klare Navigation',
    description: 'Übersichtliche Menüführung und Struktur für schnelle Orientierung.',
    tier: 'included',
    keywords: ['navigation', 'navigieren', 'menü', 'menu', 'struktur', 'orientierung'],
  },
  {
    id: 'colors',
    label: 'Farben & Farbpalette',
    description: 'Individuell abgestimmte Farben passend zu Ihrer Branche.',
    tier: 'included',
    keywords: ['farben', 'farbe', 'farbpalette', 'farbgebung', 'farbakzent'],
  },
  {
    id: 'typography',
    label: 'Schriftarten & Typografie',
    description: 'Professionelle Schriftwahl für Lesbarkeit und Markenwirkung.',
    tier: 'included',
    keywords: ['schriftarten', 'schriftart', 'typografie', 'schrift', 'fonts'],
  },
  {
    id: 'responsive',
    label: 'Responsive Gestaltung',
    description: 'Optimierte Darstellung auf Smartphone, Tablet und Desktop.',
    tier: 'included',
    keywords: ['responsive', 'mobil', 'mobile', 'smartphone', 'tablet', 'geräte'],
  },
  {
    id: 'layout',
    label: 'Modernes Onepage-Layout',
    description: 'Header, Footer und strukturierte Inhaltsbereiche.',
    tier: 'included',
    keywords: ['layout', 'onepage', 'gestaltung', 'design', 'auftritt', 'website'],
  },
  {
    id: 'legal',
    label: 'Rechtliches Basispaket',
    description: 'Impressum, Datenschutz und Cookie-Banner inklusive.',
    tier: 'included',
    keywords: ['impressum', 'datenschutz', 'cookie', 'rechtlich', 'dsgvo'],
  },
  {
    id: 'hosting',
    label: 'Hosting & Wartung',
    description: '2 Jahre Hosting, Wartung, Backup und Domain inklusive.',
    tier: 'included',
    keywords: ['hosting', 'wartung', 'backup', 'domain'],
  },
  {
    id: 'animations',
    label: 'Animationen & Übergänge',
    description: 'Dezente oder auffällige Bewegungen für mehr Dynamik.',
    tier: 'optional',
    keywords: [
      'animationen',
      'animation',
      'animiert',
      'übergänge',
      'übergang',
      'bewegung',
      'bewegte',
    ],
  },
  {
    id: 'interactive',
    label: 'Interaktive Elemente',
    description: 'Slider, Akkordeons, Hover-Effekte und Micro-Interactions.',
    tier: 'optional',
    keywords: [
      'interaktiv',
      'interaktive elemente',
      'slider',
      'akkordeon',
      'micro-interaction',
      'hover',
    ],
  },
  {
    id: 'contact_form',
    label: 'Kontaktformular',
    description: 'Direkte Anfragen über Ihre Website – optional integrierbar.',
    tier: 'optional',
    keywords: ['kontaktformular', 'kontakt-formular', 'anfrageformular'],
  },
  {
    id: 'visual_storytelling',
    label: 'Bildstarkes Design',
    description: 'Große Bilder und visuelles Storytelling für emotionale Wirkung.',
    tier: 'optional',
    keywords: ['bildstark', 'bilder', 'fotos', 'storytelling', 'hero-bild', 'galerie'],
  },
  {
    id: 'ux',
    label: 'Verbesserte Benutzererfahrung',
    description: 'UX-Optimierungen für bessere Nutzerführung und Conversion.',
    tier: 'optional',
    keywords: [
      'benutzererfahrung',
      'nutzererfahrung',
      'user experience',
      'conversion',
    ],
  },
];

export const STARTERWELLE_FALLBACK_WISHES: DesignWishItem[] = [
  {
    id: 'layout',
    label: 'Individuell gestaltete Onepage-Website',
    description: 'Header, Footer und 3 Inhaltsbereiche.',
    tier: 'included',
  },
  {
    id: 'colors',
    label: 'Farben & Farbpalette',
    description: 'Individuell abgestimmt auf Ihre Marke.',
    tier: 'included',
  },
  {
    id: 'typography',
    label: 'Schriftarten & Typografie',
    description: 'Professionelle Schriftwahl inklusive.',
    tier: 'included',
  },
  {
    id: 'responsive',
    label: 'Responsive Gestaltung',
    description: 'Optimiert für alle Endgeräte.',
    tier: 'included',
  },
  {
    id: 'legal',
    label: 'Rechtliches Basispaket',
    description: 'Impressum, Datenschutz, Cookie-Banner.',
    tier: 'included',
  },
  {
    id: 'hosting',
    label: 'Hosting & Wartung',
    description: '2 Jahre inklusive, Backup alle 2 Wochen, Domain.',
    tier: 'included',
  },
];

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function findSnippet(text: string, keyword: string): string | undefined {
  const normalized = normalizeText(text);
  const keywordNorm = normalizeText(keyword);
  const idx = normalized.indexOf(keywordNorm);
  if (idx === -1) return undefined;

  const sentences = splitSentences(text);
  for (const sentence of sentences) {
    if (normalizeText(sentence).includes(keywordNorm)) {
      return sentence.length > 160 ? `${sentence.slice(0, 157)}…` : sentence;
    }
  }

  const start = Math.max(0, idx - 40);
  const end = Math.min(text.length, idx + keyword.length + 80);
  const fragment = text.slice(start, end).trim();
  return fragment.length > 160 ? `${fragment.slice(0, 157)}…` : fragment;
}

function detectSource(
  recommendation: string,
  summary: string,
  keyword: string
): DesignWishSource | undefined {
  const rec = normalizeText(recommendation);
  const sum = normalizeText(summary);
  const kw = normalizeText(keyword);
  const inRec = rec.includes(kw);
  const inSum = sum.includes(kw);
  if (inRec && !inSum) return 'recommendation';
  if (inSum && !inRec) return 'summary';
  if (inRec || inSum) return 'recommendation';
  return undefined;
}

function catalogEntryToItem(
  entry: CatalogEntry,
  combinedText: string,
  recommendation: string,
  summary: string,
  matchedKeyword: string
): DesignWishItem {
  return {
    id: entry.id,
    label: entry.label,
    description: entry.description,
    tier: entry.tier,
    sourceSnippet: findSnippet(combinedText, matchedKeyword),
    source: detectSource(recommendation, summary, matchedKeyword),
  };
}

export function parseDesignWishesFromText(
  recommendation: string,
  summary: string
): ResolvedDesignWishes {
  const combined = `${recommendation}\n${summary}`.trim();
  const normalizedCombined = normalizeText(combined);
  const found = new Map<string, DesignWishItem>();

  for (const entry of DESIGN_FEATURE_CATALOG) {
    for (const keyword of entry.keywords) {
      const kw = normalizeText(keyword);
      if (normalizedCombined.includes(kw)) {
        if (!found.has(entry.id)) {
          found.set(
            entry.id,
            catalogEntryToItem(entry, combined, recommendation, summary, keyword)
          );
        }
        break;
      }
    }
  }

  const items = Array.from(found.values());
  return {
    included: items.filter((i) => i.tier === 'included'),
    optional: items.filter((i) => i.tier === 'optional'),
    fromStructuredPayload: false,
  };
}

function normalizeStructuredItem(raw: unknown): DesignWishItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  const id = String(obj.id || '').trim();
  const label = String(obj.label || '').trim();
  const tier = obj.tier === 'optional' ? 'optional' : obj.tier === 'included' ? 'included' : null;
  if (!id || !label || !tier) return null;

  const source =
    obj.source === 'recommendation' || obj.source === 'summary' ? obj.source : undefined;

  return {
    id,
    label,
    description: typeof obj.description === 'string' ? obj.description : undefined,
    tier,
    sourceSnippet: typeof obj.sourceSnippet === 'string' ? obj.sourceSnippet : undefined,
    source,
  };
}

function parseStructuredItems(payload: Record<string, unknown>): DesignWishItem[] {
  const raw = payload.designWishItems;
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizeStructuredItem).filter((item): item is DesignWishItem => Boolean(item));
}

export function resolveDesignWishes(payload: Record<string, unknown>): ResolvedDesignWishes {
  const structured = parseStructuredItems(payload);
  if (structured.length > 0) {
    return {
      included: structured.filter((i) => i.tier === 'included'),
      optional: structured.filter((i) => i.tier === 'optional'),
      fromStructuredPayload: true,
    };
  }

  const recommendation =
    typeof payload.recommendation === 'string' ? payload.recommendation : '';
  const summary = typeof payload.summary === 'string' ? payload.summary : '';

  if (!recommendation.trim() && !summary.trim()) {
    return {
      included: STARTERWELLE_FALLBACK_WISHES,
      optional: [],
      fromStructuredPayload: false,
    };
  }

  const parsed = parseDesignWishesFromText(recommendation, summary);
  if (parsed.included.length === 0 && parsed.optional.length === 0) {
    return {
      included: STARTERWELLE_FALLBACK_WISHES,
      optional: [],
      fromStructuredPayload: false,
    };
  }

  return parsed;
}

export function getSelectedOptionalItems(
  optionalItems: DesignWishItem[],
  selectedOptionalIds: string[]
): DesignWishItem[] {
  const idSet = new Set(selectedOptionalIds);
  return optionalItems.filter((item) => idSet.has(item.id));
}
