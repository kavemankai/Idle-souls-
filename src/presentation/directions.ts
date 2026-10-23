import { FACINGS, type Facing } from '../contracts/presentation';
/** Screen Y points down. This never changes the input heading. */
export function facingFromVector(x: number, y: number): Facing {
  return FACINGS[(Math.round(Math.atan2(x, -y) / (Math.PI / 4)) + 8) % 8];
}
export function facingAngle(facing: Facing): number {
  return FACINGS.indexOf(facing) * Math.PI / 4 - Math.PI / 2;
}
export function exactAttackFacing<T>(entries: Partial<Record<Facing, T>>, facing: Facing): T | undefined {
  // Missing attack art is explicit. Never rotate/mirror or silently use another quadrant.
  return entries[facing];
}
