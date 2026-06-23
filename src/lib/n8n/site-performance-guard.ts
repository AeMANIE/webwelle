type ResearchSnapshot = {
  workflow_key: string;
  status: string;
  payload: unknown;
};

/** True when site_performance was already dispatched or has callback data. */
export function sitePerformanceAlreadyStarted(research: ResearchSnapshot[]): boolean {
  const perf = research.find((row) => row.workflow_key === 'site_performance');
  if (!perf) return false;
  if (perf.status === 'done') return true;

  const payload =
    perf.payload && typeof perf.payload === 'object'
      ? (perf.payload as Record<string, unknown>)
      : {};
  const receivedSites = Number(payload.receivedSites || 0);
  if (receivedSites > 0) return true;
  if (perf.status === 'pending' && payload.dispatched === true) return true;

  return false;
}
