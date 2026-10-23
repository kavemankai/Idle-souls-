/**
 * Progression and sanctuary check (M5): does progress per expedition rise steadily, and does anything dominate (doc 15 stop condition: safe farming)?
 *   npx tsx tools/progression-report.ts [--n 300]     writes docs/slice/M5_REPORT.md
 * Same Old Road, real health, level table from src/progression/levelTable.ts, start level 1. Every row is 300 seeds unless --n says otherwise.
 */
import { writeFileSync } from 'node:fs';
import { loadSim } from '../src/combat/loadSimNode';
import { defaultPlan, type ExpeditionPlan, type Objective } from '../src/expedition/plan';
import { runExpedition } from '../src/expedition/run';
import { UPGRADES } from '../src/progression/experience';
import { LEVEL_TABLE } from '../src/progression/levelTable';
import type { SimApi, SimDoctrine } from '../src/combat/simApi';

const i = process.argv.indexOf('--n'), N = i > 0 ? Number(process.argv[i + 1]) : 300;
const sim = loadSim();
const known = ['C0', 'O1', 'O2', 'O3', 'KT', 'S1', 'S2'];
const obj = (room: string, kind: Objective['kind'] = 'reach'): Objective => ({ id: `${kind}-${room}`, kind, room });
const pct = (n: number) => `${(n / N * 100).toFixed(1)}%`;
const mean = (a: number[]) => (a.reduce((x, y) => x + y, 0) / Math.max(1, a.length)).toFixed(2);

interface Row { label: string; extracted: number; died: number; complete: number; level: number[]; gold: number[]; banked: number[]; sanct: number; rations: number[]; xp: number[] }
function measure(label: string, plan: ExpeditionPlan, kitRations: number, startLevel = 1): Row {
  const row: Row = { label, extracted: 0, died: 0, complete: 0, level: [], gold: [], banked: [], sanct: 0, rations: [], xp: [] };
  for (let seed = 1; seed <= N; seed++) {
    const { chronicle: c } = runExpedition(sim, { seed, level: 80, focus: 'balanced', plan, known, progression: { startLevel, kitRations } });
    if (c.outcome === 'extracted') row.extracted++; else if (c.outcome === 'died') row.died++;
    if (c.outcome === 'extracted' && c.objectives.every(o => o.status === 'completed')) row.complete++;
    row.level.push(c.progress!.level); row.xp.push(c.progress!.xp); row.rations.push(c.progress!.rationsUsed);
    row.gold.push(c.loot.carried.gold); row.banked.push(c.outcome === 'extracted' ? c.loot.carried.gold : 0);
    if (c.progress!.sanctuary.visits > 0) row.sanct++;
  }
  return row;
}
const base = (over: Partial<ExpeditionPlan>, objectives: Objective[]): ExpeditionPlan => ({ ...defaultPlan(), objectives, ...over });
const cautious = (o: Objective[], more: Partial<ExpeditionPlan> = {}) => base({ doctrine: 'guarded', retreatHpPct: 60, drinkBelowPct: 70, ...more }, o);
const pressing = (o: Objective[], more: Partial<ExpeditionPlan> = {}) => base({ doctrine: 'pressing', retreatHpPct: 30, drinkBelowPct: 40, ...more }, o);
const road = [obj('O3'), obj('KT')], deep = [obj('O3'), obj('S2')], shallow = [obj('O1', 'survey')];
const rows: Row[] = [
  measure('cautious, Old Road, starter rations', cautious(road), 2),
  measure('cautious, Old Road, no rations', cautious(road, { drinkBelowPct: 0 }), 0),
  measure('pressing, Old Road, starter rations', pressing(road), 2),
  measure('pressing, Old Road, no rations', pressing(road, { drinkBelowPct: 0 }), 0),
  measure('cautious, to the sanctuary (Broken Pump), start level 2', cautious(deep), 2, 2),
  measure('pressing, to the sanctuary (Broken Pump), start level 2', pressing(deep), 2, 2),
  measure('cautious, to the sanctuary (Broken Pump), start level 4', cautious(deep), 2, 4),
  measure('pressing, to the sanctuary (Broken Pump), start level 4', pressing(deep), 2, 4),
  measure('cautious, shallow (survey the Outer Road only)', cautious(shallow), 2),
  measure('pressing, shallow (survey the Outer Road only)', pressing(shallow), 2),
];
const table = (rs: Row[]) => `| Plan | Extracted | Died | All objectives | Mean level reached | Mean experience | Rations drunk | Reached the sanctuary | Mean gold carried | Mean gold banked |\n|---|---|---|---|---|---|---|---|---|---|\n${rs.map(r => `| ${r.label} | ${pct(r.extracted)} | ${pct(r.died)} | ${pct(r.complete)} | ${mean(r.level)} | ${mean(r.xp)} | ${mean(r.rations)} | ${pct(r.sanct)} | ${mean(r.gold)} | ${mean(r.banked)} |`).join('\n')}`;

// Upgrades: win rate in isolated fights at the level a design level 3 adventurer fights at, without and with each upgrade.
function upgradeWin(upgrade: typeof UPGRADES[number] | null, encounter: string, doctrine: SimDoctrine, level: number): number {
  const stats = (sim as SimApi).allocate(level, 'balanced');
  for (const [k, n] of Object.entries(upgrade?.bonus ?? {})) stats[k] = Math.min(20, stats[k] + n);
  const run = (sim as unknown as { runFight(c: object): { winner: string } }).runFight;
  let w = 0;
  for (let seed = 1; seed <= N; seed++) if (run({ seed, stats, god: false, doctrine, encounter }).winner === 'adventurer') w++;
  return w / N;
}
const L = LEVEL_TABLE[2].sim;
const upRows = ['mireling2', 'sentryMireling'].flatMap(e => (['guarded', 'pressing'] as SimDoctrine[]).map(d => `| ${e}, ${d} | ${(upgradeWin(null, e, d, L) * 100).toFixed(1)}% | ${UPGRADES.map(u => `${(upgradeWin(u, e, d, L) * 100).toFixed(1)}%`).join(' | ')} |`));

const out = `# Progression report (M5, trial settings)

Level table: ${LEVEL_TABLE.map(r => `L${r.design}=${r.sim}`).join(', ')} (simulator levels). Experience: kills pay once per enemy, a won fight adds up to a quarter extra by the health it cost, a completed objective and a first-time room pay a little. ${N} seeds per row, real health, balanced focus, start level as named in the row (1 unless stated). Generated by \`npx tsx tools/progression-report.ts\`.

## Plans, rations and the sanctuary

${table(rows)}

## What one sanctuary upgrade does (isolated fights, level ${L}, ${N} seeds)

| Fight | No upgrade | ${UPGRADES.map(u => u.name).join(' | ')} |
|---|---|---|${UPGRADES.map(() => '---').join('|')}|
${upRows.join('\n')}
`;
writeFileSync('docs/slice/M5_REPORT.md', out);
console.log(out);
