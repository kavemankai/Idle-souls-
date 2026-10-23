import { portableMath as M } from '../combat/portableMath';
import type { PreparedRoom, SimApi } from '../combat/simApi';
import type { Point } from './o1Route';
export interface SightSettings { range: number; arcDegrees: number }
/** Provisional detection: inside the range, inside the cone around the watcher's facing, and no solid in between. */
export function sees(sim: SimApi, room: PreparedRoom, watcher: Point & { face: number }, target: Point, s: SightSettings): boolean {
  const dx = target.x - watcher.x, dy = target.y - watcher.y;
  if (M.hypot(dx, dy) > s.range) return false;
  let d = M.atan2(dy, dx) - watcher.face;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  if (Math.abs(d) > s.arcDegrees * Math.PI / 360) return false;
  return sim.room.losClear(room, watcher.x, watcher.y, target.x, target.y);
}
