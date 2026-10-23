/** Records the walking-expedition golden runs: results and digests for a fixed matrix, so refactors can prove they change nothing.
 *  npx tsx tools/world-golden.ts --record   rewrites tests/golden/world-runs.json (only when a change to these results is intended) */
import { writeFileSync } from 'node:fs';
import { loadSim } from '../src/combat/loadSimNode';
import { runWorld } from '../src/world/worldRunner';
import type { SimDoctrine } from '../src/combat/simApi';
export const WORLD_MATRIX = {
  sets: { default: undefined, alt: { O1: 'mireling2', O2: 'mireling', O3: 'sentry' } } as Record<string, Record<string, string> | undefined>,
  doctrines: ['measured', 'guarded', 'pressing'] as SimDoctrine[], seeds: [1, 2, 3, 4],
};
export function worldGoldenRuns() {
  const sim = loadSim(), out: Record<string, unknown> = {};
  for (const [name, encounters] of Object.entries(WORLD_MATRIX.sets)) for (const doctrine of WORLD_MATRIX.doctrines) for (const seed of WORLD_MATRIX.seeds)
    out[`${name}/${doctrine}/${seed}`] = runWorld(sim, { seed, level: 80, focus: 'balanced', doctrine, from: 'C0', to: 'O3', encounters });
  return JSON.parse(JSON.stringify(out)) as Record<string, unknown>;   // the JSON round trip normalises -0, as the recorded file does
}
if (process.argv.includes('--record')) { const runs = worldGoldenRuns(); writeFileSync('tests/golden/world-runs.json', JSON.stringify(runs, null, 1) + '\n'); console.log(`recorded ${Object.keys(runs).length} runs`); }
