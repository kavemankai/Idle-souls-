import type { SimDoctrine } from '../combat/simApi';
import type { WorldGraph } from '../world/worldGraph';
import type { Cache } from '../save/saveTypes';
import type { UpgradeId } from '../progression/experience';
import { gates } from '../world/gates';
import { WorldGraph as WG } from '../world/worldGraph';
import { bossAt, type RematchVariant } from '../world/bosses';
import { planRooms, type RoutePlan, type RouteStyle } from './planner';

export type Exploration = 'safe' | 'thorough' | 'direct';
export type ReturnRoute = 'safest' | 'shortest';
/** Reach walks to a room. Survey walks into it; a Thorough survey also looks into the rooms beside it. Recover walks to the recovery cache and picks it up (it is still at risk until camp). Open works a sealed gate. Challenge walks into a boss arena and fights its boss for the first clear. Rematch does the same for a boss that is already cleared, on a temporary instance. */
export type ObjectiveKind = 'reach' | 'survey' | 'recover' | 'explore' | 'open' | 'challenge' | 'rematch';
/** `room` is where the adventurer goes. For `open` it is the room beside the gate and `to` is the room beyond; for `explore` it is the frontier room to start from and `depth` is how many new rooms to enter in a chain (default 3). */
export interface Objective { id: string; kind: ObjectiveKind; room: string; to?: string; depth?: number; /** Rematch only. */ variant?: RematchVariant }
export type ObjectiveStatus = 'queued' | 'active' | 'completed' | 'skipped_blocked' | 'cancelled' | 'suspended';
export interface ExpeditionPlan {
  /** Ordered. Return to Camp is always appended and is not listed here. */
  objectives: Objective[];
  /** Rooms the adventurer must not enter for any reason, including the way home. Absolute (L13). */
  avoid: string[];
  exploration: Exploration;
  doctrine: SimDoctrine;
  /** Head for camp at the next junction once health falls below this share of the maximum. 0 turns it off. */
  retreatHpPct: number;
  returnRoute: ReturnRoute;
  /** Drink a ration when health falls below this share and no enemy is near (0 turns drinking off). Needs progression to be on. */
  drinkBelowPct: number;
  /** Head home once rations, after at least one was drunk, are at or below this many (0 turns it off). Doc 04's healing reserve. */
  healingReserve: number;
  /** The sanctuary's one major choice. The plan makes it, so an unattended expedition never waits. */
  sanctuaryChoice: UpgradeId;
}
export const MAX_OBJECTIVES = 5;
export const CAMP = 'C0';
export const defaultPlan = (): ExpeditionPlan => ({ objectives: [], avoid: [], exploration: 'safe', doctrine: 'measured', retreatHpPct: 40, returnRoute: 'safest', drinkBelowPct: 50, healingReserve: 0, sanctuaryChoice: 'steadfast' });

/** Rooms the player has seen. A room next to a seen room by an ordinary link is a frontier room: known to exist, not yet entered. */
export function frontierRooms(graph: WorldGraph, known: ReadonlySet<string>, open: ReadonlySet<string> = new Set()): string[] {
  const out = new Set<string>();
  for (const r of known) for (const n of graph.neighbours(r)) if (!known.has(n.room) && (!graph.isGated(n.type) || open.has(n.key))) out.add(n.room);
  return [...out].sort();
}
/** Style of route an exploration preference asks for. Safe and Thorough avoid dangerous rooms when a safer way exists; Direct takes the shortest. */
export const styleOf = (e: Exploration): RouteStyle => (e === 'direct' ? 'shortest' : 'safe');

export type PreflightStatus = 'confirmed' | 'frontier' | 'blocked' | 'conflicted';
export interface ObjectivePreflight { id: string; room: string; status: PreflightStatus; route: RoutePlan | null; reason: string }
export interface Preflight {
  status: PreflightStatus; launchable: boolean; objectives: ObjectivePreflight[];
  /** Known way home from the last objective, or null when none is verified. */
  home: { route: RoutePlan | null; reason: string };
  messages: string[];
}
const RANK: Record<PreflightStatus, number> = { confirmed: 0, frontier: 1, blocked: 2, conflicted: 3 };

/** What the plan screen shows before launch. Only known geography is used; nothing is routed through fog and no enemy position is read. */
export function preflight(plan: ExpeditionPlan, graph: WorldGraph, known: ReadonlySet<string>, start = CAMP, cache: Cache | null = null, open: ReadonlySet<string> = new Set(), preparedKeys = 0, defeatedBosses: ReadonlySet<string> = new Set()): Preflight {
  const avoid = new Set(plan.avoid), style = styleOf(plan.exploration);
  const messages: string[] = [];
  const objectives: ObjectivePreflight[] = [];
  let from = start;
  /** Gates earlier Open objectives will open if they work; a later route may count on them. */
  const planned = new Set(open);
  let keysLeft = preparedKeys;
  if (plan.objectives.length > MAX_OBJECTIVES) messages.push(`At most ${MAX_OBJECTIVES} objectives.`);
  if (avoid.has(start)) messages.push('Camp cannot be avoided.');
  for (const o of plan.objectives) {
    let status: PreflightStatus, reason: string, route: RoutePlan | null = null;
    if (!graph.rooms.has(o.room)) { status = 'blocked'; reason = `Unknown room ${o.room}.`; }
    else if (o.kind === 'recover' && (!cache || cache.room !== o.room)) { status = 'blocked'; reason = `There is no recovery cache in ${name(graph, o.room)}.`; }
    else if (avoid.has(o.room)) { status = 'conflicted'; reason = `${name(graph, o.room)} is on the avoid list.`; }
    else {
      route = planRooms({ graph, known, from, to: o.room, avoid, style, open: planned });
      if (route) { status = route.frontier ? 'frontier' : 'confirmed'; reason = route.frontier ? `Known route ends at the edge of the map; ${name(graph, o.room)} is unexplored.` : `Known route, ${route.rooms.length - 1} room${route.rooms.length === 2 ? '' : 's'}.`; }
      else {
        const wide = planRooms({ graph, known, from, to: o.room, avoid: new Set(), style, open: planned });
        status = wide ? 'conflicted' : 'blocked';
        reason = wide ? `Every known way to ${name(graph, o.room)} crosses an avoided room.` : `No known open route to ${name(graph, o.room)}.`;
      }
    }
    if (o.kind === 'open' && status !== 'blocked' && status !== 'conflicted') {
      const g = o.to ? gates(graph, known, open).find(x => x.key === WG.linkKey(o.room, o.to!)) : undefined;
      if (!g || g.state === 'unseen') { status = 'blocked'; reason = 'No such gate has been seen.'; }
      else if (g.state === 'open') reason = 'Already open; nothing to do.';
      else if (g.need === 'key' && keysLeft < 1) { status = 'blocked'; reason = 'Needs a previously banked Gate Key issued at camp. A key found on the way cannot open a gate (it must be banked first).'; }
      else if (g.need === 'boss' || g.need === 'special') { status = 'blocked'; reason = g.need === 'boss' ? 'Opens when the miniboss falls.' : 'An optional special-key door, not part of this slice.'; }
      else { reason = g.need === 'key' ? 'Spends 1 Gate Key. The unlock is permanent and starts no fight.' : 'Worked by hand; no key.'; if (g.need === 'key') keysLeft--; planned.add(g.key); }
    }
    if ((o.kind === 'reach' || o.kind === 'survey') && status !== 'blocked' && status !== 'conflicted') {
      const b = bossAt(o.room);
      if (b && !defeatedBosses.has(b.id)) { status = 'blocked'; reason = `${b.name} guards ${name(graph, o.room)}. Nobody walks in by accident: use a Challenge objective.`; }
    }
    if ((o.kind === 'challenge' || o.kind === 'rematch') && status !== 'conflicted') {
      const b = bossAt(o.room), cleared = !!b && defeatedBosses.has(b.id);
      if (!b) { status = 'blocked'; reason = `${name(graph, o.room)} holds no boss.`; }
      else if (o.kind === 'challenge' && cleared) { status = 'blocked'; reason = `${b.name} is already defeated for good. A first-time challenge is not counted as done; choose Rematch to fight again.`; }
      else if (o.kind === 'rematch' && !cleared) { status = 'blocked'; reason = `${b.name} has not been defeated yet. A rematch is only open after the first clear.`; }
      else if (!planned.has(b.gate) && !open.has(b.gate)) { status = 'blocked'; reason = `The gate to ${name(graph, o.room)} is sealed. Add an Open objective for it first.`; }
      else {
        const gateText = open.has(b.gate) ? 'The gate is open.' : 'The gate opens earlier in this plan (it needs a banked Gate Key).';
        reason = o.kind === 'challenge'
          ? `${gateText} Fights ${b.name} alone; the only way out is the door you came in by${b.tier === 'miniboss' ? ', and its win opens the shortcut to the Crypt' : ''}. A kill banks nothing until camp. Not yet defeated.`
          : `${gateText} Opt-in rematch (${o.variant === 'limited-healing' ? 'limited healing: no rations' : 'standard'}) against a temporary ${b.name}. No key, the first clear is untouched, rewards are a quarter of the gold and mastery and no gear.`;
      }
    }
    objectives.push({ id: o.id, room: o.room, status, route, reason });
    if (route) from = o.room;
  }
  const homeFrom = [...objectives].reverse().find(o => o.route)?.room ?? start;
  const homeRoute = homeFrom === start ? null : planRooms({ graph, known, from: homeFrom, to: start, avoid, style: plan.returnRoute === 'shortest' ? 'shortest' : 'safe', open });
  const home = homeFrom === start ? { route: null, reason: 'Already at camp.' } : homeRoute ? { route: homeRoute, reason: `Known way home, ${homeRoute.rooms.length - 1} rooms.` } : { route: null, reason: 'No permitted route home is known.' };
  let status: PreflightStatus = 'confirmed';
  for (const o of objectives) if (RANK[o.status] > RANK[status]) status = o.status;
  if (!objectives.length) { status = 'blocked'; messages.push('Add an objective.'); }
  if (objectives.length && homeFrom !== start && !homeRoute) { messages.push('No permitted route home is known from the last objective. The return would be blocked.'); if (RANK[status] < RANK.frontier) status = 'frontier'; }
  return { status, launchable: (status === 'confirmed' || status === 'frontier') && plan.objectives.length <= MAX_OBJECTIVES && !avoid.has(start), objectives, home, messages };
}
export function name(graph: WorldGraph, id: string): string { return graph.rooms.get(id)?.name ?? id; }
