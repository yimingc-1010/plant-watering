import { describe, expect, it } from 'vitest';

import {
  CURRENT_SCHEMA_VERSION,
  emptyGarden,
  GARDEN_STORAGE_KEY,
  GardenLoadError,
  INTERVAL_MAX,
  INTERVAL_MIN,
  NAME_MAX_LENGTH,
  type LocalDate,
} from './index';

describe('public API', () => {
  it('exposes the validation limits from docs/design/domain.md', () => {
    expect(NAME_MAX_LENGTH).toBe(30);
    expect(INTERVAL_MIN).toBe(1);
    expect(INTERVAL_MAX).toBe(365);
  });

  it('exposes the storage key and schema version from ADR-002', () => {
    expect(GARDEN_STORAGE_KEY).toBe('garden');
    expect(CURRENT_SCHEMA_VERSION).toBe(1);
  });

  it('creates an empty garden whose first id is 1', () => {
    expect(emptyGarden()).toEqual({ nextId: 1, plants: [] });
  });

  it('returns a fresh garden on every call', () => {
    const first = emptyGarden();
    first.plants.push({
      id: 'p1',
      name: '龜背芋',
      intervalDays: 7,
      lastWateredOn: '2026-03-01' as LocalDate,
    });
    expect(emptyGarden().plants).toEqual([]);
  });

  it('makes GardenLoadError a real Error', () => {
    const error = new GardenLoadError('unsupported schemaVersion 2');
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(GardenLoadError);
    expect(error.name).toBe('GardenLoadError');
    expect(error.message).toBe('unsupported schemaVersion 2');
  });
});
