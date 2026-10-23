import type { Door, RoomManifest } from './roomTypes';
import { WorldGraph } from './worldGraph';

/** What opens a closed link. Only `key` and `activation` can be done in the slice today; the others wait on content (a miniboss, a special key). */
export type GateNeed = 'key' | 'activation' | 'boss' | 'special';
export type GateState = 'unseen' | 'sealed' | 'open';
export interface GateInfo { key: string; from: string; to: string; type: string; need: GateNeed; state: GateState }
export const GATE_NEED: Readonly<Record<string, GateNeed>> = { fog_one_key: 'key', unlockable_shortcut: 'activation', post_miniboss_shortcut: 'boss', special_optional_proposal: 'special' };
/** Staging point: inside the room, this far from the wall that holds the door. Opening happens here, never remotely, and never in combat. */
export const STAGING_DEPTH = 60;

/**
 * Every gated link as the player may see it. A gate is `unseen` until one of its two rooms has been entered (the fog does not show it
 * through unexplored ground), `sealed` once seen, and `open` for good after it is unlocked or activated. Opening is a world event; it is not a boss kill.
 */
export function gates(graph: WorldGraph, discovered: ReadonlySet<string>, open: ReadonlySet<string>): GateInfo[] {
  return graph.links.filter(l => graph.isGated(l.type)).map(l => {
    const key = WorldGraph.linkKey(l.from, l.to);
    return { key, from: l.from, to: l.to, type: l.type, need: GATE_NEED[l.type] ?? 'special', state: open.has(key) ? 'open' : (discovered.has(l.from) || discovered.has(l.to)) ? 'sealed' : 'unseen' };
  });
}
/** The room-local point where the adventurer stands to work the gate in `room` that leads to `other`. */
export function stagingPoint(room: RoomManifest, other: string): { x: number; y: number } {
  const d: Door | undefined = room.doors.find(x => x.to === other);
  if (!d) throw new Error(`${room.id} has no door to ${other}`);
  const inward = { west: [1, 0], east: [-1, 0], north: [0, 1], south: [0, -1] }[d.side];
  return { x: d.center.x + inward[0] * STAGING_DEPTH, y: d.center.y + inward[1] * STAGING_DEPTH };
}
export const needText = (need: GateNeed): string => need === 'key' ? 'needs a previously banked Gate Key; the unlock is permanent and does not start a fight'
  : need === 'activation' ? 'is worked by hand from this side; no key' : need === 'boss' ? 'opens when the miniboss falls' : 'is an optional special-key door, not part of this slice';
