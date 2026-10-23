import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { loadSim } from '../src/combat/loadSimNode';
import { WorldGraph } from '../src/world/worldGraph';
import { defaultPlan } from '../src/expedition/plan';
import { runExpedition, type ExpeditionConfig } from '../src/expedition/run';
import { BUDGET } from './perf-budget';

/** Wall time of headless Old Road expeditions and the gzipped size of the built JavaScript. Run: npx tsx tools/perf-report.ts [--runs N] */
export function timeOldRoad(runs: number) {
  const sim = loadSim(), graph = new WorldGraph();
  const plan = { ...defaultPlan(), objectives: [{ id: 'o1', kind: 'reach' as const, room: 'O3' }, { id: 'o2', kind: 'reach' as const, room: 'KT' }], exploration: 'safe' as const, doctrine: 'guarded' as const };
  const cfg = (seed: number): ExpeditionConfig => ({ seed, level: 80, focus: 'balanced', plan, known: ['C0', 'O1', 'O2', 'O3', 'KT'], hpOverride: 5000, progression: { startLevel: 1 } });
  runExpedition(sim, cfg(1), 30 * 3000, graph);   // warm-up: JIT and the room tables
  const ms: number[] = [], perFight: number[] = [];
  for (let i = 0; i < runs; i++) {
    const t0 = performance.now();
    const c = runExpedition(sim, cfg(i + 2), 30 * 3000, graph).chronicle;
    const dt = performance.now() - t0;
    ms.push(dt); if (c.fights.length) perFight.push(dt / c.fights.length);
  }
  const med = (a: number[]) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)] ?? 0;
  return { runs, medianMs: med(ms), maxMs: Math.max(...ms), medianPerFightMs: med(perFight), maxPerFightMs: Math.max(0, ...perFight) };
}

export function bundleGzip(dist = 'dist') {
  const dir = path.join(dist, 'assets');
  if (!fs.existsSync(dir)) return null;
  let raw = 0, gz = 0;
  const files: { file: string; raw: number; gzip: number }[] = [];
  for (const f of fs.readdirSync(dir).filter(x => x.endsWith('.js'))) {
    const b = fs.readFileSync(path.join(dir, f)), z = zlib.gzipSync(b, { level: 9 }).length;
    raw += b.length; gz += z; files.push({ file: f, raw: b.length, gzip: z });
  }
  return { raw, gzip: gz, files };
}

if (process.argv[1]?.endsWith('perf-report.ts')) {
  const runs = Number(process.argv[process.argv.indexOf('--runs') + 1]) || 7;
  const t = timeOldRoad(runs), b = bundleGzip();
  console.log(JSON.stringify({ node: process.version, expedition: t, budget: { oldRoadExpeditionMs: BUDGET.oldRoadExpeditionMs, perFightMs: BUDGET.perFightMs }, bundle: b && { rawBytes: b.raw, gzipBytes: b.gzip, budget: BUDGET.bundleGzipBytes, files: b.files } }, null, 2));
}
