import { SAVE_VERSION, defaultSave, type Bank, type SaveV1 } from './saveTypes';
export * from './saveTypes';

/** Stable text for a save: keys sorted, then a checksum line so a hand-edited or truncated file is caught. */
export function canonical(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(canonical).join(',')}]`;
  if (v && typeof v === 'object') return `{${Object.keys(v).sort().map(k => `${JSON.stringify(k)}:${canonical((v as Record<string, unknown>)[k])}`).join(',')}}`;
  return JSON.stringify(v);
}
export function checksum(text: string): string {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619) >>> 0;
  return h.toString(16).padStart(8, '0');
}
/** Wrap any document in the save envelope. Used for saves and for migration tests. */
export function wrap(doc: unknown): string { return JSON.stringify({ format: 'idle-souls-save', checksum: checksum(canonical(doc)), data: doc }); }
export function serialize(save: SaveV1): string { return wrap(JSON.parse(canonical(save))); }

export type ParseResult = { ok: true; save: SaveV1; migratedFrom: number | null } | { ok: false; error: string };
type Migration = (old: Record<string, unknown>) => Record<string, unknown>;
/** MIGRATIONS[n] turns a version n document into version n + 1. Version 0 was a sketch with a flat shape; it exists to prove the chain. */
export const MIGRATIONS: Record<number, Migration> = {
  0: old => ({
    version: 1, build: String(old.build ?? 'unknown'),
    world: { discovered: old.discovered ?? ['C0'], openedLinks: [], defeatedBosses: [], keysBanked: 0 },
    camp: { bank: { gold: Number(old.gold ?? 0), supplies: {}, gear: [], mastery: 0 }, cache: null, expeditions: 0, deaths: 0 },
    settings: defaultSave().settings,
  }),
};

export function parse(text: string): ParseResult {
  let outer: unknown;
  try { outer = JSON.parse(text); } catch { return { ok: false, error: 'The save is not valid JSON.' }; }
  if (!outer || typeof outer !== 'object') return { ok: false, error: 'The save is not an object.' };
  const o = outer as { format?: unknown; checksum?: unknown; data?: unknown };
  if (o.format !== 'idle-souls-save') return { ok: false, error: 'This is not an Idle Souls save.' };
  if (typeof o.checksum !== 'string' || o.data === undefined) return { ok: false, error: 'The save is missing its checksum or data.' };
  if (checksum(canonical(o.data)) !== o.checksum) return { ok: false, error: 'The save does not match its checksum; it was edited or cut short.' };
  let doc = o.data as Record<string, unknown>;
  const from = typeof doc.version === 'number' ? doc.version : -1;
  if (!Number.isInteger(from) || from < 0) return { ok: false, error: 'The save has no version.' };
  if (from > SAVE_VERSION) return { ok: false, error: `The save is version ${from}; this build reads up to ${SAVE_VERSION}. Update the game to open it.` };
  for (let v = from; v < SAVE_VERSION; v++) {
    const step = MIGRATIONS[v];
    if (!step) return { ok: false, error: `No migration from version ${v}.` };
    doc = step(doc);
  }
  const problems = validate(doc);
  if (problems.length) return { ok: false, error: `The save is not valid: ${problems.join('; ')}.` };
  return { ok: true, save: doc as unknown as SaveV1, migratedFrom: from === SAVE_VERSION ? null : from };
}

const isBank = (b: unknown): b is Bank => !!b && typeof b === 'object' && typeof (b as Bank).gold === 'number' && typeof (b as Bank).mastery === 'number' && Array.isArray((b as Bank).gear) && !!(b as Bank).supplies && typeof (b as Bank).supplies === 'object';
/** Shape check for a version 1 document. */
export function validate(doc: Record<string, unknown>): string[] {
  const p: string[] = [];
  const world = doc.world as SaveV1['world'] | undefined, camp = doc.camp as SaveV1['camp'] | undefined, st = doc.settings as SaveV1['settings'] | undefined;
  if (doc.version !== 1) p.push('version is not 1');
  if (!world || !Array.isArray(world.discovered) || !Array.isArray(world.openedLinks) || !Array.isArray(world.defeatedBosses) || typeof world.keysBanked !== 'number') p.push('world memory is malformed');
  if (!camp || !isBank(camp.bank) || typeof camp.expeditions !== 'number' || typeof camp.deaths !== 'number') p.push('camp is malformed');
  else if (camp.cache !== null && (typeof camp.cache.room !== 'string' || !isBank(camp.cache.contents))) p.push('the cache is malformed');
  if (!st || typeof st.music !== 'number' || typeof st.effects !== 'number' || typeof st.reducedFx !== 'boolean') p.push('settings are malformed');
  return p;
}

/** Rules that must hold in every save, whatever wrote it. Returns what is broken. */
export function validateInvariants(save: SaveV1): string[] {
  const p: string[] = [], banks: [string, Bank][] = [['bank', save.camp.bank]];
  if (save.camp.cache) banks.push(['cache', save.camp.cache.contents]);
  for (const [name, b] of banks) {
    if (b.gold < 0 || b.mastery < 0 || !Number.isFinite(b.gold)) p.push(`${name} has negative or invalid gold or mastery`);
    for (const [k, n] of Object.entries(b.supplies)) if (n < 0 || !Number.isInteger(n)) p.push(`${name} has an invalid count of ${k}`);
  }
  if (save.world.keysBanked < 0 || !Number.isInteger(save.world.keysBanked)) p.push('banked keys must be a whole number of at least 0');
  if (new Set(save.world.discovered).size !== save.world.discovered.length) p.push('a room is discovered twice');
  return p;
}

export interface SaveStore { read(): string | null; write(text: string): void }
export class MemoryStore implements SaveStore {
  private text: string | null = null;
  read() { return this.text; }
  write(text: string) { this.text = text; }
}
/** Browser storage that never throws: if it is blocked or full, saves stay in memory and `degraded` says so. */
export class LocalStore implements SaveStore {
  degraded = false;
  private readonly memory = new MemoryStore();
  constructor(private readonly key = 'idle-souls.save', private readonly storage: Pick<Storage, 'getItem' | 'setItem'> | undefined = (typeof localStorage === 'undefined' ? undefined : localStorage)) {}
  read(): string | null {
    try { const t = this.storage?.getItem(this.key) ?? null; if (t !== null) return t; } catch { this.degraded = true; }
    return this.memory.read();
  }
  write(text: string) {
    this.memory.write(text);
    try { this.storage?.setItem(this.key, text); } catch { this.degraded = true; }
  }
}

/** Load from a store; a missing or damaged save gives a fresh one and says why, and never overwrites the damaged text. */
export function load(store: SaveStore, build = 'dev'): { save: SaveV1; note: string | null } {
  const text = store.read();
  if (text === null) return { save: defaultSave(build), note: null };
  const r = parse(text);
  return r.ok ? { save: r.save, note: r.migratedFrom === null ? null : `Updated an older save (version ${r.migratedFrom}).` } : { save: defaultSave(build), note: r.error };
}
export function persist(store: SaveStore, save: SaveV1): void {
  const bad = validateInvariants(save);
  if (bad.length) throw new Error(`refusing to save a broken state: ${bad.join('; ')}`);
  store.write(serialize(save));
}
export const exportSave = (save: SaveV1): string => serialize(save);
/** Import never writes partial state: it validates the whole text, then writes once. */
export function importSave(store: SaveStore, text: string): { ok: true } | { ok: false; error: string } {
  const r = parse(text);
  if (!r.ok) return r;
  const bad = validateInvariants(r.save);
  if (bad.length) return { ok: false, error: `The save breaks a rule: ${bad.join('; ')}.` };
  store.write(serialize(r.save));
  return { ok: true };
}
