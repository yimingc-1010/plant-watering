/**
 * Port for persistent string key-value storage.
 *
 * The real implementation lives in the app (expo-sqlite kv-store, ADR-002);
 * core only depends on this interface. See docs/design/modules.md "Port 2".
 */
export interface KeyValueStore {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

/** In-memory store for tests; writes apply immediately and nothing persists. */
export class InMemoryKeyValueStore implements KeyValueStore {
  private readonly entries: Map<string, string>;
  private pendingFailure: Error | null = null;

  constructor(initial: Record<string, string> = {}) {
    this.entries = new Map(Object.entries(initial));
  }

  getItem(key: string): Promise<string | null> {
    return Promise.resolve(this.entries.get(key) ?? null);
  }

  setItem(key: string, value: string): Promise<void> {
    return this.write(() => this.entries.set(key, value));
  }

  removeItem(key: string): Promise<void> {
    return this.write(() => this.entries.delete(key));
  }

  /** The next `setItem`／`removeItem` rejects with this error and changes nothing. */
  failNextWrite(error: Error = new Error('InMemoryKeyValueStore: injected write failure')): void {
    this.pendingFailure = error;
  }

  /** A copy of all entries, for assertions. */
  snapshot(): Record<string, string> {
    return Object.fromEntries(this.entries);
  }

  private write(apply: () => void): Promise<void> {
    const failure = this.pendingFailure;
    if (failure !== null) {
      this.pendingFailure = null;
      return Promise.reject(failure);
    }
    apply();
    return Promise.resolve();
  }
}
