import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import type { AppData } from '../types';
import { createSeedData } from '../data/seed';
import { BACKUP_KEY, repository, STORAGE_KEY } from '../storage';

interface StoreValue {
  data: AppData;
  /** Apply a pure update. The result is saved immediately. */
  update: (fn: (d: AppData) => AppData) => void;
  /** Replace everything (used by Import and Reset). Also clears any "unreadable data" block. */
  replaceAll: (next: AppData) => void;
  /** Set when saved data could not be read. Saving is paused so nothing is overwritten. */
  loadIssue: string | null;
  /** Set when the last save failed (e.g. storage full). */
  saveError: string | null;
  /** Accept the example content and resume saving (the unreadable original is kept as a backup). */
  startFresh: () => void;
  /** Raw text of unreadable data, if any, so the user can download it. */
  unreadableRaw: () => string | null;
  /** True when the app is showing example content that was just created. */
  firstRun: boolean;
}

const Ctx = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [initial] = useState(() => repository.load());
  const [data, setData] = useState<AppData>(initial.data);
  const dataRef = useRef<AppData>(initial.data);
  const [loadIssue, setLoadIssue] = useState<string | null>(initial.status === 'corrupt' ? initial.reason : null);
  const blockedRef = useRef(initial.status === 'corrupt');
  const [saveError, setSaveError] = useState<string | null>(null);

  const persist = useCallback((next: AppData) => {
    if (blockedRef.current) return;
    const res = repository.save(next);
    setSaveError(res.ok ? null : res.message);
  }, []);

  const update = useCallback(
    (fn: (d: AppData) => AppData) => {
      const next = fn(dataRef.current);
      dataRef.current = next;
      setData(next);
      persist(next);
    },
    [persist],
  );

  const replaceAll = useCallback(
    (next: AppData) => {
      blockedRef.current = false;
      setLoadIssue(null);
      dataRef.current = next;
      setData(next);
      persist(next);
    },
    [persist],
  );

  const startFresh = useCallback(() => replaceAll(createSeedData()), [replaceAll]);

  const unreadableRaw = useCallback(() => {
    try {
      return window.localStorage.getItem(BACKUP_KEY) ?? window.localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  }, []);

  const value = useMemo<StoreValue>(
    () => ({ data, update, replaceAll, loadIssue, saveError, startFresh, unreadableRaw, firstRun: initial.status === 'seeded' }),
    [data, update, replaceAll, loadIssue, saveError, startFresh, unreadableRaw, initial.status],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): StoreValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStore must be used inside <StoreProvider>');
  return v;
}
