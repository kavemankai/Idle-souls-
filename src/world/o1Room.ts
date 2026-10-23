import manifest from '../../combat/rooms/o1.json' with { type: 'json' };
import { FACINGS, type Facing } from '../contracts/presentation';
import { facingAngle } from '../presentation/directions';
import type { SimRoom } from '../combat/simApi';
/** One O1 geometry for travel, sight, combat and rendering. Values are trial settings, not design locks. */
export interface Circle { id: string; x: number; y: number; r: number }
export interface SpawnSpec { x: number; y: number; facing: Facing }
export interface RoomManifest {
  id: string; floor: { x: [number, number]; y: [number, number] }; bounds: [number, number, number, number];
  solids: { rects: number[][]; circles: Circle[] };
  openings: { side: 'west' | 'east'; y: [number, number] }[];
  entry: { x: number; y: number }; threshold: { x: number; y: [number, number] };
  spawns: Record<string, SpawnSpec>; detection: { range: number; arcDegrees: number };
}
export const O1: RoomManifest = manifest as unknown as RoomManifest;
export function simRoom(room: RoomManifest = O1): SimRoom { return { bounds: room.bounds, solids: room.solids }; }
export function spawnAngle(spawn: SpawnSpec): number {
  if (!FACINGS.includes(spawn.facing)) throw new Error(`unknown facing ${spawn.facing}`);
  return facingAngle(spawn.facing);
}
