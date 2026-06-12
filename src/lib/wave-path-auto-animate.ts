import { isPhoneClass, shouldUseTouchGlow, type LayoutEnv } from './responsive-layout-mode';

/** Scroll-triggered wave for tablet / touch laptop; phones use explicit autoAnimateOnVisible. */
export function shouldAutoAnimateWaveOnScroll(env: LayoutEnv): boolean {
  return shouldUseTouchGlow(env) && !isPhoneClass(env);
}

/** Desktop workflow timeline only when wide viewport and fine pointer + hover. */
export function shouldUseDesktopWorkflowTimeline(
  cssWidth: number,
  touchGlow: boolean | null,
  lgBreakpoint = 1024,
): boolean {
  if (cssWidth < lgBreakpoint) return false;
  if (touchGlow === null) return true;
  return touchGlow === false;
}
