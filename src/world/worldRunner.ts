import { portableMath as M } from '../combat/portableMath';
import type { SimApi, SimCarry, SimDerived, SimDoctrine } from '../combat/simApi';
import { ROOMS } from './roomRegistry';
import { RoomRunner, type RetreatAnswer, type RoomResult } from './roomRunner';
import { Ledger, PICKUP_REACH, type DeathSpot, type Gain } from '../expedition/loot';
import { GATE_NEED, stagingPoint, type GateInfo } from './gates';
import type { Bank, Cache } from '../save/saveTypes';
import type { Door, RoomManifest } from './roomTypes';
import type { Point } from './o1Route';
import { WorldGraph } from './worldGraph';

/** Encounters that stand in the Old Road rooms for a plain expedition. Camp has none. */
export const OLD_ROAD_ENCOUNTERS: Readonly<Record<string, string>> = { O1: 'mireling', O2: 'sentry', O3: 'mireling2', KT: 'mireling2' };
export interface WorldRunConfig {
  seed: number; level: number; focus: string; doctrine: SimDoctrine;
  /** Start and turn-around rooms. The route between them is the graph's shortest path over ordinary links. Ignored when a navigator is given. */
  from?: string; to?: string;
  /** Decides, on every arrival, which door to leave by. Without one the walk is the fixed there-and-back of `from` and `to`. */
  navigator?: Navigator;
  /** Room to encounter id, for the rooms that have enemies. Defaults to OLD_ROAD_ENCOUNTERS; a missing room is empty. */
  encounters?: Readonly<Record<string, string>>;
  /** Door of the turn-around room that marks the frontier of the known world. Defaults to its first door that is not on the way in. */
  turnDoor?: string;
  /** The recovery cache waiting at the start of this expedition, if any. */
  cache?: Cache | null;
  /** Gate Keys issued from camp for this expedition (eligible to open gates), one-time claims already made, and links already open for good. */
  issuedKeys?: number; claims?: readonly string[]; openLinks?: readonly string[];
  /** Tests only. */
  hpOverride?: number; maxFightTicks?: number;
}
export type WorldState = 'ready' | 'outbound' | 'homebound' | 'home' | 'defeated' | 'unresolved';
/** What a navigator sees each time the adventurer starts a stretch inside a room (arriving, or turning round at a door). Everything is read-only. */
export interface ArrivalCtx {
  room: string; entry: string | null; tick: number; hp: number; hpMax: number; pos: Point;
  /** What is carried right now, read-only. */
  carried: Bank;
  /** Index of this stretch in the whole walk, 0 for the first. */
  leg: number;
  dead: ReadonlyMap<string, readonly boolean[]>; results: readonly LegResult[];
}
/** `exit` is a door of the current room. `cross` false means: walk to the door, then ask again from inside the same room (a turn-around). */
export type NavDecision = { exit: string; cross: boolean; label?: string; via?: Point } | { goal: Point; label?: string } | { halt: string };
/** What a navigator sees every tick while the adventurer is in a room and not walking a passage. */
export interface LiveCtx { room: string; entry: string | null; tick: number; hp: number; hpMax: number; fighting: boolean; pos: Point; carried: Bank }
export interface Navigator {
  start: string;
  arrive(ctx: ArrivalCtx): NavDecision;
  /** Asked every tick inside a room. Returning an exit door changes the way out now (a retreat); in a fight the adventurer disengages first. */
  live?(ctx: LiveCtx): { exit: string } | { end: true } | { again: true } | null;
  /** The room runner's answer to a `live` request: accepted (with what a retreat in a fight faces) or refused. */
  liveAnswer?(answer: RetreatAnswer, ctx: LiveCtx): void;
  /** Something was gained: a kill paid, a pickup taken, or the cache recovered. */
  looted?(gain: Gain, ctx: LiveCtx): void;
  /** The adventurer stands at a sealed gate's staging point. Return true only if the plan deliberately asks to work this gate now (no automatic spending). */
  wantsInteraction?(gate: GateInfo, ctx: LiveCtx): boolean;
  /** The result of working a gate: opened for good, or refused (no eligible key). */
  gateWorked?(gate: GateInfo, ok: boolean, ctx: LiveCtx): void;
  /** Called when a stretch ends, win or lose, before the next arrival. */
  legEnded?(result: LegResult, ctx: ArrivalCtx): void;
}
export interface LegResult { room: string; phase: string; entry: string | null; result: RoomResult }
export interface WorldResult {
  outcome: 'home' | 'defeated' | 'unresolved'; rooms: string[]; haltReason: string | null; legs: LegResult[]; ticks: number; fights: number; enemiesDefeated: number;
  hpLeft: number; hpMax: number; finalPos: Point; digest: string;
  /** Largest distance covered in one tick while walking (rooms and the passages between them) and while the simulator moved the adventurer. */
  maxWalkStep: number; maxFightStep: number;
  /** What is carried at the end and how it was gained. Nothing here is banked: `settle` decides that. */
  loot: { carried: Bank; gains: Gain[]; cache: Cache | null; recovered: Cache | null; deathSpot: DeathSpot | null; issued: number; spent: number; opened: string[]; claimed: string[] };
  /** Per room, which of its enemies are dead at the end. */
  dead: Record<string, boolean[]>;
  /** Miniboss and boss ids killed during the walk (permanent whatever happens next), sorted and without repeats. */
  bossesDefeated: string[];
}

/** Room-local position to world position. Every manifest is centred on its schedule centre. */
export function toWorld(room: RoomManifest, p: Point): Point { const c = room.plan!.center; return { x: c.x + p.x, y: c.y + p.y }; }
export function toLocal(room: RoomManifest, p: Point): Point { const c = room.plan!.center; return { x: p.x - c.x, y: p.y - c.y }; }

/** M1's fixed walk: out along the graph's shortest ordinary path to a turn-around room, across its frontier door, and back the same way to the start room's centre. */
export class WalkNavigator implements Navigator {
  readonly start: string;
  readonly rooms: string[];
  private readonly turn: string | null;
  constructor(graph: WorldGraph, manifests: Readonly<Record<string, RoomManifest>>, from: string, to: string, turnDoor?: string) {
    const path = graph.path(from, to);
    if (!path) throw new Error(`no ordinary route from ${from} to ${to}`);
    this.start = from; this.rooms = path;
    const before = path.length > 1 ? path[path.length - 2] : null;
    this.turn = turnDoor ?? manifests[to].doors.find(d => d.to !== before)?.id ?? null;
    if (this.turn && !manifests[to].doors.some(d => d.id === this.turn)) throw new Error(`${to} has no door ${this.turn}`);
  }
  arrive(ctx: ArrivalCtx): NavDecision {
    const path = this.rooms, n = path.length, i = ctx.leg;
    if (i < n) return { exit: i < n - 1 ? `to-${path[i + 1]}` : this.turn!, cross: i < n - 1, label: 'out' };
    const j = i - n;   // 0 is the first leg after the turn-around, still in the last room
    if (j === n - 1) return { goal: { x: 0, y: 0 }, label: 'back' };
    return { exit: `to-${path[n - 2 - j]}`, cross: true, label: 'back' };
  }
}

/**
 * An expedition on foot. Rooms are run by RoomRunner. Between rooms the adventurer walks the straight passage from one door to the paired door at walking
 * speed, so the world position never jumps. Enemies killed stay dead for the rest of the walk; living ones that never fought keep their places and can see
 * the adventurer on any later pass. Health carries. A navigator picks the exit door on every arrival. This class only sequences; it never picks a tactic.
 */
export class WorldRunner {
  state: WorldState = 'ready';
  tick = 0;
  readonly results: LegResult[] = [];
  readonly dead = new Map<string, boolean[]>();
  readonly nav: Navigator;
  /** The runner of the leg in progress, null while walking a passage. */
  runner: RoomRunner | null = null;
  /** Room the adventurer is in, or is walking toward. */
  room = '';
  pos: Point = { x: 0, y: 0 };
  hp = 0; hpMax = 0;
  maxWalkStep = 0; maxFightStep = 0;
  haltReason: string | null = null;
  readonly ledger: Ledger;
  deathSpot: DeathSpot | null = null;
  notes: string[] = [];
  private legIdx = -1;
  private decision: NavDecision | null = null;
  private entry: string | null = null;
  private passage: { to: Point; room: string; entry: string } | null = null;
  private face = 0;
  private hash = 2166136261;
  private readonly speed: number;
  private readonly derived: SimDerived;
  /** Stamina and poise, carried from room to room and recovered while walking. */
  carry: SimCarry;
  readonly graph: WorldGraph;
  constructor(readonly sim: SimApi, readonly cfg: WorldRunConfig, graph = new WorldGraph(), private readonly manifests: Readonly<Record<string, RoomManifest>> = ROOMS) {
    this.graph = graph;
    if (!cfg.navigator && (!cfg.from || !cfg.to)) throw new Error('a world run needs a navigator or both from and to');
    this.nav = cfg.navigator ?? new WalkNavigator(graph, manifests, cfg.from!, cfg.to!, cfg.turnDoor);
    const derived = sim.derive(sim.allocate(cfg.level, cfg.focus, cfg.seed), false);
    this.speed = sim.ARCH.adventurer.speed * derived.moveMult;
    this.derived = derived;
    this.carry = { st: derived.maxSt, poise: derived.poise };
    this.hpMax = cfg.hpOverride ?? derived.hp; this.hp = this.hpMax;
    this.ledger = new Ledger(cfg.cache ?? null, cfg.issuedKeys ?? 0, new Set(cfg.claims ?? []), new Set(cfg.openLinks ?? []));
    this.room = this.nav.start;
    this.pos = toWorld(this.manifests[this.nav.start], { x: 0, y: 0 });
  }
  /** Rooms of the planned walk when the navigator has one, else the rooms entered so far, in order and without repeats. */
  get rooms(): string[] { return (this.nav as { rooms?: string[] }).rooms ?? [...new Set(this.results.map(l => l.room).concat(this.runner ? [this.room] : []))]; }
  get terminal() { return this.state === 'home' || this.state === 'defeated' || this.state === 'unresolved'; }
  dispatch() {
    if (this.state !== 'ready') return;
    this.state = 'outbound';
    this.note(`Dispatched from ${this.nav.start}.`);
    this.beginLeg(this.nav.start, null, { x: 0, y: 0 }, 0);
  }
  private manifest(id: string) { return this.manifests[id]; }
  private note(text: string) { this.notes.push(`${this.tick}: ${text}`); }
  private ctx(room: string, entry: string | null, pos: Point): ArrivalCtx {
    return { room, entry, tick: this.tick, hp: this.hp, hpMax: this.hpMax, pos, carried: this.ledger.carried, leg: this.legIdx, dead: this.dead, results: this.results };
  }
  /** Start a stretch in `room` with the adventurer at room-local `at`, after asking the navigator where to go. */
  private beginLeg(room: string, entry: string | null, at: Point, face: number) {
    this.legIdx++;
    this.room = room; this.entry = entry;
    const m = this.manifest(room);
    const dec = this.nav.arrive(this.ctx(room, entry, at));
    this.decision = dec;
    if ('halt' in dec) { this.state = 'unresolved'; this.haltReason = dec.halt; this.runner = null; this.note(`Halted in ${room}: ${dec.halt}`); return; }
    const goal = 'goal' in dec ? dec.goal : undefined;
    const exitDoor = 'exit' in dec ? m.doors.find(d => d.id === dec.exit) : m.doors.find(d => d.id !== entry);
    if (!exitDoor) throw new Error(`${room} has no door ${'exit' in dec ? dec.exit : ''}`);
    const encounter = this.cfg.encounters?.[room] ?? (this.cfg.encounters ? undefined : OLD_ROAD_ENCOUNTERS[room]);
    this.runner = new RoomRunner(this.sim, {
      seed: this.cfg.seed, level: this.cfg.level, focus: this.cfg.focus, doctrine: this.cfg.doctrine,
      encounter, room: m,
      entryDoor: entry ?? undefined, exitDoor: exitDoor.id, start: at, startFace: face,
      startHp: this.hp, hpOverride: this.hpMax, carry: this.carry, defeated: this.dead.get(room), seedOffset: this.legIdx * 100003 + 100003, maxFightTicks: this.cfg.maxFightTicks,
      goal, via: 'exit' in dec ? dec.via : undefined,
    });
    this.runner.dispatch();
    this.note(`Entered ${room}.`);
  }
  /** Advance exactly one tick. */
  step() {
    if (this.terminal || this.state === 'ready') return;
    const before = this.pos;
    let fighting = false;
    if (this.passage) this.walkPassage();
    else {
      const r = this.runner!;
      this.askLive(r);
      const ticksBefore = r.fightTicks;
      r.step();
      fighting = r.fightTicks > ticksBefore;   // this tick belonged to the simulator, which owns the adventurer's motion
      // While the simulator owns the fight the adventurer's place is the fighter's, not the walker's.
      this.pos = toWorld(this.manifest(this.room), fighting && r.fight && r.state !== 'travelling' ? r.fight.p : r.hero);
      this.hp = r.hp; this.carry = r.carry;
      this.collect(r, fighting);
      if (r.terminal) this.endLeg(r);
    }
    const d = M.hypot(this.pos.x - before.x, this.pos.y - before.y);
    if (fighting) this.maxFightStep = Math.max(this.maxFightStep, d); else this.maxWalkStep = Math.max(this.maxWalkStep, d);
    this.tick++;
    this.mix();
  }
  /** Pay kills, take pickups and the cache within reach. Kills pay once per enemy; nothing is taken while the simulator owns the adventurer. */
  private collect(r: RoomRunner, fighting: boolean) {
    const ctx = () => this.liveCtx(r);
    r.foes.forEach((f, i) => { if (f.engaged && !f.alive) { const g = this.ledger.kill(f.arch, this.room, i); if (g) this.nav.looted?.(g, ctx()); } });
    if (fighting || r.state === 'fighting') return;
    const m = this.manifest(this.room), p = r.hero;
    for (const pk of m.pickups ?? []) if (M.hypot(pk.x - p.x, pk.y - p.y) <= PICKUP_REACH) { const g = this.ledger.pickup(this.room, pk); if (g) this.nav.looted?.(g, ctx()); }
    for (const n of this.graph.neighbours(this.room)) {
      if (!this.graph.isGated(n.type) || this.ledger.isOpen(n.key)) continue;
      const at = stagingPoint(m, n.room);
      if (M.hypot(at.x - p.x, at.y - p.y) > PICKUP_REACH) continue;
      const g: GateInfo = { key: n.key, from: this.room, to: n.room, type: n.type, need: GATE_NEED[n.type] ?? 'special', state: 'sealed' };
      if (!this.nav.wantsInteraction?.(g, ctx())) continue;
      const ok = g.need === 'key' ? this.ledger.spendKey(n.key) : g.need === 'activation' ? this.ledger.activate(n.key) : false;
      this.nav.gateWorked?.(g, ok, ctx());
    }
    const c = this.ledger.cache;
    if (c && c.room === this.room && M.hypot(c.x - p.x, c.y - p.y) <= PICKUP_REACH) { const g = this.ledger.recoverCache(); if (g) this.nav.looted?.(g, ctx()); }
  }
  private liveCtx(r: RoomRunner): LiveCtx {
    return { room: this.room, entry: this.entry, tick: this.tick, hp: r.hp, hpMax: this.hpMax, fighting: r.state === 'fighting', pos: { x: r.hero.x, y: r.hero.y }, carried: this.ledger.carried };
  }
  /** Let the navigator change the way out mid-room (a retreat order or a survival trigger). */
  private askLive(r: RoomRunner) {
    if (!this.nav.live || (r.state !== 'fighting' && r.state !== 'travelling')) return;
    const ctx: LiveCtx = { ...this.liveCtx(r), pos: r.state === 'fighting' && r.fight ? { x: r.fight.p.x, y: r.fight.p.y } : { x: r.hero.x, y: r.hero.y } };
    const act = this.nav.live(ctx);
    if (!act) return;
    if ('again' in act) {   // something changed in this room (a gate was worked): decide again from where the adventurer stands
      const dec = this.nav.arrive(this.ctx(this.room, this.entry, { x: r.hero.x, y: r.hero.y }));
      if ('exit' in dec && dec.exit !== r.exit.id && r.retreat(dec.exit).ok) this.decision = { ...dec, via: undefined };
      return;
    }
    if ('end' in act) {   // a retreat ordered while still at camp: the walk ends here
      r.finishHere();
      this.decision = { goal: { x: 0, y: 0 }, label: 'back' };
      return;
    }
    const answer = r.retreat(act.exit);
    if (answer.ok) this.decision = { exit: act.exit, cross: true, label: 'back' };
    this.nav.liveAnswer?.(answer, ctx);
  }
  private endLeg(r: RoomRunner) {
    const dec = this.decision!, room = this.room;
    const lr: LegResult = { room, phase: ('exit' in dec || 'goal' in dec) ? dec.label ?? 'walk' : 'walk', entry: this.entry, result: r.result() };
    this.results.push(lr);
    this.dead.set(room, r.foes.map(f => f.engaged && !f.alive));
    this.nav.legEnded?.(lr, this.ctx(room, this.entry, r.hero));
    if (r.state === 'defeated') {
      this.state = 'defeated'; this.note('The adventurer fell.');
      const at = r.fight ? r.fight.p : r.hero;
      this.deathSpot = { room, x: Math.round(at.x * 10) / 10, y: Math.round(at.y * 10) / 10 };
      return;
    }
    if (r.state === 'unresolved') { this.state = 'unresolved'; this.note(`Stopped in ${room}: ${r.notes[r.notes.length - 1]}`); return; }
    if ('goal' in dec) { this.state = 'home'; this.note(`Back at ${this.nav.start}.`); this.runner = null; return; }
    const exit = 'exit' in dec ? dec : null;
    if (!exit) return;
    if (!exit.cross) {
      // Turn-around: stay where the adventurer stands and ask again from the same door.
      this.state = 'homebound'; this.note(`Turned back at the ${exit.exit} door.`);
      this.beginLeg(room, exit.exit, r.hero, r.hero.face);
      return;
    }
    // Walk the passage from where the adventurer stands to the paired door of the next room.
    const here = this.manifest(room), door = here.doors.find(d => d.id === exit.exit)!;
    const there = this.manifest(door.to), arrival = there.doors.find((d: Door) => d.id === `to-${room}`)!;
    this.passage = { to: toWorld(there, arrival.center), room: door.to, entry: arrival.id };
    this.face = r.hero.face;
    this.runner = null;
  }
  private walkPassage() {
    const p = this.passage!, dx = p.to.x - this.pos.x, dy = p.to.y - this.pos.y, d = M.hypot(dx, dy);
    if (d > 1e-9) this.face = M.atan2(dy, dx);
    this.carry = this.sim.rest(this.carry, this.derived, 1);
    if (d <= this.speed) {
      this.pos = { x: p.to.x, y: p.to.y };
      const there = this.manifest(p.room);
      this.passage = null;
      this.beginLeg(p.room, p.entry, toLocal(there, this.pos), this.face);
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
      outcome: this.state === 'home' || this.state === 'defeated' ? this.state : 'unresolved', rooms: this.rooms, haltReason: this.haltReason, legs: this.results, ticks: this.tick,
      fights: this.results.reduce((n, l) => n + l.result.fights, 0), enemiesDefeated: this.results.reduce((n, l) => n + l.result.enemiesDefeated, 0),
      hpLeft: Math.round(this.hp), hpMax: this.hpMax, finalPos: { x: Math.round(this.pos.x * 10) / 10, y: Math.round(this.pos.y * 10) / 10 }, digest: this.digest,
      maxWalkStep: Math.round(this.maxWalkStep * 1000) / 1000, maxFightStep: Math.round(this.maxFightStep * 1000) / 1000,
      dead: Object.fromEntries(this.dead),
      bossesDefeated: [...new Set(this.results.flatMap(l => l.result.bossesDefeated ?? []))].sort(),
      loot: { carried: this.ledger.carried, gains: this.ledger.gains, cache: this.ledger.cache, recovered: this.ledger.recovered, deathSpot: this.deathSpot, issued: this.ledger.issued, spent: this.ledger.spent, opened: [...this.ledger.opened].sort(), claimed: [...this.ledger.claimed].sort() },
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
