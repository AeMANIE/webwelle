export type CardRect = {
  index: number;
  top: number;
  left: number;
  width: number;
  height: number;
};

const TABLET_GRID_COLUMNS = 3;

function isCardVisible(card: CardRect, viewportHeight: number): boolean {
  return card.top + card.height > 0 && card.top < viewportHeight;
}

function computeThreeColumnScrollActiveIndex(
  cards: CardRect[],
  viewportHeight: number
): number | null {
  const visible = cards.filter((card) => isCardVisible(card, viewportHeight));
  if (visible.length === 0) {
    return null;
  }

  const viewportCenterY = viewportHeight / 2;
  const rows = new Map<number, CardRect[]>();

  for (const card of visible) {
    const row = Math.floor(card.index / TABLET_GRID_COLUMNS);
    const rowCards = rows.get(row) ?? [];
    rowCards.push(card);
    rows.set(row, rowCards);
  }

  let activeRow: number | null = null;
  let minRowDist = Infinity;

  for (const [row, rowCards] of rows) {
    const rowTop = Math.min(...rowCards.map((card) => card.top));
    const rowBottom = Math.max(...rowCards.map((card) => card.top + card.height));
    const rowCenterY = (rowTop + rowBottom) / 2;
    const dist = Math.abs(rowCenterY - viewportCenterY);

    if (dist < minRowDist) {
      minRowDist = dist;
      activeRow = row;
    }
  }

  if (activeRow === null) {
    return null;
  }

  const rowCards = rows.get(activeRow)!;
  const rowTop = Math.min(...rowCards.map((card) => card.top));
  const rowBottom = Math.max(...rowCards.map((card) => card.top + card.height));
  const rowHeight = rowBottom - rowTop;

  let colIndex = 0;
  if (rowHeight > 0) {
    const progress = (viewportCenterY - rowTop) / rowHeight;
    colIndex = Math.min(
      TABLET_GRID_COLUMNS - 1,
      Math.max(0, Math.floor(progress * TABLET_GRID_COLUMNS))
    );
  }

  const targetIndex = activeRow * TABLET_GRID_COLUMNS + colIndex;
  const exact = rowCards.find((card) => card.index === targetIndex);
  if (exact) {
    return targetIndex;
  }

  return rowCards.reduce((best, card) =>
    Math.abs(card.index - targetIndex) < Math.abs(best.index - targetIndex) ? card : best
  ).index;
}

function computeDefaultScrollActiveIndex(
  cards: CardRect[],
  viewportWidth: number,
  viewportHeight: number
): number | null {
  const viewportCenterX = viewportWidth / 2;
  const viewportCenterY = viewportHeight / 2;

  let activeIndex: number | null = null;
  let minDistSq = Infinity;

  const sorted = [...cards].sort((a, b) => a.index - b.index);

  for (const card of sorted) {
    if (!isCardVisible(card, viewportHeight)) {
      continue;
    }

    const centerX = card.left + card.width / 2;
    const centerY = card.top + card.height / 2;
    const dx = centerX - viewportCenterX;
    const dy = centerY - viewportCenterY;
    const distSq = dx * dx + dy * dy;

    if (distSq < minDistSq) {
      minDistSq = distSq;
      activeIndex = card.index;
    }
  }

  return activeIndex;
}

export function computeScrollActiveIndexFromRects(
  cards: CardRect[],
  viewportWidth: number,
  viewportHeight: number,
  sectionTop: number,
  sectionBottom: number,
  columnCount = 1
): number | null {
  if (sectionBottom < 0 || sectionTop > viewportHeight) {
    return null;
  }

  if (columnCount === TABLET_GRID_COLUMNS) {
    return computeThreeColumnScrollActiveIndex(cards, viewportHeight);
  }

  return computeDefaultScrollActiveIndex(cards, viewportWidth, viewportHeight);
}

export function computeScrollActiveIndex(
  cards: Map<number, HTMLElement>,
  sectionId: string,
  columnCount = 1
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
    sectionRect.bottom,
    columnCount
  );
}
