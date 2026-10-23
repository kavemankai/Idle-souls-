import type { PreparedRoom, SimApi, SimDoctrine, SimFight } from '../combat/simApi';
import { O1, simRoom, spawnAngle, type RoomManifest, type SpawnSpec } from './o1Room';
import { planRoute, type Point } from './o1Route';
import { sees } from './o1Sight';

export type O1State = 'ready' | 'travelling' | 'fighting' | 'completed' | 'defeated' | 'unresolved';
export type O1Opponent = 'mireling' | 'sentry';
export interface O1Config {
  seed: number; opponent: O1Opponent; level: number; focus: string; doctrine: SimDoctrine;
  /** Everything below is for tests; the slice itself uses the manifest. */
  room?: RoomManifest; start?: Point; enemy?: SpawnSpec & { x: number; y: number }; maxFightTicks?: number; hpOverride?: number;
}
export interface O1Result {
  outcome: 'completed' | 'defeated' | 'unresolved'; fought: boolean; ticks: number; fightTicks: number;
  hpLeft: number; hpMax: number; finalPos: Point; detectedAtTick: number | null; digest: string;
}
const TERMINAL: O1State[] = ['completed', 'defeated', 'unresolved'];
const SIM_FIGHT_TICKS = 150 * 30;
const STATE_CODE: Record<O1State, number> = { ready: 0, travelling: 1, fighting: 2, completed: 3, defeated: 4, unresolved: 5 };

/**
 * Deterministic 30 Hz traversal of O1. It walks a planned route, hands a fight to the simulator when the fixed enemy
 * sees the adventurer, and afterwards only reads the simulator. It never chooses an attack, block or dodge.
 */
export class O1Controller {
  state: O1State = 'ready';
  tick = 0;
  fightTicks = 0;
  fought = false;
  detectedAtTick: number | null = null;
  hero: Point & { face: number; moving: boolean };
  enemy: Point & { face: number; alive: boolean };
  hp: number; hpMax: number;
  fight: SimFight | null = null;
  notes: string[] = [];
  private route: Point[] = [];
  private readonly room: RoomManifest;
  private readonly prepared: PreparedRoom;
  private readonly stats: Record<string, number>;
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
    const spawn = cfg.enemy ?? { ...this.room.spawns[cfg.opponent] };
    this.enemy = { x: spawn.x, y: spawn.y, face: spawnAngle(spawn), alive: true };
    this.goal = { x: this.room.threshold.x + 2, y: (this.room.threshold.y[0] + this.room.threshold.y[1]) / 2 };
  }
  get routePoints(): readonly Point[] { return this.route; }
  get terminal() { return TERMINAL.includes(this.state); }
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
    if (this.enemy.alive && sees(this.sim, this.prepared, this.enemy, this.hero, { range: this.room.detection.range, arcDegrees: this.room.detection.arcDegrees })) {
      this.startFight();
      return;
    }
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
  private startFight() {
    this.fought = true;
    this.detectedAtTick = this.tick;
    this.state = 'fighting';
    this.note(`Detected by the ${this.cfg.opponent} at tick ${this.tick}.`);
    this.fight = this.sim.createFight({
      seed: this.cfg.seed, stats: this.stats, god: false, doctrine: this.cfg.doctrine, encounter: this.cfg.opponent,
      room: simRoom(this.room), hpOverride: this.hpMax,
      spawns: { adventurer: { x: this.hero.x, y: this.hero.y, face: this.hero.face }, enemies: [{ x: this.enemy.x, y: this.enemy.y, face: this.enemy.face }] },
    });
  }
  private fightStep() {
    const S = this.fight!;
    this.sim.step(S);
    this.fightTicks++;
    this.hp = Math.max(0, S.p.hp);
    const e = S.enemies[0];
    this.enemy.x = e.x; this.enemy.y = e.y; this.enemy.face = e.face; this.enemy.alive = !e.dead;
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
    const parts = [STATE_CODE[this.state], this.hero.x, this.hero.y, this.hero.face * 100, this.hp, this.enemy.x, this.enemy.y, this.enemy.face * 100, f ? f.enemies[0].hp : 0, f ? f.p.actInst : 0]
      .map(v => Math.round(v * 10));
    for (const v of parts) { this.hash = Math.imul(this.hash ^ (v & 0xffff), 16777619) >>> 0; this.hash = Math.imul(this.hash ^ (v >> 16 & 0xffff), 16777619) >>> 0; }
  }
  get digest() { return this.hash.toString(16).padStart(8, '0'); }
  result(): O1Result {
    return {
      outcome: this.state === 'completed' || this.state === 'defeated' || this.state === 'unresolved' ? this.state : 'unresolved',
      fought: this.fought, ticks: this.tick, fightTicks: this.fightTicks, hpLeft: Math.round(this.hp), hpMax: this.hpMax,
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
