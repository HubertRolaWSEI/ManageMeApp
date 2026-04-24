import { AppConfig, type StorageBackend } from '../../config/app-config';
import { db } from '../firebase';
import { FirestoreAdapter } from './FirestoreAdapter';
import { LocalStorageAdapter } from './LocalStorageAdapter';
import type { StorageAdapter } from './types';

let currentAdapter: StorageAdapter | null = null;

function buildAdapter(backend: StorageBackend): StorageAdapter {
  if (backend === 'firestore') {
    return new FirestoreAdapter(db);
  }
  return new LocalStorageAdapter();
}

/**
 * Zwraca aktywny adapter magazynu. Pierwsze wywołanie tworzy adapter zgodnie
 * z konfiguracją aplikacji (`AppConfig.storageBackend`).
 */
export function storage(): StorageAdapter {
  if (!currentAdapter) {
    currentAdapter = buildAdapter(AppConfig.storageBackend);
  }
  return currentAdapter;
}

/**
 * Inicjalizuje magazyn — wywoływane raz przy starcie aplikacji.
 * Hydratuje cache (dla Firestore ładuje dane z bazy).
 */
export async function initStorage(): Promise<StorageAdapter> {
  const adapter = storage();
  await adapter.hydrate();
  return adapter;
}

/** Nazwa aktywnego backendu — do UI. */
export function getActiveBackendName(): StorageBackend {
  return storage().name;
}

export type { StorageAdapter } from './types';
