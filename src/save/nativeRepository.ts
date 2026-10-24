import { Capacitor, registerPlugin } from '@capacitor/core';
import { defaultSave } from './save';
import {
  parseDurable, prepareCommit, serializeDurable, upgradeToV3,
  type CommitResult, type DurableRepository, type LoadResult, type SaveV3,
} from './durable';
import { IndexedDbDurableRepository } from './indexedDbRepository';

interface NativeStorage {
  readSave(): Promise<{ raw: string | null; backup: string | null }>;
  initialize(args: { raw: string }): Promise<{ raw: string; duplicate: boolean }>;
  commit(args: { raw: string; expectedRevision: number; transactionId: string }): Promise<{ raw: string; duplicate: boolean }>;
  importSave(args: { raw: string; replaceExisting: boolean }): Promise<{ raw: string }>;
}
const bridge = registerPlugin<NativeStorage>('IdleSoulsSave');

/** Fail closed on native plugin failure; never substitute browser memory/localStorage. */
export class NativeSqliteDurableRepository implements DurableRepository {
  constructor(private readonly plugin: NativeStorage = bridge) {}
  async load(): Promise<LoadResult> {
    try {
      const current = await this.plugin.readSave();
      if (current.raw !== null) {
        const parsed = parseDurable(current.raw);
        return parsed.ok ? { ok: true, save: parsed.save, migratedFrom: parsed.migratedFrom, recoveredBackup: false } :
          { ok: false, error: parsed.error, backupAvailable: !!current.backup };
      }
      let legacy: string | null;
      try { legacy = localStorage.getItem('idle-souls.save'); }
      catch (error) { return { ok: false, error: 'Cannot inspect legacy save: ' + String(error), backupAvailable: false }; }
      const parsed = legacy === null ? { ok: true as const, save: upgradeToV3(defaultSave()), migratedFrom: null } : parseDurable(legacy);
      if (!parsed.ok) return { ok: false, error: 'Legacy source retained: ' + parsed.error, backupAvailable: false };
      const persisted = await this.plugin.initialize({ raw: serializeDurable(parsed.save) });
      const checked = parseDurable(persisted.raw);
      return checked.ok ? { ok: true, save: checked.save, migratedFrom: legacy === null ? null : parsed.migratedFrom, recoveredBackup: false } :
        { ok: false, error: checked.error, backupAvailable: false };
    } catch (error) { return { ok: false, error: 'Native SQLite storage unavailable: ' + String(error), backupAvailable: false }; }
  }
  async readBackup(): Promise<string | null> { return (await this.plugin.readSave()).backup; }
  async commit(revision: number, id: string, change: (previous: SaveV3) => SaveV3): Promise<CommitResult> {
    const old = await this.load();
    if (!old.ok) return { ok: false, error: old.error };
    const planned = prepareCommit(old.save, revision, id, change);
    if (!planned.ok || planned.duplicate) return planned;
    try {
      const write = await this.plugin.commit({ raw: serializeDurable(planned.save), expectedRevision: revision, transactionId: id });
      const check = parseDurable(write.raw);
      return check.ok ? { ok: true, save: check.save, duplicate: write.duplicate } : { ok: false, error: check.error };
    } catch (error) { return { ok: false, error: 'Native transaction failed: ' + String(error), conflict: /revision conflict/i.test(String(error)) }; }
  }
  async import(raw: string, replaceExisting: boolean): Promise<CommitResult> {
    const parsed = parseDurable(raw);
    if (!parsed.ok) return parsed;
    try {
      const answer = await this.plugin.importSave({ raw: serializeDurable(parsed.save), replaceExisting });
      const confirmed = parseDurable(answer.raw);
      return confirmed.ok ? { ok: true, save: confirmed.save, duplicate: false } : { ok: false, error: confirmed.error };
    } catch (error) { return { ok: false, error: 'Native import failed: ' + String(error) }; }
  }
}
export function playerSaveRepository(): DurableRepository {
  return Capacitor.isNativePlatform() ? new NativeSqliteDurableRepository() : new IndexedDbDurableRepository();
}
