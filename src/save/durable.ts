import { checksum, canonical, parse as parseLegacy, serialize as serializeLegacy, validateInvariants, wrap, type SaveV2 } from './save';
import { WorldGraph } from '../world/worldGraph';
import { BOSSES } from '../world/bosses';
import type { ExpeditionConfig } from '../expedition/run';
import type { Order } from '../expedition/expedition';

/**
 * V3 is a separate durable format; the synchronous V2 API remains available for
 * existing development fixtures until the player is migrated to this repository.
 */
export const DURABLE_VERSION = 3;
export const RULES_VERSION = 1;
export const CONTENT_VERSION = 1;
export const MAX_REPLAY_TICKS = 90000;
export const MAX_REPLAY_COMMANDS = 2048;
export const MAX_TRANSACTIONS = 4096;

export interface PermanentRanks { training: number; weapon: number; shield: number }
export const emptyPermanent = (): PermanentRanks => ({ training: 0, weapon: 0, shield: 0 });
export interface RecordedOrder { tick: number; order: Order }
export interface ActiveExpeditionV3 {
  version: 1;
  id: string;
  /** Includes the full seeded plan, known-world state and the permanent build frozen at dispatch. */
  config: ExpeditionConfig;
  /** Every successfully accepted player order, in call order, tagged with the current simulation tick. */
  commands: RecordedOrder[];
  tick: number;
  /** Digest of canonical authoritative continuation data at this exact tick. */
  fingerprint: string;
  rulesVersion: number;
  contentVersion: number;
}
export interface SaveV3 extends Omit<SaveV2, 'version' | 'camp'> {
  version: 3;
  revision: number;
  rulesVersion: number;
  contentVersion: number;
  camp: SaveV2['camp'] & { permanent: PermanentRanks };
  activeExpedition: ActiveExpeditionV3 | null;
  /** Bounded idempotency cache plus active expedition ID/counter checks for long-lived settlement safety. */
  processedTransactionIds: string[];
}
export const toLegacy = (save: SaveV3): SaveV2 => ({
  version: 2, build: save.build, world: save.world,
  camp: { bank: save.camp.bank, cache: save.camp.cache, expeditions: save.camp.expeditions, deaths: save.camp.deaths },
  settings: save.settings,
});
export function upgradeToV3(legacy: SaveV2): SaveV3 {
  const bad = validateInvariants(legacy);
  if (bad.length) throw new Error('Unsafe legacy save: ' + bad.join('; '));
  // Deep copy so the imported V2 object cannot be changed by later UI mutations.
  const base = JSON.parse(serializeLegacy(legacy)) as { data: SaveV2 };
  const s = base.data;
  return {
    ...s, version: 3, revision: 0, rulesVersion: RULES_VERSION,
    contentVersion: CONTENT_VERSION, camp: { ...s.camp, permanent: emptyPermanent() },
    activeExpedition: null, processedTransactionIds: [],
  };
}
const record = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const count = (v: unknown, max = Number.MAX_SAFE_INTEGER): v is number =>
  typeof v === 'number' && Number.isSafeInteger(v) && v >= 0 && v <= max;
const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const strings = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every(x => typeof x === 'string' && x.length > 0 && x.length <= 180) && new Set(v).size === v.length;
const safeId = (v: unknown): v is string => typeof v === 'string' && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(v);
const graph = new WorldGraph();
const validRooms = new Set(graph.rooms.keys());
const validLinks = new Set(graph.links.map(l => WorldGraph.linkKey(l.from, l.to)));
const validBosses = new Set(Object.keys(BOSSES));
function bankProblems(value: unknown, at: string): string[] {
  if (!record(value)) return [at + ' is not an object'];
  const b = value;
  const problems: string[] = [];
  for (const k of ['gold', 'mastery', 'keys', 'prepared'] as const) if (!count(b[k])) problems.push(at + '.' + k + ' must be a nonnegative integer');
  if (!record(b.supplies)) problems.push(at + '.supplies must be an object');
  else for (const [k, n] of Object.entries(b.supplies)) {
    if (!/^[a-z][a-z0-9-]{0,63}$/.test(k) || !count(n)) problems.push(at + '.supplies contains invalid item or quantity ' + k);
  }
  if (!strings(b.gear)) problems.push(at + '.gear has invalid or duplicate IDs');
  else if (b.gear.some((g: string) => g === 'starter-sword' || g === 'starter-shield')) problems.push(at + '.gear contains protected starter equipment');
  return problems;
}
function validateCheckpoint(v: unknown): string[] {
  if (!record(v)) return ['activeExpedition must be an object'];
  const p: string[] = [];
  if (v.version !== 1 || v.rulesVersion !== RULES_VERSION || v.contentVersion !== CONTENT_VERSION) p.push('checkpoint version is incompatible');
  if (!safeId(v.id)) p.push('invalid active expedition ID');
  if (!count(v.tick, MAX_REPLAY_TICKS)) p.push('checkpoint tick is outside replay bound');
  if (typeof v.fingerprint !== 'string' || !/^[0-9a-f]{8}$/.test(v.fingerprint)) p.push('invalid checkpoint fingerprint');
  if (!Array.isArray(v.commands) || v.commands.length > MAX_REPLAY_COMMANDS) p.push('checkpoint commands exceed bound');
  else {
    let last = -1;
    for (const cmd of v.commands) {
      if (!record(cmd) || !count(cmd.tick, MAX_REPLAY_TICKS) || cmd.tick < last || cmd.tick > (v.tick as number) ||
        !record(cmd.order) || (cmd.order.type !== 'retreat' && cmd.order.type !== 'redirect') ||
        (cmd.order.type === 'redirect' && (typeof cmd.order.room !== 'string' || !validRooms.has(cmd.order.room)))) {
        p.push('checkpoint has an invalid or out-of-order command'); break;
      }
      last = cmd.tick;
    }
  }
  if (!record(v.config)) p.push('checkpoint configuration is missing');
  else {
    const c = v.config;
    if (!count(c.seed) || c.seed === 0 || !count(c.level) || typeof c.focus !== 'string') p.push('checkpoint seed/level/focus is invalid');
    if (!strings(c.known) || c.known.some((x: string) => !validRooms.has(x))) p.push('checkpoint known rooms are invalid');
    if (!record(c.plan) || !Array.isArray(c.plan.objectives) || c.plan.objectives.length > 6) p.push('checkpoint plan is invalid');
    if (c.issueKeys !== undefined && !count(c.issueKeys, 2)) p.push('invalid issued key count');
    if (!record(c.progression) || !count(c.progression.startLevel, 9) || c.progression.startLevel === 0) p.push('checkpoint progress is invalid');
  }
  return p;
}
/** Do not dereference untrusted nested fields before their shape is established. */
export function validateV3(value: unknown): string[] {
  if (!record(value)) return ['save is not an object'];
  const p: string[] = [];
  if (value.version !== 3) p.push('save version is not 3');
  if (typeof value.build !== 'string' || value.build.length > 200) p.push('invalid build identifier');
  if (!count(value.revision)) p.push('revision must be a nonnegative integer');
  if (value.rulesVersion !== RULES_VERSION || value.contentVersion !== CONTENT_VERSION) p.push('rules/content version is incompatible');
  if (!record(value.world)) p.push('world memory is malformed');
  else {
    const w = value.world;
    if (!strings(w.discovered) || w.discovered.some((x: string) => !validRooms.has(x)) || !w.discovered.includes('C0')) p.push('discovered rooms are invalid');
    if (!strings(w.openedLinks) || w.openedLinks.some((x: string) => !validLinks.has(x))) p.push('opened links are invalid');
    if (!strings(w.defeatedBosses) || w.defeatedBosses.some((x: string) => !validBosses.has(x))) p.push('defeated bosses are invalid');
    if (!strings(w.claims)) p.push('claimed pickups are invalid');
  }
  if (!record(value.camp)) p.push('camp is malformed');
  else {
    const c = value.camp;
    p.push(...bankProblems(c.bank, 'camp.bank'));
    if (!count(c.expeditions) || !count(c.deaths) || (count(c.deaths) && count(c.expeditions) && c.deaths > c.expeditions)) p.push('camp expedition/death counters are invalid');
    if (c.cache !== null) {
      if (!record(c.cache) || typeof c.cache.room !== 'string' || !validRooms.has(c.cache.room) ||
          !finite(c.cache.x) || !finite(c.cache.y)) p.push('cache location is malformed');
      else p.push(...bankProblems(c.cache.contents, 'camp.cache.contents'));
    }
    if (!record(c.permanent) ||
      !count(c.permanent.training, 3) || !count(c.permanent.weapon, 2) || !count(c.permanent.shield, 2)) p.push('permanent ranks are invalid');
    if (record(c.bank) && c.bank.prepared !== 0) p.push('bank contains issued keys');
  }
  if (!record(value.settings) || !finite(value.settings.music) || !finite(value.settings.effects) ||
    value.settings.music < 0 || value.settings.music > 1 || value.settings.effects < 0 || value.settings.effects > 1 ||
    typeof value.settings.reducedFx !== 'boolean') p.push('settings are malformed');
  if (!strings(value.processedTransactionIds) || value.processedTransactionIds.length > MAX_TRANSACTIONS ||
    value.processedTransactionIds.some((x: string) => !safeId(x))) p.push('processed transaction IDs are invalid');
  if (value.activeExpedition !== null) p.push(...validateCheckpoint(value.activeExpedition));
  // The version-2 invariant checker remains the source of existing bank/cache rules.
  if (p.length === 0) {
    try { p.push(...validateInvariants(toLegacy(value as unknown as SaveV3))); }
    catch { p.push('legacy bank/world invariants could not be validated'); }
  }
  return p;
}
export type DurableParse = { ok: true; save: SaveV3; migratedFrom: number | null } | { ok: false; error: string };
export function parseDurable(raw: string): DurableParse {
  let input: unknown;
  try { input = JSON.parse(raw); } catch { return { ok: false, error: 'Save is not valid JSON' }; }
  if (!record(input) || input.format !== 'idle-souls-save' || typeof input.checksum !== 'string' || !('data' in input))
    return { ok: false, error: 'Missing Idle Souls envelope' };
  try {
    if (checksum(canonical(input.data)) !== input.checksum) return { ok: false, error: 'Save checksum mismatch' };
  } catch { return { ok: false, error: 'Malformed data cannot be checksummed' }; }
  if (record(input.data) && input.data.version === 3) {
    const problems = validateV3(input.data);
    return problems.length ? { ok: false, error: problems.join('; ') } :
      { ok: true, save: input.data as unknown as SaveV3, migratedFrom: null };
  }
  // Read and migrate v0/v1/v2 only after the old parser has verified the envelope.
  let legacy: ReturnType<typeof parseLegacy>;
  try { legacy = parseLegacy(raw); } catch { return { ok: false, error: 'Legacy save structure is malformed' }; }
  if (!legacy.ok) return legacy;
  try {
    const upgraded = upgradeToV3(legacy.save);
    const problems = validateV3(upgraded);
    return problems.length ? { ok: false, error: problems.join('; ') } : { ok: true, save: upgraded, migratedFrom: legacy.migratedFrom ?? 2 };
  } catch (error) { return { ok: false, error: 'Unsafe legacy save: ' + String(error) }; }
}
export function serializeDurable(save: SaveV3): string {
  const problems = validateV3(save);
  if (problems.length) throw new Error('Refusing unsafe save: ' + problems.join('; '));
  return wrap(JSON.parse(canonical(save)));
}
export type CommitResult = { ok: true; save: SaveV3; duplicate: boolean } | { ok: false; error: string; conflict?: boolean };
export type LoadResult = { ok: true; save: SaveV3; migratedFrom: number | null; recoveredBackup: boolean } | { ok: false; error: string; backupAvailable: boolean };
export interface DurableRepository {
  load(): Promise<LoadResult>;
  commit(revision: number, id: string, change: (previous: SaveV3) => SaveV3): Promise<CommitResult>;
  readBackup(): Promise<string | null>;
  /** Import may replace an existing save only after explicit user consent. */
  import(raw: string, replaceExisting: boolean): Promise<CommitResult>;
}
export function prepareCommit(old: SaveV3, revision: number, id: string, fn: (old: SaveV3) => SaveV3): CommitResult {
  if (!safeId(id)) return { ok: false, error: 'Transaction ID is invalid' };
  if (old.processedTransactionIds.includes(id)) return { ok: true, save: old, duplicate: true };
  if (old.revision !== revision) return { ok: false, error: 'Concurrent revision conflict', conflict: true };
  let next: SaveV3;
  try { next = fn(structuredClone(old)); } catch (e) { return { ok: false, error: String(e) }; }
  if (next.revision !== old.revision) return { ok: false, error: 'Reducer changed the revision itself' };
  if (next.version !== 3) return { ok: false, error: 'Reducer changed save version' };
  next.revision = old.revision + 1;
  next.processedTransactionIds = [...old.processedTransactionIds, id].slice(-MAX_TRANSACTIONS);
  const problems = validateV3(next);
  return problems.length ? { ok: false, error: problems.join('; ') } : { ok: true, save: next, duplicate: false };
}

/** For deterministic unit tests only. The player must never use memory as durable storage. */
export class TestDurableRepository implements DurableRepository {
  private main: string | null;
  private backup: string | null = null;
  failNextCommit = false;
  constructor(save: SaveV3) { this.main = serializeDurable(save); }
  async load(): Promise<LoadResult> {
    if (!this.main) return { ok: false, error: 'Missing primary save', backupAvailable: !!this.backup };
    const p = parseDurable(this.main);
    return p.ok ? { ok: true, save: p.save, migratedFrom: p.migratedFrom, recoveredBackup: false } :
      { ok: false, error: p.error, backupAvailable: !!this.backup };
  }
  async readBackup() { return this.backup; }
  async commit(revision: number, id: string, change: (previous: SaveV3) => SaveV3): Promise<CommitResult> {
    const current = await this.load();
    if (!current.ok) return { ok: false, error: current.error };
    const result = prepareCommit(current.save, revision, id, change);
    if (!result.ok || result.duplicate) return result;
    if (this.failNextCommit) { this.failNextCommit = false; return { ok: false, error: 'Injected storage interruption' }; }
    this.backup = this.main;
    this.main = serializeDurable(result.save);
    return result;
  }
  async import(raw: string, replaceExisting: boolean): Promise<CommitResult> {
    const parsed = parseDurable(raw);
    if (!parsed.ok) return parsed;
    if (this.main && !replaceExisting) return { ok: false, error: 'Import requires replacement confirmation' };
    this.backup = this.main;
    this.main = serializeDurable(parsed.save);
    return { ok: true, save: parsed.save, duplicate: false };
  }
}
