import { describe, expect, it } from 'vitest';

import { InMemoryKeyValueStore, type KeyValueStore } from './key-value-store';

describe('InMemoryKeyValueStore', () => {
  it('returns null for a missing key', async () => {
    const store: KeyValueStore = new InMemoryKeyValueStore();
    expect(await store.getItem('garden')).toBeNull();
  });

  it('starts with the initial values', async () => {
    const store = new InMemoryKeyValueStore({ garden: '{"v":1}' });
    expect(await store.getItem('garden')).toBe('{"v":1}');
  });

  it('does not share state with the initial object', async () => {
    const initial = { garden: 'a' };
    const store = new InMemoryKeyValueStore(initial);
    initial.garden = 'b';
    expect(await store.getItem('garden')).toBe('a');
  });

  it('setItem stores and overwrites', async () => {
    const store = new InMemoryKeyValueStore();
    await store.setItem('k', 'one');
    expect(await store.getItem('k')).toBe('one');
    await store.setItem('k', 'two');
    expect(await store.getItem('k')).toBe('two');
  });

  it('removeItem deletes the key; removing a missing key is fine', async () => {
    const store = new InMemoryKeyValueStore({ k: 'v' });
    await store.removeItem('k');
    expect(await store.getItem('k')).toBeNull();
    await expect(store.removeItem('missing')).resolves.toBeUndefined();
  });

  it('failNextWrite makes the next setItem reject and keeps the old value', async () => {
    const store = new InMemoryKeyValueStore({ k: 'old' });
    const error = new Error('disk full');
    store.failNextWrite(error);
    await expect(store.setItem('k', 'new')).rejects.toBe(error);
    expect(await store.getItem('k')).toBe('old');
  });

  it('failNextWrite makes the next removeItem reject and keeps the value', async () => {
    const store = new InMemoryKeyValueStore({ k: 'old' });
    store.failNextWrite();
    await expect(store.removeItem('k')).rejects.toBeInstanceOf(Error);
    expect(await store.getItem('k')).toBe('old');
  });

  it('only fails once; later writes succeed', async () => {
    const store = new InMemoryKeyValueStore();
    store.failNextWrite();
    await expect(store.setItem('k', 'a')).rejects.toThrow();
    await store.setItem('k', 'b');
    expect(await store.getItem('k')).toBe('b');
  });

  it('reads are not affected by a pending failure', async () => {
    const store = new InMemoryKeyValueStore({ k: 'v' });
    store.failNextWrite();
    expect(await store.getItem('k')).toBe('v');
    await expect(store.setItem('k', 'x')).rejects.toThrow();
  });

  it('snapshot returns a copy of all entries', async () => {
    const store = new InMemoryKeyValueStore({ a: '1' });
    await store.setItem('b', '2');
    const snap = store.snapshot();
    expect(snap).toEqual({ a: '1', b: '2' });
    snap.a = 'changed';
    expect(await store.getItem('a')).toBe('1');
    expect(store.snapshot()).toEqual({ a: '1', b: '2' });
  });
});
