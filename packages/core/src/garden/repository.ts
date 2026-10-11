/**
 * Persistence format of the Garden: one JSON document under one key (ADR-002).
 * See docs/design/domain.md "持久化格式（schema v1）".
 */

import { type LocalDate, parseLocalDate } from '../date/local-date';
import type { Plant } from '../plant/plant';
import { INTERVAL_MAX, INTERVAL_MIN, NAME_MAX_LENGTH } from '../plant/validation';
import type { KeyValueStore } from '../ports/key-value-store';
import { emptyGarden, type Garden } from './garden';

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

/**
 * Turns a document of version `n` into one of version `n + 1`. The repository
 * sets `schemaVersion` on the result, so a migration only reshapes the fields.
 */
export type Migration = (document: Record<string, unknown>) => Record<string, unknown>;

/** Keyed by the version a migration upgrades from. */
export type MigrationTable = Readonly<Partial<Record<number, Migration>>>;

export interface PlantRepositoryOptions {
  /** Version written by `save` and reached by migration; tests inject a higher one. */
  schemaVersion?: number;
  migrations?: MigrationTable;
}

/** Schema v1 has no predecessor yet. */
const MIGRATIONS: MigrationTable = {};

const ID_PATTERN = /^p([1-9][0-9]*)$/;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isIntegerIn = (value: unknown, min: number, max: number): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;

/**
 * Reads and writes the Garden as one JSON document under `GARDEN_STORAGE_KEY`,
 * migrating older documents and refusing anything it cannot trust. Loading
 * never writes, so unusable data stays in storage untouched.
 */
export class PlantRepository {
  private readonly schemaVersion: number;
  private readonly migrations: MigrationTable;

  constructor(
    private readonly store: KeyValueStore,
    options: PlantRepositoryOptions = {},
  ) {
    this.schemaVersion = options.schemaVersion ?? CURRENT_SCHEMA_VERSION;
    this.migrations = options.migrations ?? MIGRATIONS;
  }

  /** A missing key is an empty Garden; unusable data rejects with `GardenLoadError`. */
  async load(): Promise<Garden> {
    const raw = await this.store.getItem(GARDEN_STORAGE_KEY);
    if (raw === null) return emptyGarden();
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      throw new GardenLoadError('Stored garden is not valid JSON', { cause: error });
    }
    return toGarden(this.migrate(parsed));
  }

  /** Writes only the schema fields, in the order shown in domain.md. */
  async save(garden: Garden): Promise<void> {
    const document = {
      schemaVersion: this.schemaVersion,
      nextId: garden.nextId,
      plants: garden.plants.map(({ id, name, intervalDays, lastWateredOn }) => ({
        id,
        name,
        intervalDays,
        lastWateredOn,
      })),
    };
    await this.store.setItem(GARDEN_STORAGE_KEY, JSON.stringify(document));
  }

  private migrate(parsed: unknown): Record<string, unknown> {
    if (!isRecord(parsed)) throw new GardenLoadError('Stored garden is not a JSON object');
    const version = parsed.schemaVersion;
    if (!isIntegerIn(version, 1, Number.MAX_SAFE_INTEGER)) {
      throw new GardenLoadError('Stored garden has an invalid schemaVersion');
    }
    if (version > this.schemaVersion) {
      throw new GardenLoadError(
        `Stored garden schemaVersion ${version} is newer than ${this.schemaVersion}`,
      );
    }
    let document = parsed;
    for (let from = version; from < this.schemaVersion; from++) {
      const migration = this.migrations[from];
      if (migration === undefined) {
        throw new GardenLoadError(`No migration from schemaVersion ${from}`);
      }
      try {
        document = { ...migration(document), schemaVersion: from + 1 };
      } catch (error) {
        throw new GardenLoadError(`Migration from schemaVersion ${from} failed`, { cause: error });
      }
    }
    return document;
  }
}

/** Checks every Garden invariant (docs/design/domain.md "Garden"). */
function toGarden(document: Record<string, unknown>): Garden {
  const { nextId, plants } = document;
  if (!isIntegerIn(nextId, 1, Number.MAX_SAFE_INTEGER)) {
    throw new GardenLoadError('Stored garden has an invalid nextId');
  }
  if (!Array.isArray(plants)) throw new GardenLoadError('Stored garden has no plants array');

  const ids = new Set<string>();
  const names = new Set<string>();
  const result = plants.map((value: unknown, index): Plant => {
    const plant = toPlant(value, index);
    if (ids.has(plant.id)) throw new GardenLoadError(`Duplicate plant id ${plant.id}`);
    if (names.has(plant.name)) throw new GardenLoadError(`Plant ${index} has a duplicate name`);
    if (Number(ID_PATTERN.exec(plant.id)?.[1]) >= nextId) {
      throw new GardenLoadError(`nextId ${nextId} is not greater than id ${plant.id}`);
    }
    ids.add(plant.id);
    names.add(plant.name);
    return plant;
  });
  return { nextId, plants: result };
}

function toPlant(value: unknown, index: number): Plant {
  const invalid = (field: string) => new GardenLoadError(`Plant ${index} has an invalid ${field}`);
  if (!isRecord(value)) throw invalid('entry');
  const { id, name, intervalDays, lastWateredOn } = value;
  if (typeof id !== 'string' || !ID_PATTERN.test(id)) throw invalid('id');
  if (
    typeof name !== 'string' ||
    name === '' ||
    name !== name.trim() ||
    [...name].length > NAME_MAX_LENGTH
  ) {
    throw invalid('name');
  }
  if (!isIntegerIn(intervalDays, INTERVAL_MIN, INTERVAL_MAX)) throw invalid('intervalDays');
  // Strict: parseLocalDate trims, so a padded value would not round-trip.
  if (typeof lastWateredOn !== 'string' || parseLocalDate(lastWateredOn) !== lastWateredOn) {
    throw invalid('lastWateredOn');
  }
  return { id, name, intervalDays, lastWateredOn: lastWateredOn as LocalDate };
}
