import { defaultSave } from './save';
import {
  parseDurable, prepareCommit, serializeDurable, upgradeToV3,
  type CommitResult, type DurableRepository, type LoadResult, type SaveV3,
} from './durable';

type SavedRow = { name: 'main' | 'backup' | 'quarantine'; raw: string };
const DB_NAME = 'idle-souls-durable';
const TABLE = 'documents';

/**
 * IndexedDB readwrite transactions serialize across browser tabs.
 * No in-memory fallbacks and no successful acknowledgement before oncomplete.
 * This adapter is for browsers; native Android must use the SQLite adapter.
 */
export class IndexedDbDurableRepository implements DurableRepository {
  constructor(
    private readonly idb: IDBFactory = indexedDB,
    private readonly legacy: Pick<Storage, 'getItem'> | null = typeof localStorage === 'undefined' ? null : localStorage,
  ) {}
  private open(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      let request: IDBOpenDBRequest;
      try { request = this.idb.open(DB_NAME, 1); } catch (e) { reject(e); return; }
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(TABLE)) request.result.createObjectStore(TABLE, { keyPath: 'name' });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error('Cannot open IndexedDB'));
      request.onblocked = () => reject(new Error('Durable save is blocked by another tab'));
    });
  }
  private transaction<T>(operation: (store: IDBObjectStore, finish: (value: T) => void, fail: (error: string) => void) => void): Promise<T> {
    return this.open().then(db => new Promise<T>((resolve, reject) => {
      let done = false;
      let value: T;
      const tx = db.transaction(TABLE, 'readwrite');
      const store = tx.objectStore(TABLE);
      const fail = (error: string) => { if (!done) { done = true; try { tx.abort(); } catch {} reject(new Error(error)); } };
      const finish = (v: T) => { value = v; };
      tx.oncomplete = () => { db.close(); if (!done) resolve(value); };
      tx.onabort = () => { db.close(); if (!done) reject(tx.error ?? new Error('Durable transaction aborted')); };
      tx.onerror = () => { /* onabort reports the failed transaction */ };
      try { operation(store, finish, fail); } catch (e) { fail(String(e)); }
    }));
  }
  private async legacyText(): Promise<string | null> {
    // Catch SecurityError/denied storage as a failure, not a new save.
    if (!this.legacy) return null;
    return this.legacy.getItem('idle-souls.save');
  }
  async load(): Promise<LoadResult> {
    try {
      const legacyText = await this.legacyText();
      return await this.transaction<LoadResult>((store, finish, fail) => {
        const request = store.get('main');
        request.onerror = () => fail('Cannot read durable save');
        request.onsuccess = () => {
          const existing = (request.result as SavedRow | undefined)?.raw;
          if (existing) {
            const parsed = parseDurable(existing);
            if (parsed.ok) { finish({ ok: true, save: parsed.save, migratedFrom: parsed.migratedFrom, recoveredBackup: false }); return; }
            const backup = store.get('backup');
            backup.onerror = () => fail('Cannot read durable backup');
            backup.onsuccess = () => finish({ ok: false, error: parsed.error, backupAvailable: !!(backup.result as SavedRow | undefined)?.raw });
            return;
          }
          const parsed = legacyText === null ? { ok: true as const, save: upgradeToV3(defaultSave()), migratedFrom: null } : parseDurable(legacyText);
          if (!parsed.ok) { finish({ ok: false, error: 'Legacy save preserved; migration refused: ' + parsed.error, backupAvailable: false }); return; }
          // The source legacy record is never overwritten or deleted. Only a fully checked V3 copy is committed.
          const raw = serializeDurable(parsed.save);
          store.put({ name: 'main', raw } satisfies SavedRow);
          finish({ ok: true, save: parsed.save, migratedFrom: legacyText === null ? null : parsed.migratedFrom, recoveredBackup: false });
        };
      });
    } catch (error) { return { ok: false, error: 'Durable save unavailable: ' + String(error), backupAvailable: false }; }
  }
  async readBackup(): Promise<string | null> {
    return this.transaction<string | null>((store, finish, fail) => {
      const request = store.get('backup');
      request.onerror = () => fail('Cannot read backup');
      request.onsuccess = () => finish((request.result as SavedRow | undefined)?.raw ?? null);
    });
  }
  async commit(revision: number, id: string, change: (previous: SaveV3) => SaveV3): Promise<CommitResult> {
    try {
      return await this.transaction<CommitResult>((store, finish, fail) => {
        const request = store.get('main');
        request.onerror = () => fail('Cannot read current save');
        request.onsuccess = () => {
          const raw = (request.result as SavedRow | undefined)?.raw;
          if (!raw) { finish({ ok: false, error: 'No durable save; load or migrate before continuing' }); return; }
          const current = parseDurable(raw);
          if (!current.ok) { finish({ ok: false, error: current.error }); return; }
          const result = prepareCommit(current.save, revision, id, change);
          if (result.ok && !result.duplicate) {
            store.put({ name: 'backup', raw } satisfies SavedRow);
            store.put({ name: 'main', raw: serializeDurable(result.save) } satisfies SavedRow);
          }
          finish(result);
        };
      });
    } catch (error) { return { ok: false, error: 'Save write failed: ' + String(error) }; }
  }
  async import(raw: string, replaceExisting: boolean): Promise<CommitResult> {
    const parsed = parseDurable(raw);
    if (!parsed.ok) return parsed;
    try {
      return await this.transaction<CommitResult>((store, finish, fail) => {
        const request = store.get('main');
        request.onerror = () => fail('Cannot inspect existing save before import');
        request.onsuccess = () => {
          const current = (request.result as SavedRow | undefined)?.raw;
          if (current && !replaceExisting) { finish({ ok: false, error: 'Replacement requires explicit confirmation' }); return; }
          if (current) {
            store.put({ name: 'quarantine', raw: current } satisfies SavedRow);
            const checked = parseDurable(current);
            if (checked.ok) store.put({ name: 'backup', raw: current } satisfies SavedRow);
          }
          store.put({ name: 'main', raw: serializeDurable(parsed.save) } satisfies SavedRow);
          finish({ ok: true, save: parsed.save, duplicate: false });
        };
      });
    } catch (error) { return { ok: false, error: 'Import failed: ' + String(error) }; }
  }
  /** Replacing the primary with a confirmed backup preserves even the corrupted original. */
  async restoreBackup(): Promise<CommitResult> {
    const raw = await this.readBackup();
    return raw ? this.import(raw, true) : { ok: false, error: 'No backup available' };
  }
}
