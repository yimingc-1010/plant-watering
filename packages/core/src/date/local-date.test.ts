import { describe, expect, it } from 'vitest';

import { FakeClock } from '../ports/clock';
import {
  addDays,
  daysBetween,
  localDateAt,
  parseLocalDate,
  todayFrom,
  type LocalDate,
} from './local-date';

const d = (text: string): LocalDate => {
  const parsed = parseLocalDate(text);
  if (parsed === null) throw new Error(`invalid test date: ${text}`);
  return parsed;
};

describe('parseLocalDate', () => {
  it.each(['2026-03-05', '2028-02-29', '2026-12-31', '2026-01-01'])('accepts %s', (text) => {
    expect(parseLocalDate(text)).toBe(text);
  });

  it('trims surrounding whitespace', () => {
    expect(parseLocalDate(' 2026-03-05 ')).toBe('2026-03-05');
  });

  it.each([
    '2026-02-29',
    '2026-13-01',
    '2026-00-10',
    '2026-04-31',
    '2026-03-00',
    '2026-3-5',
    '26-03-05',
    '2026/03/05',
    '2026-03-05T00:00',
    '',
    'abc',
  ])('rejects %j', (text) => {
    expect(parseLocalDate(text)).toBeNull();
  });
});

describe('addDays', () => {
  it.each([
    ['2026-01-31', 1, '2026-02-01'],
    ['2026-12-28', 7, '2027-01-04'],
    ['2028-02-28', 1, '2028-02-29'],
    ['2028-02-29', 365, '2029-02-28'],
    ['2026-02-28', 1, '2026-03-01'],
    ['2026-03-01', -1, '2026-02-28'],
    ['2027-01-04', -7, '2026-12-28'],
    ['2026-03-05', 0, '2026-03-05'],
  ] as const)('%s + %i = %s', (from, days, expected) => {
    expect(addDays(d(from), days)).toBe(expected);
  });
});

describe('daysBetween', () => {
  it.each([
    ['2026-03-01', '2026-03-08', 7],
    ['2026-03-08', '2026-03-01', -7],
    ['2026-03-05', '2026-03-05', 0],
    ['2026-12-28', '2027-01-04', 7],
    ['2028-02-28', '2028-03-01', 2],
    ['2028-02-29', '2029-02-28', 365],
  ] as const)('%s -> %s = %i', (from, to, expected) => {
    expect(daysBetween(d(from), d(to))).toBe(expected);
  });
});

describe('localDateAt', () => {
  const instant = Date.UTC(2026, 2, 7, 20, 0); // 2026-03-07T20:00Z

  it.each([
    [0, '2026-03-07'],
    [480, '2026-03-08'],
    [-300, '2026-03-07'],
    [240, '2026-03-08'],
    [-720, '2026-03-07'],
    [840, '2026-03-08'],
  ] as const)('offset %i -> %s', (offset, expected) => {
    expect(localDateAt(instant, offset)).toBe(expected);
  });

  it('handles the instant just before and at local midnight', () => {
    const midnightUtc8 = Date.UTC(2026, 2, 7, 16, 0); // 2026-03-08T00:00+08:00
    expect(localDateAt(midnightUtc8 - 1, 480)).toBe('2026-03-07');
    expect(localDateAt(midnightUtc8, 480)).toBe('2026-03-08');
  });
});

describe('todayFrom', () => {
  it('uses the clock offset (UTC+8 is already the next day)', () => {
    const clock = new FakeClock(Date.UTC(2026, 2, 7, 20, 0), 480);
    expect(todayFrom(clock)).toBe('2026-03-08');
  });

  it('uses the clock offset (UTC-5 is still the same day)', () => {
    const clock = new FakeClock(Date.UTC(2026, 2, 7, 20, 0), -300);
    expect(todayFrom(clock)).toBe('2026-03-07');
  });

  it('follows a timezone change on the next call', () => {
    const clock = new FakeClock(Date.UTC(2026, 2, 7, 20, 0), -300);
    expect(todayFrom(clock)).toBe('2026-03-07');
    clock.setUtcOffsetMinutes(480);
    expect(todayFrom(clock)).toBe('2026-03-08');
  });

  it('asks the clock for the offset at the current instant', () => {
    const now = Date.UTC(2026, 2, 7, 20, 0);
    const seen: number[] = [];
    const clock = {
      now: () => now,
      utcOffsetMinutes: (epochMs: number) => {
        seen.push(epochMs);
        return 480;
      },
    };
    expect(todayFrom(clock)).toBe('2026-03-08');
    expect(seen).toEqual([now]);
  });
});
