import { portableMath as M } from '../combat/portableMath';
import type { PreparedRoom, SimApi, SimDoctrine, SimFight, SimFighter } from '../combat/simApi';
import { simRoom, spawnAngle, type Door, type EnemySpec, type RoomManifest } from './o1Room';
import { planRoute, type Point } from './o1Route';
import { sees } from './o1Sight';

export type RoomState = 'ready' | 'travelling' | 'fighting' | 'completed' | 'defeated' | 'unresolved';
export interface RoomRunnerConfig {
  seed: number; level: number; focus: string; doctrine: SimDoctrine;
  /** Which of the room's encounters stands in it. Omit for a room with no enemies. */
  encounter?: string;
  room: RoomManifest;
  /** Door the adventurer enters by and door that ends the run. Default to the room's own, then to its first two doors. */
  entryDoor?: string; exitDoor?: string;
  /** Everything below is for tests; a real run uses the manifest. */
  start?: Point; maxFightTicks?: number; hpOverride?: number;
  /** Expedition carry-over: health on entry, enemies already killed on an earlier visit (by index), and an offset that keeps fight seeds distinct per visit. */
  startFace?: number; startHp?: number; defeated?: readonly boolean[]; seedOffset?: number;
  /** End the run on reaching this point instead of crossing the exit door. */
  goal?: Point;
  /** Walk to this point first, then to the exit (a dead-end room, or a U-turn through the door it came in by). */
  via?: Point;
  /** Replaces the encounter's enemy positions (same archetypes, same order). */
  enemies?: EnemySpec[];
  /** Single-enemy shorthand for `enemies`; the archetype defaults to the encounter's first. */
  enemy?: Omit<EnemySpec, 'arch'> & { arch?: string };
}
export interface RoomResult {
  outcome: 'completed' | 'defeated' | 'unresolved'; fought: boolean; fights: number; enemiesDefeated: number; ticks: number; fightTicks: number;
  hpLeft: number; hpMax: number; finalPos: Point; detectedAtTick: number | null; digest: string;
}
/** One enemy standing in the room. `engaged` means the simulator owns it right now (or did, and it is down). */
export interface Foe { arch: string; x: number; y: number; face: number; alive: boolean; engaged: boolean }
const TERMINAL: RoomState[] = ['completed', 'defeated', 'unresolved'];
const SIM_FIGHT_TICKS = 150 * 30;
const STATE_CODE: Record<RoomState, number> = { ready: 0, travelling: 1, fighting: 2, completed: 3, defeated: 4, unresolved: 5 };
/** The simulator fights named encounters; a subset of a room's enemies maps to the encounter with those archetypes in that order. */
const ENCOUNTER_FOR: Record<string, string> = { mireling: 'mireling', sentry: 'sentry', 'mireling,mireling': 'mireling2', 'sentry,mireling': 'sentryMireling' };

const OUT = { west: [-1, 0], east: [1, 0], north: [0, -1], south: [0, 1] } as const;
/** True once a point is on or past the wall face that holds the door. */
export function crossed(door: Door, p: Point): boolean {
  return door.side === 'east' ? p.x >= door.center.x : door.side === 'west' ? p.x <= door.center.x : door.side === 'south' ? p.y >= door.center.y : p.y <= door.center.y;
}
/**
 * Deterministic 30 Hz traversal of one room, from an entry door to an exit door. It walks a planned route, hands a fight to the simulator when a fixed enemy
 * sees the adventurer (allies within the alert radius join it), and afterwards only reads the simulator.
 * It never chooses an attack, block or dodge. Enemies that stay out of a fight can start a later one after a win.
 */
export class RoomRunner<C extends RoomRunnerConfig = RoomRunnerConfig> {
  state: RoomState = 'ready';
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
  private viaPending: boolean;
  protected readonly room: RoomManifest;
  readonly entry: Door;
  readonly exit: Door;
  private readonly prepared: PreparedRoom;
  readonly stats: Record<string, number>;
  readonly speed: number;
  private readonly goal: Point;
  private hash = 2166136261;
  constructor(readonly sim: SimApi, readonly cfg: C) {
    this.room = cfg.room;
    const door = (id: string | undefined, fallback: Door) => { if (!id) return fallback; const d = this.room.doors.find(x => x.id === id); if (!d) throw new Error(`${this.room.id} has no door ${id}`); return d; };
    if (this.room.doors.length < 1) throw new Error(`${this.room.id} has no doors`);
    this.entry = door(cfg.entryDoor ?? this.room.entryDoor, this.room.doors[0]);
    this.exit = door(cfg.exitDoor ?? this.room.exitDoor, this.room.doors.find(d => d !== this.entry) ?? this.entry);
    this.prepared = sim.room.prepare(simRoom(this.room));
    this.stats = sim.allocate(cfg.level, cfg.focus, cfg.seed);
    const derived = sim.derive(this.stats, false);
    this.speed = sim.ARCH.adventurer.speed * derived.moveMult;
    this.hpMax = cfg.hpOverride ?? derived.hp; this.hp = Math.min(this.hpMax, cfg.startHp ?? this.hpMax);
    const start = cfg.start ?? this.entry.center;
    this.hero = { x: start.x, y: start.y, face: cfg.startFace ?? 0, moving: false };
    const known = cfg.encounter ? this.room.encounters[cfg.encounter] : undefined;
    if (cfg.encounter && !known) throw new Error(`${this.room.id} has no encounter ${cfg.encounter}`);
    const base = known ? known.enemies : [];
    const specs: EnemySpec[] = cfg.enemies ?? (cfg.enemy ? [{ arch: cfg.enemy.arch ?? base[0].arch, ...cfg.enemy }] : base);
    // An enemy killed on an earlier visit stays dead and takes no part in this one.
    this.foes = specs.map((s, i) => { const dead = cfg.defeated?.[i] === true; return { arch: s.arch, x: s.x, y: s.y, face: spawnAngle(s), alive: !dead, engaged: dead }; });
    this.viaPending = cfg.via !== undefined;
    const out = OUT[this.exit.side];
    this.goal = cfg.goal ?? { x: this.exit.center.x + out[0] * 2, y: this.exit.center.y + out[1] * 2 };
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
    this.note(`Dispatched through ${this.room.id} to ${this.exit.to}.`);
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
    const via = this.viaPending ? this.cfg.via! : null;
    const first = planRoute(this.sim, this.prepared, this.room.bounds, this.hero, via ?? this.goal);
    const second = first && via ? planRoute(this.sim, this.prepared, this.room.bounds, via, this.goal) : [];
    if (!first || !second) { this.state = 'unresolved'; this.note(`No route to the ${this.exit.side} threshold.`); return; }
    this.route = first.concat(second);
  }
  private travel() {
    const det = this.room.detection;
    const seer = this.foes.findIndex(f => f.alive && !f.engaged && sees(this.sim, this.prepared, f, this.hero, { range: det.range, arcDegrees: det.arcDegrees }));
    if (seer >= 0) { this.startFight(seer); return; }
    let budget = this.speed;
    this.hero.moving = false;
    while (budget > 1e-9 && this.route.length) {
      const next = this.route[0], dx = next.x - this.hero.x, dy = next.y - this.hero.y, d = M.hypot(dx, dy);
      if (d > 1e-9) this.hero.face = M.atan2(dy, dx);
      this.hero.moving = true;
      if (d <= budget) { this.hero.x = next.x; this.hero.y = next.y; this.route.shift(); budget -= d; }
      else { this.hero.x += dx / d * budget; this.hero.y += dy / d * budget; budget = 0; }
    }
    if (this.viaPending && M.hypot(this.hero.x - this.cfg.via!.x, this.hero.y - this.cfg.via!.y) < 1e-6) this.viaPending = false;
    if (this.cfg.goal ? this.route.length === 0 && M.hypot(this.hero.x - this.goal.x, this.hero.y - this.goal.y) < 1e-6 : crossed(this.exit, this.hero)) {
      this.state = 'completed';
      this.hero.moving = false;
      this.note(this.cfg.goal ? 'Reached the goal.' : this.fought ? `Reached the ${this.exit.side} threshold after the fight.` : `Reached the ${this.exit.side} threshold. No fight occurred.`);
    }
  }
  private startFight(seer: number) {
    const s = this.foes[seer], reach = this.room.detection.alertRadius;
    // The seer and every unengaged living ally within the alert radius of it.
    const idx = this.foes.map((f, i) => i).filter(i => this.foes[i].alive && !this.foes[i].engaged && (i === seer || M.hypot(this.foes[i].x - s.x, this.foes[i].y - s.y) <= reach));
    const encounter = ENCOUNTER_FOR[idx.map(i => this.foes[i].arch).join(',')];
    if (!encounter) throw new Error(`no simulator encounter for ${idx.map(i => this.foes[i].arch).join(',')}`);
    idx.forEach(i => { this.foes[i].engaged = true; });
    this.fought = true; this.fights++;
    this.detectedAtTick ??= this.tick;
    this.state = 'fighting';
    this.note(`${this.foes[seer].arch} at (${Math.round(s.x)}, ${Math.round(s.y)}) saw the adventurer at tick ${this.tick}${idx.length > 1 ? `; ${idx.length - 1} ally joins` : ''}.`);
    this.fightIdx = idx;
    this.fight = this.sim.createFight({
      seed: this.cfg.seed + (this.cfg.seedOffset ?? 0) + (this.fights - 1) * 1009, stats: this.stats, god: false, doctrine: this.cfg.doctrine, encounter,
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
  result(): RoomResult {
    return {
      outcome: this.state === 'completed' || this.state === 'defeated' || this.state === 'unresolved' ? this.state : 'unresolved',
      fought: this.fought, fights: this.fights, enemiesDefeated: this.foes.filter((f, i) => f.engaged && !f.alive && this.cfg.defeated?.[i] !== true).length, ticks: this.tick, fightTicks: this.fightTicks,
      hpLeft: Math.round(this.hp), hpMax: this.hpMax,
      finalPos: { x: Math.round(this.hero.x * 10) / 10, y: Math.round(this.hero.y * 10) / 10 }, detectedAtTick: this.detectedAtTick, digest: this.digest,
    };
  }
}
/** Headless run of one room. */
export function runRoom(sim: SimApi, cfg: RoomRunnerConfig, maxTicks = 30 * 400): RoomResult {
  const c = new RoomRunner(sim, cfg);
  c.dispatch();
  while (!c.terminal && c.tick < maxTicks) c.step();
  return c.result();
}
