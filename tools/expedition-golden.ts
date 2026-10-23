/** Records the expedition golden runs: Chronicles for a fixed matrix of plans and seeds, so refactors can prove they change nothing.
 *  npx tsx tools/expedition-golden.ts --record   rewrites tests/golden/expedition-runs.json (only when a change to these results is intended) */
import { writeFileSync } from 'node:fs';
import { loadSim } from '../src/combat/loadSimNode';
import { defaultPlan, type ExpeditionPlan } from '../src/expedition/plan';
import { runExpedition } from '../src/expedition/run';
const obj = (room: string, kind: 'reach' | 'survey' = 'reach') => ({ id: `${kind}-${room}`, kind, room });
export const EXPEDITION_PLANS: Record<string, ExpeditionPlan> = {
  directSurvey: { ...defaultPlan(), exploration: 'direct', objectives: [obj('T1', 'survey'), obj('O3')] },
  thoroughSurvey: { ...defaultPlan(), exploration: 'thorough', doctrine: 'guarded', objectives: [obj('T1', 'survey')] },
  cautious: { ...defaultPlan(), retreatHpPct: 95, doctrine: 'pressing', objectives: [obj('O3'), obj('KT')] },
};
export const EXPEDITION_KNOWN = ['C0', 'O1', 'O2', 'O3', 'KT'];
export function expeditionGoldenRuns() {
  const sim = loadSim(), out: Record<string, unknown> = {};
  for (const [name, plan] of Object.entries(EXPEDITION_PLANS)) for (const seed of [1, 2, 3, 4])
    out[`${name}/${seed}`] = runExpedition(sim, { seed, level: 80, focus: 'balanced', plan, known: EXPEDITION_KNOWN }).chronicle;
  return JSON.parse(JSON.stringify(out)) as Record<string, unknown>;
}
if (process.argv.includes('--record')) { const runs = expeditionGoldenRuns(); writeFileSync('tests/golden/expedition-runs.json', JSON.stringify(runs, null, 1) + '\n'); console.log(`recorded ${Object.keys(runs).length} runs`); }
