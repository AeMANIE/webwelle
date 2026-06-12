export type CardRect = {
  index: number;
  top: number;
  left: number;
  width: number;
  height: number;
};

export function computeScrollActiveIndexFromRects(
  cards: CardRect[],
  viewportWidth: number,
  viewportHeight: number,
  sectionTop: number,
  sectionBottom: number
): number | null {
  if (sectionBottom < 0 || sectionTop > viewportHeight) {
    return null;
  }

  const viewportCenterX = viewportWidth / 2;
  const viewportCenterY = viewportHeight / 2;

  let activeIndex: number | null = null;
  let minDistSq = Infinity;

  const sorted = [...cards].sort((a, b) => a.index - b.index);

  for (const card of sorted) {
    const { index, top, left, width, height } = card;
    const visible = top + height > 0 && top < viewportHeight;
    if (!visible) continue;

    const centerX = left + width / 2;
    const centerY = top + height / 2;
    const dx = centerX - viewportCenterX;
    const dy = centerY - viewportCenterY;
    const distSq = dx * dx + dy * dy;

    if (distSq < minDistSq) {
      minDistSq = distSq;
      activeIndex = index;
    }
  }

  return activeIndex;
}

export function computeScrollActiveIndex(
  cards: Map<number, HTMLElement>,
  sectionId: string
): number | null {
  const section = document.getElementById(sectionId);
  if (!section) return null;

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
    window.innerWidth,
    window.innerHeight,
    sectionRect.top,
    sectionRect.bottom
  );
}
