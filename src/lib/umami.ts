const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function getUmamiConfig() {
  const scriptUrl = process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL?.trim();
  const websiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID?.trim();

  if (!scriptUrl || !websiteId || !UUID_REGEX.test(websiteId)) {
    return null;
  }

  try {
    const parsed = new URL(scriptUrl);
    if (parsed.protocol !== 'https:') {
      return null;
    }
    if (!parsed.pathname.endsWith('/script.js')) {
      return null;
    }

    return {
      scriptUrl: parsed.toString(),
      websiteId,
      origin: parsed.origin,
    };
  } catch {
    return null;
  }
}

export const UMAMI_CONSENT_EVENT = 'cookie-consent-updated';

export function hasStatisticsConsent(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      return false;
    }

    const settings = JSON.parse(consent) as { statistics?: boolean };
    return settings.statistics === true;
  } catch {
    return false;
  }
}

export function isUmamiTrackingPath(pathname: string): boolean {
  const excludedPrefixes = ['/admin', '/customer'];
  return !excludedPrefixes.some((prefix) => pathname.startsWith(prefix));
}
