import type { SimDoctrine } from '../combat/simApi';
import type { WorldGraph } from '../world/worldGraph';
import type { Cache } from '../save/saveTypes';
import { planRooms, type RoutePlan, type RouteStyle } from './planner';

export type Exploration = 'safe' | 'thorough' | 'direct';
export type ReturnRoute = 'safest' | 'shortest';
/** Reach walks to a room. Survey walks into it; a Thorough survey also looks into the rooms beside it. Recover walks to the recovery cache and picks it up (it is still at risk until camp). Other kinds (gather, open, challenge) need systems that come later. */
export type ObjectiveKind = 'reach' | 'survey' | 'recover';
export interface Objective { id: string; kind: ObjectiveKind; room: string }
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
}
export const MAX_OBJECTIVES = 5;
export const CAMP = 'C0';
export const defaultPlan = (): ExpeditionPlan => ({ objectives: [], avoid: [], exploration: 'safe', doctrine: 'measured', retreatHpPct: 40, returnRoute: 'safest' });

/** Rooms the player has seen. A room next to a seen room by an ordinary link is a frontier room: known to exist, not yet entered. */
export function frontierRooms(graph: WorldGraph, known: ReadonlySet<string>): string[] {
  const out = new Set<string>();
  for (const r of known) for (const n of graph.neighbours(r)) if (!known.has(n.room) && !graph.isGated(n.type)) out.add(n.room);
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
export function preflight(plan: ExpeditionPlan, graph: WorldGraph, known: ReadonlySet<string>, start = CAMP, cache: Cache | null = null): Preflight {
  const avoid = new Set(plan.avoid), style = styleOf(plan.exploration);
  const messages: string[] = [];
  const objectives: ObjectivePreflight[] = [];
  let from = start;
  if (plan.objectives.length > MAX_OBJECTIVES) messages.push(`At most ${MAX_OBJECTIVES} objectives.`);
  if (avoid.has(start)) messages.push('Camp cannot be avoided.');
  for (const o of plan.objectives) {
    let status: PreflightStatus, reason: string, route: RoutePlan | null = null;
    if (!graph.rooms.has(o.room)) { status = 'blocked'; reason = `Unknown room ${o.room}.`; }
    else if (o.kind === 'recover' && (!cache || cache.room !== o.room)) { status = 'blocked'; reason = `There is no recovery cache in ${name(graph, o.room)}.`; }
    else if (avoid.has(o.room)) { status = 'conflicted'; reason = `${name(graph, o.room)} is on the avoid list.`; }
    else {
      route = planRooms({ graph, known, from, to: o.room, avoid, style });
      if (route) { status = route.frontier ? 'frontier' : 'confirmed'; reason = route.frontier ? `Known route ends at the edge of the map; ${name(graph, o.room)} is unexplored.` : `Known route, ${route.rooms.length - 1} room${route.rooms.length === 2 ? '' : 's'}.`; }
      else {
        const open = planRooms({ graph, known, from, to: o.room, avoid: new Set(), style });
        status = open ? 'conflicted' : 'blocked';
        reason = open ? `Every known way to ${name(graph, o.room)} crosses an avoided room.` : `No known open route to ${name(graph, o.room)}.`;
      }
    }
    objectives.push({ id: o.id, room: o.room, status, route, reason });
    if (route) from = o.room;
  }
  const homeFrom = [...objectives].reverse().find(o => o.route)?.room ?? start;
  const homeRoute = homeFrom === start ? null : planRooms({ graph, known, from: homeFrom, to: start, avoid, style: plan.returnRoute === 'shortest' ? 'shortest' : 'safe' });
  const home = homeFrom === start ? { route: null, reason: 'Already at camp.' } : homeRoute ? { route: homeRoute, reason: `Known way home, ${homeRoute.rooms.length - 1} rooms.` } : { route: null, reason: 'No permitted route home is known.' };
  let status: PreflightStatus = 'confirmed';
  for (const o of objectives) if (RANK[o.status] > RANK[status]) status = o.status;
  if (!objectives.length) { status = 'blocked'; messages.push('Add an objective.'); }
  if (objectives.length && homeFrom !== start && !homeRoute) { messages.push('No permitted route home is known from the last objective. The return would be blocked.'); if (RANK[status] < RANK.frontier) status = 'frontier'; }
  return { status, launchable: (status === 'confirmed' || status === 'frontier') && plan.objectives.length <= MAX_OBJECTIVES && !avoid.has(start), objectives, home, messages };
}
export function name(graph: WorldGraph, id: string): string { return graph.rooms.get(id)?.name ?? id; }
