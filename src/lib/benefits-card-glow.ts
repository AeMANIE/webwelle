/** Scroll-glow prefix: touch tablets need is-in-view at md+; phones keep max-md prefix. */
export function getBenefitsScrollGlowPrefix(touchGlow: boolean | null): string {
  return touchGlow ? '' : 'max-md:';
}

/** Hover glow only when pointer + fine hover (desktop mouse), not on touch tablets. */
export function shouldEnableBenefitsHoverGlow(touchGlow: boolean | null): boolean {
  return touchGlow === false;
}
