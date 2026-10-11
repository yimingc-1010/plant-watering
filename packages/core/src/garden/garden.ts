import type { LocalDate } from '../date/local-date';
import type { Plant, PlantId } from '../plant/plant';

/**
 * Aggregate root: all plants plus the id counter.
 *
 * Invariants: names and ids are unique, every plant satisfies the field rules,
 * and `nextId` exceeds every existing id's number. See docs/design/domain.md
 * "Garden".
 */
export interface Garden {
  /** Number for the next `PlantId`; starts at 1. */
  nextId: number;
  plants: Plant[];
}

/** What `undoWatering` needs to restore a plant; held in memory only. */
export interface UndoToken {
  readonly plantId: PlantId;
  readonly previousLastWateredOn: LocalDate;
}

export function emptyGarden(): Garden {
  return { nextId: 1, plants: [] };
}
