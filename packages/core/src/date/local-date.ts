import type { Clock } from '../ports/clock';

/**
 * A calendar day in some timezone, formatted `YYYY-MM-DD`.
 *
 * Lexicographic order equals chronological order. All arithmetic goes through
 * `Date.UTC`, never the runtime's local timezone, so results are identical on
 * every machine. See docs/design/domain.md "LocalDate".
 */
export type LocalDate = string & { readonly __brand: 'LocalDate' };

const MS_PER_DAY = 86_400_000;
const MS_PER_MINUTE = 60_000;
const PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

const pad = (n: number, width: number): string => String(n).padStart(width, '0');

function fromUtcMs(ms: number): LocalDate {
  const date = new Date(ms);
  return `${pad(date.getUTCFullYear(), 4)}-${pad(date.getUTCMonth() + 1, 2)}-${pad(
    date.getUTCDate(),
    2,
  )}` as LocalDate;
}

/** UTC midnight of the date, in epoch ms. */
export function utcMidnightOf(date: LocalDate): number {
  const [year, month, day] = date.split('-').map(Number) as [number, number, number];
  return Date.UTC(year, month - 1, day);
}

/** Strict `YYYY-MM-DD` parse after trimming; nonexistent dates return `null`. */
export function parseLocalDate(text: string): LocalDate | null {
  const match = PATTERN.exec(text.trim());
  if (match === null) return null;
  const [, y, m, d] = match as unknown as [string, string, string, string];
  const year = Number(y);
  const month = Number(m);
  const day = Number(d);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return `${y}-${m}-${d}` as LocalDate;
}

export function addDays(date: LocalDate, days: number): LocalDate {
  return fromUtcMs(utcMidnightOf(date) + days * MS_PER_DAY);
}

/** `to − from` in days; negative when `to` is before `from`. */
export function daysBetween(from: LocalDate, to: LocalDate): number {
  return Math.round((utcMidnightOf(to) - utcMidnightOf(from)) / MS_PER_DAY);
}

/** The date of an instant at a UTC offset (minutes, east positive). */
export function localDateAt(epochMs: number, utcOffsetMinutes: number): LocalDate {
  return fromUtcMs(epochMs + utcOffsetMinutes * MS_PER_MINUTE);
}

/** The only way to get the PRD's "today". */
export function todayFrom(clock: Clock): LocalDate {
  const now = clock.now();
  return localDateAt(now, clock.utcOffsetMinutes(now));
}
