import type { Facing } from '../contracts/presentation';
/** Room manifests describe geometry in one local frame: centre (0,0), x east, y south, simulation units. */
export type Side = 'west' | 'east' | 'north' | 'south';
export interface Circle { id: string; x: number; y: number; r: number }
export interface SpawnSpec { x: number; y: number; facing: Facing }
export interface EnemySpec extends SpawnSpec { arch: string }
/** Something lying in a room. The adventurer takes it when it passes within reach; it is carried (at risk) until camp. It refills every expedition. */
export interface Pickup {
  id: string; kind: 'supplies' | 'gear' | 'key'; item: string; qty: number; x: number; y: number;
  /** For keys. `once`: a one-time authored discovery, claimed for good. `trial`: repeatable, once per expedition. */
  claim?: 'once' | 'trial';
}
export interface EncounterSpec { name: string; enemies: EnemySpec[] }
export interface Door {
  id: string; to: string; side: Side; linkType: string;
  /** Point on the wall's inner face where the opening is centred. */
  center: { x: number; y: number };
  /** Extent of the opening along the wall (y for west and east, x for north and south). */
  span: [number, number];
}
export interface RoomManifest {
  id: string; name: string; note: string; status: 'generated' | 'authored';
  plan?: { center: { x: number; y: number }; difficulty: string; candidateEncounter: string; purpose: string; region: string };
  floor: { x: [number, number]; y: [number, number] };
  bounds: [number, number, number, number];
  solids: { rects: number[][]; circles: Circle[] };
  doors: Door[];
  openings: { side: Side; y?: [number, number]; x?: [number, number] }[];
  entryDoor?: string; exitDoor?: string;
  entry?: { x: number; y: number }; threshold?: { x: number; y: [number, number] };
  encounters: Record<string, EncounterSpec>;
  pickups?: Pickup[];
  /** A safe place to rest (doc 09): one rest and one upgrade choice per expedition. It never banks, secures a cache or extracts. */
  sanctuary?: { x: number; y: number };
  detection: { range: number; arcDegrees: number; alertRadius: number };
}
export interface WorldRoom { id: string; name: string; region: string; center: { x: number; y: number }; floor: { w: number; h: number }; difficulty: string; candidateEncounter: string; purpose: string; status: string }
export interface WorldLink { from: string; to: string; type: string; doors: { from: string; to: string } }
export interface WorldFile { version: 1; rooms: WorldRoom[]; links: WorldLink[] }
