/**
 * LocalStorageStub is a reusable in-memory implementation of the Storage interface.
 * Use it in tests that need to exercise localStorage-dependent behavior without
 * relying on the jsdom global (which is shared across tests).
 */
export class LocalStorageStub implements Storage {
  private store = new Map<string, string>();

  get length(): number {
    return this.store.size;
  }

  key(index: number): string | null {
    const keys = Array.from(this.store.keys());
    return keys[index] ?? null;
  }

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}
