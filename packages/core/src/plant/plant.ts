import { addDays, daysBetween, type LocalDate } from '../date/local-date';

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

/** `lastWateredOn + intervalDays`: the PRD's 到期日／下次澆水日. */
export function nextWateringOn(plant: Plant): LocalDate {
  return addDays(plant.lastWateredOn, plant.intervalDays);
}

/** Days past `nextWateringOn`; negative means not yet due. */
export function overdueDays(plant: Plant, today: LocalDate): number {
  return daysBetween(nextWateringOn(plant), today);
}

/** The PRD's 待澆: on or after `nextWateringOn`. */
export function isDue(plant: Plant, today: LocalDate): boolean {
  return overdueDays(plant, today) >= 0;
}
