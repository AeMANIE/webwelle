/**
 * WebWelle design tokens for contexts without CSS variables (e-mails, PDFs).
 * Keep in sync with src/app/globals.css :root.
 *
 * 3-Farben-Hierarchie (Homepage/Funnel unverändert lassen):
 *   1 background #0e141f
 *   2 primary/secondaryBlue #6699ff – Links, sekundäre Akzente, Info
 *   3 brand #8C36C9 – primäre CTAs, wichtigste Highlights (sparsam)
 */
export const WW_COLORS = {
  background: '#0e141f',
  foreground: '#ffffff',
  card: '#1a2332',
  border: '#374151',
  muted: '#2a3441',
  mutedForeground: '#a0a0a0',
  /** Hellblau – Glow-Anfang; Marketing/Funnel (--primary in globals.css) */
  secondaryBlue: '#6699ff',
  primary: '#6699ff',
  primaryForeground: '#0e141f',
  /** Dunkles Lila – Admin, Portal, E-Mail-CTAs */
  brand: '#8C36C9',
  brandForeground: '#0e141f',
  brandMuted: 'rgba(140, 54, 201, 0.18)',
  glowBackdrop: '#1d1d34',
  success: '#10b981',
  warning: '#f59e0b',
  info: '#6699ff',
  destructive: '#ef4444',
} as const;

export type WwColorKey = keyof typeof WW_COLORS;

/** Inline-HTML-Helfer für E-Mails (kein CSS-Var-Support in Clients) */
export const WW_EMAIL = {
  primaryBorder: 'rgba(102, 153, 255, 0.28)',
  primaryBorderLight: 'rgba(102, 153, 255, 0.18)',
  brandBorder: 'rgba(140, 54, 201, 0.28)',
  brandBorderLight: 'rgba(140, 54, 201, 0.18)',
  brandShadow: 'rgba(140, 54, 201, 0.28)',
  cardGradient: `linear-gradient(180deg, #151d2b 0%, ${WW_COLORS.background} 100%)`,
} as const;

/** Helles E-Mail-Layout – lesbar in iOS Light/Dark Mode (keine Client-Inversion) */
export const WW_EMAIL_LIGHT = {
  pageBg: '#f1f5f9',
  cardBg: '#ffffff',
  heading: '#0e141f',
  body: '#334155',
  muted: '#64748b',
  border: '#e2e8f0',
  panelBg: '#f8fafc',
  primary: '#6699ff',
  brand: '#8C36C9',
  brandText: '#ffffff',
  infoBg: '#eff6ff',
  infoBorder: '#bfdbfe',
  brandTintBg: '#f5f0fa',
  brandTintBorder: '#e9d5ff',
} as const;
