/** Typed surface of combat/deep-stats/combat-sim.js that the O1 slice uses. The sim stays plain JS. */
export type SimDoctrine = 'measured' | 'guarded' | 'pressing';
export interface SimRoom {
  bounds: readonly [number, number, number, number];
  solids: { rects: readonly (readonly number[])[]; circles: readonly { x: number; y: number; r: number }[] };
}
export interface SimMove { id: string; kind: string; windup?: number; active?: number; recovery?: number; dur?: number }
export interface SimFighter {
  arch: string; name: string; x: number; y: number; face: number; r: number;
  hp: number; maxHp: number; act: SimMove | null; actT: number; actInst: number; blocking: boolean; blockStart: number;
  stagger: number; iframe: boolean; dead: boolean; mvx: number; mvy: number;
}
export interface SimEvent { tick: number; text: string; kind: string }
export interface SimFight {
  tick: number; over: boolean; winner: 'adventurer' | 'enemy' | 'draw' | null;
  p: SimFighter; enemies: SimFighter[]; events: SimEvent[]; d: { raise: number; moveMult: number };
}
export interface SimSpawn { x: number; y: number; face: number }
export interface SimFightConfig {
  seed: number; stats: Record<string, number>; god: boolean; doctrine: SimDoctrine; encounter: string;
  room?: SimRoom; spawns?: { adventurer?: SimSpawn; enemies?: SimSpawn[] }; hpOverride?: number;
}
export interface PreparedRoom { readonly __prepared: true }
export interface SimApi {
  HZ: number;
  MAX_LEVEL: number;
  PROFILES: Record<string, unknown>;
  ARCH: Record<string, { speed: number; r: number }>;
  allocate(level: number, focus: string, seed?: number): Record<string, number>;
  derive(stats: Record<string, number>, god: boolean): { moveMult: number; hp: number };
  createFight(cfg: SimFightConfig): SimFight;
  step(S: SimFight): void;
  room: {
    prepare(room: SimRoom): PreparedRoom;
    nearest(room: PreparedRoom, x: number, y: number): { d: number; nx: number; ny: number };
    losClear(room: PreparedRoom, x0: number, y0: number, x1: number, y1: number): boolean;
  };
}
