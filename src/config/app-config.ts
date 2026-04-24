/**
 * Konfiguracja aplikacji ManageMe.
 *
 * Pozwala m.in. wybrać miejsce magazynowania danych aplikacji:
 *   - 'localStorage' — dane przechowywane w przeglądarce (domyślnie)
 *   - 'firestore'    — dane przechowywane w bazie NoSQL Google Firestore
 *
 * Wartość można nadpisać:
 *   1. Zmienną środowiskową VITE_STORAGE_BACKEND (w pliku .env).
 *   2. W runtime w ustawieniach aplikacji (zapis do localStorage pod
 *      kluczem `manageme_storage_backend`).
 */

export type StorageBackend = 'localStorage' | 'firestore';

const RUNTIME_KEY = 'manageme_storage_backend';

const DEFAULT_BACKEND: StorageBackend = 'localStorage';

function isValidBackend(value: unknown): value is StorageBackend {
  return value === 'localStorage' || value === 'firestore';
}

export function getConfiguredStorageBackend(): StorageBackend {
  try {
    const runtime = typeof localStorage !== 'undefined' ? localStorage.getItem(RUNTIME_KEY) : null;
    if (isValidBackend(runtime)) return runtime;
  } catch {
    // ignorujemy — brak dostępu do localStorage
  }

  const fromEnv = (import.meta as unknown as { env?: Record<string, string | undefined> }).env?.VITE_STORAGE_BACKEND;
  if (isValidBackend(fromEnv)) return fromEnv;

  return DEFAULT_BACKEND;
}

export function setStorageBackend(backend: StorageBackend) {
  if (!isValidBackend(backend)) return;
  try {
    localStorage.setItem(RUNTIME_KEY, backend);
  } catch {
    // ignorujemy
  }
}

export const AppConfig = {
  get storageBackend(): StorageBackend {
    return getConfiguredStorageBackend();
  },
};
