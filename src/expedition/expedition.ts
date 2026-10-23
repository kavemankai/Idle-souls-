import type { ArrivalCtx, LegResult, LiveCtx, NavDecision, Navigator } from '../world/worldRunner';
import type { RetreatAnswer } from '../world/roomRunner';
import type { WorldGraph } from '../world/worldGraph';
import type { Cache } from '../save/saveTypes';
import { Progress, REST_BELOW } from '../progression/experience';
import { describeBank, type Gain } from './loot';
import { WorldGraph as WG } from '../world/worldGraph';
import { GATE_NEED, needText, stagingPoint, type GateInfo } from '../world/gates';
import { ROOMS } from '../world/roomRegistry';
import { bossAt, BOSSES } from '../world/bosses';
import { CAMP, MAX_OBJECTIVES, frontierRooms, name, styleOf, type ExpeditionPlan, type Objective, type ObjectiveStatus } from './plan';
import { planRooms, type RoutePlan, type RouteStyle } from './planner';

export type IntentKind = 'launch' | 'route' | 'objective' | 'discovery' | 'sweep' | 'fight' | 'retreat' | 'redirect' | 'skip' | 'order' | 'loot' | 'level' | 'ration' | 'sanctuary' | 'boss' | 'end';
/** One line of the intent feed: what the adventurer is doing and why. `cause` is the rule or order behind it. */
export interface Intent { tick: number; kind: IntentKind; room: string; text: string; cause: string }
/** A fact worth keeping in the Chronicle on its own line: a gate opened, a boss engaged, a boss defeated. Banking is added when the Chronicle is built. */
export interface ChronicleEvent { tick: number; kind: 'gate_opened' | 'boss_engaged' | 'boss_defeated' | 'boss_reset'; room: string; text: string }
export type Mode = 'outbound' | 'returning' | 'blocked' | 'home';
export interface ObjectiveState extends Objective { status: ObjectiveStatus; note: string }
export type Order = { type: 'retreat' } | { type: 'redirect'; room: string };

const pct = (hp: number, max: number) => Math.round(hp / max * 100);
const units = (n: number) => `${Math.round(n)} units`;
const list = (rooms: readonly string[]) => rooms.join(' > ');

/**
 * The expedition layer. It is a navigator: on every arrival in a room it decides which door to leave by, from the plan, the map the player has seen, the
 * adventurer's health and any orders. It picks routes, never tactics. Every decision is written to the intent feed with its cause.
 * Orders (retreat, redirect) take effect at the next arrival, the next legal decision point; M2 has no mid-fight hand-off.
 */
export class Expedition implements Navigator {
  readonly start = CAMP;
  readonly rooms: string[] = [];
  readonly known: Set<string>;
  readonly objectives: ObjectiveState[];
  readonly intent: Intent[] = [];
  mode: Mode = 'outbound';
  /** Room or short plan the adventurer is heading for right now. */
  target: string | null = null;
  route: RoutePlan | null = null;
  endReason: string | null = null;
  readonly visited = new Set<string>();
  /** Bosses already defeated for good, and bosses that fell during this expedition. */
  readonly defeated: Set<string>;
  readonly felled = new Set<string>();
  readonly events: ChronicleEvent[] = [];
  private bossTries = 0;
  private pending: Order[] = [];
  private sub: { room: string; why: string; back: boolean }[] = [];
  private lastRoute: string[] = [];
  private readonly avoid: Set<string>;
  private nextId = 100;
  constructor(readonly plan: ExpeditionPlan, private readonly graph: WorldGraph, known: Iterable<string>, private readonly cache: Cache | null = null, openLinks: Iterable<string> = [], private readonly progress: Progress | null = null, defeatedBosses: Iterable<string> = []) {
    this.defeated = new Set(defeatedBosses);
    this.openLinks = new Set(openLinks);
    this.known = new Set(known);
    this.avoid = new Set(plan.avoid);
    if (plan.objectives.length > MAX_OBJECTIVES) throw new Error(`at most ${MAX_OBJECTIVES} objectives`);
    if (this.avoid.has(CAMP)) throw new Error('camp cannot be avoided');
    this.objectives = plan.objectives.map(o => ({ ...o, status: 'queued', note: '' }));
    this.say(0, 'launch', CAMP, `Launched with ${this.objectives.length} objective${this.objectives.length === 1 ? '' : 's'}: ${plan.exploration} exploration, ${plan.doctrine} doctrine, retreat below ${plan.retreatHpPct}% health, ${plan.returnRoute} way home.`, 'Plan accepted at camp.');
  }
  /** Queue an order. Returns the reason it was refused, or null. */
  order(o: Order): string | null {
    if (o.type === 'redirect') {
      if (this.avoid.has(o.room)) return `${name(this.graph, o.room)} is on the avoid list.`;
      if (!this.known.has(o.room) && !frontierRooms(this.graph, this.known, this.openLinks).includes(o.room)) return `${name(this.graph, o.room)} is not on the map yet.`;
      if (this.objectives.filter(x => x.status === 'queued' || x.status === 'active').length >= MAX_OBJECTIVES) return `At most ${MAX_OBJECTIVES} objectives.`;
    }
    this.pending.push(o);
    return null;
  }
  get pendingOrders(): readonly Order[] { return this.pending; }
  private say(tick: number, kind: IntentKind, room: string, text: string, cause: string) { this.intent.push({ tick, kind, room, text, cause }); }
  private lastTick = 0;
  private rationsDrunk = 0;
  private set(o: ObjectiveState, status: ObjectiveStatus, note = '') {
    if (status === 'completed' && o.status !== 'completed') this.progress?.objective(this.lastTick);
    o.status = status; o.note = note;
  }
  /** Heard from the world runner: a ration was drunk. */
  rationUsed(info: { from: 'kit' | 'found'; healed: number; left: number; hp: number }, ctx: LiveCtx) {
    this.rationsDrunk++;
    this.say(ctx.tick, 'ration', ctx.room, `Drank a ${info.from === 'kit' ? 'starter' : 'found'} ration: +${info.healed} health, now ${info.hp}. ${info.left} left.`, `Drinking rule: below ${this.plan.drinkBelowPct}% health, no enemy near, one at a time, never in a fight.`);
  }
  /** Heard from the world runner: the sanctuary took the plan's upgrade, or rested. It banks nothing. */
  sanctuaryUsed(info: { kind: 'upgrade'; upgrade: string; name: string; visit: number } | { kind: 'rest'; healed: number; visit: number }, ctx: LiveCtx) {
    const text = info.kind === 'upgrade' ? `At the Broken Pump sanctuary: took the ${info.name} upgrade for this expedition. No banking here.` : `Rested at the sanctuary: +${info.healed} health, stamina restored. One rest per expedition. No banking here.`;
    this.say(ctx.tick, 'sanctuary', ctx.room, text, info.kind === 'upgrade' ? `The plan's default choice (${this.plan.sanctuaryChoice}); nothing waits for a decision.` : 'Hurt and safe: the first eligible rest (doc 09). Nothing is banked or secured.');
  }
  private active(): ObjectiveState | undefined { return this.objectives.find(o => o.status === 'active' || o.status === 'queued'); }

  /**
   * Called every tick inside a room. A manual Retreat order or the health threshold turns the walk into a retreat at once, even mid-fight
   * (the combat layer disengages; this layer only supplies the way out). Redirects wait for the next doorway.
   */
  live(ctx: LiveCtx): { exit: string } | { end: true } | { again: true } | null {
    if (this.rearrive) { this.rearrive = false; return { again: true }; }
    if (this.mode !== 'outbound' || this.retreatTried) return null;
    const manual = this.pending.some(o => o.type === 'retreat');
    const low = this.plan.retreatHpPct > 0 && pct(ctx.hp, ctx.hpMax) < this.plan.retreatHpPct;
    // Healing reserve (doc 04): once at least one ration has been drunk, head home when what is left is at or below the reserve.
    const reserve = this.plan.healingReserve > 0 && this.rationsDrunk > 0 && (ctx.rations ?? Infinity) <= this.plan.healingReserve;
    if (!manual && !low && !reserve) return null;
    this.pending = this.pending.filter(o => o.type !== 'retreat');
    if (ctx.room === CAMP) {
      this.startReturn(ctx, why0(manual, ctx, this.plan)[0], why0(manual, ctx, this.plan)[1]);
      this.mode = 'home'; this.endReason = 'Retreat ordered at camp.';
      this.say(ctx.tick, 'end', ctx.room, 'Already at camp: the expedition ends here. Nothing is banked twice.', 'Extraction completes once; being at camp already counts.');
      return { end: true };
    }
    const style: RouteStyle = this.plan.returnRoute === 'shortest' ? 'shortest' : 'safe';
    const route = this.route0(ctx.room, CAMP, style);
    const why = !manual && !low && reserve ? [`Rations are down to ${ctx.rations}, at or below the healing reserve of ${this.plan.healingReserve}.`, 'Survival policy (healing reserve)'] as [string, string] : why0(manual, ctx, this.plan);
    if (!route) {
      this.retreatTried = true;
      const open = planRooms({ open: this.openLinks, graph: this.graph, known: this.known, from: ctx.room, to: CAMP, avoid: new Set(), style: 'shortest' });
      this.say(ctx.tick, 'retreat', ctx.room, `RETREAT BLOCKED: ${open ? 'every known way home crosses an avoided room' : 'no known open route home'}. ${why[0]} The adventurer carries on and does not cross the avoided room.`, 'Avoid is absolute (L13), even in a retreat. No teleport.');
      return null;
    }
    this.startReturn(ctx, why[0], why[1]);
    this.liveRoute = route;
    return { exit: `to-${route.rooms[1]}` };
  }
  liveAnswer(answer: RetreatAnswer, ctx: LiveCtx) {
    if (!this.liveRoute) return;
    const route = this.liveRoute; this.liveRoute = null;
    if (!answer.ok) { this.retreatTried = true; this.say(ctx.tick, 'retreat', ctx.room, `RETREAT BLOCKED: ${answer.reason} The adventurer carries on.`, 'No route out of this room from where it stands.'); return; }
    this.route = route; this.target = CAMP;
    const door = `to-${route.rooms[1]}`;
    if (answer.report) {
      const r = answer.report;
      this.say(ctx.tick, 'retreat', ctx.room, `Disengage: ${r.pursuers} enem${r.pursuers === 1 ? 'y' : 'ies'} here, nearest ${r.nearest} units, ${r.withinReach} within reach, stamina ${r.stamina}%, health ${r.health}%${r.acting ? ', mid-action' : ''}. Stops attacking, guards while walking out by the ${door} door.`, 'Phase 1 of a retreat: break contact. Enemies stay in their room.');
    } else this.say(ctx.tick, 'retreat', ctx.room, `Withdraw: heads for the ${door} door, then ${list(route.rooms)}.`, 'Phase 2 of a retreat: leave by the permitted way home.');
  }
  /** Asked when the adventurer stands at a sealed gate: only the gate the current objective names, and only here, never by chance. */
  wantsInteraction(g: GateInfo): boolean {
    const o = this.active();
    return !!o && o.kind === 'open' && o.status === 'active' && o.room === g.from && o.to === g.to;
  }
  gateWorked(g: GateInfo, ok: boolean, ctx: LiveCtx) {
    const a = name(this.graph, g.from), b = name(this.graph, g.to);
    if (ok) {
      this.openLinks.add(g.key);
      this.events.push({ tick: ctx.tick, kind: 'gate_opened', room: g.from, text: `The way from ${a} to ${b} opened for good.` });
      this.rearrive = true;   // the way out may have changed: decide again from here
      this.say(ctx.tick, 'loot', g.from, g.need === 'key' ? `Spent 1 Gate Key: the way from ${a} to ${b} is open for good. No fight has started.` : `Worked the shortcut from ${a} to ${b}: it is open for good.`, g.need === 'key' ? 'A deliberate, permanent unlock (L16, L19). It persists even if the adventurer falls.' : 'A shortcut activated by hand; it stays open.');
    } else this.say(ctx.tick, 'skip', g.from, `Could not open the way from ${a} to ${b}: no eligible key is carried.`, 'Only a key banked at camp and issued for this expedition can open a gate (L19).');
  }
  private retreatTried = false;
  private cacheRecovered = false;
  /** Gates and shortcuts open for good: from the save, plus any opened on this expedition. */
  readonly openLinks: Set<string>;
  private interactTries = 0;
  private rearrive = false;
  private exploring: { id: string; left: number } | null = null;
  private cacheTries = 0;
  /** Heard from the world runner: something was gained. Everything gained is carried and at risk until camp. */
  looted(g: Gain, ctx: LiveCtx) {
    if (g.source === 'cache') this.cacheRecovered = true;
    const text = g.source === 'kill' ? `Defeated ${g.label.replace(' defeated', '')} in ${name(this.graph, g.room)}: ${describeBank(g.bundle)}.` : g.source === 'pickup' ? `Picked up ${g.label} in ${name(this.graph, g.room)}.` : `Recovered the cache in ${name(this.graph, g.room)}: ${describeBank(g.bundle)}.`;
    const fresh = g.bundle.keys > 0 ? ' A Gate Key found on the way cannot open a gate until it has been banked at camp.' : '';
    this.say(ctx.tick, 'loot', g.room, `${text} Carried, at risk until camp.${fresh}`, 'Loot is banked only by arriving at camp alive (doc 08).');
  }
  private liveRoute: RoutePlan | null = null;

  legEnded(lr: LegResult, ctx: ArrivalCtx) {
    const r = lr.result;
    if (r.escaped && this.bossLive(lr.room)) { this.events.push({ tick: ctx.tick, kind: 'boss_reset', room: lr.room, text: `Left ${bossAt(lr.room)!.name} unfinished; it resets.` }); this.say(ctx.tick, 'boss', lr.room, `Left ${bossAt(lr.room)!.name} alive. The fight is abandoned and the boss resets to full health. Nothing is lost and no key returns.`, 'An unfinished boss fight does not persist.'); }
    if (r.escaped) this.say(ctx.tick, 'fight', lr.room, `Broke contact in ${name(this.graph, lr.room)} with health ${r.hpLeft} of ${r.hpMax}; surviving enemies return to their posts.`, 'No lingering alert: enemies reset when the adventurer leaves (doc 07).');
    if (r.fights > 0 && !r.escaped) this.say(ctx.tick, 'fight', lr.room, `${r.outcome === 'defeated' ? 'Lost' : 'Won'} ${r.fights} fight${r.fights === 1 ? '' : 's'} in ${name(this.graph, lr.room)}, ${r.enemiesDefeated} enemies down; health ${r.hpLeft} of ${r.hpMax}.`, 'The simulator ran the fight; the expedition layer only reads the outcome.');
    if (r.outcome === 'defeated') { this.mode = 'blocked'; this.endReason = `Fell in ${name(this.graph, lr.room)}.`; }
  }

  arrive(ctx: ArrivalCtx): NavDecision {
    const room = ctx.room, tick = ctx.tick;
    this.lastTick = tick;
    this.visited.add(room);
    for (const e of this.progress?.drainEvents() ?? []) this.say(tick, 'level', room, `Reached level ${e.level} of 9 (${e.xp} experience): ${e.cause}. It applies from here on and ends with the expedition.`, 'Temporary progression: training by use, learning from mistakes, finding out (doc 10).');
    if (!this.known.has(room)) {
      this.known.add(room);
      this.progress?.discovery(tick);
      this.say(tick, 'discovery', room, `Entered ${name(this.graph, room)} for the first time. It is now on the map.`, 'Map memory is permanent.');
    }
    if (this.rooms[this.rooms.length - 1] !== room) this.rooms.push(room);
    this.applyOrders(ctx);
    if (this.mode === 'outbound' && this.plan.retreatHpPct > 0 && pct(ctx.hp, ctx.hpMax) < this.plan.retreatHpPct) this.startReturn(ctx, `Health ${pct(ctx.hp, ctx.hpMax)}% is below the ${this.plan.retreatHpPct}% retreat setting.`, 'Survival policy');
    if (this.mode === 'returning') return this.goHome(ctx);
    if (this.mode !== 'outbound') return { halt: this.endReason ?? 'Stopped.' };
    // Subgoals (looking into rooms beside a survey target) come before the next objective.
    while (this.sub.length && this.sub[0].room === room) { const s = this.sub.shift()!; this.say(tick, 'sweep', room, s.back ? `Back in ${name(this.graph, room)}; the survey goes on.` : `Looked around ${name(this.graph, room)}.`, s.why); }
    if (this.sub.length) return this.head(ctx, this.sub[0].room, 'safe', this.sub[0].why);
    for (let guard = 0; guard <= this.objectives.length; guard++) {
      const o = this.active();
      if (!o) { this.startReturn(ctx, 'Every objective is done or skipped.', 'Return to Camp ends every plan.'); return this.goHome(ctx); }
      if (o.status === 'queued') { this.set(o, 'active'); this.say(tick, 'objective', room, `Objective ${this.index(o)}: ${o.kind === 'survey' ? 'survey' : o.kind === 'challenge' ? 'challenge the boss of' : o.kind === 'rematch' ? 'rematch the boss of' : 'reach'} ${name(this.graph, o.room)}.`, 'Next in the plan order.'); }
      if (o.kind === 'open') {
        const link = WG.linkKey(o.room, o.to!);
        if (this.openLinks.has(link)) {
          this.set(o, 'completed', 'Open for good.');
          this.say(tick, 'objective', room, `Objective ${this.index(o)} done: the way from ${name(this.graph, o.room)} to ${name(this.graph, o.to!)} is open for good.`, 'The gate is open.');
          continue;
        }
        if (o.room === room) {
          const link2 = this.graph.neighbours(room).find(n => n.room === o.to);
          const need = link2 ? GATE_NEED[link2.type] ?? 'special' : 'special';
          const why = !link2 ? 'There is no door there.' : need === 'key' ? (ctx.carried.prepared < 1 ? (ctx.carried.keys > 0 ? 'The Gate Key found on this run cannot open a gate until it has been banked at camp.' : 'No Gate Key was issued from camp for this expedition.') : '')
            : need === 'activation' ? '' : need === 'boss' ? 'It opens when the miniboss falls.' : 'It is an optional special-key door, not part of this slice.';
          if (why || ++this.interactTries > 2) {
            const reason = why || 'The gate could not be reached.';
            this.set(o, 'skipped_blocked', reason);
            this.say(tick, 'skip', room, `Objective ${this.index(o)} skipped, blocked: ${reason}`, 'L14: try legal alternatives, then skip and continue in order.');
            continue;
          }
          this.say(tick, 'objective', room, `Walking to the gate to ${name(this.graph, o.to!)}: ${needText(need)}.`, 'Open objective: a deliberate, planned unlock.');
          const back = ctx.entry ?? this.graph.neighbours(room)[0].door;
          return { exit: back, cross: true, label: 'out', via: stagingPoint(ROOMS[room], o.to!) };
        }
      }
      if ((o.kind === 'reach' || o.kind === 'survey') && this.bossLive(o.room) && (o.room === room || this.route0(room, o.room, styleOf(this.plan.exploration)))) {
        this.set(o, 'skipped_blocked', 'A boss guards that room. Use a Challenge objective.');
        this.say(tick, 'skip', room, `Objective ${this.index(o)} skipped, blocked: ${name(this.graph, o.room)} holds a boss and nobody walks in by accident.`, 'Commitment (doc 21): a boss is engaged only by a deliberate objective.');
        continue;
      }
      if (o.kind === 'challenge' || o.kind === 'rematch') {
        const b = bossAt(o.room);
        const refuse = !b ? 'There is no boss there.' : o.kind === 'challenge' && this.defeated.has(b.id) ? `${b.name} is already defeated for good. A first-time challenge is not counted as done; a Rematch must be chosen.`
          : o.kind === 'rematch' && !this.defeated.has(b.id) ? `${b.name} has not been defeated yet; a rematch opens after the first clear.` : '';
        if (refuse) { this.set(o, 'skipped_blocked', refuse); this.say(tick, 'skip', room, `Objective ${this.index(o)} skipped, blocked: ${refuse}`, 'L14: skip and continue in order. Nothing is counted as done silently.'); continue; }
        if (this.felled.has(b!.id)) { this.set(o, 'completed', 'Defeated.'); continue; }
        if (o.room === room) {
          if (++this.bossTries > 2) {
            this.set(o, 'skipped_blocked', `${b!.name} did not engage.`);
            this.say(tick, 'skip', room, `Objective ${this.index(o)} skipped, blocked: ${b!.name} did not engage.`, 'L14: try legal alternatives, then skip and continue in order.');
            continue;
          }
          const spec = ROOMS[room].encounters[Object.keys(ROOMS[room].encounters).find(k => ROOMS[room].encounters[k].enemies[0].arch === b!.id)!].enemies[0];
          this.say(tick, 'objective', room, `Walking toward ${b!.name} to ${o.kind === 'rematch' ? 'take the rematch' : 'challenge it'}.`, `${o.kind === 'rematch' ? 'Rematch' : 'Challenge'} objective: a deliberate fight, alone, the entry door the only way out.`);
          return { exit: ctx.entry ?? this.graph.neighbours(room)[0].door, cross: true, label: 'out', via: { x: spec.x - 110, y: spec.y } };
        }
      }
      if (o.kind === 'explore' && !this.exploring && o.room === room) this.exploring = { id: o.id, left: Math.max(0, (o.depth ?? 3) - 1) };
      if (o.kind === 'explore' && this.exploring && this.exploring.id === o.id) {
        const next = this.graph.neighbours(room).find(n => !this.known.has(n.room) && (!this.graph.isGated(n.type) || this.openLinks.has(n.key)) && !this.avoid.has(n.room) && !this.barred(n.room));
        if (this.exploring.left > 0 && next) {
          this.exploring.left--;
          return this.head(ctx, next.room, styleOf(this.plan.exploration), `Exploring on from ${name(this.graph, room)}`);
        }
        this.exploring = null;
        this.set(o, 'completed', 'Explored as far as it goes.');
        this.say(tick, 'objective', room, `Objective ${this.index(o)} done: explored on from the edge of the map as far as the bounded search allows.`, 'Bounded exploration: a few rooms, then home (doc 05).');
        continue;
      }
      if (o.kind === 'recover' && this.cacheRecovered) {
        this.set(o, 'completed', 'Cache recovered; still at risk until camp.');
        this.say(tick, 'objective', room, `Objective ${this.index(o)} done: the recovery cache is in hand. It is not banked until camp.`, 'The cache was picked up.');
        continue;
      }
      if (o.kind === 'recover' && o.room === room && this.cache) {
        if (++this.cacheTries > 2) {
          this.set(o, 'skipped_blocked', 'The cache could not be reached.');
          this.say(tick, 'skip', room, `Objective ${this.index(o)} skipped, blocked: the cache could not be reached.`, 'L14: try legal alternatives, then skip and continue in order.');
          continue;
        }
        this.say(tick, 'objective', room, `Walking to the recovery cache in ${name(this.graph, room)}.`, 'Recover objective.');
        const back = ctx.entry ?? this.graph.neighbours(room)[0].door;
        return { exit: back, cross: true, label: 'out', via: { x: this.cache.x, y: this.cache.y } };
      }
      if (o.room === room) {
        this.set(o, 'completed', o.kind === 'survey' ? 'Surveyed.' : 'Reached.');
        this.say(tick, 'objective', room, `Objective ${this.index(o)} done: ${o.kind === 'survey' ? 'surveyed' : 'reached'} ${name(this.graph, room)}.`, 'Arrival at the objective room.');
        if (o.kind === 'survey' && this.plan.exploration === 'thorough') this.queueSweep(room, ctx.entry);
        if (this.sub.length) return this.head(ctx, this.sub[0].room, 'safe', this.sub[0].why);
        continue;
      }
      const route = this.route0(room, o.room, styleOf(this.plan.exploration));
      if (!route) {
        const crossing = planRooms({ open: this.openLinks, graph: this.graph, known: this.known, from: room, to: o.room, avoid: new Set(), style: 'shortest' });
        const sealedBoss = (o.kind === 'challenge' || o.kind === 'rematch') && bossAt(o.room) && !this.openLinks.has(bossAt(o.room)!.gate);
        const why = sealedBoss ? `The gate to ${name(this.graph, o.room)} is sealed and nothing opened it.` : crossing ? `Every known way to ${name(this.graph, o.room)} crosses an avoided room.` : `No known open route to ${name(this.graph, o.room)} from ${name(this.graph, room)}.`;
        this.set(o, 'skipped_blocked', why);
        this.say(tick, 'skip', room, `Objective ${this.index(o)} skipped, blocked: ${why}`, 'L14: try legal alternatives, then skip and continue in order.');
        continue;
      }
      return this.head(ctx, o.room, styleOf(this.plan.exploration), `Objective ${this.index(o)}`, route);
    }
    this.startReturn(ctx, 'Nothing left to try.', 'Return to Camp ends every plan.');
    return this.goHome(ctx);
  }

  private index(o: ObjectiveState) { return this.objectives.indexOf(o) + 1; }
  /** A boss stands in `room` right now: it has not been defeated, or a rematch put a temporary one there, and it has not fallen on this expedition. */
  private bossLive(room: string): boolean {
    const b = bossAt(room);
    if (!b || this.felled.has(b.id)) return false;
    return !this.defeated.has(b.id) || this.objectives.some(o => o.kind === 'rematch' && o.room === room);
  }
  /** Nobody walks into a living boss's arena by chance: only the challenge or rematch objective that is being worked now may. */
  private barred(room: string): boolean {
    if (!this.bossLive(room)) return false;
    const o = this.active();
    return !(o && (o.kind === 'challenge' || o.kind === 'rematch') && o.room === room);
  }
  private avoidFor(from: string, to: string): Set<string> {
    const out = new Set(this.avoid);
    for (const r of this.graph.rooms.keys()) if (r !== from && r !== to && this.barred(r)) out.add(r);
    return out;
  }
  private route0(from: string, to: string, style: RouteStyle, notFirst?: Set<string>) {
    return planRooms({ open: this.openLinks, graph: this.graph, known: this.known, from, to, avoid: this.avoidFor(from, to), style, notFirst });
  }
  /** Heard from the world runner: a boss came into a fight. */
  bossEngaged(info: { boss: string; room: string; rematch: boolean }, ctx: LiveCtx) {
    const b = BOSSES[info.boss];
    this.events.push({ tick: ctx.tick, kind: 'boss_engaged', room: info.room, text: `${b.name} engaged${info.rematch ? ' (rematch)' : ''}.` });
    this.say(ctx.tick, 'boss', info.room, `${b.name} sees the adventurer. The fight is to the finish or the door; the only way out is the way in.`, info.rematch ? 'Rematch objective: opted in.' : 'Challenge objective: a deliberate commitment (doc 21).');
  }
  /** Heard from the world runner: a boss fell. The clear is permanent the moment it happens. */
  bossDefeated(info: { boss: string; room: string; first: boolean; opened: string | null }, ctx: LiveCtx) {
    const b = BOSSES[info.boss];
    this.felled.add(info.boss);
    if (info.opened) this.openLinks.add(info.opened);
    this.events.push({ tick: ctx.tick, kind: 'boss_defeated', room: info.room, text: `${b.name} defeated${info.first ? ' for the first time' : ' (rematch)'}.` });
    this.say(ctx.tick, 'boss', info.room, info.first
      ? `${b.name} is down for good.${info.opened ? ` The way from ${name(this.graph, b.room)} to ${name(this.graph, info.opened.split('~').find(x => x !== b.room)!)} is open for good.` : ''}${b.campaign ? ' The campaign route is unlocked.' : ''} The rewards are carried and at risk until camp.`
      : `${b.name}'s temporary double is down. The first clear is unchanged. Limited rewards are carried, at risk until camp.`, info.first ? 'First clear: permanent whatever happens next (doc 11).' : 'Rematch: no key, no new world change.');
    for (const o of this.objectives) if ((o.kind === 'challenge' || o.kind === 'rematch') && o.room === info.room && (o.status === 'active' || o.status === 'queued')) this.set(o, 'completed', info.first ? 'Defeated for the first time.' : 'Rematch won.');
    this.rearrive = true;
  }
  private queueSweep(room: string, cameFrom: string | null) {
    const sides = this.graph.neighbours(room).filter(n => !this.graph.isGated(n.type) && !this.avoid.has(n.room) && !this.barred(n.room) && !this.visited.has(n.room) && n.door !== cameFrom && n.room !== CAMP);
    for (const n of sides) { this.sub.push({ room: n.room, why: `Thorough survey looks into ${name(this.graph, n.room)}.`, back: false }, { room, why: `Thorough survey returns to ${name(this.graph, room)}.`, back: true }); }
  }
  private applyOrders(ctx: ArrivalCtx) {
    const orders = this.pending; this.pending = [];
    for (const o of orders) {
      if (o.type === 'retreat') { if (this.mode === 'outbound') this.startReturn(ctx, 'Player ordered a retreat.', 'Manual retreat outranks every objective.'); continue; }
      if (this.mode !== 'outbound') { this.say(ctx.tick, 'order', ctx.room, `Redirect to ${name(this.graph, o.room)} ignored: the adventurer is already heading home.`, 'A retreat is not undone by a redirect.'); continue; }
      const id = `r${this.nextId++}`;
      const first = this.active();
      const entry: ObjectiveState = { id, kind: 'reach', room: o.room, status: 'queued', note: '' };
      this.objectives.splice(first ? this.objectives.indexOf(first) : this.objectives.length, 0, entry);
      if (first && first.status === 'active') this.set(first, 'queued', 'Postponed by a redirect.');
      this.sub = [];
      this.say(ctx.tick, 'redirect', ctx.room, `Redirect accepted at ${name(this.graph, ctx.room)}: reach ${name(this.graph, o.room)} first.`, 'Player order, applied at the first safe junction.');
    }
  }
  private startReturn(ctx: { tick: number; room: string }, text: string, cause: string) {
    this.mode = 'returning'; this.sub = [];
    for (const o of this.objectives) if (o.status === 'active' || o.status === 'queued') this.set(o, 'suspended', text);
    this.say(ctx.tick, 'retreat', ctx.room, `Heading for camp. ${text}`, cause);
  }
  private goHome(ctx: ArrivalCtx): NavDecision {
    if (ctx.room === CAMP) { this.mode = 'home'; this.endReason = 'Back at camp.'; this.say(ctx.tick, 'end', ctx.room, 'Arrived at camp alive. Banking comes with M3.', 'Extraction means arriving at camp alive.'); return { goal: { x: 0, y: 0 }, label: 'back' }; }
    const style: RouteStyle = this.plan.returnRoute === 'shortest' ? 'shortest' : 'safe';
    const route = this.route0(ctx.room, CAMP, style);
    if (!route) {
      this.mode = 'blocked';
      const open = planRooms({ open: this.openLinks, graph: this.graph, known: this.known, from: ctx.room, to: CAMP, avoid: new Set(), style: 'shortest' });
      this.endReason = open ? `Extraction blocked by your exclusion: every known way home crosses an avoided room.` : 'Extraction blocked: no known open route home.';
      this.say(ctx.tick, 'end', ctx.room, this.endReason, 'Avoid is absolute (L13), even on the way home. No teleport.');
      return { halt: this.endReason };
    }
    return this.head(ctx, CAMP, style, 'Way home', route);
  }
  /** Leave by the first door of the route to `to`, and log why that route. */
  private head(ctx: ArrivalCtx, to: string, style: RouteStyle, label: string, route = this.route0(ctx.room, to, style)): NavDecision {
    if (!route) { this.mode = 'blocked'; this.endReason = `No route from ${name(this.graph, ctx.room)} to ${name(this.graph, to)}.`; return { halt: this.endReason }; }
    this.route = route; this.target = to;
    const next = route.rooms[1];
    // A choice is logged when the route changes, and again at every junction (a room with three or more doors) even if the route holds.
    const sameAsBefore = this.lastRoute.length > 1 && this.lastRoute.slice(1).join() === route.rooms.join();
    this.lastRoute = route.rooms;
    if (!sameAsBefore || this.graph.neighbours(ctx.room).length >= 3) {
      const first = this.graph.neighbours(ctx.room).find(n => n.room === next)!;
      const alt = this.route0(ctx.room, to, style, new Set([first.door]));
      const why = style === 'safe' ? 'cheapest by walking distance plus a danger charge per region label' : 'shortest walking distance';
      const rival = alt ? ` Next best goes by ${list(alt.rooms)}: ${units(alt.distance)}, danger ${alt.danger} (this one: ${units(route.distance)}, danger ${route.danger}).` : ' No other permitted way.';
      this.say(ctx.tick, 'route', ctx.room, `${label.replace(/\.$/, '')}: ${list(route.rooms)}${route.frontier ? ' (ends at unexplored ground)' : ''}.${rival}`, `${this.mode === 'returning' ? `${this.plan.returnRoute === 'shortest' ? 'Shortest' : 'Safest'} way home` : `${this.plan.exploration[0].toUpperCase()}${this.plan.exploration.slice(1)} exploration`}: ${why}.`);
    }
    // Leaving by the door it came in is a U-turn (a dead end, or a look-around): walk to the middle of the room first.
    const exit = `to-${next}`;
    // A sanctuary with something still on offer (the upgrade choice, or a rest for a hurt adventurer) is a short detour on the way through.
    const sp = this.progress, spot = ROOMS[ctx.room]?.sanctuary;
    const wantsSanctuary = !!sp && !!spot && (!sp.sanctuary.upgrade || (!sp.sanctuary.rested && ctx.hp < ctx.hpMax * REST_BELOW));
    return { exit, cross: true, label: this.mode === 'returning' ? 'back' : 'out', via: wantsSanctuary ? { x: spot!.x, y: spot!.y } : exit === ctx.entry ? { x: 0, y: 0 } : undefined };
  }
}
const why0 = (manual: boolean, ctx: LiveCtx, plan: ExpeditionPlan): [string, string] => manual ? ['Player ordered a retreat.', 'Manual retreat outranks every objective.'] : [`Health ${pct(ctx.hp, ctx.hpMax)}% is below the ${plan.retreatHpPct}% retreat setting.`, 'Survival policy'];
