import { createLocalStorageRepository, type DataRepository } from './repository';

/** Swap this one line for a cloud-backed repository later. */
export const repository: DataRepository = createLocalStorageRepository();

export { BACKUP_KEY, STORAGE_KEY } from './repository';
export type { DataRepository, LoadResult, SaveResult } from './repository';
