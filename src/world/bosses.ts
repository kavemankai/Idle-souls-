import { WorldGraph } from './worldGraph';

/** The two permanent fights of the slice. `room` is the arena; `gate` is the sealed link in front of it. */
export interface BossInfo {
  id: 'warden' | 'castellan'; name: string; tier: 'miniboss' | 'boss'; room: string;
  /** The gate that must be open before the arena can be entered, as a link key. */
  gate: string; gateFrom: string;
  /** Link opened for good by the first clear (the Warden's shortcut). Absent for the Castellan. */
  opens?: string;
  /** What the first clear records in the world instead of a link (the campaign route). */
  campaign?: string;
  /** The one gear item a first clear carries. A rematch never pays it. */
  gear: string;
}
export const BOSSES: Readonly<Record<string, BossInfo>> = {
  warden: { id: 'warden', name: 'Bell Warden', tier: 'miniboss', room: 'MB', gate: WorldGraph.linkKey('T2', 'MB'), gateFrom: 'T2', opens: WorldGraph.linkKey('MB', 'K2'), gear: 'warden-bell-clapper' },
  castellan: { id: 'castellan', name: 'Siltbound Castellan', tier: 'boss', room: 'B1', gate: WorldGraph.linkKey('K2', 'B1'), gateFrom: 'K2', campaign: 'campaign-route-unlocked', gear: 'castellan-silt-crest' },
};
/** The boss that stands in `room`, if any. */
export const bossAt = (room: string): BossInfo | undefined => Object.values(BOSSES).find(b => b.room === room);
/** A rematch pays this share of the kill's gold and mastery and no gear. Trial value, not tuned. */
export const REMATCH_GOLD_SHARE = 0.25;
/** Rematch variants. `limited-healing` is the one challenge that does not revert the clear: the adventurer carries no rations and drinks none. */
export type RematchVariant = 'standard' | 'limited-healing';
