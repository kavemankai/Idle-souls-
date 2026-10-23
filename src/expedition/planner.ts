import type { WorldGraph } from '../world/worldGraph';

export type RouteStyle = 'safe' | 'shortest';
/** Region danger labels from the room schedule. A label, not odds: the planner never reads enemy positions. */
export const DANGER: Readonly<Record<string, number>> = { SAFE: 0, EARLY: 1, TRIAL: 3, MID: 3, HIGH: 6, MINIBOSS: 8, BOSS: 10, SECRET: 6 };
/** Trial constant: one danger point costs as much as this many world units of walking, for the Safe style. */
export const UNITS_PER_DANGER = 150;
export interface RouteQuery {
  graph: WorldGraph; known: ReadonlySet<string>; from: string; to: string; avoid: ReadonlySet<string>; style: RouteStyle;
  /** Gated link keys that are open. Closed gates are walls. */
  open?: ReadonlySet<string>;
  /** Doors out of `from` the route may not start with; used to find the runner-up. */
  notFirst?: ReadonlySet<string>;
}
export interface RoutePlan {
  rooms: string[];
  /** World units walked between room centres. */
  distance: number;
  /** Sum of danger labels of the rooms entered. */
  danger: number;
  cost: number;
  style: RouteStyle;
  /** True when the last room is not yet explored, so the route stops at the edge of the map. */
  frontier: boolean;
}
const dist = (graph: WorldGraph, a: string, b: string) => { const p = graph.room(a).center, q = graph.room(b).center; return Math.hypot(p.x - q.x, p.y - q.y); };

/**
 * Cheapest permitted route over known rooms. Rooms in `avoid` and closed gates are walls. Only the destination may be unexplored (a frontier room), so a
 * route never crosses fog. Ties break by room id, so the same query always gives the same route. Plain Dijkstra on an array; the world is tiny.
 */
export function planRooms(q: RouteQuery): RoutePlan | null {
  const { graph, known, from, to, avoid, style } = q;
  if (!known.has(from) || avoid.has(from)) return null;
  if (avoid.has(to)) return null;
  const best = new Map<string, number>([[from, 0]]), prev = new Map<string, string>(), done = new Set<string>();
  const stepCost = (a: string, b: string) => {
    const d = dist(graph, a, b), danger = DANGER[graph.room(b).difficulty] ?? 0;
    return style === 'safe' ? d + danger * UNITS_PER_DANGER : d;
  };
  for (;;) {
    let at: string | null = null;
    for (const [r] of [...best.entries()].sort((x, y) => x[1] - y[1] || (x[0] < y[0] ? -1 : 1))) if (!done.has(r)) { at = r; break; }
    if (at === null || at === to) break;
    done.add(at);
    // A frontier room is a dead end for planning: its own neighbours are unknown.
    if (!known.has(at)) continue;
    for (const n of graph.neighbours(at)) {
      if (avoid.has(n.room) || done.has(n.room)) continue;
      if (graph.isGated(n.type) && !q.open?.has(n.key)) continue;
      if (at === from && q.notFirst?.has(n.door)) continue;
      if (!known.has(n.room) && n.room !== to) continue;
      const c = best.get(at)! + stepCost(at, n.room);
      const old = best.get(n.room);
      if (old === undefined || c < old - 1e-9 || (Math.abs(c - old) <= 1e-9 && at < prev.get(n.room)!)) { best.set(n.room, c); prev.set(n.room, at); }
    }
  }
  if (!best.has(to)) return null;
  const rooms: string[] = [];
  for (let r: string | undefined = to; r !== undefined; r = prev.get(r)) rooms.unshift(r);
  if (rooms[0] !== from) return null;
  let distance = 0, danger = 0;
  for (let i = 1; i < rooms.length; i++) { distance += dist(graph, rooms[i - 1], rooms[i]); danger += DANGER[graph.room(rooms[i]).difficulty] ?? 0; }
  return { rooms, distance: Math.round(distance), danger, cost: Math.round(style === 'safe' ? distance + danger * UNITS_PER_DANGER : distance), style, frontier: !known.has(to) };
}
