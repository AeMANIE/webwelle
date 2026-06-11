export function persistLeadToken(_token: string): void {
  // HttpOnly wf_token cookie is set server-side (middleware / API). No client storage.
}

export function getStoredLeadToken(): string | null {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get('t');
}

export function funnelResumeUrl(token: string, step = 2): string {
  return `/funnel-${step}?t=${encodeURIComponent(token)}`;
}
