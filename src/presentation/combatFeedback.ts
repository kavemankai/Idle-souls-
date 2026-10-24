import type { CombatView, Gauge } from '../contracts/presentation';
import type { ExpeditionVisualState } from './expeditionVisual';

export type FeedbackKind = 'damage' | 'heal' | 'block' | 'perfect' | 'parry';
export interface CombatFeedback {
  readonly kind: FeedbackKind;
  readonly actorId: string;
  readonly x: number;
  readonly y: number;
  /** HP deltas are exact net changes between rendered simulator snapshots,
   * not invented per-attack hits (especially at 4x/16x speeds). */
  readonly amount?: number;
  readonly label: string;
}
export interface CombatHealthBar {
  readonly actorId: string;
  readonly name: string;
  readonly x: number;
  readonly y: number;
  readonly hp: Gauge;
  readonly hero: boolean;
}
const NUMBER_EPSILON = 0.0001;
const numberText = (value: number) => {
  const positive = Math.abs(value);
  if (positive >= 100) return String(Math.round(positive));
  if (positive >= 1) return String(Math.round(positive * 10) / 10);
  return String(Math.round(positive * 100) / 100);
};

/** One authoritative gauge for the hero at all times, and enemies while fighting. */
export function combatHealthBars(view: ExpeditionVisualState): readonly CombatHealthBar[] {
  const hero = view.actors[0];
  if (!hero) return [];
  const bars: CombatHealthBar[] = [{
    actorId: 'hero', name: 'Adventurer', x: hero.x, y: hero.y,
    hp: view.heroHealth, hero: true,
  }];
  if (!view.fighting || !view.combat) return bars;
  for (const actor of view.actors.slice(1)) {
    if (actor.combatSlot === null) continue;
    const f = view.combat.combatants[actor.combatSlot];
    if (!f) continue;
    bars.push({
      actorId: actor.id, name: f.name, x: actor.x, y: actor.y,
      hp: f.hp, hero: false,
    });
  }
  return bars;
}

/**
 * Visual-only sampler. The initial observation (including a restored fight)
 * establishes a baseline and must NOT create an imaginary damage burst.
 * All values, positions and defensive counters are read from the sim.
 */
export class CombatFeedbackTracker {
  private fightKey: string | null = null;
  private tick = -1;
  private hp = new Map<string, number>();
  private counters = { blocks: 0, perfects: 0, parries: 0 };

  reset() {
    this.fightKey = null;
    this.tick = -1;
    this.hp.clear();
    this.counters = { blocks: 0, perfects: 0, parries: 0 };
  }

  sample(view: ExpeditionVisualState): readonly CombatFeedback[] {
    if (!view.fighting || !view.combat || !view.fightKey) {
      this.reset();
      return [];
    }
    const bars = combatHealthBars(view);
    const combat: CombatView = view.combat;
    const now = {
      blocks: combat.totals.blocks,
      perfects: combat.totals.perfects,
      parries: combat.totals.parries,
    };
    // Scene recreation, a new encounter, or backwards time after a restore.
    const start = this.fightKey !== view.fightKey || view.tick < this.tick;
    if (start) {
      this.fightKey = view.fightKey;
      this.tick = view.tick;
      this.hp = new Map(bars.map(b => [b.actorId, b.hp.value]));
      this.counters = now;
      return [];
    }
    if (this.tick === view.tick) return [];
    this.tick = view.tick;
    const results: CombatFeedback[] = [];
    for (const bar of bars) {
      const previous = this.hp.get(bar.actorId);
      const current = bar.hp.value;
      if (previous !== undefined && Number.isFinite(previous) && Number.isFinite(current)) {
        const difference = current - previous;
        if (Math.abs(difference) > NUMBER_EPSILON) {
          const kind = difference < 0 ? 'damage' : 'heal';
          results.push({
            kind, actorId: bar.actorId, x: bar.x, y: bar.y,
            amount: Math.abs(difference),
            label: (difference < 0 ? '−' : '+') + numberText(difference),
          });
        }
      }
      this.hp.set(bar.actorId, current);
    }
    // A defence label is only displayed if the simulator incremented that
    // actual outcome counter. A guard pose alone proves nothing.
    const defensive = now.parries > this.counters.parries ? 'parry'
      : now.perfects > this.counters.perfects ? 'perfect'
      : now.blocks > this.counters.blocks ? 'block' : null;
    if (defensive) {
      const hero = bars[0];
      results.push({
        kind: defensive, actorId: 'hero', x: hero.x, y: hero.y,
        label: defensive === 'parry' ? 'PARRY' : defensive === 'perfect' ? 'PERFECT BLOCK' : 'BLOCK',
      });
    }
    this.counters = now;
    return results;
  }
}
