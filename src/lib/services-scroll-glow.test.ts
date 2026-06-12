import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  computeScrollActiveIndexFromRects,
  type CardRect,
} from './services-scroll-glow';

const CARD_W = 280;
const CARD_H = 200;
const GAP = 32;
const VIEW_W = 1024;
const VIEW_H = 900;
const TABLET_COLS = 3;
const VIEW_CENTER_Y = VIEW_H / 2;

function gridCard(index: number, cols: number, rowTop: number): CardRect {
  const col = index % cols;
  const row = Math.floor(index / cols);
  const gridWidth = cols * CARD_W + (cols - 1) * GAP;
  const gridLeft = (VIEW_W - gridWidth) / 2;

  return {
    index,
    left: gridLeft + col * (CARD_W + GAP),
    top: rowTop + row * (CARD_H + GAP),
    width: CARD_W,
    height: CARD_H,
  };
}

function threeColGrid(rowTop: number): CardRect[] {
  return Array.from({ length: 6 }, (_, index) => gridCard(index, TABLET_COLS, rowTop));
}

function threeColActive(
  cards: CardRect[],
  sectionTop: number,
  sectionBottom: number
): number | null {
  return computeScrollActiveIndexFromRects(
    cards,
    VIEW_W,
    VIEW_H,
    sectionTop,
    sectionBottom,
    TABLET_COLS
  );
}

describe('computeScrollActiveIndexFromRects', () => {
  it('single column: card nearest viewport center wins', () => {
    const cards: CardRect[] = Array.from({ length: 6 }, (_, index) => ({
      index,
      left: 100,
      top: VIEW_CENTER_Y - CARD_H / 2 + (index - 2) * (CARD_H + GAP),
      width: CARD_W,
      height: CARD_H,
    }));

    const active = computeScrollActiveIndexFromRects(
      cards,
      VIEW_W,
      VIEW_H,
      0,
      1200
    );

    assert.equal(active, 2);
  });

  it('3-column first row: left card (Webdesign) can become active', () => {
    const rowTop = 400;
    const cards = threeColGrid(rowTop);

    const active = threeColActive(cards, rowTop - 40, rowTop + CARD_H + GAP + 40);

    assert.equal(active, 0);
  });

  it('3-column first row: middle card (SEO-Basis) can become active', () => {
    const rowTop = VIEW_CENTER_Y - CARD_H / 2;
    const cards = threeColGrid(rowTop);

    const active = threeColActive(cards, rowTop - 40, rowTop + CARD_H + GAP + 40);

    assert.equal(active, 1);
  });

  it('3-column first row: right card (SEO-Profi) can become active', () => {
    const rowTop = 300;
    const cards = threeColGrid(rowTop);

    const active = threeColActive(cards, rowTop - 40, rowTop + CARD_H + GAP + 40);

    assert.equal(active, 2);
  });

  it('3-column second row: left card (Inhalte) can become active', () => {
    const rowTop = 200;
    const cards = threeColGrid(rowTop);
    const sectionBottom = rowTop + 2 * (CARD_H + GAP);

    const active = threeColActive(cards, rowTop - 40, sectionBottom + 40);

    assert.equal(active, 3);
  });

  it('3-column second row: middle card (Branding) can become active', () => {
    const rowTop = VIEW_CENTER_Y - CARD_H / 2 - (CARD_H + GAP);
    const cards = threeColGrid(rowTop);
    const sectionBottom = rowTop + 2 * (CARD_H + GAP);

    const active = threeColActive(cards, rowTop - 40, sectionBottom + 40);

    assert.equal(active, 4);
  });

  it('3-column second row: right card (Automatisierung) can become active', () => {
    const rowTop = 50;
    const cards = threeColGrid(rowTop);
    const sectionBottom = rowTop + 2 * (CARD_H + GAP);

    const active = threeColActive(cards, rowTop - 40, sectionBottom + 40);

    assert.equal(active, 5);
  });

  it('3-column with 1 column count keeps middle-card bias (desktop-style)', () => {
    const rowTop = VIEW_CENTER_Y - CARD_H / 2;
    const cards = threeColGrid(rowTop);

    const active = computeScrollActiveIndexFromRects(
      cards,
      VIEW_W,
      VIEW_H,
      rowTop - 40,
      rowTop + CARD_H + GAP + 40,
      1
    );

    assert.equal(active, 1);
  });

  it('returns null when section is off screen', () => {
    const cards = threeColGrid(2000);

    const active = computeScrollActiveIndexFromRects(
      cards,
      VIEW_W,
      VIEW_H,
      2000,
      2600,
      TABLET_COLS
    );

    assert.equal(active, null);
  });
});
