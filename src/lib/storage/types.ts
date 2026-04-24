/**
 * Warstwa abstrakcji nad magazynem danych (key-value).
 *
 * API jest synchroniczne (jak `localStorage`), aby zminimalizować zmiany
 * w istniejących serwisach. Implementacje oparte o bazę danych używają
 * cache'u w pamięci hydratowanego przy starcie aplikacji (funkcja
 * `hydrate()` na adapterze) i zapisują dane do bazy w tle.
 */
export interface StorageAdapter {
  /** Nazwa backendu — do celów diagnostycznych i UI. */
  readonly name: 'localStorage' | 'firestore';

  /**
   * Hydratacja cache z bazy danych (tylko backendy asynchroniczne).
   * Dla `localStorage` wywołanie jest no-op.
   */
  hydrate(): Promise<void>;

  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** Lista kluczy zarządzanych przez aplikację (używane przy hydratacji). */
export const MANAGED_KEYS = [
  'manageme_projects',
  'manageme_active_project',
  'manageme_stories',
  'manageme_tasks',
  'manageme_notifications',
  'app_users',
  'logged_in_user',
] as const;

export type ManagedKey = (typeof MANAGED_KEYS)[number];
