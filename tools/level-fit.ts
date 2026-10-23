/**
 * Fit the design-level table to the whole roster.
 *   npx tsx tools/level-fit.ts --curves docs/slice/data/curves.json [--write] [--n 300]
 * Input: win-rate curves from tools/roster-curves.ts and the room arrival rows in src/progression/levelTable.ts (ROOM_ARRIVAL).
 * Method: for every design level d, the rooms that expect the adventurer at d each want their encounter near a target win rate (measured doctrine, balanced
 * focus). The table is the strictly rising list of simulator levels (at least 2 apart) that minimises the squared miss over all rows, found exactly by dynamic
 * programming over levels 1 to 200 on the linearly interpolated curves. The chosen levels are then checked with fresh seeds (1001 and up) for all three
 * doctrines and both focuses, so the numbers in the report are not the ones the fit saw. Nothing is hidden: rows that cannot be met stay in the report as misses.
 * --write rewrites the LEVEL_TABLE block in src/progression/levelTable.ts and docs/slice/data/fit.json.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { loadSim } from '../src/combat/loadSimNode';
import { LEVEL_TABLE, ROOM_ARRIVAL, type RoomArrival } from '../src/progression/levelTable';
import { DOCTRINES, FOCUSES, LEVELS, type Curves } from './roster-curves';

const arg = (k: string, d = '') => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };
export const MAX_SIM = 200, MIN_STEP = 2;
/** A row counts as calibrated when every room on it lands within this many points of its target (fresh seeds, measured doctrine); otherwise it is flagged as a miss. */
const MISS_LIMIT = 0.12;

export function interp(curve: Record<number, number>, level: number): number {
  if (level <= LEVELS[0]) return curve[LEVELS[0]];
  for (let i = 1; i < LEVELS.length; i++) if (level <= LEVELS[i]) {
    const a = LEVELS[i - 1], b = LEVELS[i], t = (level - a) / (b - a);
    return curve[a] + (curve[b] - curve[a]) * t;
  }
  return curve[LEVELS[LEVELS.length - 1]];
}

/** Strictly rising simulator levels for design levels 1..n minimising the squared miss of every arrival row. */
export function fitTable(curves: Curves, arrival: readonly RoomArrival[], n = 9): number[] {
  const cost: number[][] = Array.from({ length: n + 1 }, () => new Array(MAX_SIM + 1).fill(0));
  for (let d = 1; d <= n; d++) for (let L = 1; L <= MAX_SIM; L++) {
    for (const r of arrival.filter(x => x.design === d)) {
      const c = curves[r.encounter]?.measured?.balanced;
      if (!c) throw new Error(`no curve for ${r.encounter}`);
      cost[d][L] += (interp(c, L) - r.target) ** 2;
    }
  }
  const best: number[][] = Array.from({ length: n + 1 }, () => new Array(MAX_SIM + 1).fill(Infinity)), from: number[][] = Array.from({ length: n + 1 }, () => new Array(MAX_SIM + 1).fill(0));
  for (let L = 1; L <= MAX_SIM; L++) best[1][L] = cost[1][L];
  for (let d = 2; d <= n; d++) {
    let run = Infinity, at = 0;
    for (let L = 1; L <= MAX_SIM; L++) {
      const prev = L - MIN_STEP;
      if (prev >= 1 && best[d - 1][prev] < run) { run = best[d - 1][prev]; at = prev; }
      if (run < Infinity) { best[d][L] = run + cost[d][L]; from[d][L] = at; }
    }
  }
  let L = 1;
  for (let l = 1; l <= MAX_SIM; l++) if (best[n][l] < best[n][L]) L = l;
  const out: number[] = new Array(n + 1);
  for (let d = n; d >= 1; d--) { out[d] = L; L = from[d][L]; }
  return out.slice(1);
}

export interface Checked { row: RoomArrival; sim: number; win: Record<string, Record<string, number>> }
if (process.argv[1]?.endsWith('level-fit.ts')) {
  const curves = JSON.parse(readFileSync(arg('curves'), 'utf8')) as Curves, n = Number(arg('n', '300'));
  const table = fitTable(curves, ROOM_ARRIVAL, LEVEL_TABLE.length);
  const sim = loadSim();
  const run = (sim as unknown as { runFight(c: object): { winner: string } }).runFight;
  const checked: Checked[] = ROOM_ARRIVAL.map(row => {
    const level = table[row.design - 1], win: Record<string, Record<string, number>> = {};
    for (const d of DOCTRINES) { win[d] = {}; for (const f of FOCUSES) {
      const stats = sim.allocate(level, f); let w = 0;
      for (let seed = 1001; seed < 1001 + n; seed++) if (run({ seed, stats, god: false, doctrine: d, encounter: row.encounter }).winner === 'adventurer') w++;
      win[d][f] = w / n;
    } }
    return { row, sim: level, win };
  });
  const rows = table.map((s, i) => {
    const mine = checked.filter(c => c.row.design === i + 1);
    const note = mine.map(c => `${c.row.room} ${c.row.encounter} ${(c.win.measured.balanced * 100).toFixed(0)}% (target ${(c.row.target * 100).toFixed(0)}%)`).join('; ');
    const worst = Math.max(...mine.map(c => Math.abs(c.win.measured.balanced - c.row.target)));
    return { design: i + 1, sim: s, calibrated: worst <= MISS_LIMIT, note: worst <= MISS_LIMIT ? note : `${note}; MISS, worst ${(worst * 100).toFixed(0)} points` };
  });
  const block = rows.map(r => `  { design: ${r.design}, sim: ${r.sim}, calibrated: ${r.calibrated}, note: ${JSON.stringify(r.note)} },`).join('\n');
  console.log(rows.map(r => `L${r.design} = ${r.sim}  ${r.note}`).join('\n'));
  if (process.argv.includes('--write')) {
    const file = 'src/progression/levelTable.ts', src = readFileSync(file, 'utf8');
    writeFileSync(file, src.replace(/export const LEVEL_TABLE: readonly LevelRow\[\] = \[[\s\S]*?\n\];/, `export const LEVEL_TABLE: readonly LevelRow[] = [\n${block}\n];`));
    writeFileSync('docs/slice/data/fit.json', JSON.stringify({ table, checked }, null, 1));
    console.log('wrote', file, 'and docs/slice/data/fit.json');
  }
}
