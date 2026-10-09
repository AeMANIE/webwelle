const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Self-hosted Umami (VPS) — Domain nach Umzug von statistik.webpfad.de */
const DEFAULT_UMAMI_SCRIPT_URL = 'https://analytics.webwelle.com/script.js';
const DEFAULT_UMAMI_WEBSITE_ID = '52d93104-c986-4810-ae8c-7981797b1001';
const LEGACY_UMAMI_ORIGIN = 'https://statistik.webpfad.de';

export function getUmamiConfig() {
  let scriptUrl =
    process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL?.trim() || DEFAULT_UMAMI_SCRIPT_URL;
  // Alte Domain aus Coolify/Env auf die neue Analytics-Domain umleiten
  if (scriptUrl.startsWith(LEGACY_UMAMI_ORIGIN)) {
    scriptUrl = DEFAULT_UMAMI_SCRIPT_URL;
  }

  const websiteId =
    process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID?.trim() || DEFAULT_UMAMI_WEBSITE_ID;

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
