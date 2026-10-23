import { portableMath as M } from '../combat/portableMath';
import type { PreparedRoom, SimApi } from '../combat/simApi';
export interface Point { x: number; y: number }
const CELL = 8;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]] as const;
/** Deterministic grid A* around solids, smoothed to straight legs. Returns waypoints after `from`, ending on `to`, or null when blocked. */
export function planRoute(sim: SimApi, room: PreparedRoom, bounds: readonly [number, number, number, number], from: Point, to: Point, radius = 13, margin = 2): Point[] | null {
  const free = (x: number, y: number) => sim.room.nearest(room, x, y).d >= radius + margin;
  const [bx0, by0, bx1, by1] = bounds;
  const cols = Math.ceil((bx1 - bx0) / CELL) + 1, rows = Math.ceil((by1 - by0) / CELL) + 1;
  const toXY = (i: number): Point => ({ x: bx0 + (i % cols) * CELL, y: by0 + Math.floor(i / cols) * CELL });
  const snap = (p: Point) => Math.max(0, Math.min(rows - 1, Math.round((p.y - by0) / CELL))) * cols + Math.max(0, Math.min(cols - 1, Math.round((p.x - bx0) / CELL)));
  const walkable = new Uint8Array(cols * rows);
  for (let i = 0; i < walkable.length; i++) { const c = toXY(i); walkable[i] = free(c.x, c.y) ? 1 : 0; }
  const start = snap(from), goal = snap(to);
  if (!free(to.x, to.y) || sim.room.nearest(room, from.x, from.y).d < radius - 1e-6) return null;   // a start hugging a wall is fine, one inside a solid is not
  const nearestWalkable = (i: number): number => {
    if (walkable[i]) return i;
    const c = toXY(i);
    for (let ring = 1; ring < 6; ring++) for (let dy = -ring; dy <= ring; dy++) for (let dx = -ring; dx <= ring; dx++) {
      const x = Math.round((c.x - bx0) / CELL) + dx, y = Math.round((c.y - by0) / CELL) + dy;
      if (x >= 0 && y >= 0 && x < cols && y < rows && walkable[y * cols + x]) return y * cols + x;
    }
    return -1;
  };
  const s = nearestWalkable(start), g = nearestWalkable(goal);
  if (s < 0 || g < 0) return null;
  const cost = new Float64Array(cols * rows).fill(Infinity), prev = new Int32Array(cols * rows).fill(-1), closed = new Uint8Array(cols * rows);
  const h = (i: number) => { const a = toXY(i), b = toXY(g); return M.hypot(a.x - b.x, a.y - b.y); };
  // Open list as a plain array scanned for the minimum: the grid is small and ties break on the lower index, which keeps the result deterministic.
  const open: number[] = [s]; cost[s] = 0;
  while (open.length) {
    let bi = 0;
    for (let k = 1; k < open.length; k++) {
      const a = open[k], b = open[bi], fa = cost[a] + h(a), fb = cost[b] + h(b);
      if (fa < fb - 1e-9 || (Math.abs(fa - fb) <= 1e-9 && a < b)) bi = k;
    }
    const cur = open.splice(bi, 1)[0];
    if (cur === g) break;
    if (closed[cur]) continue;
    closed[cur] = 1;
    const cx = cur % cols, cy = Math.floor(cur / cols);
    for (const [dx, dy] of DIRS) {
      const nx = cx + dx, ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
      const n = ny * cols + nx;
      if (!walkable[n] || closed[n]) continue;
      if (dx && dy && (!walkable[cy * cols + nx] || !walkable[ny * cols + cx])) continue;   // no corner cutting
      const c = cost[cur] + (dx && dy ? Math.SQRT2 : 1) * CELL;
      if (c < cost[n]) { cost[n] = c; prev[n] = cur; open.push(n); }
    }
  }
  if (!Number.isFinite(cost[g])) return null;
  const cells: Point[] = [];
  for (let i = g; i >= 0; i = prev[i]) cells.push(toXY(i));
  cells.reverse();
  const pts: Point[] = [from, ...cells.slice(1, -1), to];
  const clearLeg = (a: Point, b: Point) => {
    const n = Math.max(1, Math.ceil(M.hypot(b.x - a.x, b.y - a.y) / 3));
    for (let k = 0; k <= n; k++) if (!free(a.x + (b.x - a.x) * k / n, a.y + (b.y - a.y) * k / n)) return false;
    return true;
  };
  const out: Point[] = [];
  let at = 0;
  while (at < pts.length - 1) {
    let far = pts.length - 1;
    while (far > at + 1 && !clearLeg(pts[at], pts[far])) far--;
    out.push(pts[far]); at = far;
  }
  return out;
}
