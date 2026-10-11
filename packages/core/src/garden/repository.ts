/**
 * Persistence format of the Garden: one JSON document under one key (ADR-002).
 * See docs/design/domain.md "持久化格式（schema v1）".
 */

export const GARDEN_STORAGE_KEY = 'garden';
export const CURRENT_SCHEMA_VERSION = 1;

/** Schema v1 document as stored; values are unvalidated until loaded. */
export interface GardenDocument {
  schemaVersion: typeof CURRENT_SCHEMA_VERSION;
  nextId: number;
  plants: {
    id: string;
    name: string;
    intervalDays: number;
    lastWateredOn: string;
  }[];
}

/**
 * Stored data cannot be used: unparsable JSON, a newer `schemaVersion`, or a
 * broken invariant. The stored data is never overwritten in this case.
 */
export class GardenLoadError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'GardenLoadError';
  }
}
