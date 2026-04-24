import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  getDocs,
  collection,
  type Firestore,
} from 'firebase/firestore';
import type { StorageAdapter } from './types';
import { MANAGED_KEYS } from './types';

/**
 * Adapter magazynujący dane w kolekcji Firestore.
 *
 * Każdy klucz = jeden dokument w kolekcji `COLLECTION` o polach:
 *   { value: <string> }
 *
 * Zachowanie:
 *   - `hydrate()` wczytuje wszystkie zarządzane klucze do cache'u w pamięci
 *     (jednokrotny odczyt przy starcie aplikacji).
 *   - `getItem()` zwraca dane z cache'u (synchronicznie, jak `localStorage`).
 *   - `setItem()` / `removeItem()` aktualizują cache natychmiast, a do
 *     Firestore zapisują w tle (fire-and-forget, z logowaniem błędów).
 */
export class FirestoreAdapter implements StorageAdapter {
  readonly name = 'firestore' as const;

  private readonly COLLECTION = 'manageme_kv';
  private cache: Map<string, string> = new Map();
  private hydrated = false;
  private readonly db: Firestore;

  constructor(db: Firestore) {
    this.db = db;
  }

  async hydrate(): Promise<void> {
    if (this.hydrated) return;

    const snapshot = await getDocs(collection(this.db, this.COLLECTION));
    snapshot.forEach(d => {
      const data = d.data() as { value?: string } | undefined;
      if (data && typeof data.value === 'string') {
        this.cache.set(d.id, data.value);
      }
    });

    // Opcjonalna jednorazowa migracja danych z localStorage → Firestore,
    // jeżeli baza jest pusta, a w przeglądarce istnieją zapisane dane.
    if (snapshot.empty) {
      for (const key of MANAGED_KEYS) {
        const local = localStorage.getItem(key);
        if (local !== null) {
          this.cache.set(key, local);
          void this.writeToFirestore(key, local);
        }
      }
    }

    this.hydrated = true;
  }

  getItem(key: string): string | null {
    const v = this.cache.get(key);
    return v === undefined ? null : v;
  }

  setItem(key: string, value: string): void {
    this.cache.set(key, value);
    void this.writeToFirestore(key, value);
  }

  removeItem(key: string): void {
    this.cache.delete(key);
    void this.deleteFromFirestore(key);
  }

  private async writeToFirestore(key: string, value: string): Promise<void> {
    try {
      await setDoc(doc(this.db, this.COLLECTION, key), { value });
    } catch (err) {
      console.error('[FirestoreAdapter] zapis nie powiódł się:', key, err);
    }
  }

  private async deleteFromFirestore(key: string): Promise<void> {
    try {
      await deleteDoc(doc(this.db, this.COLLECTION, key));
    } catch (err) {
      console.error('[FirestoreAdapter] usunięcie nie powiodło się:', key, err);
    }
  }

  /** Pomocnicze — sprawdzenie czy dokument istnieje (wykorzystywane w testach). */
  async keyExistsInDb(key: string): Promise<boolean> {
    const snap = await getDoc(doc(this.db, this.COLLECTION, key));
    return snap.exists();
  }
}
