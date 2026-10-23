import type { Bank, Cache } from '../save/saveTypes';
import type { WorldResult } from '../world/worldRunner';
import type { Expedition, Intent } from './expedition';
import type { ExpeditionPlan, ObjectiveStatus } from './plan';

export type ChronicleOutcome = 'extracted' | 'died' | 'blocked' | 'stopped';
/** The record of one expedition: what was ordered, what was done and why, and how it ended. Plain data, no clock, so equal runs give equal records. */
export interface Chronicle {
  version: 3;
  seed: number;
  outcome: ChronicleOutcome;
  /** One sentence for the player: why it ended the way it did. */
  summary: string;
  plan: ExpeditionPlan;
  objectives: { id: string; kind: string; room: string; status: ObjectiveStatus; note: string }[];
  route: string[];
  discovered: string[];
  fights: { room: string; won: boolean; enemiesDefeated: number; hpLeft: number; hpMax: number }[];
  ticks: number;
  hpLeft: number; hpMax: number;
  digest: string;
  intent: Intent[];
  /** What was carried and where it came from. Nothing here is banked; `settle` decides that from the outcome. */
  loot: {
    carried: Bank;
    gains: { source: string; room: string; label: string; bundle: Bank }[];
    /** The cache waiting when the expedition started, and whether it was picked up. */
    startCache: Cache | null; cacheRecovered: boolean;
    /** Where a death would leave a cache: only set when the adventurer fell. */
    deathSpot: { room: string; x: number; y: number } | null;
    /** Gate Keys issued at launch and spent on gates; the keys are gone either way. */
    issued: number; spent: number;
    /** Gates and shortcuts opened this expedition (permanent), and one-time discoveries claimed (permanent). */
    opened: string[]; claimed: string[];
  };
  /** Bosses first defeated during the expedition. Permanent whatever happens next.  */
  bossesDefeated: string[];
}
export function buildChronicle(seed: number, ex: Expedition, result: WorldResult, startKnown: ReadonlySet<string>, startCache: Cache | null = null): Chronicle {
  const outcome: ChronicleOutcome = result.outcome === 'home' ? 'extracted' : result.outcome === 'defeated' ? 'died' : ex.mode === 'blocked' ? 'blocked' : 'stopped';
  const last = result.legs[result.legs.length - 1];
  const summary = outcome === 'extracted' ? `Back at camp alive with ${result.hpLeft} of ${result.hpMax} health after ${result.fights} fight${result.fights === 1 ? '' : 's'}.`
    : outcome === 'died' ? `Fell in ${last ? last.room : 'the field'} after ${result.fights} fight${result.fights === 1 ? '' : 's'}; reached ${ex.rooms[ex.rooms.length - 1]}.`
    : ex.endReason ?? result.haltReason ?? 'The expedition stopped.';
  return {
    version: 3, seed, outcome, summary, plan: ex.plan,
    objectives: ex.objectives.map(o => ({ id: o.id, kind: o.kind, room: o.room, status: o.status, note: o.note })),
    route: ex.rooms.slice(), discovered: [...ex.known].filter(r => !startKnown.has(r)).sort(),
    fights: result.legs.filter(l => l.result.fights > 0).map(l => ({ room: l.room, won: l.result.outcome !== 'defeated', enemiesDefeated: l.result.enemiesDefeated, hpLeft: l.result.hpLeft, hpMax: l.result.hpMax })),
    ticks: result.ticks, hpLeft: result.hpLeft, hpMax: result.hpMax, digest: result.digest, intent: ex.intent.slice(),
    loot: { carried: result.loot.carried, gains: result.loot.gains.map(g => ({ source: g.source, room: g.room, label: g.label, bundle: g.bundle })), startCache, cacheRecovered: result.loot.recovered !== null, deathSpot: result.loot.deathSpot, issued: result.loot.issued, spent: result.loot.spent, opened: result.loot.opened, claimed: result.loot.claimed },
    bossesDefeated: result.bossesDefeated,
  };
}
