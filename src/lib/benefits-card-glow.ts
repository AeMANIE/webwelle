import { computeScrollActiveIndexFromRects, type CardRect } from './services-scroll-glow';

/** Pick the single benefit card closest to the viewport center (exclusive scroll glow). */
export function computeBenefitsScrollActiveIndex(
  cards: Map<number, HTMLElement>,
  section: HTMLElement,
  viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 0,
  viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 0
): number | null {
  const sectionRect = section.getBoundingClientRect();
  const cardRects: CardRect[] = [];

  for (const [index, el] of cards.entries()) {
    const rect = el.getBoundingClientRect();
    cardRects.push({
      index,
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    });
  }

  return computeScrollActiveIndexFromRects(
    cardRects,
    viewportWidth,
    viewportHeight,
    sectionRect.top,
    sectionRect.bottom,
    1
  );
}

/** Touch scroll/tap glow at all breakpoints — full literals for Tailwind scanner. */
export const BENEFITS_TOUCH_SCROLL_CARD_GLOW =
  'group-[.is-in-view]:border-primary/40 group-[.is-in-view]:shadow-lg group-[.is-in-view]:shadow-primary/5 group-[.is-tapped]:border-primary/40 group-[.is-tapped]:shadow-lg group-[.is-tapped]:shadow-primary/5';

export const BENEFITS_TOUCH_SCROLL_BAR_GLOW =
  'group-[.is-in-view]:w-1.5 group-[.is-in-view]:bg-primary group-[.is-tapped]:w-1.5 group-[.is-tapped]:bg-primary';

export const BENEFITS_TOUCH_SCROLL_ICON_GLOW =
  'group-[.is-in-view]:scale-105 group-[.is-tapped]:scale-105';

/** Desktop pointer: scroll glow on phone widths only; md+ uses hover. */
export const BENEFITS_DESKTOP_SCROLL_CARD_GLOW =
  'max-md:group-[.is-in-view]:border-primary/40 max-md:group-[.is-in-view]:shadow-lg max-md:group-[.is-in-view]:shadow-primary/5';

export const BENEFITS_DESKTOP_SCROLL_BAR_GLOW =
  'max-md:group-[.is-in-view]:w-1.5 max-md:group-[.is-in-view]:bg-primary';

export const BENEFITS_DESKTOP_SCROLL_ICON_GLOW =
  'max-md:group-[.is-in-view]:scale-105';

export const BENEFITS_DESKTOP_HOVER_CARD_GLOW =
  'md:hover:border-primary/40 md:hover:shadow-lg md:hover:shadow-primary/5';

export const BENEFITS_DESKTOP_HOVER_BAR_GLOW =
  'md:group-hover:w-1.5 md:group-hover:bg-primary';

export const BENEFITS_DESKTOP_HOVER_ICON_GLOW = 'md:group-hover:scale-105';

export type BenefitsGlowClasses = {
  card: string;
  bar: string;
  icon: string;
};

/** Scroll-based glow: touch devices at all breakpoints; desktop keeps max-md scroll fallback. */
export function getBenefitsScrollGlowClasses(touchGlow: boolean | null): BenefitsGlowClasses {
  if (touchGlow) {
    return {
      card: BENEFITS_TOUCH_SCROLL_CARD_GLOW,
      bar: BENEFITS_TOUCH_SCROLL_BAR_GLOW,
      icon: BENEFITS_TOUCH_SCROLL_ICON_GLOW,
    };
  }

  return {
    card: BENEFITS_DESKTOP_SCROLL_CARD_GLOW,
    bar: BENEFITS_DESKTOP_SCROLL_BAR_GLOW,
    icon: BENEFITS_DESKTOP_SCROLL_ICON_GLOW,
  };
}

/** Hover glow only when pointer + fine hover (desktop mouse), not on touch tablets. */
export function getBenefitsHoverGlowClasses(touchGlow: boolean | null): BenefitsGlowClasses {
  if (touchGlow === false) {
    return {
      card: BENEFITS_DESKTOP_HOVER_CARD_GLOW,
      bar: BENEFITS_DESKTOP_HOVER_BAR_GLOW,
      icon: BENEFITS_DESKTOP_HOVER_ICON_GLOW,
    };
  }

  return { card: '', bar: '', icon: '' };
}

/** @deprecated Use getBenefitsScrollGlowClasses — kept for tests migrating prefix logic. */
export function getBenefitsScrollGlowPrefix(touchGlow: boolean | null): string {
  return touchGlow ? '' : 'max-md:';
}

/** @deprecated Use getBenefitsHoverGlowClasses */
export function shouldEnableBenefitsHoverGlow(touchGlow: boolean | null): boolean {
  return touchGlow === false;
}
