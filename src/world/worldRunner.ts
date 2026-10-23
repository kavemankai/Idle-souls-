import { portableMath as M } from '../combat/portableMath';
import type { SimApi, SimDoctrine } from '../combat/simApi';
import { ROOMS } from './roomRegistry';
import { RoomRunner, type RoomResult } from './roomRunner';
import type { Door, RoomManifest } from './roomTypes';
import type { Point } from './o1Route';
import { WorldGraph } from './worldGraph';

/** Encounters that stand in the Old Road rooms for a plain expedition. Camp has none. */
export const OLD_ROAD_ENCOUNTERS: Readonly<Record<string, string>> = { O1: 'mireling', O2: 'sentry', O3: 'mireling2' };
export interface WorldRunConfig {
  seed: number; level: number; focus: string; doctrine: SimDoctrine;
  /** Start and turn-around rooms. The route between them is the graph's shortest path over ordinary links. */
  from: string; to: string;
  /** Room to encounter id, for the rooms that have enemies. Defaults to OLD_ROAD_ENCOUNTERS; a missing room is empty. */
  encounters?: Readonly<Record<string, string>>;
  /** Door of the turn-around room that marks the frontier of the known world. Defaults to its first door that is not on the way in. */
  turnDoor?: string;
  /** Tests only. */
  hpOverride?: number; maxFightTicks?: number;
}
export type WorldState = 'ready' | 'outbound' | 'homebound' | 'home' | 'defeated' | 'unresolved';
export interface LegResult { room: string; phase: 'out' | 'back'; result: RoomResult }
export interface WorldResult {
  outcome: 'home' | 'defeated' | 'unresolved'; rooms: string[]; legs: LegResult[]; ticks: number; fights: number; enemiesDefeated: number;
  hpLeft: number; hpMax: number; finalPos: Point; digest: string;
  /** Largest distance covered in one tick while walking (rooms and the passages between them) and while the simulator moved the adventurer. */
  maxWalkStep: number; maxFightStep: number;
  /** Per room, which of its enemies are dead at the end. */
  dead: Record<string, boolean[]>;
}
interface Leg { room: string; phase: 'out' | 'back'; entry: string | null; exit: string | null }

/** Room-local position to world position. Every manifest is centred on its schedule centre. */
export function toWorld(room: RoomManifest, p: Point): Point { const c = room.plan!.center; return { x: c.x + p.x, y: c.y + p.y }; }
export function toLocal(room: RoomManifest, p: Point): Point { const c = room.plan!.center; return { x: p.x - c.x, y: p.y - c.y }; }

/**
 * One expedition on foot: from a room out through the graph's path to a turn-around room, then back the same way to the start room's centre.
 * Rooms are run by RoomRunner. Between rooms the adventurer walks the straight passage from one door to the other at walking speed, so the world position
 * never jumps. Enemies killed stay dead for the rest of the walk; living ones that never fought keep their places and can see the adventurer on any later pass.
 * Health carries. This class only sequences; it never picks a tactic.
 */
export class WorldRunner {
  state: WorldState = 'ready';
  tick = 0;
  readonly rooms: string[];
  readonly legs: Leg[];
  readonly results: LegResult[] = [];
  readonly dead = new Map<string, boolean[]>();
  /** The runner of the leg in progress, null while walking a passage. */
  runner: RoomRunner | null = null;
  pos: Point = { x: 0, y: 0 };
  hp = 0; hpMax = 0;
  maxWalkStep = 0; maxFightStep = 0;
  notes: string[] = [];
  private legIdx = -1;
  private passage: { to: Point; next: number } | null = null;
  private face = 0;
  private hash = 2166136261;
  private readonly speed: number;
  readonly graph: WorldGraph;
  constructor(readonly sim: SimApi, readonly cfg: WorldRunConfig, graph = new WorldGraph(), private readonly manifests: Readonly<Record<string, RoomManifest>> = ROOMS) {
    this.graph = graph;
    const path = graph.path(cfg.from, cfg.to);
    if (!path) throw new Error(`no ordinary route from ${cfg.from} to ${cfg.to}`);
    this.rooms = path;
    const last = this.manifests[cfg.to], before = path.length > 1 ? path[path.length - 2] : null;
    const turn = cfg.turnDoor ?? last.doors.find(d => d.to !== before)?.id ?? null;
    if (turn && !last.doors.some(d => d.id === turn)) throw new Error(`${cfg.to} has no door ${turn}`);
    const out: Leg[] = path.map((room, i) => ({ room, phase: 'out' as const, entry: i > 0 ? `to-${path[i - 1]}` : null, exit: i < path.length - 1 ? `to-${path[i + 1]}` : turn }));
    const back: Leg[] = path.slice().reverse().map((room, i, rev) => ({ room, phase: 'back' as const, entry: i === 0 ? turn : `to-${rev[i - 1]}`, exit: i < rev.length - 1 ? `to-${rev[i + 1]}` : null }));
    this.legs = [...out, ...back];
    const derived = sim.derive(sim.allocate(cfg.level, cfg.focus, cfg.seed), false);
    this.speed = sim.ARCH.adventurer.speed * derived.moveMult;
    this.hpMax = cfg.hpOverride ?? derived.hp; this.hp = this.hpMax;
    const first = this.manifests[cfg.from];
    this.pos = toWorld(first, { x: 0, y: 0 });
  }
  get terminal() { return this.state === 'home' || this.state === 'defeated' || this.state === 'unresolved'; }
  dispatch() {
    if (this.state !== 'ready') return;
    this.state = 'outbound';
    this.note(`Dispatched from ${this.cfg.from} to ${this.cfg.to}: ${this.rooms.join(' > ')}.`);
    this.beginLeg(0, { x: 0, y: 0 }, 0);
  }
  private room(id: string) { return this.manifests[id]; }
  private note(text: string) { this.notes.push(`${this.tick}: ${text}`); }
  /** Start a room leg with the adventurer at room-local `at`. */
  private beginLeg(i: number, at: Point, face: number) {
    this.legIdx = i;
    const leg = this.legs[i], room = this.room(leg.room);
    const last = i === this.legs.length - 1;
    const encounter = this.cfg.encounters?.[leg.room] ?? (this.cfg.encounters ? undefined : OLD_ROAD_ENCOUNTERS[leg.room]);
    const exitDoor = leg.exit ? room.doors.find(d => d.id === leg.exit)! : room.doors.find(d => d.id !== leg.entry)!;
    this.runner = new RoomRunner(this.sim, {
      seed: this.cfg.seed, level: this.cfg.level, focus: this.cfg.focus, doctrine: this.cfg.doctrine,
      encounter, room,
      entryDoor: leg.entry ?? undefined, exitDoor: exitDoor.id, start: at, startFace: face,
      startHp: this.hp, hpOverride: this.hpMax, defeated: this.dead.get(leg.room), seedOffset: (i + 1) * 100003, maxFightTicks: this.cfg.maxFightTicks,
      // The walk ends at the start room's centre; every other leg ends at its exit door.
      goal: last ? { x: 0, y: 0 } : undefined,
    });
    this.runner.dispatch();
    this.note(`Entered ${leg.room} (${leg.phase}).`);
  }
  /** Advance exactly one tick. */
  step() {
    if (this.terminal || this.state === 'ready') return;
    const before = this.pos;
    let fighting = false;
    if (this.passage) this.walkPassage();
    else {
      const r = this.runner!;
      const ticksBefore = r.fightTicks;
      r.step();
      fighting = r.fightTicks > ticksBefore;   // this tick belonged to the simulator, which owns the adventurer's motion
      // While the simulator owns the fight the adventurer's place is the fighter's, not the walker's.
      this.pos = toWorld(this.room(this.legs[this.legIdx].room), fighting && r.fight && r.state !== 'travelling' ? r.fight.p : r.hero);
      this.hp = r.hp;
      if (r.terminal) this.endLeg(r);
    }
    const d = M.hypot(this.pos.x - before.x, this.pos.y - before.y);
    if (fighting) this.maxFightStep = Math.max(this.maxFightStep, d); else this.maxWalkStep = Math.max(this.maxWalkStep, d);
    this.tick++;
    this.mix();
  }
  private endLeg(r: RoomRunner) {
    const leg = this.legs[this.legIdx];
    this.results.push({ room: leg.room, phase: leg.phase, result: r.result() });
    this.dead.set(leg.room, r.foes.map(f => f.engaged && !f.alive));
    if (r.state === 'defeated') { this.state = 'defeated'; this.note('The adventurer fell.'); return; }
    if (r.state === 'unresolved') { this.state = 'unresolved'; this.note(`Stopped in ${leg.room}: ${r.notes[r.notes.length - 1]}`); return; }
    const next = this.legIdx + 1;
    if (next >= this.legs.length) { this.state = 'home'; this.note(`Back at ${this.cfg.from}.`); this.runner = null; return; }
    const nextLeg = this.legs[next];
    if (nextLeg.room === leg.room) {
      // Turn-around: stay where the adventurer stands.
      this.state = 'homebound'; this.note(`Turned back at the ${leg.exit} frontier.`);
      this.beginLeg(next, r.hero, r.hero.face);
      return;
    }
    // Walk the passage from where the adventurer stands to the paired door of the next room.
    const there = this.room(nextLeg.room), arrival = there.doors.find((d: Door) => d.id === nextLeg.entry)!;
    this.passage = { to: toWorld(there, arrival.center), next };
    this.face = r.hero.face;
    this.runner = null;
  }
  private walkPassage() {
    const p = this.passage!, dx = p.to.x - this.pos.x, dy = p.to.y - this.pos.y, d = M.hypot(dx, dy);
    if (d > 1e-9) this.face = M.atan2(dy, dx);
    if (d <= this.speed) {
      this.pos = { x: p.to.x, y: p.to.y };
      const there = this.room(this.legs[p.next].room);
      this.passage = null;
      this.beginLeg(p.next, toLocal(there, this.pos), this.face);
    } else this.pos = { x: this.pos.x + dx / d * this.speed, y: this.pos.y + dy / d * this.speed };
  }
  private mix() {
    const r = this.runner;
    const parts = [this.legIdx, this.passage ? 1 : 0, this.pos.x, this.pos.y, this.hp, r ? parseInt(r.digest, 16) & 0xffff : 0].map(v => Math.round(v * 10));
    for (const v of parts) { this.hash = Math.imul(this.hash ^ (v & 0xffff), 16777619) >>> 0; this.hash = Math.imul(this.hash ^ (v >> 16 & 0xffff), 16777619) >>> 0; }
  }
  get digest() {
    // Fold in each finished leg's own digest so the result depends on every fight, not only on the sampled ticks.
    let h = this.hash;
    for (const l of this.results) for (const c of l.result.digest) { h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0; }
    return h.toString(16).padStart(8, '0');
  }
  result(): WorldResult {
    return {
      outcome: this.state === 'home' || this.state === 'defeated' ? this.state : 'unresolved', rooms: this.rooms, legs: this.results, ticks: this.tick,
      fights: this.results.reduce((n, l) => n + l.result.fights, 0), enemiesDefeated: this.results.reduce((n, l) => n + l.result.enemiesDefeated, 0),
      hpLeft: Math.round(this.hp), hpMax: this.hpMax, finalPos: { x: Math.round(this.pos.x * 10) / 10, y: Math.round(this.pos.y * 10) / 10 }, digest: this.digest,
      maxWalkStep: Math.round(this.maxWalkStep * 1000) / 1000, maxFightStep: Math.round(this.maxFightStep * 1000) / 1000,
      dead: Object.fromEntries(this.dead),
    };
  }
}
/** Headless expedition on foot. */
export function runWorld(sim: SimApi, cfg: WorldRunConfig, maxTicks = 30 * 1500): WorldResult {
  const w = new WorldRunner(sim, cfg);
  w.dispatch();
  while (!w.terminal && w.tick < maxTicks) w.step();
  return w.result();
}
