import type { LocalDate } from '../date/local-date';

/**
 * `p<n>` (e.g. `p1`), issued from `Garden.nextId` and never reused after a
 * delete. See docs/design/domain.md "PlantId".
 */
export type PlantId = string;

/**
 * A plant as stored. Due status is derived from `today`, never stored.
 * See docs/design/domain.md "Plant".
 */
export interface Plant {
  readonly id: PlantId;
  /** Already trimmed; 1–30 code points. */
  name: string;
  /** Integer in `INTERVAL_MIN`–`INTERVAL_MAX`. */
  intervalDays: number;
  lastWateredOn: LocalDate;
}
