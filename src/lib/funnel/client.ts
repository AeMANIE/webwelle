const TOKEN_COOKIE = 'wf_token';
const TOKEN_STORAGE = 'webwelle_funnel_token';

export function persistLeadToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_STORAGE, token);
  document.cookie = `${TOKEN_COOKIE}=${encodeURIComponent(token)}; path=/; max-age=${60 * 60 * 24 * 90}; SameSite=Lax`;
}

export function getStoredLeadToken(): string | null {
  if (typeof window === 'undefined') return null;
  const fromUrl = new URLSearchParams(window.location.search).get('t');
  if (fromUrl) return fromUrl;
  const fromStorage = localStorage.getItem(TOKEN_STORAGE);
  if (fromStorage) return fromStorage;
  const match = document.cookie.match(new RegExp(`(?:^|; )${TOKEN_COOKIE}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function funnelResumeUrl(token: string, step = 2): string {
  return `/funnel-${step}?t=${encodeURIComponent(token)}`;
}
