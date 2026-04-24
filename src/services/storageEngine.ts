import {
  collection,
  doc,
  getDocs,
  query,
  where,
  writeBatch,
} from 'firebase/firestore';
import { getDataStorageMode } from '../config/dataStorage';
import { db } from '../lib/firebase';

const LOCAL_API_DELAY_MS = 180;

const delay = <T>(value: T): Promise<T> =>
  new Promise((resolve) => {
    setTimeout(() => resolve(value), LOCAL_API_DELAY_MS);
  });

const maybeDelay = <T>(value: T): Promise<T> =>
  getDataStorageMode() === 'localStorage' ? delay(value) : Promise.resolve(value);

const safeParseArray = <T>(raw: string | null): T[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as T[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const mapSnapshotDoc = <T extends { id: string }>(docId: string, data: object): T =>
  ({ id: docId, ...(data as Omit<T, 'id'>) }) as T;

export const readCollection = async <T extends { id: string }>(
  localStorageKey: string,
  firestoreCollection: string,
): Promise<T[]> => {
  if (getDataStorageMode() === 'localStorage') {
    return maybeDelay(safeParseArray<T>(localStorage.getItem(localStorageKey)));
  }

  const snapshot = await getDocs(collection(db, firestoreCollection));
  return snapshot.docs.map((entry) => mapSnapshotDoc<T>(entry.id, entry.data()));
};

export const readCollectionByField = async <T extends { id: string }>(
  localStorageKey: string,
  firestoreCollection: string,
  field: string,
  value: string,
): Promise<T[]> => {
  if (getDataStorageMode() === 'localStorage') {
    const all = await readCollection<T>(localStorageKey, firestoreCollection);
    return all.filter((item) => String((item as Record<string, unknown>)[field]) === value);
  }

  const collectionRef = collection(db, firestoreCollection);
  const snapshot = await getDocs(query(collectionRef, where(field, '==', value)));
  return snapshot.docs.map((entry) => mapSnapshotDoc<T>(entry.id, entry.data()));
};

export const writeCollection = async <T extends { id: string }>(
  localStorageKey: string,
  firestoreCollection: string,
  records: T[],
): Promise<void> => {
  if (getDataStorageMode() === 'localStorage') {
    localStorage.setItem(localStorageKey, JSON.stringify(records));
    await maybeDelay(undefined);
    return;
  }

  const collectionRef = collection(db, firestoreCollection);
  const existingSnapshot = await getDocs(collectionRef);
  const batch = writeBatch(db);
  const nextIds = new Set(records.map((record) => record.id));

  existingSnapshot.docs.forEach((existingDoc) => {
    if (!nextIds.has(existingDoc.id)) {
      batch.delete(existingDoc.ref);
    }
  });

  records.forEach((record) => {
    batch.set(doc(collectionRef, record.id), record);
  });

  await batch.commit();
};
