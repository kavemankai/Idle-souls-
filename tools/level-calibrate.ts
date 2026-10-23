/**
 * Calibrate the design-level table (src/progression/levelTable.ts) against win-rate targets.
 *   npx tsx tools/level-calibrate.ts                     print the result, change nothing
 *   npx tsx tools/level-calibrate.ts --write             rewrite src/progression/levelTable.ts and docs/slice/M5_CALIBRATION.md
 *   npx tsx tools/level-calibrate.ts --targets t.json    targets as [{ "design": 1, "encounter": "mireling", "win": 0.8 }, ...]
 *   options: --doctrine measured  --n 300  --step 12  --anchors 7:40,8:52,9:65
 * For each target it finds the simulator level (balanced focus, isolated fight in the legacy arena, the same method balance.js uses) whose win rate is
 * nearest the target. Design levels with no target are filled by straight-line interpolation between their calibrated neighbours or anchors and are marked
 * not calibrated, so a miss is visible. Past the last calibrated row the table continues at `--step` simulator levels per design level (default 12, a placeholder slope). Doc 27's boss-ready band (true level 40 to 65) can be passed as `--anchors 7:40,8:52,9:65`, but the existing encounters already need more than that.
 * After the roster (M6) lands, add its encounters to the targets and re-run with --write.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { loadSim } from '../src/combat/loadSimNode';
import { LEVEL_TABLE, type LevelRow } from '../src/progression/levelTable';
import type { SimApi, SimDoctrine } from '../src/combat/simApi';

export interface Target { design: number; encounter: string; win: number }
/**
 * Arrival bands from doc 25 section 7, restricted to the encounters that exist before the roster. A lone Mireling is winnable at any level (93% at level 1) and a lone
 * Sentry is flat at about 68% from level 1 to 40, so neither can place a level; the two pairs are the only encounters whose win rate climbs with level.
 * Doc 25 puts "two at once dangerous" at design level 1, which is what 40% for the Mireling pair at level 1 says.
 */
export const DEFAULT_TARGETS: readonly Target[] = [
  { design: 1, encounter: 'mireling2', win: 0.4 },
  { design: 2, encounter: 'mireling2', win: 0.55 },
  { design: 3, encounter: 'sentryMireling', win: 0.25 },
  { design: 4, encounter: 'sentryMireling', win: 0.55 },
];
const arg = (k: string, d: string) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };

export function winRate(sim: SimApi, level: number, encounter: string, doctrine: SimDoctrine, n: number, from = 1): number {
  const stats = sim.allocate(level, 'balanced');
  const run = (sim as unknown as { runFight(c: object): { winner: string } }).runFight;
  let w = 0;
  for (let seed = from; seed < from + n; seed++) if (run({ seed, stats, god: false, doctrine, encounter }).winner === 'adventurer') w++;
  return w / n;
}

/**
 * The lowest level where the win rate first reaches `target`. Win rate against these encounters is noisy and sometimes flat for dozens of levels, so
 * "nearest to the target" would land anywhere on a plateau. A coarse scan (few seeds, every third level, smoothed over three points) finds the first crossing;
 * a fine pass over the levels around it with the full seed count picks the one nearest the target. If the target is never reached the best level is returned,
 * and the caller sees the shortfall in the achieved win rate.
 */
export function findLevel(sim: SimApi, encounter: string, doctrine: SimDoctrine, target: number, n: number): { level: number; win: number } {
  const coarse: { level: number; win: number }[] = [];
  for (let level = 1; level <= sim.MAX_LEVEL; level += 3) coarse.push({ level, win: winRate(sim, level, encounter, doctrine, Math.max(80, Math.round(n / 3))) });
  const smooth = coarse.map((c, i) => ({ level: c.level, win: (coarse[Math.max(0, i - 1)].win + c.win + coarse[Math.min(coarse.length - 1, i + 1)].win) / 3 }));
  const cross = smooth.find(c => c.win >= target) ?? smooth.reduce((a, b) => (b.win > a.win ? b : a));
  let fine = { level: cross.level, win: 0, err: Infinity };
  for (let level = Math.max(1, cross.level - 4); level <= Math.min(sim.MAX_LEVEL, cross.level + 4); level++) {
    const win = winRate(sim, level, encounter, doctrine, n), e = Math.abs(win - target);
    if (e < fine.err) fine = { level, win, err: e };
  }
  return { level: fine.level, win: fine.win };
}

if (process.argv[1]?.endsWith('level-calibrate.ts')) {
  const sim = loadSim();
  const doctrine = arg('doctrine', 'measured') as SimDoctrine, n = Number(arg('n', '300')), step = Number(arg('step', '12'));
  const targets: Target[] = process.argv.includes('--targets') ? JSON.parse(readFileSync(arg('targets', ''), 'utf8')) : [...DEFAULT_TARGETS];
  const anchors: Record<number, number> = Object.fromEntries(arg('anchors', '').split(',').filter(Boolean).map(s => s.split(':').map(Number) as [number, number]));
  const found = new Map<number, { level: number; win: number; encounter: string; target: number }>();
  for (const t of targets) {
    const r = findLevel(sim, t.encounter, doctrine, t.win, n);
    const prev = found.get(t.design);
    if (!prev || Math.abs(r.win - t.win) < Math.abs(prev.win - prev.target)) found.set(t.design, { ...r, encounter: t.encounter, target: t.win });
  }
  const rows: LevelRow[] = [];
  const points: [number, number][] = [];   // [design, sim] known so far (calibrated or anchored)
  for (let d = 1; d <= LEVEL_TABLE.length; d++) {
    const f = found.get(d);
    if (f) { rows.push({ design: d, sim: f.level, calibrated: true, note: `${f.encounter}: ${(f.win * 100).toFixed(0)}% against a target of ${(f.target * 100).toFixed(0)}%` }); points.push([d, f.level]); }
    else if (anchors[d] !== undefined) { rows.push({ design: d, sim: anchors[d], calibrated: false, note: 'anchored to doc 27 boss-ready band, not measured' }); points.push([d, anchors[d]]); }
    else rows.push({ design: d, sim: 0, calibrated: false, note: '' });
  }
  for (const r of rows) if (!r.note) {
    const lo = [...points].reverse().find(p => p[0] < r.design), hi = points.find(p => p[0] > r.design);
    r.sim = lo && hi ? Math.round(lo[1] + (hi[1] - lo[1]) * (r.design - lo[0]) / (hi[0] - lo[0])) : lo ? lo[1] + step * (r.design - lo[0]) : hi ? Math.max(1, hi[1] - step * (hi[0] - r.design)) : 1;
    r.note = lo && hi ? 'interpolated between neighbours, not measured' : `extrapolated at ${step} simulator levels per design level, not measured`;
  }
  for (let i = 1; i < rows.length; i++) if (rows[i].sim <= rows[i - 1].sim) { rows[i].sim = rows[i - 1].sim + 1; rows[i].note += ' (raised to keep the table rising)'; }
  const misses = rows.filter(r => !r.calibrated).map(r => r.design);
  const table = rows.map(r => `  { design: ${r.design}, sim: ${r.sim}, calibrated: ${r.calibrated}, note: ${JSON.stringify(r.note)} },`).join('\n');
  const report = `# Level table calibration (generated)

Doctrine ${doctrine}, balanced focus, ${n} seeds per measurement, isolated fights in the legacy arena. Run \`npx tsx tools/level-calibrate.ts --write\` to regenerate.

| Design level | Simulator level | Calibrated | Basis |
|---|---|---|---|
${rows.map(r => `| ${r.design} | ${r.sim} | ${r.calibrated ? 'yes' : 'no'} | ${r.note} |`).join('\n')}

Not calibrated: design level${misses.length === 1 ? '' : 's'} ${misses.join(', ')}. ${misses.length ? 'These wait for roster encounters (M6) with targets, or for a human call.' : ''}
`;
  console.log(report);
  if (process.argv.includes('--write')) {
    const file = 'src/progression/levelTable.ts', src = readFileSync(file, 'utf8');
    const out = src.replace(/export const LEVEL_TABLE: readonly LevelRow\[\] = \[[\s\S]*?\n\];/, `export const LEVEL_TABLE: readonly LevelRow[] = [\n${table}\n];`);
    writeFileSync(file, out); writeFileSync('docs/slice/M5_CALIBRATION.md', report);
    console.log('wrote', file, 'and docs/slice/M5_CALIBRATION.md');
  }
}
