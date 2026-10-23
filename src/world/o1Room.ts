import manifest from '../../combat/rooms/o1.json' with { type: 'json' };
import { FACINGS } from '../contracts/presentation';
import { facingAngle } from '../presentation/directions';
import type { SimRoom } from '../combat/simApi';
import type { SpawnSpec } from './roomTypes';
import type { RoomManifest } from './roomTypes';
export type { RoomManifest, Circle, SpawnSpec, EnemySpec, EncounterSpec, Door, Side } from './roomTypes';
/** O1 is the one authored room: it names its entry and exit doors, so entry and threshold are always present. */
export type RouteRoom = RoomManifest & { entry: { x: number; y: number }; threshold: { x: number; y: [number, number] } };
export const O1: RouteRoom = manifest as unknown as RouteRoom;
export function simRoom(room: RoomManifest = O1): SimRoom { return { bounds: room.bounds, solids: room.solids }; }
export function spawnAngle(spawn: SpawnSpec): number {
  if (!FACINGS.includes(spawn.facing)) throw new Error(`unknown facing ${spawn.facing}`);
  return facingAngle(spawn.facing);
}
