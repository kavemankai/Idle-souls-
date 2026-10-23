import type { SimApi } from '../combat/simApi';
import type { Cache } from '../save/saveTypes';
import { WorldGraph } from '../world/worldGraph';
import { WorldRunner, type WorldResult } from '../world/worldRunner';
import { buildChronicle, type Chronicle } from './chronicle';
import { Expedition } from './expedition';
import type { ExpeditionPlan } from './plan';
import { bossAt } from '../world/bosses';
import { Progress } from '../progression/experience';

export interface ExpeditionConfig {
  seed: number; level: number; focus: string; plan: ExpeditionPlan;
  /** Rooms the player has seen when the expedition starts. */
  known: readonly string[];
  /** The recovery cache waiting at camp's last record, if any. */
  cache?: Cache | null;
  /** Gate Keys issued from camp (0 to 2, never more than the bank holds), one-time claims already made, links already open for good. */
  issueKeys?: number; claims?: readonly string[]; openLinks?: readonly string[];
  /** Bosses defeated for good (the save's `world.defeatedBosses`). Their arenas stand empty unless a rematch objective brings a temporary one back. */
  defeatedBosses?: readonly string[];
  /**
   * Temporary progression (design level 1 to 9 through the level table; `level` is then ignored). The adventurer carries `kitRations` starter rations
   * (default 2, not loot) and drinks and rests by the plan's rules. Omit for the fixed level with no drinking and no sanctuary, as before.
   */
  progression?: { startLevel: number; kitRations?: number };
  /** Tests only. */
  hpOverride?: number; maxFightTicks?: number; encounters?: Readonly<Record<string, string>>;
}
export interface ExpeditionRun { world: WorldRunner; expedition: Expedition; startKnown: ReadonlySet<string> }
export function startExpedition(sim: SimApi, cfg: ExpeditionConfig, graph = new WorldGraph()): ExpeditionRun {
  const progress = cfg.progression ? new Progress(cfg.progression.startLevel, cfg.plan.sanctuaryChoice) : null;
  const beaten = new Set(cfg.defeatedBosses ?? []);
  const rematches = cfg.plan.objectives.filter(o => o.kind === 'rematch' && bossAt(o.room) && beaten.has(bossAt(o.room)!.id));
  // The limited-healing rematch: nothing to drink all expedition, no starter rations and no drinking rule.
  const limited = rematches.some(o => o.variant === 'limited-healing');
  const expedition = new Expedition(cfg.plan, graph, cfg.known, cfg.cache ?? null, cfg.openLinks ?? [], progress, cfg.defeatedBosses ?? []);
  const world = new WorldRunner(sim, {
    seed: cfg.seed, level: cfg.level, focus: cfg.focus, doctrine: cfg.plan.doctrine, navigator: expedition,
    progress: progress ?? undefined, kitRations: progress && !limited ? cfg.progression!.kitRations ?? 2 : 0, drinkBelowPct: progress && !limited ? cfg.plan.drinkBelowPct : 0,
    defeatedBosses: cfg.defeatedBosses, rematchRooms: rematches.map(o => o.room),
    hpOverride: cfg.hpOverride, maxFightTicks: cfg.maxFightTicks, encounters: cfg.encounters, cache: cfg.cache, issuedKeys: cfg.issueKeys, claims: cfg.claims, openLinks: cfg.openLinks,
  }, graph);
  world.dispatch();
  return { world, expedition, startKnown: new Set(cfg.known) };
}
export function finishChronicle(cfg: ExpeditionConfig, run: ExpeditionRun): { result: WorldResult; chronicle: Chronicle } {
  const result = run.world.result();
  return { result, chronicle: buildChronicle(cfg.seed, run.expedition, result, run.startKnown, cfg.cache ?? null, cfg.defeatedBosses ?? []) };
}
/** Headless expedition from plan to Chronicle. */
export function runExpedition(sim: SimApi, cfg: ExpeditionConfig, maxTicks = 30 * 3000, graph = new WorldGraph()) {
  const run = startExpedition(sim, cfg, graph);
  while (!run.world.terminal && run.world.tick < maxTicks) run.world.step();
  return finishChronicle(cfg, run);
}
