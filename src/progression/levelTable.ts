/**
 * Design levels 1 to 9 mapped to simulator levels (the simulator grants 1.3 stat points per level above 1; the scale is not changed).
 * The table is data: `npx tsx tools/level-calibrate.ts --write` recalibrates it against encounter win-rate targets and rewrites this file.
 * Rows marked `calibrated: false` were interpolated or anchored, not measured; the report says which.
 */
export interface LevelRow { design: number; sim: number; calibrated: boolean; note: string }
export const LEVEL_TABLE: readonly LevelRow[] = [
  { design: 1, sim: 1, calibrated: true, note: "O1 mireling 96% (target 88%)" },
  { design: 2, sim: 27, calibrated: true, note: "O2 sentry 74% (target 75%); O3 mireling2 47% (target 45%); KT mireling2 47% (target 45%)" },
  { design: 3, sim: 39, calibrated: true, note: "T1 harrier 84% (target 83%)" },
  { design: 4, sim: 133, calibrated: false, note: "T2 harrierSentry 45% (target 50%); T3 harrierMireling 65% (target 50%); S1 spitter 92% (target 78%); MISS, worst 15 points" },
  { design: 5, sim: 135, calibrated: true, note: "S2 brute 67% (target 73%); S3 spitterGrunt 71% (target 60%)" },
  { design: 6, sim: 140, calibrated: false, note: "MB warden 54% (target 48%); K1 sentrySpitter 10% (target 50%); MISS, worst 40 points" },
  { design: 7, sim: 143, calibrated: true, note: "K2 duelist 70% (target 68%); K3 duelist 70% (target 68%)" },
  { design: 8, sim: 156, calibrated: true, note: "B1 castellan 33% (target 35%)" },
  { design: 9, sim: 160, calibrated: true, note: "B1 castellan 38% (target 50%)" },
];
/**
 * The design level the adventurer is expected to have on arriving in a room on the intended route, and the win rate (measured doctrine, balanced focus, isolated
 * fight) the room's encounter should give at the table's simulator level for that design level. The table is fitted to these rows by
 * `npx tsx tools/level-calibrate.ts --roster`.
 * Arrival levels: doc 25 section 7 gives ranges per region (Old Road 1 to 2, Watchtower 2 to 4, Sunken Passage 3 to 5, Bell Warden 4 to 6, Forgotten Crypt 5 to 8,
 * Castellan 7 to 9); inside a region a room takes its place along the route (the later room, the higher level) and the optional miniboss takes the top of its range.
 * Targets: the middle of the handoff's section 6 band at the level that band is stated for (Mireling 80 to 95%, Sentry 65 to 85, Harrier 75 to 90, Spitter 70 to 85,
 * Brute 60 to 85, Duelist 55 to 80, Warden 35 to 60, Castellan 30 to 55). Pairs have no stated band: doc 25 says a pair of regular enemies forces a route or retreat
 * decision, so they aim at 45 to 60%. The Castellan appears twice: at design level 8 at the low end of its band (first attempt) and at 9 in its upper half (prepared).
 */
export interface RoomArrival { room: string; design: number; encounter: string; target: number; basis: string }
export const ROOM_ARRIVAL: readonly RoomArrival[] = [
  { room: 'O1', design: 1, encounter: 'mireling', target: 0.875, basis: 'Mireling alone, band 80 to 95%' },
  { room: 'O2', design: 2, encounter: 'sentry', target: 0.75, basis: 'Sentry alone, band 65 to 85%' },
  { room: 'O3', design: 2, encounter: 'mireling2', target: 0.45, basis: 'doc 25: two at once is dangerous on the Old Road' },
  { room: 'KT', design: 2, encounter: 'mireling2', target: 0.45, basis: 'the Watchpost garrison stands in for the staged waves' },
  { room: 'T1', design: 3, encounter: 'harrier', target: 0.825, basis: 'Harrier alone, band 75 to 90%' },
  { room: 'T2', design: 4, encounter: 'harrierSentry', target: 0.5, basis: 'doc 25: a ranged and guard pair forces a route or retreat decision' },
  { room: 'T3', design: 4, encounter: 'harrierMireling', target: 0.5, basis: 'optional pair, treated like T2' },
  { room: 'S1', design: 4, encounter: 'spitter', target: 0.775, basis: 'Spitter alone, band 70 to 85%' },
  { room: 'S2', design: 5, encounter: 'brute', target: 0.725, basis: 'Brute alone, band 60 to 85%' },
  { room: 'S3', design: 5, encounter: 'spitterGrunt', target: 0.6, basis: 'weak escort, easier than a regular pair' },
  { room: 'MB', design: 6, encounter: 'warden', target: 0.475, basis: 'Warden, band 35 to 60%' },
  { room: 'K1', design: 6, encounter: 'sentrySpitter', target: 0.5, basis: 'staged pair, doc 15' },
  { room: 'K2', design: 7, encounter: 'duelist', target: 0.675, basis: 'Duelist alone, band 55 to 80%' },
  { room: 'K3', design: 7, encounter: 'duelist', target: 0.675, basis: 'Duelist alone, band 55 to 80%' },
  { room: 'B1', design: 8, encounter: 'castellan', target: 0.35, basis: 'Castellan, first attempt, low end of the 30 to 55% band' },
  { room: 'B1', design: 9, encounter: 'castellan', target: 0.5, basis: 'Castellan, prepared, upper half of the band' },
];
export const MAX_DESIGN_LEVEL = LEVEL_TABLE.length;
export const clampDesign = (d: number): number => Math.max(1, Math.min(MAX_DESIGN_LEVEL, Math.round(d)));
/** Simulator level for a design level. */
export const simLevel = (design: number): number => LEVEL_TABLE[clampDesign(design) - 1].sim;
