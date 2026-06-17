import type { DwaSolutionItem } from './types';

export const PROJECT_BRIEF_MIN_LENGTH = 20;

/** Static fallback when n8n project_solutions is pending or unavailable */
export const DWA_SOLUTION_CATALOG: DwaSolutionItem[] = [
  {
    id: 'multilingual',
    title: 'Mehrsprachige Umsetzung',
    description:
      'Internationale Websites mit sauber strukturierten Sprachversionen und konsistenter Nutzerführung.',
  },
  {
    id: 'large_website',
    title: 'Größere Websiteprojekte',
    description:
      'Mehrstufige Auftritte mit vielen Seiten, Bereichen oder unterschiedlichen Nutzerrollen.',
  },
  {
    id: 'forms_booking',
    title: 'Spezielle Formulare & Buchungssysteme',
    description:
      'Individuelle Eingabemasken, Terminbuchung und Anfragekonfiguratoren für Ihre Prozesse.',
  },
  {
    id: 'crm',
    title: 'CRM-Anbindung',
    description:
      'Verbindung zu bestehenden CRM-Systemen für strukturierte Kundendaten und saubere Übergaben.',
  },
  {
    id: 'automation',
    title: 'Komplexe Automatisierungen',
    description:
      'Mehrstufige Workflows mit externen Systemen, APIs und abgestimmten Prozessen.',
  },
  {
    id: 'seo',
    title: 'SEO-Betreuung',
    description:
      'Technische und inhaltliche Suchmaschinenoptimierung – laufend oder projektbezogen.',
  },
  {
    id: 'content',
    title: 'Bild- & Contentpakete',
    description:
      'Individuelle Fotografie, Texterstellung oder redaktionelle Begleitung für Ihren Auftritt.',
  },
  {
    id: 'ux',
    title: 'UX- & Interaktionskonzepte',
    description:
      'Durchdachte Nutzererlebnisse für komplexe Produkte, Portale oder Plattformen.',
  },
];

export function normalizeDwaSolutions(value: unknown): DwaSolutionItem[] {
  if (!value || typeof value !== 'object') return [];
  const raw = value as Record<string, unknown>;
  const list = raw.solutions ?? raw.items;
  if (!Array.isArray(list)) return [];

  return list.reduce<DwaSolutionItem[]>((acc, item) => {
    if (!item || typeof item !== 'object') return acc;
    const row = item as Record<string, unknown>;
    const id = String(row.id || '').trim();
    const title = String(row.title || row.name || '').trim();
    const description = String(row.description || '').trim();
    if (!id || !title) return acc;
    acc.push({
      id,
      title,
      description: description || title,
      recommended: row.recommended === true,
    });
    return acc;
  }, []);
}

export function defaultSelectedSolutionIds(solutions: DwaSolutionItem[]): string[] {
  const recommended = solutions.filter((s) => s.recommended).map((s) => s.id);
  if (recommended.length > 0) return recommended;
  return solutions.slice(0, 3).map((s) => s.id);
}
