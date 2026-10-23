import type { PreparedRoom, SimApi, SimDoctrine, SimFight, SimFighter } from '../combat/simApi';
import { O1, simRoom, spawnAngle, type EnemySpec, type RoomManifest } from './o1Room';
import { planRoute, type Point } from './o1Route';
import { sees } from './o1Sight';

export type O1State = 'ready' | 'travelling' | 'fighting' | 'completed' | 'defeated' | 'unresolved';
/** An encounter id from the simulator, with positions in combat/rooms/o1.json. */
export type O1Opponent = 'mireling' | 'sentry' | 'mireling2' | 'sentryMireling';
export interface O1Config {
  seed: number; opponent: O1Opponent; level: number; focus: string; doctrine: SimDoctrine;
  /** Everything below is for tests; the slice itself uses the manifest. */
  room?: RoomManifest; start?: Point; maxFightTicks?: number; hpOverride?: number;
  /** Replaces the encounter's enemy positions (same archetypes, same order). */
  enemies?: EnemySpec[];
  /** Single-enemy shorthand for `enemies`; the archetype defaults to the encounter's first. */
  enemy?: Omit<EnemySpec, 'arch'> & { arch?: string };
}
export interface O1Result {
  outcome: 'completed' | 'defeated' | 'unresolved'; fought: boolean; fights: number; enemiesDefeated: number; ticks: number; fightTicks: number;
  hpLeft: number; hpMax: number; finalPos: Point; detectedAtTick: number | null; digest: string;
}
/** One enemy standing in the room. `engaged` means the simulator owns it right now (or did, and it is down). */
export interface Foe { arch: string; x: number; y: number; face: number; alive: boolean; engaged: boolean }
const TERMINAL: O1State[] = ['completed', 'defeated', 'unresolved'];
const SIM_FIGHT_TICKS = 150 * 30;
const STATE_CODE: Record<O1State, number> = { ready: 0, travelling: 1, fighting: 2, completed: 3, defeated: 4, unresolved: 5 };
/** The simulator fights named encounters; a subset of a room's enemies maps to the encounter with those archetypes in that order. */
const ENCOUNTER_FOR: Record<string, string> = { mireling: 'mireling', sentry: 'sentry', 'mireling,mireling': 'mireling2', 'sentry,mireling': 'sentryMireling' };

/**
 * Deterministic 30 Hz traversal of O1. It walks a planned route, hands a fight to the simulator when a fixed enemy
 * sees the adventurer (allies within the alert radius join it), and afterwards only reads the simulator.
 * It never chooses an attack, block or dodge. Enemies that stay out of a fight can start a later one after a win.
 */
export class O1Controller {
  state: O1State = 'ready';
  tick = 0;
  fightTicks = 0;
  fights = 0;
  fought = false;
  detectedAtTick: number | null = null;
  hero: Point & { face: number; moving: boolean };
  foes: Foe[];
  hp: number; hpMax: number;
  fight: SimFight | null = null;
  notes: string[] = [];
  private fightIdx: number[] = [];
  private route: Point[] = [];
  private readonly room: RoomManifest;
  private readonly prepared: PreparedRoom;
  readonly stats: Record<string, number>;
  private readonly speed: number;
  private readonly goal: Point;
  private hash = 2166136261;
  constructor(readonly sim: SimApi, readonly cfg: O1Config) {
    this.room = cfg.room ?? O1;
    this.prepared = sim.room.prepare(simRoom(this.room));
    this.stats = sim.allocate(cfg.level, cfg.focus, cfg.seed);
    const derived = sim.derive(this.stats, false);
    this.speed = sim.ARCH.adventurer.speed * derived.moveMult;
    this.hpMax = cfg.hpOverride ?? derived.hp; this.hp = this.hpMax;
    const start = cfg.start ?? this.room.entry;
    this.hero = { x: start.x, y: start.y, face: 0, moving: false };
    const base = this.room.encounters[cfg.opponent].enemies;
    const specs: EnemySpec[] = cfg.enemies ?? (cfg.enemy ? [{ arch: cfg.enemy.arch ?? base[0].arch, ...cfg.enemy }] : base);
    this.foes = specs.map(s => ({ arch: s.arch, x: s.x, y: s.y, face: spawnAngle(s), alive: true, engaged: false }));
    this.goal = { x: this.room.threshold.x + 2, y: (this.room.threshold.y[0] + this.room.threshold.y[1]) / 2 };
  }
  get routePoints(): readonly Point[] { return this.route; }
  get terminal() { return TERMINAL.includes(this.state); }
  /** The simulator fighter behind foe `i`, while a fight that includes it is on record. */
  fighterOf(i: number): SimFighter | null {
    const k = this.fightIdx.indexOf(i);
    return this.fight && k >= 0 ? this.fight.enemies[k] : null;
  }
  /** Index of foe `i` among the current fight's enemies, or -1 when it is not in that fight. */
  fightSlot(i: number): number { return this.fight ? this.fightIdx.indexOf(i) : -1; }
  dispatch() {
    if (this.state !== 'ready') return;
    this.state = 'travelling';
    this.note('Dispatched to O2.');
    this.replan();
  }
  /** Advance exactly one simulation tick. */
  step() {
    if (this.terminal || this.state === 'ready') return;
    if (this.state === 'travelling') this.travel();
    else this.fightStep();
    this.tick++;
    this.mix();
  }
  private replan() {
    const route = planRoute(this.sim, this.prepared, this.room.bounds, this.hero, this.goal);
    if (!route) { this.state = 'unresolved'; this.note('No route to the east threshold.'); return; }
    this.route = route;
  }
  private travel() {
    const det = this.room.detection;
    const seer = this.foes.findIndex(f => f.alive && !f.engaged && sees(this.sim, this.prepared, f, this.hero, { range: det.range, arcDegrees: det.arcDegrees }));
    if (seer >= 0) { this.startFight(seer); return; }
    let budget = this.speed;
    this.hero.moving = false;
    while (budget > 1e-9 && this.route.length) {
      const next = this.route[0], dx = next.x - this.hero.x, dy = next.y - this.hero.y, d = Math.hypot(dx, dy);
      if (d > 1e-9) this.hero.face = Math.atan2(dy, dx);
      this.hero.moving = true;
      if (d <= budget) { this.hero.x = next.x; this.hero.y = next.y; this.route.shift(); budget -= d; }
      else { this.hero.x += dx / d * budget; this.hero.y += dy / d * budget; budget = 0; }
    }
    if (this.hero.x >= this.room.threshold.x) {
      this.state = 'completed';
      this.hero.moving = false;
      this.note(this.fought ? 'Reached the east threshold after the fight.' : 'Reached the east threshold. No fight occurred.');
    }
  }
  private startFight(seer: number) {
    const s = this.foes[seer], reach = this.room.detection.alertRadius;
    // The seer and every unengaged living ally within the alert radius of it.
    const idx = this.foes.map((f, i) => i).filter(i => this.foes[i].alive && !this.foes[i].engaged && (i === seer || Math.hypot(this.foes[i].x - s.x, this.foes[i].y - s.y) <= reach));
    const encounter = ENCOUNTER_FOR[idx.map(i => this.foes[i].arch).join(',')];
    if (!encounter) throw new Error(`no simulator encounter for ${idx.map(i => this.foes[i].arch).join(',')}`);
    idx.forEach(i => { this.foes[i].engaged = true; });
    this.fought = true; this.fights++;
    this.detectedAtTick ??= this.tick;
    this.state = 'fighting';
    this.note(`${this.foes[seer].arch} at (${Math.round(s.x)}, ${Math.round(s.y)}) saw the adventurer at tick ${this.tick}${idx.length > 1 ? `; ${idx.length - 1} ally joins` : ''}.`);
    this.fightIdx = idx;
    this.fight = this.sim.createFight({
      seed: this.cfg.seed + (this.fights - 1) * 1009, stats: this.stats, god: false, doctrine: this.cfg.doctrine, encounter,
      room: simRoom(this.room), hpOverride: this.hpMax,
      spawns: { adventurer: { x: this.hero.x, y: this.hero.y, face: this.hero.face }, enemies: idx.map(i => ({ x: this.foes[i].x, y: this.foes[i].y, face: this.foes[i].face })) },
    });
    this.fight.p.hp = this.hp;   // health carries over between fights; the simulator has no other carry-over
  }
  private fightStep() {
    const S = this.fight!;
    this.sim.step(S);
    this.fightTicks++;
    this.hp = Math.max(0, S.p.hp);
    this.fightIdx.forEach((fi, k) => { const e = S.enemies[k], f = this.foes[fi]; f.x = e.x; f.y = e.y; f.face = e.face; f.alive = !e.dead; });
    if (S.over) {
      if (S.winner === 'adventurer') {
        this.hero.x = S.p.x; this.hero.y = S.p.y; this.hero.face = S.p.face;
        this.state = 'travelling';
        this.note(`Fight won with ${Math.round(S.p.hp)} of ${this.hpMax} health. Travel resumes.`);
        this.replan();
      } else if (S.winner === 'enemy') { this.state = 'defeated'; this.note('The adventurer fell.'); }
      else { this.state = 'unresolved'; this.note('The fight timed out.'); }
    } else if (this.fightTicks >= (this.cfg.maxFightTicks ?? SIM_FIGHT_TICKS)) {
      this.state = 'unresolved'; this.note('The fight timed out.');
    }
  }
  private note(text: string) { this.notes.push(`${this.tick}: ${text}`); }
  /** Rolling hash of rounded per-tick state, so two runs can be compared without storing them. */
  private mix() {
    const f = this.fight;
    const parts = [STATE_CODE[this.state], this.hero.x, this.hero.y, this.hero.face * 100, this.hp, f ? f.enemies.reduce((n, e) => n + e.hp, 0) : 0, f ? f.p.actInst : 0,
      ...this.foes.flatMap(o => [o.x, o.y, o.face * 100, o.alive ? 1 : 0])].map(v => Math.round(v * 10));
    for (const v of parts) { this.hash = Math.imul(this.hash ^ (v & 0xffff), 16777619) >>> 0; this.hash = Math.imul(this.hash ^ (v >> 16 & 0xffff), 16777619) >>> 0; }
  }
  get digest() { return this.hash.toString(16).padStart(8, '0'); }
  result(): O1Result {
    return {
      outcome: this.state === 'completed' || this.state === 'defeated' || this.state === 'unresolved' ? this.state : 'unresolved',
      fought: this.fought, fights: this.fights, enemiesDefeated: this.foes.filter(f => f.engaged && !f.alive).length, ticks: this.tick, fightTicks: this.fightTicks,
      hpLeft: Math.round(this.hp), hpMax: this.hpMax,
      finalPos: { x: Math.round(this.hero.x * 10) / 10, y: Math.round(this.hero.y * 10) / 10 }, detectedAtTick: this.detectedAtTick, digest: this.digest,
    };
  }
}
/** Headless run used by tests, the report and the browser comparison. */
export function runO1(sim: SimApi, cfg: O1Config, maxTicks = 30 * 400): O1Result {
  const c = new O1Controller(sim, cfg);
  c.dispatch();
  while (!c.terminal && c.tick < maxTicks) c.step();
  return c.result();
}
