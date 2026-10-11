import { describe, expect, it } from 'vitest';

import type { LocalDate } from '../date/local-date';
import { InMemoryKeyValueStore } from '../ports/key-value-store';
import { emptyGarden, type Garden } from './garden';
import { GARDEN_STORAGE_KEY, GardenLoadError, type Migration, PlantRepository } from './repository';

const date = (text: string) => text as LocalDate;

/** The example document from docs/design/domain.md "持久化格式（schema v1）". */
const DOMAIN_EXAMPLE = {
  schemaVersion: 1,
  nextId: 3,
  plants: [
    { id: 'p1', name: '龜背芋', intervalDays: 7, lastWateredOn: '2026-03-01' },
    { id: 'p2', name: '虎尾蘭', intervalDays: 14, lastWateredOn: '2026-03-01' },
  ],
};

const EXAMPLE_GARDEN: Garden = {
  nextId: 3,
  plants: [
    { id: 'p1', name: '龜背芋', intervalDays: 7, lastWateredOn: date('2026-03-01') },
    { id: 'p2', name: '虎尾蘭', intervalDays: 14, lastWateredOn: date('2026-03-01') },
  ],
};

function storeWith(document: unknown): InMemoryKeyValueStore {
  const raw = typeof document === 'string' ? document : JSON.stringify(document);
  return new InMemoryKeyValueStore({ [GARDEN_STORAGE_KEY]: raw });
}

async function expectLoadErrorWithoutWrite(store: InMemoryKeyValueStore): Promise<void> {
  const before = store.snapshot();
  await expect(new PlantRepository(store).load()).rejects.toBeInstanceOf(GardenLoadError);
  expect(store.snapshot()).toEqual(before);
}

const plant = (overrides: Record<string, unknown> = {}) => ({
  id: 'p1',
  name: '龜背芋',
  intervalDays: 7,
  lastWateredOn: '2026-03-01',
  ...overrides,
});

const document = (overrides: Record<string, unknown> = {}) => ({
  schemaVersion: 1,
  nextId: 2,
  plants: [plant()],
  ...overrides,
});

describe('PlantRepository.load', () => {
  it('returns an empty garden when the key does not exist', async () => {
    const store = new InMemoryKeyValueStore();
    await expect(new PlantRepository(store).load()).resolves.toEqual(emptyGarden());
    expect(store.snapshot()).toEqual({});
  });

  it('reads the domain.md example document', async () => {
    await expect(new PlantRepository(storeWith(DOMAIN_EXAMPLE)).load()).resolves.toEqual(
      EXAMPLE_GARDEN,
    );
  });

  it('accepts names and intervals at their boundaries', async () => {
    const garden = await new PlantRepository(
      storeWith(
        document({
          nextId: 3,
          plants: [
            plant({ id: 'p1', name: '字'.repeat(30), intervalDays: 1 }),
            plant({ id: 'p2', name: 'A', intervalDays: 365 }),
          ],
        }),
      ),
    ).load();
    expect(garden.plants).toHaveLength(2);
  });
});

describe('PlantRepository.save', () => {
  it('writes the exact domain.md field names and order under GARDEN_STORAGE_KEY', async () => {
    const store = new InMemoryKeyValueStore();
    await new PlantRepository(store).save(EXAMPLE_GARDEN);
    expect(store.snapshot()).toEqual({ [GARDEN_STORAGE_KEY]: JSON.stringify(DOMAIN_EXAMPLE) });
  });

  it('does not write fields other than the schema v1 fields', async () => {
    const store = new InMemoryKeyValueStore();
    const extra = {
      nextId: 2,
      plants: [{ ...EXAMPLE_GARDEN.plants[0], note: 'x' }],
      extra: true,
    } as unknown as Garden;
    await new PlantRepository(store).save(extra);
    expect(JSON.parse(store.snapshot()[GARDEN_STORAGE_KEY] ?? '')).toEqual({
      schemaVersion: 1,
      nextId: 2,
      plants: [DOMAIN_EXAMPLE.plants[0]],
    });
  });

  it('round-trips: load after save returns the same garden', async () => {
    const store = new InMemoryKeyValueStore();
    const repository = new PlantRepository(store);
    await repository.save(EXAMPLE_GARDEN);
    await expect(repository.load()).resolves.toEqual(EXAMPLE_GARDEN);
  });

  it('round-trips an empty garden', async () => {
    const repository = new PlantRepository(new InMemoryKeyValueStore());
    await repository.save(emptyGarden());
    await expect(repository.load()).resolves.toEqual(emptyGarden());
  });

  it('rejects when the write fails and leaves stored data unchanged', async () => {
    const store = storeWith(DOMAIN_EXAMPLE);
    const before = store.snapshot();
    const failure = new Error('disk full');
    store.failNextWrite(failure);
    await expect(new PlantRepository(store).save(emptyGarden())).rejects.toBe(failure);
    expect(store.snapshot()).toEqual(before);
  });
});

describe('PlantRepository migrations', () => {
  // Only v1 exists, so the mechanism is verified with an injected schema:
  // pretend the current version is 3 and v1 / v2 documents are older.
  const renameToV2: Migration = ({ garden, ...rest }) => ({ ...rest, flora: garden });
  const renameToV3: Migration = ({ flora, ...rest }) => ({ ...rest, plants: flora });

  it('applies every migration from the stored version in order', async () => {
    const calls: number[] = [];
    const migrations = {
      1: (doc: Record<string, unknown>) => (calls.push(1), renameToV2(doc)),
      2: (doc: Record<string, unknown>) => (calls.push(2), renameToV3(doc)),
    };
    const { plants, ...v1Rest } = DOMAIN_EXAMPLE;
    const store = storeWith({ ...v1Rest, garden: plants });
    const before = store.snapshot();

    const repository = new PlantRepository(store, { schemaVersion: 3, migrations });
    await expect(repository.load()).resolves.toEqual(EXAMPLE_GARDEN);
    expect(calls).toEqual([1, 2]);
    expect(store.snapshot()).toEqual(before);
  });

  it('starts from the stored version, skipping earlier migrations', async () => {
    const calls: number[] = [];
    const migrations = {
      1: (doc: Record<string, unknown>) => (calls.push(1), renameToV2(doc)),
      2: (doc: Record<string, unknown>) => (calls.push(2), renameToV3(doc)),
    };
    const { plants, ...rest } = DOMAIN_EXAMPLE;
    const store = storeWith({ ...rest, schemaVersion: 2, flora: plants });

    const repository = new PlantRepository(store, { schemaVersion: 3, migrations });
    await expect(repository.load()).resolves.toEqual(EXAMPLE_GARDEN);
    expect(calls).toEqual([2]);
  });

  it('applies no migration to a current-version document', async () => {
    const repository = new PlantRepository(storeWith({ ...DOMAIN_EXAMPLE, schemaVersion: 3 }), {
      schemaVersion: 3,
      migrations: {
        1: () => {
          throw new Error('should not run');
        },
      },
    });
    await expect(repository.load()).resolves.toEqual(EXAMPLE_GARDEN);
  });

  it('validates the migrated document', async () => {
    const store = storeWith({ ...DOMAIN_EXAMPLE, schemaVersion: 1 });
    const before = store.snapshot();
    const repository = new PlantRepository(store, {
      schemaVersion: 2,
      migrations: { 1: (doc) => ({ ...doc, nextId: 1 }) },
    });
    await expect(repository.load()).rejects.toBeInstanceOf(GardenLoadError);
    expect(store.snapshot()).toEqual(before);
  });

  it('fails when a migration step is missing', async () => {
    const store = storeWith({ ...DOMAIN_EXAMPLE, schemaVersion: 1 });
    const before = store.snapshot();
    const repository = new PlantRepository(store, {
      schemaVersion: 3,
      migrations: { 2: renameToV3 },
    });
    await expect(repository.load()).rejects.toBeInstanceOf(GardenLoadError);
    expect(store.snapshot()).toEqual(before);
  });

  it('wraps a throwing migration in GardenLoadError', async () => {
    const store = storeWith({ ...DOMAIN_EXAMPLE, schemaVersion: 1 });
    const cause = new Error('boom');
    const repository = new PlantRepository(store, {
      schemaVersion: 2,
      migrations: {
        1: () => {
          throw cause;
        },
      },
    });
    const error = await repository.load().catch((e: unknown) => e);
    expect(error).toBeInstanceOf(GardenLoadError);
    expect((error as GardenLoadError).cause).toBe(cause);
  });

  it('saves with the configured schema version', async () => {
    const store = new InMemoryKeyValueStore();
    await new PlantRepository(store, { schemaVersion: 3 }).save(EXAMPLE_GARDEN);
    expect(JSON.parse(store.snapshot()[GARDEN_STORAGE_KEY] ?? '')).toEqual({
      ...DOMAIN_EXAMPLE,
      schemaVersion: 3,
    });
  });
});

describe('PlantRepository load errors (never overwrite stored data)', () => {
  const cases: [string, unknown][] = [
    ['newer schemaVersion', document({ schemaVersion: 2 })],
    ['unparsable JSON', '{"schemaVersion": 1, "nextId": '],
    ['empty string', ''],
    ['JSON null', 'null'],
    ['JSON array', '[]'],
    ['JSON number', '1'],
    ['missing schemaVersion', { nextId: 1, plants: [] }],
    ['schemaVersion is a string', document({ schemaVersion: '1' })],
    ['schemaVersion is zero', document({ schemaVersion: 0 })],
    ['schemaVersion is not an integer', document({ schemaVersion: 0.5 })],
    ['missing nextId', { schemaVersion: 1, plants: [] }],
    ['nextId is zero', document({ nextId: 0, plants: [] })],
    ['nextId is not an integer', document({ nextId: 2.5 })],
    ['nextId is a string', document({ nextId: '2' })],
    ['plants is not an array', document({ plants: {} })],
    ['missing plants', { schemaVersion: 1, nextId: 1 }],
    ['plant is null', document({ plants: [null] })],
    ['plant is an array', document({ plants: [[]] })],
    [
      'duplicate id',
      document({ nextId: 3, plants: [plant({ id: 'p1' }), plant({ id: 'p1', name: '虎尾蘭' })] }),
    ],
    ['duplicate name', document({ nextId: 3, plants: [plant({ id: 'p1' }), plant({ id: 'p2' })] })],
    ['id is not p<n>', document({ plants: [plant({ id: 'x1' })] })],
    ['id is p0', document({ plants: [plant({ id: 'p0' })] })],
    ['id has a leading zero', document({ plants: [plant({ id: 'p01' })] })],
    ['id is a number', document({ plants: [plant({ id: 1 })] })],
    ['nextId equals an existing id number', document({ nextId: 1 })],
    [
      'nextId not greater than the largest id number',
      document({ nextId: 5, plants: [plant({ id: 'p5' })] }),
    ],
    ['name is empty', document({ plants: [plant({ name: '' })] })],
    ['name is only whitespace', document({ plants: [plant({ name: '   ' })] })],
    ['name is not trimmed', document({ plants: [plant({ name: ' 龜背芋' })] })],
    ['name exceeds 30 code points', document({ plants: [plant({ name: '字'.repeat(31) })] })],
    ['name is a number', document({ plants: [plant({ name: 1 })] })],
    ['intervalDays is 0', document({ plants: [plant({ intervalDays: 0 })] })],
    ['intervalDays is 366', document({ plants: [plant({ intervalDays: 366 })] })],
    ['intervalDays is not an integer', document({ plants: [plant({ intervalDays: 1.5 })] })],
    ['intervalDays is a string', document({ plants: [plant({ intervalDays: '7' })] })],
    [
      'lastWateredOn does not exist',
      document({ plants: [plant({ lastWateredOn: '2026-02-29' })] }),
    ],
    ['lastWateredOn is malformed', document({ plants: [plant({ lastWateredOn: '2026/03/01' })] })],
    [
      'lastWateredOn has whitespace',
      document({ plants: [plant({ lastWateredOn: ' 2026-03-01' })] }),
    ],
    ['lastWateredOn is missing', document({ plants: [plant({ lastWateredOn: undefined })] })],
  ];

  it.each(cases)('%s → GardenLoadError, storage unchanged', async (_label, stored) => {
    await expectLoadErrorWithoutWrite(storeWith(stored));
  });

  it('keeps the parse error as the cause', async () => {
    const error = await new PlantRepository(storeWith('{oops')).load().catch((e: unknown) => e);
    expect(error).toBeInstanceOf(GardenLoadError);
    expect((error as GardenLoadError).cause).toBeInstanceOf(SyntaxError);
  });
});
