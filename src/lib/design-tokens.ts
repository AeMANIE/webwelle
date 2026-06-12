/**
 * WebWelle design tokens for contexts without CSS variables (e-mails, PDFs).
 * Keep in sync with src/app/globals.css :root.
 *
 * 3-Farben-Referenz (Homepage/Funnel unverändert lassen):
 *   background #0e141f | secondaryBlue #6699ff | brand (Lila) #8C36C9
 * Admin/Portal/E-Mails: brand. Marketing/Funnel: secondaryBlue (--info/--primary Ziel).
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
  brandBorder: 'rgba(140, 54, 201, 0.28)',
  brandBorderLight: 'rgba(140, 54, 201, 0.18)',
  brandShadow: 'rgba(140, 54, 201, 0.28)',
  cardGradient: `linear-gradient(180deg, #151d2b 0%, ${WW_COLORS.background} 100%)`,
} as const;
