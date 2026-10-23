import type { SimApi } from '../combat/simApi';
import type { Cache } from '../save/saveTypes';
import { WorldGraph } from '../world/worldGraph';
import { WorldRunner, type WorldResult } from '../world/worldRunner';
import { buildChronicle, type Chronicle } from './chronicle';
import { Expedition } from './expedition';
import type { ExpeditionPlan } from './plan';

export interface ExpeditionConfig {
  seed: number; level: number; focus: string; plan: ExpeditionPlan;
  /** Rooms the player has seen when the expedition starts. */
  known: readonly string[];
  /** The recovery cache waiting at camp's last record, if any. */
  cache?: Cache | null;
  /** Tests only. */
  hpOverride?: number; maxFightTicks?: number; encounters?: Readonly<Record<string, string>>;
}
export interface ExpeditionRun { world: WorldRunner; expedition: Expedition; startKnown: ReadonlySet<string> }
export function startExpedition(sim: SimApi, cfg: ExpeditionConfig, graph = new WorldGraph()): ExpeditionRun {
  const expedition = new Expedition(cfg.plan, graph, cfg.known, cfg.cache ?? null);
  const world = new WorldRunner(sim, {
    seed: cfg.seed, level: cfg.level, focus: cfg.focus, doctrine: cfg.plan.doctrine, navigator: expedition,
    hpOverride: cfg.hpOverride, maxFightTicks: cfg.maxFightTicks, encounters: cfg.encounters, cache: cfg.cache,
  }, graph);
  world.dispatch();
  return { world, expedition, startKnown: new Set(cfg.known) };
}
export function finishChronicle(cfg: ExpeditionConfig, run: ExpeditionRun): { result: WorldResult; chronicle: Chronicle } {
  const result = run.world.result();
  return { result, chronicle: buildChronicle(cfg.seed, run.expedition, result, run.startKnown, cfg.cache ?? null) };
}
/** Headless expedition from plan to Chronicle. */
export function runExpedition(sim: SimApi, cfg: ExpeditionConfig, maxTicks = 30 * 3000, graph = new WorldGraph()) {
  const run = startExpedition(sim, cfg, graph);
  while (!run.world.terminal && run.world.tick < maxTicks) run.world.step();
  return finishChronicle(cfg, run);
}
