import worldFile from '../../combat/rooms/world.json' with { type: 'json' };
import type { WorldFile, WorldLink, WorldRoom } from './roomTypes';

export const LINK_TYPES = ['ordinary', 'fog_one_key', 'unlockable_shortcut', 'post_miniboss_shortcut', 'special_optional_proposal'] as const;
export interface Neighbour { room: string; type: string; door: string; arrivalDoor: string; key: string }
/** The slice's rooms and links. Gated links (everything but `ordinary`) are closed until the caller opens them by key. */
export class WorldGraph {
  readonly rooms: ReadonlyMap<string, WorldRoom>;
  readonly links: readonly WorldLink[];
  private readonly adj = new Map<string, Neighbour[]>();
  constructor(file: WorldFile = worldFile as unknown as WorldFile) {
    const errors = WorldGraph.validate(file);
    if (errors.length) throw new Error(`invalid world: ${errors.join('; ')}`);
    this.rooms = new Map(file.rooms.map(r => [r.id, r]));
    this.links = file.links;
    for (const r of file.rooms) this.adj.set(r.id, []);
    for (const l of file.links) {
      const key = WorldGraph.linkKey(l.from, l.to);
      this.adj.get(l.from)!.push({ room: l.to, type: l.type, door: l.doors.from, arrivalDoor: l.doors.to, key });
      this.adj.get(l.to)!.push({ room: l.from, type: l.type, door: l.doors.to, arrivalDoor: l.doors.from, key });
    }
    for (const list of this.adj.values()) list.sort((a, b) => a.room.localeCompare(b.room));
  }
  /** Same key for both directions of a link. */
  static linkKey(a: string, b: string) { return a < b ? `${a}~${b}` : `${b}~${a}`; }
  /** Every problem with a world file, as readable sentences. Empty when it is sound. */
  static validate(file: WorldFile): string[] {
    const errors: string[] = [], ids = new Set<string>();
    for (const r of file.rooms) { if (ids.has(r.id)) errors.push(`duplicate room ${r.id}`); ids.add(r.id); }
    const seen = new Set<string>(), doors = new Set<string>();
    for (const l of file.links) {
      for (const end of [l.from, l.to]) if (!ids.has(end)) errors.push(`link ${l.from} to ${l.to} names unknown room ${end}`);
      if (l.from === l.to) errors.push(`link ${l.from} to itself`);
      if (!(LINK_TYPES as readonly string[]).includes(l.type)) errors.push(`link ${l.from} to ${l.to} has unknown type ${l.type}`);
      const key = WorldGraph.linkKey(l.from, l.to);
      if (seen.has(key)) errors.push(`duplicate link ${key}`); seen.add(key);
      if (l.doors.from !== `to-${l.to}` || l.doors.to !== `to-${l.from}`) errors.push(`link ${key} has doors ${l.doors.from}, ${l.doors.to} that do not name the other room`);
      for (const [room, door] of [[l.from, l.doors.from], [l.to, l.doors.to]]) { const k = `${room}/${door}`; if (doors.has(k)) errors.push(`room ${room} has two doors named ${door}`); doors.add(k); }
    }
    return errors;
  }
  room(id: string): WorldRoom { const r = this.rooms.get(id); if (!r) throw new Error(`unknown room ${id}`); return r; }
  neighbours(id: string): readonly Neighbour[] { this.room(id); return this.adj.get(id)!; }
  isGated(type: string) { return type !== 'ordinary'; }
  /** Shortest path in rooms, never crossing a gated link unless its key is in `open`. Null when there is none. */
  path(from: string, to: string, open: ReadonlySet<string> = new Set()): string[] | null {
    this.room(from); this.room(to);
    const prev = new Map<string, string | null>([[from, null]]), queue = [from];
    for (let i = 0; i < queue.length; i++) {
      const at = queue[i];
      if (at === to) break;
      for (const n of this.adj.get(at)!) {
        if (prev.has(n.room) || (this.isGated(n.type) && !open.has(n.key))) continue;
        prev.set(n.room, at); queue.push(n.room);
      }
    }
    if (!prev.has(to)) return null;
    const out: string[] = [];
    for (let at: string | null = to; at; at = prev.get(at)!) out.unshift(at);
    return out;
  }
}
