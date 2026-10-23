import { MAX_DESIGN_LEVEL, clampDesign } from './levelTable';

/**
 * Temporary expedition progression (doc 10, handoff 10.5). Experience comes from three honest places and each pays once:
 * training by use (a kill pays once per enemy), learning from mistakes (health lost in a won fight adds up to a quarter extra on that fight's kills),
 * and finding out (a first-time room, a completed objective). A level gained applies at the next arrival in a room, never mid-fight.
 * Nothing here is banked: levels, experience and the upgrade end with the expedition, whatever the outcome.
 */
export const XP_TO_REACH: readonly number[] = [0, 10, 24, 44, 70, 105, 150, 205, 270];   // cumulative, index = design level - 1
export const KILL_XP: Readonly<Record<string, number>> = { mireling: 8, sentry: 20, harrier: 18, spitter: 18, grunt: 10, brute: 40, duelist: 40, warden: 80, castellan: 200 };
export const DEFAULT_KILL_XP = 15;
export const OBJECTIVE_XP = 12;
export const DISCOVERY_XP = 4;
export const MISTAKE_SHARE = 0.25;

/** Rations heal this share of maximum health (the design anchor is 35 of 100) and the drinker stands still this long. Never in a fight. */
export const RATION_HEAL = 0.35;
export const DRINK_TICKS = 20;
/** No ration is drunk with an enemy this close, whether or not it has seen the adventurer. */
export const MELEE_SAFE = 90;
/** A sanctuary rest restores this share of maximum health, only when health is below REST_BELOW of it, and only once per expedition. */
export const REST_HEAL = 0.6;
export const REST_BELOW = 0.9;

export type UpgradeId ='steadfast' | 'riposte' | 'quickstep';
/** Major checkpoint choices (doc 10). The simulator is untouched, so each is a temporary bonus of stat points in the stats the description names. */
export interface Upgrade { id: UpgradeId; name: string; text: string; bonus: Readonly<Record<string, number>> }
export const UPGRADES: readonly Upgrade[] = [
  { id: 'steadfast', name: 'Steadfast', text: 'Guarding costs less stamina and the body takes hits better.', bonus: { guardStrength: 4, endurance: 3, balance: 2 } },
  { id: 'riposte', name: 'Riposte', text: 'Better payoff from well-timed guards and strikes after them.', bonus: { guardSkill: 4, swingSkill: 3, composure: 2 } },
  { id: 'quickstep', name: 'Quickstep', text: 'Faster on the feet when repositioning or backing off.', bonus: { moveSpeed: 4, dodgeSkill: 3, dodgePower: 2 } },
];
export const upgradeById = (id: UpgradeId): Upgrade => UPGRADES.find(u => u.id === id)!;

export interface LevelEvent { tick: number; level: number; xp: number; cause: string }
export interface SanctuaryState { rested: boolean; restedAt: number | null; upgrade: UpgradeId | null; visits: number }

export class Progress {
  level: number;
  xp: number;
  readonly startLevel: number;
  readonly events: LevelEvent[] = [];
  readonly sanctuary: SanctuaryState = { rested: false, restedAt: null, upgrade: null, visits: 0 };
  readonly defaultUpgrade: UpgradeId;
  private legKillXp = 0;
  private logged = 0;
  constructor(startLevel = 1, defaultUpgrade: UpgradeId = 'steadfast', xp = 0) {
    this.startLevel = clampDesign(startLevel); this.level = this.startLevel; this.xp = Math.max(XP_TO_REACH[this.startLevel - 1], xp);
    this.defaultUpgrade = defaultUpgrade;
  }
  get xpToNext(): number | null { return this.level >= MAX_DESIGN_LEVEL ? null : XP_TO_REACH[this.level]; }
  private add(n: number, tick: number, cause: string) {
    this.xp += n;
    while (this.level < MAX_DESIGN_LEVEL && this.xp >= XP_TO_REACH[this.level]) { this.level++; this.events.push({ tick, level: this.level, xp: this.xp, cause }); }
  }
  kill(arch: string, tick: number): number { const n = KILL_XP[arch] ?? DEFAULT_KILL_XP; this.legKillXp += n; this.add(n, tick, `defeated a ${arch}`); return n; }
  objective(tick: number) { this.add(OBJECTIVE_XP, tick, 'completed an objective'); }
  discovery(tick: number) { this.add(DISCOVERY_XP, tick, 'found a new room'); }
  /** End of a leg: a won fight teaches in proportion to the health it cost, at most a quarter more on that leg's kills. Returns the bonus. */
  endLeg(healthLostShare: number, won: boolean, tick: number): number {
    const bonus = won && this.legKillXp > 0 ? Math.floor(MISTAKE_SHARE * this.legKillXp * Math.max(0, Math.min(1, healthLostShare))) : 0;
    this.legKillXp = 0;
    if (bonus > 0) this.add(bonus, tick, 'learned from the hits taken');
    return bonus;
  }
  /** Level-ups not yet reported to the intent feed. */
  drainEvents(): LevelEvent[] { const out = this.events.slice(this.logged); this.logged = this.events.length; return out; }
  statBonus(): Readonly<Record<string, number>> { return this.sanctuary.upgrade ? upgradeById(this.sanctuary.upgrade).bonus : {}; }
}
