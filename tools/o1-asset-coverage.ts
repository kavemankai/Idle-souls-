/** O1 sprite coverage measured against real deterministic combat-controller frames.
 *  npx tsx tools/o1-asset-coverage.ts [--seeds 100]
 *  Reconstructs old missing coverage on the SAME trace without modifying simulator.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { loadSim } from '../src/combat/loadSimNode';
import { O1Controller, type O1Opponent } from '../src/world/o1Controller';
import { O1PresentationAdapter } from '../src/world/o1Adapter';
import { chooseFrame } from '../src/presentation/spriteSelection';
import type { ActorView } from '../src/contracts/presentation';
import type { SimDoctrine } from '../src/combat/simApi';

const args = process.argv;
const i = args.indexOf('--seeds');
const seedsPerPair = i >= 0 ? Number(args[i + 1]) : 100;
if (!Number.isSafeInteger(seedsPerPair) || seedsPerPair < 1 || seedsPerPair > 300) throw new Error('seeds must be 1..300');
const at = (kind: string): { frames: Record<string, unknown> } =>
  JSON.parse(readFileSync(`assets/characters/runtime/${kind}.json`, 'utf8'));
const frames: Record<string, Record<string, unknown>> = {
  adventurer: at('adventurer').frames, sentry: at('sentry').frames, mireling: at('mireling').frames,
};
const before = (frameName: string) => {
  // Reconstruct unrendered actions/facings from docs/o1_slice/ASSET_NEEDS.md.
  // This must be compared with the SAME trace; original source atlases are not modified.
  const [kind, action, facing] = frameName.split('__');
  const selectedMissing = ['W', 'NW', 'SE'].includes(facing);
  if (kind === 'adventurer' && ['light', 'dodge', 'reaction'].includes(action) && selectedMissing) return false;
  if (kind === 'sentry' && ['light', 'bash'].includes(action) && selectedMissing) return false;
  if (kind === 'sentry' && action === 'reaction') return false;
  if (kind === 'mireling' && ['light', 'reaction'].includes(action)) return false;
  return Boolean(frames[kind]?.[frameName]);
};
const now = (frameName: string) => {
  const kind = frameName.split('__')[0];
  return Boolean(frames[kind]?.[frameName]);
};
const opponents: O1Opponent[] = ['mireling', 'sentry'];
const doctrines: SimDoctrine[] = ['measured', 'guarded', 'pressing'];
const sim = loadSim();
const historicCounts = new Map<string, number>();
const currentCounts = new Map<string, number>();
let drawnFrames = 0, legacyFallbacks = 0, currentFallbacks = 0, totalFights = 0;
const key = (a: ActorView) => `${a.kind} ${a.action} ${a.facing}`;
const add = (map: Map<string, number>, name: string) => map.set(name, (map.get(name) ?? 0) + 1);
for (const opponent of opponents) for (const doctrine of doctrines) for (let seed = 1; seed <= seedsPerPair; seed++) {
  const controller = new O1Controller(sim, { opponent, doctrine, seed, level: 80, focus: 'balanced' });
  const adapter = new O1PresentationAdapter(controller);
  controller.dispatch();
  let steps = 0;
  while (!controller.terminal && steps < 12000) {
    controller.step();
    steps++;
    for (const actor of adapter.read().actors) {
      if (!actor.visible) continue;
      drawnFrames++;
      if (chooseFrame(actor, before).missing) { legacyFallbacks++; add(historicCounts, key(actor)); }
      if (chooseFrame(actor, now).missing) { currentFallbacks++; add(currentCounts, key(actor)); }
    }
  }
  if (!controller.terminal) throw new Error(`O1 did not terminate: ${opponent} ${doctrine} seed=${seed}`);
  totalFights++;
}
const summarize = (data: Map<string, number>) => Object.fromEntries([...data.entries()].sort((a, b) => b[1] - a[1]));
const report = {
  generatedFrom: 'tools/o1-asset-coverage.ts',
  scope: { opponents, doctrines, seedsPerPair, totalFights, level: 80, focus: 'balanced', tickRate: 30 },
  drawnFrames, reconstructedPreWaveFallbacks: legacyFallbacks, currentFallbacks,
  reconstructedPreWavePercent: +(legacyFallbacks / drawnFrames * 100).toFixed(3),
  currentFallbackPercent: +(currentFallbacks / drawnFrames * 100).toFixed(3),
  historicalPublishedForReference: { drawnFrames: 627971, fallbacks: 60456 },
  previousByClip: summarize(historicCounts), currentByClip: summarize(currentCounts),
  caveat: 'Previous fallback count is reconstructed from pre-wave file coverage on the same simulation trace. Original manifest reported 60,456 / 627,971; minor sampling-order differences are possible. Actual phone/human readability untested.',
};
writeFileSync('docs/o1_slice/asset-coverage-report.json', JSON.stringify(report, null, 2) + '\n');
const pct = (x: number) => (drawnFrames ? (x * 100 / drawnFrames).toFixed(2) : '0.00') + '%';
const lines = [...currentCounts].sort((a,b)=>b[1]-a[1]).map(([clip,count])=>`| ${clip} | ${count} |`).join('\n');
const markdown = `# O1 measured directional sprite coverage

Generated from deterministic 30 Hz O1 controller snapshots by \`npx tsx tools/o1-asset-coverage.ts --seeds ${seedsPerPair}\`. Level 80 balanced adventurer; ${totalFights} runs (two opponents, three doctrines, ${seedsPerPair} seeds per combination). The atlas availability is read from the current repository files. No AI or combat data is changed.

| Measurement | Count | Fraction of frames |
| --- | ---: | ---: |
| Actor frames drawn | ${drawnFrames} | 100% |
| Reconstructed original fallbacks on this same trace | ${legacyFallbacks} | ${pct(legacyFallbacks)} |
| Fallbacks with current atlases | ${currentFallbacks} | ${pct(currentFallbacks)} |

Previously published sample: 60,456 fallbacks of 627,971 actor frames (9.6%). Here the old coverage is reconstructed on the same deterministic traces, so the denominators and relative reduction are directly comparable. This is not a separate historical rerun of the old checkout.

## Remaining requested clips

${currentCounts.size ? '| Clip/direction | Fallback frames |\n| --- | ---: |\n' + lines : 'No missing direction/clip was requested on this sample.'}

The absence of fallback requests **does not** prove animation quality, combat tell accuracy, rig appeal, or death animations. A visual review and physical phone review remain required.
`;
writeFileSync('docs/o1_slice/ASSET_COVERAGE_REPORT.md', markdown);
console.log(JSON.stringify({drawnFrames,legacyFallbacks,currentFallbacks,totalFights,originalPublished:60456},null,2));
