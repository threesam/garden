import { describe, expect, it } from 'vitest';
import { COLS, FILL, LETTERS, ROWS, letterCells } from './wordmark';

// This module is generated from the hand-edited grid, so the tests guard the
// invariants a regeneration could quietly break — not the artwork itself.
describe('wordmark', () => {
  it('spells threesam', () => {
    expect(LETTERS.map((l) => l.ch).join('')).toBe('threesam');
  });

  it('gives every letter ROWS rows of equal width', () => {
    for (const letter of LETTERS) {
      expect(letter.rows).toHaveLength(ROWS);
      const widths = new Set(letter.rows.map((r) => r.length));
      expect(widths.size).toBe(1);
    }
  });

  it('keeps letters inside the full grid, left to right, without overlapping', () => {
    let prevRight = -1;
    for (const letter of LETTERS) {
      const width = letter.rows[0]?.length ?? 0;
      expect(letter.x0).toBeGreaterThan(prevRight);
      expect(letter.x0 + width).toBeLessThanOrEqual(COLS);
      prevRight = letter.x0 + width - 1;
    }
  });

  it('decodes only 0/1 cells, all within the letter box', () => {
    for (const letter of LETTERS) {
      expect(letter.rows.join('')).toMatch(/^[01]+$/);
      const width = letter.rows[0]?.length ?? 0;
      for (const [x, y] of letterCells(letter)) {
        expect(x).toBeGreaterThanOrEqual(0);
        expect(x).toBeLessThan(width);
        expect(y).toBeGreaterThanOrEqual(0);
        expect(y).toBeLessThan(ROWS);
      }
    }
  });

  it('carries the full 1543-dot mark', () => {
    const total = LETTERS.reduce((n, l) => n + letterCells(l).length, 0);
    expect(total).toBe(1543);
  });

  it('has a dot diameter under twice the pitch, or dots would merge solid', () => {
    expect(FILL).toBeGreaterThan(0);
    expect(FILL).toBeLessThan(2);
  });
});
