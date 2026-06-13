import { TARGET_WEBSITES } from './analysis-types';

const TECHNICAL_ERROR_PATTERN =
  /request failed|status code \d+|ECONNREFUSED|ETIMEDOUT|invalid json|fetch failed/i;

export function clampDesignScore(score: number | null | undefined): number | null {
  if (score == null || Number.isNaN(score)) return null;
  return Math.min(5, Math.max(0, score));
}

export function clampReceivedSites(count: number, target = TARGET_WEBSITES): number {
  if (!Number.isFinite(count) || count < 0) return 0;
  return Math.min(target, Math.round(count));
}

export function sanitizeCustomerErrorMessage(raw: unknown): string | null {
  if (typeof raw !== 'string' || !raw.trim()) return null;
  if (TECHNICAL_ERROR_PATTERN.test(raw)) {
    return 'Für diese Website konnten derzeit nicht alle Werte geladen werden.';
  }
  return raw.trim();
}

export function customerFeatureLabel(raw: string): string {
  const key = raw.toLowerCase().trim();
  const map: Record<string, string> = {
    'responsive design': 'Gute Darstellung auf Mobilgeräten und Desktop',
    kontaktformular: 'Einfache Kontaktmöglichkeit für neue Anfragen',
    'blog/artikelbereich': 'Artikelbereich für Sichtbarkeit und Vertrauen',
    'terminbuchungssystem': 'Online-Terminbuchung auf Wunsch',
    suchmaschinenoptimierung: 'Solide Basis für bessere Auffindbarkeit bei Google',
    seo: 'Solide Basis für bessere Auffindbarkeit bei Google',
  };
  return map[key] || raw;
}
