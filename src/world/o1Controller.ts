import type { SimApi, SimDoctrine } from '../combat/simApi';
import { O1 } from './o1Room';
import { RoomRunner, runRoom, type Foe, type RoomResult, type RoomRunnerConfig, type RoomState } from './roomRunner';
import type { EnemySpec, RoomManifest } from './o1Room';
import type { Point } from './o1Route';

export type { Foe };
export type O1State = RoomState;
export type O1Result = RoomResult;
/** An encounter id from the simulator, with positions in combat/rooms/o1.json. */
export type O1Opponent = 'mireling' | 'sentry' | 'mireling2' | 'sentryMireling';
export interface O1Config {
  seed: number; opponent: O1Opponent; level: number; focus: string; doctrine: SimDoctrine;
  /** Everything below is for tests; the slice itself uses the manifest. */
  room?: RoomManifest; start?: Point; maxFightTicks?: number; hpOverride?: number;
  enemies?: EnemySpec[];
  enemy?: Omit<EnemySpec, 'arch'> & { arch?: string };
}
type O1Resolved = O1Config & RoomRunnerConfig;

/** The O1 slice: Old Road, west door to east door. Everything is in RoomRunner; this only names the room and the encounter. */
export class O1Controller extends RoomRunner<O1Resolved> {
  constructor(sim: SimApi, cfg: O1Config) { super(sim, { ...cfg, encounter: cfg.opponent, room: cfg.room ?? O1 }); }
}
/** Headless run used by tests, the report and the browser comparison. */
export function runO1(sim: SimApi, cfg: O1Config, maxTicks = 30 * 400): O1Result {
  return runRoom(sim, { ...cfg, encounter: cfg.opponent, room: cfg.room ?? O1 }, maxTicks);
}
