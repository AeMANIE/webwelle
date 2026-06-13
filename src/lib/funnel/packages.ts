import type { DesignWishItem } from './design-wishes';

export type BlogMode = 'none' | 'bundle_10' | 'custom';

export interface FunnelAddonSelection {
  seoProfi: boolean;
  blogMode: BlogMode;
  blogCount: number;
  brandingSelected: boolean;
  animationSelected: boolean;
}

export interface FunnelDesignPreferences {
  includedItems: DesignWishItem[];
  optionalItems: DesignWishItem[];
  selectedOptionalIds: string[];
  parsedAt?: string;
  /** @deprecated Legacy static preference fields */
  interactiveElements?: string;
  informationDensity?: string;
  visualStyle?: string;
}

export const STARTERWELLE = {
  id: 'starterwelle' as const,
  name: 'StarterWelle',
  priceCents: 99900,
  compareAtPriceCents: 99900,
  stripePriceId: 'price_1ThumEJ8MIbotcdAuJdNM20L',
  termLabel: '24 Monate',
  features: [
    'Individuell gestaltete Onepage-Website für einen professionellen Unternehmensauftritt',
    'Inklusive Header, Footer und 3 Inhaltsbereichen für Unternehmen, Leistungen und Anfrage',
    'Optional mit Kontaktformular für direkte Kundenanfragen',
    'Inklusive 3 individuelle KI-Bilder',
    'Mit grundlegender SEO-Einrichtung für eine bessere Sichtbarkeit bei Google',
    'Impressum, Datenschutz und Cookie-Banner inklusive',
    'Hosting, Wartung, Domain (.de oder .com) und Backups inklusive',
  ],
};

export const SEO_PROFI_ADDON = {
  id: 'seo_profi',
  name: 'SEO Profi Zusatzpaket',
  priceCents: 29900,
  stripePriceId: 'price_1ThuqjJ8MIbotcdAodiU9DGS',
  description:
    'Professionelle SEO-Betreuung: Keyword-Strategie, OnPage-Optimierung und laufendes Monitoring für mehr Sichtbarkeit.',
};

export const BLOG_BUNDLE_10 = {
  id: 'blog_bundle_10',
  name: '10 Blog-Artikel Paket',
  priceCents: 49900,
  stripePriceId: 'price_1Thut7J8MIbotcdAvDGxBGTz',
  articleCount: 10,
  description:
    'Zehn SEO-optimierte Fachartikel für Ihre Branche – perfekt für mehr Reichweite und Vertrauen bei Google.',
};

export const BLOG_UNIT_PRICE_CENTS = 6999;
export const BLOG_MIN_COUNT = 5;

export const BRANDING_ADDON = {
  id: 'branding',
  name: 'Branding & Logo',
  priceCents: 19900,
  stripePriceId: 'price_1ThuueJ8MIbotcdAeReNxoO3',
  description:
    'Vier Logo-Entwürfe zur Auswahl – ideal, wenn Ihr Außenauftritt modernisiert oder professionell aufgebaut werden soll.',
};

export const ANIMATION_ADDON = {
  id: 'animation',
  name: 'Animationspaket',
  priceCents: 99900,
  stripePriceId: 'price_1ThuvnJ8MIbotcdASWwhyiVY',
  description:
    'Mehr Dynamik und visuelle Wirkung durch passende Animationen und Übergänge, abgestimmt auf Branche und Seitenaufbau.',
};

export const INTERACTIVE_ELEMENT_OPTIONS = [
  {
    id: 'subtle',
    label: 'Dezent',
    description: 'Leichte Hover-Effekte und sanfte Übergänge – seriös und zurückhaltend.',
  },
  {
    id: 'moderate',
    label: 'Moderat',
    description: 'Slider, Akkordeons und dezente Animationen für mehr Dynamik.',
  },
  {
    id: 'strong',
    label: 'Stark interaktiv',
    description: 'Auffällige Elemente, Micro-Interactions und bewegte Inhalte für maximale Aufmerksamkeit.',
  },
] as const;

export const INFORMATION_DENSITY_OPTIONS = [
  {
    id: 'compact',
    label: 'Kompakt',
    description: 'Wenig Text, klare Botschaften – ideal für schnelle Orientierung.',
  },
  {
    id: 'balanced',
    label: 'Ausgewogen',
    description: 'Gute Mischung aus Information und Übersichtlichkeit.',
  },
  {
    id: 'detailed',
    label: 'Ausführlich',
    description: 'Mehr Inhalt und Details für fundierte Kaufentscheidungen.',
  },
] as const;

export const VISUAL_STYLE_OPTIONS = [
  {
    id: 'minimal',
    label: 'Minimal',
    description: 'Viel Weißraum, klare Linien, reduzierte Farbpalette.',
  },
  {
    id: 'modern',
    label: 'Klassisch-modern',
    description: 'Zeitgemäßes Design mit ausgewogener Typografie und Farbakzenten.',
  },
  {
    id: 'visual',
    label: 'Bildstark',
    description: 'Große Bilder, visuelle Storytelling-Elemente und emotionale Wirkung.',
  },
] as const;

export function normalizeAddonSelection(raw: unknown): FunnelAddonSelection {
  const obj = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const blogMode =
    obj.blogMode === 'bundle_10' || obj.blogMode === 'custom' ? obj.blogMode : 'none';
  const blogCount = Math.max(
    BLOG_MIN_COUNT,
    Math.min(50, Number(obj.blogCount) || BLOG_MIN_COUNT)
  );

  return {
    seoProfi: Boolean(obj.seoProfi),
    blogMode,
    blogCount,
    brandingSelected: Boolean(obj.brandingSelected),
    animationSelected: Boolean(obj.animationSelected),
  };
}

function normalizeDesignWishItem(raw: unknown): DesignWishItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  const id = String(obj.id || '').trim();
  const label = String(obj.label || '').trim();
  const tier =
    obj.tier === 'optional' ? 'optional' : obj.tier === 'included' ? 'included' : null;
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

export function normalizeDesignPreferences(raw: unknown): FunnelDesignPreferences {
  const obj = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};

  const includedItems = Array.isArray(obj.includedItems)
    ? obj.includedItems.map(normalizeDesignWishItem).filter((i): i is DesignWishItem => Boolean(i))
    : [];

  const optionalItems = Array.isArray(obj.optionalItems)
    ? obj.optionalItems.map(normalizeDesignWishItem).filter((i): i is DesignWishItem => Boolean(i))
    : [];

  const selectedOptionalIds = Array.isArray(obj.selectedOptionalIds)
    ? obj.selectedOptionalIds.map((id) => String(id)).filter(Boolean)
    : [];

  return {
    includedItems,
    optionalItems,
    selectedOptionalIds,
    parsedAt: typeof obj.parsedAt === 'string' ? obj.parsedAt : undefined,
    interactiveElements:
      typeof obj.interactiveElements === 'string' ? obj.interactiveElements : undefined,
    informationDensity:
      typeof obj.informationDensity === 'string' ? obj.informationDensity : undefined,
    visualStyle: typeof obj.visualStyle === 'string' ? obj.visualStyle : undefined,
  };
}

export function hasDesignWishSelection(prefs: FunnelDesignPreferences): boolean {
  return prefs.includedItems.length > 0 || prefs.selectedOptionalIds.length > 0;
}

export function hasBlogSelection(selection: FunnelAddonSelection): boolean {
  return selection.blogMode === 'bundle_10' || selection.blogMode === 'custom';
}

export function effectiveSeoProfi(selection: FunnelAddonSelection): boolean {
  return selection.seoProfi;
}

export interface OfferLineItem {
  label: string;
  description?: string;
  amountCents: number;
}

export interface FunnelOfferBreakdown {
  items: OfferLineItem[];
  subtotalCents: number;
}

export function listSelectedPackageLabels(
  selection?: FunnelAddonSelection | null
): string[] {
  const normalized = normalizeAddonSelection(selection);
  const labels: string[] = [STARTERWELLE.name];

  if (normalized.seoProfi) {
    labels.push(SEO_PROFI_ADDON.name);
  }

  if (normalized.blogMode === 'bundle_10') {
    labels.push(BLOG_BUNDLE_10.name);
  } else if (normalized.blogMode === 'custom') {
    labels.push(`Blog-Artikel (${normalized.blogCount}×)`);
  }

  if (normalized.brandingSelected) {
    labels.push(BRANDING_ADDON.name);
  }

  if (normalized.animationSelected) {
    labels.push(ANIMATION_ADDON.name);
  }

  return labels;
}

export function calculateFunnelOfferTotal(
  selection?: FunnelAddonSelection | null
): FunnelOfferBreakdown {
  const normalized = normalizeAddonSelection(selection);
  const items: OfferLineItem[] = [
    {
      label: STARTERWELLE.name,
      description: `Onepage-Website · ${STARTERWELLE.termLabel}`,
      amountCents: STARTERWELLE.priceCents,
    },
  ];

  if (normalized.blogMode === 'bundle_10') {
    items.push({
      label: BLOG_BUNDLE_10.name,
      description: `${BLOG_BUNDLE_10.articleCount} SEO-optimierte Fachartikel`,
      amountCents: BLOG_BUNDLE_10.priceCents,
    });
  } else if (normalized.blogMode === 'custom') {
    items.push({
      label: `Blog-Artikel (${normalized.blogCount}×)`,
      description: `à ${formatEuro(BLOG_UNIT_PRICE_CENTS)}`,
      amountCents: normalized.blogCount * BLOG_UNIT_PRICE_CENTS,
    });
  }

  if (normalized.seoProfi) {
    items.push({
      label: SEO_PROFI_ADDON.name,
      amountCents: SEO_PROFI_ADDON.priceCents,
    });
  }

  if (normalized.brandingSelected) {
    items.push({
      label: BRANDING_ADDON.name,
      amountCents: BRANDING_ADDON.priceCents,
    });
  }

  if (normalized.animationSelected) {
    items.push({
      label: ANIMATION_ADDON.name,
      amountCents: ANIMATION_ADDON.priceCents,
    });
  }

  const subtotalCents = items.reduce((sum, item) => sum + item.amountCents, 0);

  return {
    items,
    subtotalCents,
  };
}

export function formatEuro(cents: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100);
}

export function labelForPreference(
  options: ReadonlyArray<{ id: string; label: string }>,
  id?: string
): string {
  if (!id) return '–';
  return options.find((o) => o.id === id)?.label || id;
}
