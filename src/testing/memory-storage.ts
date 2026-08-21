/**
 * An in-memory `Storage` for tests.
 *
 * Node 26 defines a global `localStorage` that is `undefined` unless the
 * process is started with `--localstorage-file`, and it shadows the one jsdom
 * provides. Tests therefore supply their own storage rather than reaching for
 * a global whose meaning changes with the Node version.
 */
export class MemoryStorage implements Storage {
  private readonly entries = new Map<string, string>();

  get length(): number {
    return this.entries.size;
  }

  clear(): void {
    this.entries.clear();
  }

  getItem(key: string): string | null {
    return this.entries.get(key) ?? null;
  }

  key(index: number): string | null {
    return [...this.entries.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.entries.delete(key);
  }

  setItem(key: string, value: string): void {
    this.entries.set(key, String(value));
  }
}
