/** Generates combat/rooms/<ID>.json for every room in the vertical slice, plus combat/rooms/world.json, from the two CSVs.
 *  npx tsx tools/world/build-rooms.ts --write   rewrite the committed files
 *  npx tsx tools/world/build-rooms.ts --check   fail when the committed files differ from a fresh build
 *  Hand-authored data (extra solids, encounters, detection, door choices) lives in combat/rooms/overrides/<ID>.json. */
import { existsSync, readFileSync, writeFileSync, readdirSync } from 'node:fs';
import type { Door, RoomManifest, Side, WorldFile, WorldLink, WorldRoom } from '../../src/world/roomTypes';

const WALL = 60, FACE_INSET = 20, DOOR_WIDTH = 174, MIN_END = 20, MIN_BETWEEN = 26;
const DETECTION = { range: 160, arcDegrees: 120, alertRadius: 120 };
const SIDE_ORDER: Side[] = ['west', 'east', 'north', 'south'];
const ROOMS_DIR = 'combat/rooms';

function csv(path: string): Record<string, string>[] {
  const rows: string[][] = [];
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/).filter(Boolean)) {
    const cells: string[] = []; let cur = '', quoted = false;
    for (const ch of line) {
      if (ch === '"') quoted = !quoted; else if (ch === ',' && !quoted) { cells.push(cur); cur = ''; } else cur += ch;
    }
    cells.push(cur); rows.push(cells);
  }
  const [head, ...body] = rows;
  return body.map(r => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ''])));
}
const num = (s: string) => { const n = Number(s); if (!Number.isFinite(n)) throw new Error(`not a number: ${s}`); return n; };
/** Same convention for both ends of a link: the wall facing the neighbour along the larger axis; a tie goes to the vertical walls. */
function sideToward(from: WorldRoom, to: WorldRoom): Side {
  const dx = to.center.x - from.center.x, dy = to.center.y - from.center.y;
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'east' : 'west';
  return dy > 0 ? 'south' : 'north';
}
/** Cut [lo, hi] around the door spans; throws when a wall piece would be too short to exist. */
function wallPieces(lo: number, hi: number, spans: [number, number][], room: string, side: Side): [number, number][] {
  const out: [number, number][] = []; let at = lo;
  spans.forEach(([a, b], i) => {
    const gap = a - at, need = i === 0 ? MIN_END : MIN_BETWEEN;
    if (gap < need) throw new Error(`${room}: door on the ${side} wall leaves a ${gap.toFixed(0)}-unit wall piece, needs ${need}`);
    out.push([at, a]); at = b;
  });
  if (hi - at < MIN_END) throw new Error(`${room}: last door on the ${side} wall leaves a ${(hi - at).toFixed(0)}-unit end piece, needs ${MIN_END}`);
  out.push([at, hi]);
  return out;
}

export function buildWorld(): { rooms: Record<string, RoomManifest>; world: WorldFile } {
  const roomRows = csv('vertical_slice_room_schedule.csv'), linkRows = csv('vertical_slice_connections.csv');
  const wrooms: WorldRoom[] = roomRows.map(r => ({
    id: r.id, name: r.name, region: r.region, center: { x: num(r.center_x), y: num(r.center_y) },
    floor: { w: num(r.clear_floor_width), h: num(r.clear_floor_height) }, difficulty: r.difficulty, candidateEncounter: r.candidate_encounter, purpose: r.purpose,
    status: existsSync(`${ROOMS_DIR}/overrides/${r.id}.json`) ? 'authored' : 'generated',
  }));
  const byId = new Map(wrooms.map(r => [r.id, r]));
  if (byId.size !== wrooms.length) throw new Error('duplicate room id in the schedule');
  const links: WorldLink[] = linkRows.map(l => {
    if (!byId.has(l.from_room) || !byId.has(l.to_room)) throw new Error(`link ${l.from_room} to ${l.to_room} names an unknown room`);
    return { from: l.from_room, to: l.to_room, type: l.link_type, doors: { from: `to-${l.to_room}`, to: `to-${l.from_room}` } };
  });
  const rooms: Record<string, RoomManifest> = {};
  for (const wr of wrooms) {
    const hw = wr.floor.w / 2, hh = wr.floor.h / 2, face = hh - FACE_INSET;
    // Every link touching this room, as (neighbour, link type).
    const mine = links.flatMap(l => l.from === wr.id ? [{ other: l.to, type: l.type }] : l.to === wr.id ? [{ other: l.from, type: l.type }] : []);
    const bySide = new Map<Side, { other: WorldRoom; type: string }[]>();
    for (const m of mine) { const other = byId.get(m.other)!, side = sideToward(wr, other); bySide.set(side, [...(bySide.get(side) ?? []), { other, type: m.type }]); }
    const doors: Door[] = [];
    for (const side of SIDE_ORDER) {
      const list = bySide.get(side) ?? [], horizontal = side === 'west' || side === 'east';
      list.sort((a, b) => (horizontal ? a.other.center.y - b.other.center.y : a.other.center.x - b.other.center.x) || a.other.id.localeCompare(b.other.id));
      const A = horizontal ? face : hw - FACE_INSET;   // usable half length of that wall
      list.forEach((m, i) => {
        const c = A * (-1 + (2 * i + 1) / list.length), span: [number, number] = [c - DOOR_WIDTH / 2, c + DOOR_WIDTH / 2];
        const center = side === 'west' ? { x: -hw, y: c } : side === 'east' ? { x: hw, y: c } : side === 'north' ? { x: c, y: -face } : { x: c, y: face };
        doors.push({ id: `to-${m.other.id}`, to: m.other.id, side, linkType: m.type, center, span });
      });
    }
    const spans = (side: Side) => doors.filter(d => d.side === side).map(d => d.span);
    const north = doors.some(d => d.side === 'north'), south = doors.some(d => d.side === 'south');
    const bounds: [number, number, number, number] = [-(hw + WALL), -(north ? hh + 40 : face), hw + WALL, south ? hh + 40 : face];
    const rects: number[][] = [];
    rects.push(...wallPieces(-(hw + WALL), hw + WALL, spans('north'), wr.id, 'north').map(([a, b]) => [a, -(hh + 40), b, -face]));
    rects.push(...wallPieces(-(hw + WALL), hw + WALL, spans('south'), wr.id, 'south').map(([a, b]) => [a, face, b, hh + 40]));
    rects.push(...wallPieces(-face, face, spans('west'), wr.id, 'west').map(([a, b]) => [-(hw + WALL), a, -hw, b]));
    rects.push(...wallPieces(-face, face, spans('east'), wr.id, 'east').map(([a, b]) => [hw, a, hw + WALL, b]));
    const ovPath = `${ROOMS_DIR}/overrides/${wr.id}.json`;
    const ov = existsSync(ovPath) ? JSON.parse(readFileSync(ovPath, 'utf8')) : {};
    const entryDoor: string | undefined = ov.entryDoor, exitDoor: string | undefined = ov.exitDoor;
    for (const id of [entryDoor, exitDoor]) if (id && !doors.some(d => d.id === id)) throw new Error(`${wr.id}: override names door ${id}, which the links do not produce`);
    const m: RoomManifest = {
      id: wr.id, name: ov.name ?? wr.name,
      note: ov.note ?? 'Generated placeholder geometry from the room schedule and connections. Valid walls and doors, not tuned and not art-reviewed. Local frame: centre (0,0), x east, y south, simulation units.',
      status: ov.status ?? 'generated',
      plan: { center: wr.center, difficulty: wr.difficulty, candidateEncounter: wr.candidateEncounter, purpose: wr.purpose, region: wr.region },
      floor: { x: [-hw, hw], y: [-hh, hh] }, bounds,
      solids: { rects: [...rects, ...(ov.solids?.rects ?? [])], circles: ov.solids?.circles ?? [] },
      doors,
      openings: doors.map(d => d.side === 'west' || d.side === 'east' ? { side: d.side, y: d.span } : { side: d.side, x: d.span }),
      ...(entryDoor ? { entryDoor } : {}), ...(exitDoor ? { exitDoor } : {}),
      encounters: ov.encounters ?? {}, ...(ov.pickups ? { pickups: ov.pickups } : {}), ...(ov.sanctuary ? { sanctuary: ov.sanctuary } : {}), detection: ov.detection ?? DETECTION,
    };
    const entry = entryDoor && doors.find(d => d.id === entryDoor), exit = exitDoor && doors.find(d => d.id === exitDoor);
    if (entry) m.entry = { x: entry.center.x, y: entry.center.y };
    if (exit && (exit.side === 'east' || exit.side === 'west')) m.threshold = { x: exit.center.x, y: exit.span };
    rooms[wr.id] = m;
  }
  return { rooms, world: { version: 1, rooms: wrooms, links } };
}

/** JSON with two-space indent and short numeric arrays kept on one line. */
export function pretty(v: unknown): string {
  return JSON.stringify(v, null, 2).replace(/\[\s+(-?[\d.]+(?:,\s+-?[\d.]+)*)\s+\]/g, (_m, g: string) => `[${g.replace(/\s+/g, ' ')}]`) + '\n';
}
export function files(): Record<string, string> {
  const { rooms, world } = buildWorld(), out: Record<string, string> = { [`${ROOMS_DIR}/world.json`]: pretty(world) };
  for (const [id, m] of Object.entries(rooms)) out[`${ROOMS_DIR}/${id.toLowerCase()}.json`] = pretty(m);
  return out;
}
if (process.argv[1]?.endsWith('build-rooms.ts')) {
  const want = files(), write = process.argv.includes('--write'), check = process.argv.includes('--check');
  if (write) { for (const [p, t] of Object.entries(want)) writeFileSync(p, t); console.log(`wrote ${Object.keys(want).length} files`); }
  if (check) {
    const bad = Object.entries(want).filter(([p, t]) => !existsSync(p) || readFileSync(p, 'utf8') !== t).map(([p]) => p);
    const stray = readdirSync(ROOMS_DIR).filter(f => f.endsWith('.json') && f !== 'ENCOUNTER_CONTRACT.json' && !Object.keys(want).some(p => p.endsWith(`/${f}`)));
    if (bad.length || stray.length) { console.error(`out of date: ${[...bad, ...stray.map(s => `${s} (not generated)`)].join(', ')}\nrun npm run world:build`); process.exit(1); }
    console.log(`world files are current (${Object.keys(want).length} files)`);
  }
}
