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
  return Array.from({ length: 6 }, (_, index) => gridCard(index, 3, rowTop));
}

describe('computeScrollActiveIndexFromRects', () => {
  it('single column: card nearest viewport center wins', () => {
    const cards: CardRect[] = Array.from({ length: 6 }, (_, index) => ({
      index,
      left: 100,
      top: VIEW_H / 2 - CARD_H / 2 + (index - 2) * (CARD_H + GAP),
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

  it('3-column tablet row: middle card (SEO-Basis) can become active', () => {
    const rowTop = VIEW_H / 2 - CARD_H / 2;
    const cards = threeColGrid(rowTop);

    const active = computeScrollActiveIndexFromRects(
      cards,
      VIEW_W,
      VIEW_H,
      rowTop - 40,
      rowTop + CARD_H + GAP + 40
    );

    assert.equal(active, 1);
  });

  it('3-column second row: middle card (Branding) can become active', () => {
    const rowTop = VIEW_H / 2 - CARD_H / 2 - (CARD_H + GAP);
    const cards = threeColGrid(rowTop);

    const active = computeScrollActiveIndexFromRects(
      cards,
      VIEW_W,
      VIEW_H,
      rowTop - 40,
      rowTop + 2 * (CARD_H + GAP)
    );

    assert.equal(active, 4);
  });

  it('returns null when section is off screen', () => {
    const cards = threeColGrid(2000);

    const active = computeScrollActiveIndexFromRects(
      cards,
      VIEW_W,
      VIEW_H,
      2000,
      2600
    );

    assert.equal(active, null);
  });
});
