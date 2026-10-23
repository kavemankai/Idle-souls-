/**
 * Design levels 1 to 9 mapped to simulator levels (the simulator grants 1.3 stat points per level above 1; the scale is not changed).
 * The table is data: `npx tsx tools/level-calibrate.ts --write` recalibrates it against encounter win-rate targets and rewrites this file.
 * Rows marked `calibrated: false` were interpolated or anchored, not measured; the report says which.
 */
export interface LevelRow { design: number; sim: number; calibrated: boolean; note: string }
export const LEVEL_TABLE: readonly LevelRow[] = [
  { design: 1, sim: 15, calibrated: true, note: "mireling2: 40% against a target of 40%" },
  { design: 2, sim: 48, calibrated: true, note: "mireling2: 56% against a target of 55%" },
  { design: 3, sim: 62, calibrated: true, note: "sentryMireling: 23% against a target of 25%" },
  { design: 4, sim: 94, calibrated: true, note: "sentryMireling: 57% against a target of 55%" },
  { design: 5, sim: 106, calibrated: false, note: "extrapolated at 12 simulator levels per design level, not measured" },
  { design: 6, sim: 118, calibrated: false, note: "extrapolated at 12 simulator levels per design level, not measured" },
  { design: 7, sim: 130, calibrated: false, note: "extrapolated at 12 simulator levels per design level, not measured" },
  { design: 8, sim: 142, calibrated: false, note: "extrapolated at 12 simulator levels per design level, not measured" },
  { design: 9, sim: 154, calibrated: false, note: "extrapolated at 12 simulator levels per design level, not measured" },
];
export const MAX_DESIGN_LEVEL = LEVEL_TABLE.length;
export const clampDesign = (d: number): number => Math.max(1, Math.min(MAX_DESIGN_LEVEL, Math.round(d)));
/** Simulator level for a design level. */
export const simLevel = (design: number): number => LEVEL_TABLE[clampDesign(design) - 1].sim;
