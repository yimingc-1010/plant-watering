import { describe, expect, it } from 'vitest';

import { parseLocalDate, type LocalDate } from '../date/local-date';
import { isDue, nextWateringOn, overdueDays, type Plant } from './plant';

const d = (text: string): LocalDate => {
  const parsed = parseLocalDate(text);
  if (parsed === null) throw new Error(`invalid test date: ${text}`);
  return parsed;
};

const plant = (id: string, name: string, intervalDays: number, lastWateredOn: string): Plant => ({
  id,
  name,
  intervalDays,
  lastWateredOn: d(lastWateredOn),
});

describe('nextWateringOn', () => {
  it('adds the interval to the last watered date (US-02 #1)', () => {
    expect(nextWateringOn(plant('p1', '龜背芋', 7, '2026-03-01'))).toBe('2026-03-08');
    expect(nextWateringOn(plant('p2', '虎尾蘭', 14, '2026-03-01'))).toBe('2026-03-15');
  });

  it('crosses month and leap-day boundaries', () => {
    expect(nextWateringOn(plant('p1', 'a', 1, '2028-02-28'))).toBe('2028-02-29');
    expect(nextWateringOn(plant('p1', 'a', 365, '2026-12-31'))).toBe('2027-12-31');
  });
});

describe('overdueDays and isDue (US-03 #2–4)', () => {
  const monstera = plant('p1', '龜背芋', 7, '2026-03-01');

  it('is not due the day before the next watering date', () => {
    expect(overdueDays(monstera, d('2026-03-07'))).toBe(-1);
    expect(isDue(monstera, d('2026-03-07'))).toBe(false);
  });

  it('is due with 0 overdue days on the next watering date', () => {
    expect(overdueDays(monstera, d('2026-03-08'))).toBe(0);
    expect(isDue(monstera, d('2026-03-08'))).toBe(true);
  });

  it('counts overdue days after the next watering date', () => {
    expect(overdueDays(monstera, d('2026-03-11'))).toBe(3);
    expect(isDue(monstera, d('2026-03-11'))).toBe(true);
  });

  it('is negative when watered today', () => {
    expect(overdueDays(plant('p1', 'a', 14, '2026-03-11'), d('2026-03-11'))).toBe(-14);
  });
});
