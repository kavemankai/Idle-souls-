import type { SimApi } from '../combat/simApi';
import { checksum, canonical } from '../save/save';
import {
  CONTENT_VERSION, MAX_REPLAY_COMMANDS, MAX_REPLAY_TICKS, RULES_VERSION,
  type ActiveExpeditionV3, type RecordedOrder,
} from '../save/durable';
import { WorldGraph } from '../world/worldGraph';
import type { Order } from './expedition';
import { startExpedition, type ExpeditionConfig, type ExpeditionRun } from './run';

/**
 * Version-one deterministic command journal. Rehydration starts the original
 * authoritative simulator with its original seed and replays every 30 Hz tick
 * and player input IN ORDER, including inputs entered between ticks.
 * No combat object, RNG, AI state or prototype is serialized or mutated.
 *
 * This is bounded by MAX_REPLAY_TICKS and MUST be reprofiled on low-end Android
 * before declaring device-ready mid-fight recovery. Never substitute a doorway
 * reset or a recreated fight for checked replay.
 */
export class ExpeditionCommandJournal {
  readonly commands: RecordedOrder[] = [];
  constructor(private readonly run: ExpeditionRun) {}
  order(order: Order): string | null {
    if (this.commands.length >= MAX_REPLAY_COMMANDS) return 'The expedition order journal is full. Save or extract first.';
    const refused = this.run.expedition.order(order);
    if (refused === null) this.commands.push({ tick: this.run.world.tick, order: structuredClone(order) });
    return refused;
  }
}
export function continuationFingerprint(run: ExpeditionRun): string {
  const w = run.world, ex = run.expedition, r = w.runner;
  // Every mutable field of the current JS fight is included in the proof,
  // rather than relying on the partial SimFight TypeScript interface.
  // Class instances are NOT restored from this representation.
  let fight: unknown = null;
  if (r?.fight) {
    try { fight = JSON.parse(JSON.stringify(r.fight)); }
    catch { throw new Error('Fight cannot be canonically proven; refuse checkpoint'); }
  }
  const data = {
    world: w.result(),
    worldState: { tick: w.tick, state: w.state, room: w.room, pos: w.pos, hp: w.hp, hpMax: w.hpMax, carry: w.carry, digest: w.digest },
    room: r ? {
      state: r.state, tick: r.tick, fightTicks: r.fightTicks, fights: r.fights,
      hero: r.hero, foes: r.foes, hp: r.hp, hpMax: r.hpMax, carry: r.carry,
      retreating: r.retreating, escaped: r.escaped, digest: r.digest, fight,
    } : null,
    expedition: {
      rooms: ex.rooms, known: [...ex.known].sort(), objectives: ex.objectives, intent: ex.intent,
      events: ex.events, visited: [...ex.visited].sort(), defeated: [...ex.defeated].sort(), felled: [...ex.felled].sort(),
      mode: ex.mode, target: ex.target, route: ex.route, endReason: ex.endReason,
      openLinks: [...ex.openLinks].sort(), pendingOrders: ex.pendingOrders,
    },
  };
  return checksum(canonical(data));
}
export function checkpoint(id: string, cfg: ExpeditionConfig, run: ExpeditionRun, journal: readonly RecordedOrder[]): ActiveExpeditionV3 {
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(id)) throw new Error('Invalid expedition identity');
  if (run.world.tick > MAX_REPLAY_TICKS || journal.length > MAX_REPLAY_COMMANDS) throw new Error('Replay bound exceeded');
  return {
    version: 1, id, config: structuredClone(cfg), commands: structuredClone(journal),
    tick: run.world.tick, fingerprint: continuationFingerprint(run),
    rulesVersion: RULES_VERSION, contentVersion: CONTENT_VERSION,
  };
}
/** The restore itself is deliberately synchronous, allowing exact headless parity tests. */
export function restoreExpedition(sim: SimApi, snapshot: ActiveExpeditionV3, graph = new WorldGraph()): ExpeditionRun {
  if (snapshot.version !== 1 || snapshot.rulesVersion !== RULES_VERSION || snapshot.contentVersion !== CONTENT_VERSION)
    throw new Error('This checkpoint uses incompatible rules or content; export it before upgrading');
  if (!Number.isSafeInteger(snapshot.tick) || snapshot.tick < 0 || snapshot.tick > MAX_REPLAY_TICKS ||
    snapshot.commands.length > MAX_REPLAY_COMMANDS) throw new Error('Unsafe replay bounds');
  const run = startExpedition(sim, structuredClone(snapshot.config), graph);
  let pos = 0;
  const applyOrders = () => {
    while (pos < snapshot.commands.length && snapshot.commands[pos].tick === run.world.tick) {
      const reason = run.expedition.order(snapshot.commands[pos].order);
      if (reason !== null) throw new Error('Replay input refused: ' + reason);
      pos++;
    }
  };
  while (run.world.tick < snapshot.tick) {
    if (run.world.terminal) throw new Error('Replay finished before checkpoint tick');
    applyOrders();
    run.world.step();
  }
  applyOrders(); // Includes orders accepted at the saved tick but not yet stepped.
  if (pos !== snapshot.commands.length) throw new Error('Replay command sequence was not exhausted');
  if (continuationFingerprint(run) !== snapshot.fingerprint) throw new Error('Replay parity mismatch; refusing an unsafe resume');
  return run;
}
