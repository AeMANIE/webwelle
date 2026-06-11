export type LayoutMode = 'mobile' | 'desktop';

export type LayoutEnv = {
  cssWidth: number;
  cssHeight: number;
  coarsePointer: boolean;
  fineHover: boolean;
  segmentCount: number;
  supportsViewportSegments: boolean;
};

const PHONE_MAX_MIN_EDGE = 500;
const LARGE_TABLET_MIN_EDGE = 800;

const FOLD_COVER_MIN_SHORT = 360;
const FOLD_COVER_MAX_SHORT = 480;
const FOLD_COVER_MIN_LONG = 880;
const FOLD_COVER_MAX_LONG = 1000;

export function isFoldCoverPortrait(env: LayoutEnv): boolean {
  const { cssWidth, cssHeight, coarsePointer, segmentCount, supportsViewportSegments } = env;

  if (!supportsViewportSegments || segmentCount > 1 || !coarsePointer) {
    return false;
  }

  if (cssHeight <= cssWidth) {
    return false;
  }

  const shortEdge = cssWidth;
  const longEdge = cssHeight;

  return (
    shortEdge >= FOLD_COVER_MIN_SHORT &&
    shortEdge <= FOLD_COVER_MAX_SHORT &&
    longEdge >= FOLD_COVER_MIN_LONG &&
    longEdge <= FOLD_COVER_MAX_LONG
  );
}

export function isPhoneClass(env: LayoutEnv): boolean {
  const minEdge = Math.min(env.cssWidth, env.cssHeight);
  return minEdge <= PHONE_MAX_MIN_EDGE;
}

export function computeLayoutMode(env: LayoutEnv): LayoutMode {
  if (env.segmentCount > 1) {
    return 'mobile';
  }

  if (isFoldCoverPortrait(env)) {
    return 'desktop';
  }

  if (isPhoneClass(env)) {
    return 'mobile';
  }

  const minEdge = Math.min(env.cssWidth, env.cssHeight);
  if (minEdge >= LARGE_TABLET_MIN_EDGE) {
    return 'desktop';
  }

  if (env.fineHover && !env.coarsePointer) {
    return 'desktop';
  }

  return 'mobile';
}

export function shouldUseTouchGlow(env: LayoutEnv): boolean {
  return env.coarsePointer || !env.fineHover;
}

function getViewportSegmentCount(): number {
  if (typeof window === 'undefined') {
    return 1;
  }

  const visualViewport = window.visualViewport as (VisualViewport & {
    segments?: DOMRectReadOnly[];
  }) | null;
  const segments = visualViewport?.segments;
  if (segments && segments.length > 0) {
    return segments.length;
  }

  if (window.matchMedia('(horizontal-viewport-segments: 2)').matches) {
    return 2;
  }

  if (window.matchMedia('(vertical-viewport-segments: 2)').matches) {
    return 2;
  }

  return 1;
}

function supportsViewportSegmentsApi(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const visualViewport = window.visualViewport as VisualViewport & {
    segments?: DOMRectReadOnly[];
  };
  if (visualViewport && 'segments' in visualViewport) {
    return true;
  }

  try {
    return (
      window.matchMedia('(horizontal-viewport-segments: 1)').media !== 'not all' ||
      window.matchMedia('(vertical-viewport-segments: 1)').media !== 'not all'
    );
  } catch {
    return false;
  }
}

export function readLayoutEnv(): LayoutEnv {
  if (typeof window === 'undefined') {
    return {
      cssWidth: 390,
      cssHeight: 844,
      coarsePointer: true,
      fineHover: false,
      segmentCount: 1,
      supportsViewportSegments: false,
    };
  }

  return {
    cssWidth: window.innerWidth,
    cssHeight: window.innerHeight,
    coarsePointer: window.matchMedia('(pointer: coarse)').matches,
    fineHover: window.matchMedia('(hover: hover) and (pointer: fine)').matches,
    segmentCount: getViewportSegmentCount(),
    supportsViewportSegments: supportsViewportSegmentsApi(),
  };
}

export function getServicesGridClass(mode: LayoutMode | null, cssWidth: number): string {
  if (mode !== 'desktop') {
    return 'grid-cols-1';
  }

  if (cssWidth < 640) {
    return 'grid-cols-1';
  }

  if (cssWidth < 1024) {
    return 'grid-cols-2';
  }

  return 'grid-cols-3';
}
