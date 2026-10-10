import { describe, expect, it } from 'vitest';

import { parseLocalDate, todayFrom, type LocalDate } from '../date/local-date';
import { FakeClock, systemClock } from './clock';

const d = (text: string): LocalDate => {
  const parsed = parseLocalDate(text);
  if (parsed === null) throw new Error(`invalid test date: ${text}`);
  return parsed;
};

describe('systemClock', () => {
  it('reads the current time from Date.now', () => {
    const before = Date.now();
    const now = systemClock.now();
    expect(now).toBeGreaterThanOrEqual(before);
    expect(now).toBeLessThanOrEqual(Date.now());
  });

  it('reports the runtime offset east-positive, matching Date#getTimezoneOffset', () => {
    const instant = Date.UTC(2026, 6, 1, 12, 0);
    expect(systemClock.utcOffsetMinutes(instant)).toBe(-new Date(instant).getTimezoneOffset());
  });
});

describe('FakeClock', () => {
  it('defaults to epoch 0 and offset 0', () => {
    const clock = new FakeClock();
    expect(clock.now()).toBe(0);
    expect(clock.utcOffsetMinutes(0)).toBe(0);
  });

  it('keeps the single-argument constructor compatible (offset 0)', () => {
    const clock = new FakeClock(1_000);
    expect(clock.now()).toBe(1_000);
    expect(clock.utcOffsetMinutes(1_000)).toBe(0);
  });

  it('accepts an offset in the constructor', () => {
    const clock = new FakeClock(1_000, 480);
    expect(clock.utcOffsetMinutes(clock.now())).toBe(480);
  });

  it('is frozen: repeated reads return the same instant', () => {
    const clock = new FakeClock(5_000, 60);
    expect(clock.now()).toBe(5_000);
    expect(clock.now()).toBe(5_000);
    expect(clock.utcOffsetMinutes(0)).toBe(60);
    expect(clock.utcOffsetMinutes(10 ** 12)).toBe(60);
  });

  it('advance moves time forward by the given ms', () => {
    const clock = new FakeClock(1_000);
    clock.advance(500);
    expect(clock.now()).toBe(1_500);
  });

  it('set jumps to an absolute instant', () => {
    const clock = new FakeClock(1_000);
    clock.set(42);
    expect(clock.now()).toBe(42);
  });

  it('setUtcOffsetMinutes changes the offset only', () => {
    const clock = new FakeClock(1_000, 480);
    clock.setUtcOffsetMinutes(-300);
    expect(clock.utcOffsetMinutes(clock.now())).toBe(-300);
    expect(clock.now()).toBe(1_000);
  });

  it('time changes do not change the offset', () => {
    const clock = new FakeClock(0, 480);
    clock.advance(86_400_000);
    clock.set(123);
    clock.setToday(d('2026-03-11'));
    expect(clock.utcOffsetMinutes(clock.now())).toBe(480);
  });

  it('setToday sets 12:00 local time of that date in the current offset', () => {
    const clock = new FakeClock(0, 480);
    clock.setToday(d('2026-03-11'));
    expect(todayFrom(clock)).toBe('2026-03-11');
    expect(clock.now()).toBe(Date.parse('2026-03-11T12:00:00+08:00'));
  });

  it('setToday works for negative offsets', () => {
    const clock = new FakeClock(0, -300);
    clock.setToday(d('2026-03-11'));
    expect(todayFrom(clock)).toBe('2026-03-11');
    expect(clock.now()).toBe(Date.parse('2026-03-11T12:00:00-05:00'));
  });
});
