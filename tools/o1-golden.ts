/** Records the O1 golden runs: results and digests for a fixed matrix, so refactors can prove they change nothing.
 *  npx tsx tools/o1-golden.ts --record   rewrites tests/golden/o1-runs.json (only when a change to O1 results is intended) */
import { writeFileSync } from 'node:fs';
import { loadSim } from '../src/combat/loadSimNode';
import { runO1, type O1Opponent } from '../src/world/o1Controller';
import type { SimDoctrine } from '../src/combat/simApi';
export const MATRIX = { opponents: ['mireling', 'sentry', 'mireling2', 'sentryMireling'] as O1Opponent[], doctrines: ['measured', 'guarded', 'pressing'] as SimDoctrine[], seeds: [1, 2, 3, 4, 5, 6] };
export function goldenRuns() {
  const sim = loadSim(), out: Record<string, unknown> = {};
  for (const opponent of MATRIX.opponents) for (const doctrine of MATRIX.doctrines) for (const seed of MATRIX.seeds)
    out[`${opponent}/${doctrine}/${seed}`] = runO1(sim, { seed, opponent, level: 80, focus: 'balanced', doctrine });
  return JSON.parse(JSON.stringify(out)) as Record<string, unknown>;   // the JSON round trip normalises -0, as the recorded file does
}
if (process.argv.includes('--record')) { const runs = goldenRuns(); writeFileSync('tests/golden/o1-runs.json', JSON.stringify(runs, null, 1) + '\n'); console.log(`recorded ${Object.keys(runs).length} runs`); }
