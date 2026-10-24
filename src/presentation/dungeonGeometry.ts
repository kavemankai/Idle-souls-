import type { RoomManifest } from '../world/roomTypes';
import { WorldGraph } from '../world/worldGraph';
import type { WorldLink } from '../world/roomTypes';

export interface Vec { readonly x: number; readonly y: number }
export interface Hallway {
  readonly key: string; readonly from: string; readonly to: string;
  readonly start: Vec; readonly end: Vec; readonly width: number;
  readonly length: number; readonly polygon: readonly [Vec, Vec, Vec, Vec];
}
export interface VisibleDungeon {
  readonly rooms: readonly string[];
  readonly halls: readonly Hallway[];
  readonly sealed: readonly { room: string; x: number; y: number; horizontal: boolean }[];
}
const center = (room: RoomManifest): Vec => room.plan!.center;
export const worldPoint = (room: RoomManifest, point: Vec): Vec =>
  ({ x: center(room).x + point.x, y: center(room).y + point.y });

/** The precise two door-centre endpoints used by the WorldRunner passage walk. */
export function hallwayFor(link: WorldLink, rooms: Readonly<Record<string, RoomManifest>>): Hallway {
  const a = rooms[link.from], b = rooms[link.to];
  if (!a || !b) throw new Error(`Missing room for hallway ${link.from}~${link.to}`);
  const da = a.doors.find(d => d.id === link.doors.from);
  const db = b.doors.find(d => d.id === link.doors.to);
  if (!da || !db) throw new Error(`Missing paired doorway for ${link.from}~${link.to}`);
  const start = worldPoint(a, da.center), end = worldPoint(b, db.center);
  const dx = end.x - start.x, dy = end.y - start.y;
  const length = Math.hypot(dx, dy);
  if (length <= 0) throw new Error(`Zero-length passage ${link.from}~${link.to}`);
  const opening = Math.min(da.span[1] - da.span[0], db.span[1] - db.span[0]);
  const width = Math.max(42, Math.min(112, opening * .66));
  const px = -dy / length * width / 2, py = dx / length * width / 2;
  return {
    key: WorldGraph.linkKey(link.from, link.to), from: link.from, to: link.to,
    start, end, length, width,
    polygon: [
      { x: start.x + px, y: start.y + py },
      { x: end.x + px, y: end.y + py },
      { x: end.x - px, y: end.y - py },
      { x: start.x - px, y: start.y - py },
    ],
  };
}

const distance = (a: Vec, b: Vec) => Math.hypot(a.x - b.x, a.y - b.y);
/** Distance to the same centreline travelled by WorldRunner.walkPassage(). */
export function distanceToHallway(p: Vec, h: Hallway): number {
  const dx = h.end.x - h.start.x, dy = h.end.y - h.start.y;
  const t = Math.max(0, Math.min(1, ((p.x - h.start.x) * dx + (p.y - h.start.y) * dy) / (h.length * h.length)));
  return distance(p, { x: h.start.x + t * dx, y: h.start.y + t * dy });
}

/**
 * Fog-safe, bounded visibility. A corridor can be seen while physically being
 * traversed even if the destination has not been discovered; the destination
 * ROOM remains hidden until the expedition's known set contains it.
 */
export function visibleDungeon(
  graph: WorldGraph, rooms: Readonly<Record<string, RoomManifest>>,
  known: ReadonlySet<string>, open: ReadonlySet<string>,
  position: Vec, currentRoom: string, crossing: boolean, radius = 960,
): VisibleDungeon {
  const visibleRooms = [...known].filter(id => !!rooms[id] &&
    (id === currentRoom || distance(position, center(rooms[id])) <= radius));
  if (!visibleRooms.includes(currentRoom) && rooms[currentRoom]) visibleRooms.push(currentRoom);
  const visible = new Set(visibleRooms);
  const halls: Hallway[] = [], sealed: VisibleDungeon['sealed'][number][] = [];
  for (const link of graph.links) {
    const a = rooms[link.from], b = rooms[link.to];
    if (!a || !b) continue;
    const gated = graph.isGated(link.type);
    const key = WorldGraph.linkKey(link.from, link.to);
    const openLink = !gated || open.has(key);
    const knownA = known.has(link.from), knownB = known.has(link.to);
    if (!openLink) {
      for (const roomId of [link.from, link.to]) {
        if (!visible.has(roomId)) continue;
        const room = rooms[roomId];
        const door = room.doors.find(d => d.to === (roomId === link.from ? link.to : link.from));
        if (!door) continue;
        const p = worldPoint(room, door.center);
        sealed.push({ room: roomId, x: p.x, y: p.y, horizontal: door.side === 'north' || door.side === 'south' });
      }
      continue;
    }
    if (!(visible.has(link.from) || visible.has(link.to))) continue;
    const hall = hallwayFor(link, rooms);
    if ((knownA && knownB) || (crossing && distanceToHallway(position, hall) <= hall.width / 2 + 12)) {
      halls.push(hall);
    }
  }
  return { rooms: visibleRooms, halls, sealed };
}
