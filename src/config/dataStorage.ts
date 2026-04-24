export type DataStorageMode = 'localStorage' | 'firebase';

const STORAGE_MODE_KEY = 'manageme_data_storage_mode';
const rawStorageMode = import.meta.env.VITE_DATA_STORAGE?.toString();

const mapStorageMode = (value: string | undefined): DataStorageMode => {
  const normalized = value?.toLowerCase();

  if (normalized === 'localstorage' || normalized === 'local') {
    return 'localStorage';
  }

  if (normalized === 'firebase' || normalized === 'firestore') {
    return 'firebase';
  }

  return 'firebase';
};

const DEFAULT_STORAGE_MODE = mapStorageMode(rawStorageMode);

export const getDataStorageMode = (): DataStorageMode => {
  const fromRuntime = typeof window !== 'undefined'
    ? window.localStorage.getItem(STORAGE_MODE_KEY) ?? undefined
    : undefined;
  return mapStorageMode(fromRuntime ?? DEFAULT_STORAGE_MODE);
};

export const setDataStorageMode = (mode: DataStorageMode): void => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_MODE_KEY, mode);
  window.dispatchEvent(
    new CustomEvent<DataStorageMode>('app-storage-mode-changed', { detail: mode }),
  );
};

export const DATA_STORAGE_MODE: DataStorageMode = getDataStorageMode();
