const REQUIRED_WORKFLOWS = [
  'industry_questions',
  'seo_keywords',
  'competitor_design',
] as const;

const TERMINAL_STATUSES = new Set(['done', 'error']);

export type FunnelResearchItem = {
  workflow_key: string;
  status: string;
};

function isTerminal(status: string): boolean {
  return TERMINAL_STATUSES.has(status);
}

/**
 * Polling kann stoppen, wenn die Kern-Workflows fertig sind und
 * site_performance (falls gestartet) ebenfalls abgeschlossen ist.
 */
export function isFunnelResearchComplete(
  research: FunnelResearchItem[] | undefined | null
): boolean {
  if (!research?.length) return false;

  const byKey = new Map(research.map((item) => [item.workflow_key, item]));

  for (const key of REQUIRED_WORKFLOWS) {
    const item = byKey.get(key);
    if (!item || !isTerminal(item.status)) return false;
  }

  const performance = byKey.get('site_performance');
  if (performance && !isTerminal(performance.status)) return false;

  return true;
}
