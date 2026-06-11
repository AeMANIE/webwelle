export const STARTERWELLE_ANCHOR_ID = 'starterwelle';
export const HOME_TOP_TARGET = 'top';
const SCROLL_TARGET_KEY = 'webwelle:scroll-target';

export function scrollToTop(behavior: ScrollBehavior = 'smooth'): void {
  if (typeof window === 'undefined') return;
  window.scrollTo({ top: 0, behavior });
}

export function navigateToHomeTop(): void {
  if (typeof window === 'undefined') return;

  if (window.location.pathname === '/') {
    window.history.replaceState(null, '', '/');
    scrollToTop('smooth');
    return;
  }

  sessionStorage.setItem(SCROLL_TARGET_KEY, HOME_TOP_TARGET);
  window.location.assign('/');
}

export function scrollToElementById(
  id: string,
  behavior: ScrollBehavior = 'smooth'
): boolean {
  const element = document.getElementById(id);
  if (!element) return false;
  element.scrollIntoView({ behavior, block: 'start' });
  return true;
}

export function scrollToStarterwelle(): void {
  scrollToElementById(STARTERWELLE_ANCHOR_ID);
}

export function navigateToStarterwelle(): void {
  if (typeof window === 'undefined') return;

  if (window.location.pathname === '/') {
    window.history.replaceState(null, '', `/#${STARTERWELLE_ANCHOR_ID}`);
    scrollToStarterwelle();
    return;
  }

  sessionStorage.setItem(SCROLL_TARGET_KEY, STARTERWELLE_ANCHOR_ID);
  window.location.assign(`/#${STARTERWELLE_ANCHOR_ID}`);
}

export function consumePendingScrollTarget(): string | null {
  if (typeof window === 'undefined') return null;
  const target = sessionStorage.getItem(SCROLL_TARGET_KEY);
  if (target) sessionStorage.removeItem(SCROLL_TARGET_KEY);
  return target;
}

export function scrollToAnchorWithRetry(
  id: string,
  behavior: ScrollBehavior = 'smooth',
  maxAttempts = 40,
  delayMs = 50
): void {
  let attempts = 0;

  const run = () => {
    if (scrollToElementById(id, behavior)) return;
    attempts += 1;
    if (attempts < maxAttempts) {
      window.setTimeout(run, delayMs);
    }
  };

  run();
}
