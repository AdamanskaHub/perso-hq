import { SCHEMA_VERSION, type AppData } from '../types';
import { createSeedData } from '../data/seed';
import { migrate } from './migrate';
import { sanitiseAppData } from './validate';

/**
 * Persistence boundary.
 *
 * The UI only talks to a `DataRepository`. To move to a cloud database later, write another
 * implementation of this interface (see README → "Future cloud sync") and swap it in
 * `src/storage/index.ts`. Nothing in the components needs to change.
 */

export type LoadResult =
  | { status: 'ok'; data: AppData }
  | { status: 'seeded'; data: AppData }
  | { status: 'corrupt'; data: AppData; reason: string };

export type SaveResult = { ok: true } | { ok: false; reason: 'quota' | 'unavailable' | 'unknown'; message: string };

export interface DataRepository {
  /** Reads saved data. Seeds example content only if nothing has ever been saved. */
  load(): LoadResult;
  save(data: AppData): SaveResult;
  /** Size of the stored data in bytes (approximate), if known. */
  usageBytes(): number | null;
}

export const STORAGE_KEY = 'personal-hq:data';
export const BACKUP_KEY = 'personal-hq:corrupt-backup';

interface Envelope {
  schemaVersion: number;
  savedAt: string;
  data: unknown;
}

function isQuotaError(e: unknown): boolean {
  return (
    e instanceof DOMException &&
    (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED' || e.code === 22 || e.code === 1014)
  );
}

/** Returns localStorage, or null if the browser blocks it. A full-but-readable store still counts as available. */
function getStorage(): Storage | null {
  try {
    const s = window.localStorage;
    try {
      const probe = '__phq_probe__';
      s.setItem(probe, '1');
      s.removeItem(probe);
    } catch (e) {
      if (!isQuotaError(e)) return null;
    }
    return s;
  } catch {
    return null;
  }
}

export function createLocalStorageRepository(): DataRepository {
  // Probe once; a probe on every save would double the writes.
  let cache: Storage | null | undefined;
  const storageOnce = () => (cache === undefined ? (cache = getStorage()) : cache);
  return {
    load() {
      const storage = storageOnce();
      if (!storage) {
        return { status: 'corrupt', data: createSeedData(), reason: 'Browser storage is unavailable (private mode or blocked). Changes will not be kept.' };
      }
      const raw = storage.getItem(STORAGE_KEY);
      if (raw === null) {
        const seed = createSeedData();
        // First use only: persist the example content.
        const res = this.save(seed);
        void res;
        return { status: 'seeded', data: seed };
      }
      try {
        const env = JSON.parse(raw) as Envelope;
        if (typeof env !== 'object' || env === null || typeof env.schemaVersion !== 'number') {
          throw new Error('Unrecognised storage format');
        }
        if (env.schemaVersion > SCHEMA_VERSION) {
          throw new Error(`Saved by a newer version of Personal HQ (schema ${env.schemaVersion})`);
        }
        const { data, errors } = sanitiseAppData(migrate(env.data, env.schemaVersion));
        if (!data) throw new Error(errors.slice(0, 3).join('; '));
        return { status: 'ok', data };
      } catch (e) {
        // Keep the unreadable original so nothing is silently destroyed.
        try {
          storage.setItem(BACKUP_KEY, raw);
        } catch {
          /* quota: the original in STORAGE_KEY is untouched anyway */
        }
        return {
          status: 'corrupt',
          data: createSeedData(),
          reason: e instanceof Error ? e.message : 'Saved data could not be read',
        };
      }
    },

    save(data) {
      const storage = storageOnce();
      if (!storage) return { ok: false, reason: 'unavailable', message: 'Browser storage is unavailable, so this change was not saved.' };
      const env: Envelope = { schemaVersion: SCHEMA_VERSION, savedAt: new Date().toISOString(), data };
      try {
        storage.setItem(STORAGE_KEY, JSON.stringify(env));
        return { ok: true };
      } catch (e) {
        const isQuota = isQuotaError(e);
        return isQuota
          ? { ok: false, reason: 'quota', message: 'Browser storage is full, so the latest change was not saved. Export your data now and remove some trophy images.' }
          : { ok: false, reason: 'unknown', message: 'The latest change could not be saved.' };
      }
    },

    usageBytes() {
      const storage = storageOnce();
      const raw = storage?.getItem(STORAGE_KEY);
      return raw == null ? null : new Blob([raw]).size;
    },
  };
}
