import { describe, expect, it } from 'vitest';

import { compareDue, compareNames } from './sort';

describe('compareNames (ADR-004)', () => {
  it('orders Chinese names by stroke count', () => {
    expect(['龜背芋', '虎尾蘭', '文竹', '大岩桐'].sort(compareNames)).toEqual([
      '大岩桐',
      '文竹',
      '虎尾蘭',
      '龜背芋',
    ]);
  });

  it('matches the order confirmed in ADR-004 exactly', () => {
    const expected = [
      '🌵仙人掌',
      '大岩桐',
      '文竹',
      '虎尾蘭',
      '盆栽2',
      '盆栽10',
      '龜背芋',
      'aloe',
      'Aloe',
      'Basil',
      'Monstera',
    ];
    const shuffled = [
      'Monstera',
      '盆栽10',
      'Aloe',
      '龜背芋',
      '🌵仙人掌',
      'Basil',
      '虎尾蘭',
      'aloe',
      '盆栽2',
      '文竹',
      '大岩桐',
    ];
    expect([...shuffled].sort(compareNames)).toEqual(expected);
    expect([...expected].reverse().sort(compareNames)).toEqual(expected);
  });

  it('returns 0 only for identical strings', () => {
    expect(compareNames('Aloe', 'Aloe')).toBe(0);
    expect(compareNames('aloe', 'Aloe')).toBeLessThan(0);
    expect(compareNames('Aloe', 'aloe')).toBeGreaterThan(0);
  });

  it('falls back to code point order when the collator ties', () => {
    // NFC vs NFD forms of "é" are canonically equivalent, so the collator returns 0.
    const composed = 'café';
    const decomposed = 'café';
    const collator = new Intl.Collator('zh-Hant-TW', {
      usage: 'sort',
      sensitivity: 'variant',
      numeric: true,
    });
    expect(collator.compare(composed, decomposed)).toBe(0);
    expect(compareNames(decomposed, composed)).toBeLessThan(0);
    expect(compareNames(composed, decomposed)).toBeGreaterThan(0);
  });
});

describe('compareDue', () => {
  it('orders by overdue days descending, then by name (US-03 #7)', () => {
    const items = [
      { id: 'p1', name: 'Basil', overdueDays: 0 },
      { id: 'p2', name: 'Monstera', overdueDays: 3 },
      { id: 'p3', name: 'Aloe', overdueDays: 3 },
    ];
    expect([...items].sort(compareDue).map((item) => item.name)).toEqual([
      'Aloe',
      'Monstera',
      'Basil',
    ]);
  });

  it('breaks name ties by id, giving a total order', () => {
    const a = { id: 'p1', name: '文竹', overdueDays: 2 };
    const b = { id: 'p2', name: '文竹', overdueDays: 2 };
    expect(compareDue(a, b)).toBeLessThan(0);
    expect(compareDue(b, a)).toBeGreaterThan(0);
    expect(compareDue(a, { ...a })).toBe(0);
    expect([b, a].sort(compareDue)).toEqual([a, b]);
  });
});
