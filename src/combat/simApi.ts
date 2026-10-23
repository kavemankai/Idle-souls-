/** Typed surface of combat/deep-stats/combat-sim.js that the O1 slice uses. The sim stays plain JS. */
export type SimDoctrine = 'measured' | 'guarded' | 'pressing';
export interface SimRoom {
  bounds: readonly [number, number, number, number];
  solids: { rects: readonly (readonly number[])[]; circles: readonly { x: number; y: number; r: number }[] };
}
export interface SimMove { id: string; kind: string; windup?: number; active?: number; recovery?: number; dur?: number }
export interface SimMoveFull extends SimMove { name: string; windup: number; range?: number; arc?: number; dmg?: number }
export interface SimFighter {
  arch: string; name: string; x: number; y: number; face: number; r: number;
  hp: number; maxHp: number; st: number; maxSt: number; poise: number; maxPoise: number; flash: number; parryWin?: number;
  act: SimMoveFull | null; actT: number; actInst: number; blocking: boolean; blockStart: number;
  stagger: number; iframe: boolean; dead: boolean; mvx: number; mvy: number; mv?: Record<string, SimMoveFull>;
}
/** Derived numbers from derive(stats): the ones the stat descriptions quote. */
export interface SimDerived {
  moveMult: number; hp: number; delay: number; misread: number; reserve: number; greed: number; temp: number; spacingErr: number; dodgeErr: number; flankSense: number;
  poisePower: number; trackMult: number; arcMult: number; glance: number; chainMax: number; raise: number; parryStart: number; blockMult: number; chip: number;
  breakStag: number; perfect: number; parry: number; guardArc: number; dodgeDist: number; iframes: number; dodgeStam: number; counterWin: number;
  maxSt: number; regen: number; regenPause: number; poise: number; staggerMult: number;
}
export interface SimAi { readout: string; truth: string; intent: string; parryP: number | null; snaps: { x: number; y: number }[]; target: number }
export interface SimStats {
  dealt: number; taken: number; blocks: number; perfects: number; parries: number; dodges: number; punishes: number;
  dodgeCounters: number; guardBreaksDealt: number; counteredHits: number; dmgBy: Record<string, number>;
}
export interface SimEvent { tick: number; text: string; kind: string }
export interface SimFight {
  tick: number; over: boolean; winner: 'adventurer' | 'enemy' | 'draw' | null;
  p: SimFighter; enemies: SimFighter[]; events: SimEvent[]; d: SimDerived; ai: SimAi; stats: SimStats;
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
  derive(stats: Record<string, number>, god: boolean): SimDerived;
  playerMoves(d: SimDerived): Record<string, SimMoveFull>;
  pointsSpent(stats: Record<string, number>): number;
  playerLevel(stats: Record<string, number>): number;
  STATS: { key: string; name: string; family: string }[];
  FAMILIES: { key: string; name: string }[];
  CAUSES: Record<string, [string, string]>;
  DOCTRINES: Record<string, { name: string }>;
  createFight(cfg: SimFightConfig): SimFight;
  step(S: SimFight): void;
  room: {
    prepare(room: SimRoom): PreparedRoom;
    nearest(room: PreparedRoom, x: number, y: number): { d: number; nx: number; ny: number };
    losClear(room: PreparedRoom, x0: number, y0: number, x1: number, y1: number): boolean;
  };
}
