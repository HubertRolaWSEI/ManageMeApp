import type { StorageAdapter } from './types';

/**
 * Adapter dla `window.localStorage` — zachowanie oryginalne.
 */
export class LocalStorageAdapter implements StorageAdapter {
  readonly name = 'localStorage' as const;

  async hydrate(): Promise<void> {
    // Brak hydratacji — dane są już w `localStorage`.
  }

  getItem(key: string): string | null {
    return localStorage.getItem(key);
  }

  setItem(key: string, value: string): void {
    localStorage.setItem(key, value);
  }

  removeItem(key: string): void {
    localStorage.removeItem(key);
  }
}
