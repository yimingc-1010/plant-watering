import { utcMidnightOf, type LocalDate } from '../date/local-date';

/**
 * Port for reading the current time.
 *
 * Every external dependency (time, location, sensors, network, storage, payments)
 * is accessed through a port like this one, with a real and a fake implementation,
 * so unit and e2e tests stay deterministic. See docs/process.md, principle 4.
 */
export interface Clock {
  /** Current instant, epoch ms. */
  now(): number;
  /** Device UTC offset at the given instant (minutes, east positive, DST included). */
  utcOffsetMinutes(epochMs: number): number;
}

export const systemClock: Clock = {
  now: () => Date.now(),
  utcOffsetMinutes: (epochMs) => -new Date(epochMs).getTimezoneOffset(),
};

const MS_PER_MINUTE = 60_000;
const NOON_MS = 12 * 60 * MS_PER_MINUTE;

/**
 * Deterministic clock for tests and fake-mode dev builds.
 *
 * Time is frozen: it only changes through `advance`, `set` or `setToday`.
 * The offset is fixed until `setUtcOffsetMinutes`.
 */
export class FakeClock implements Clock {
  constructor(
    private current: number = 0,
    private offsetMinutes: number = 0,
  ) {}

  now(): number {
    return this.current;
  }

  utcOffsetMinutes(_epochMs: number): number {
    return this.offsetMinutes;
  }

  advance(ms: number): void {
    this.current += ms;
  }

  set(epochMs: number): void {
    this.current = epochMs;
  }

  setUtcOffsetMinutes(minutes: number): void {
    this.offsetMinutes = minutes;
  }

  /** Sets 12:00 of `date` at the current offset, away from the day boundary. */
  setToday(date: LocalDate): void {
    this.current = utcMidnightOf(date) + NOON_MS - this.offsetMinutes * MS_PER_MINUTE;
  }
}
