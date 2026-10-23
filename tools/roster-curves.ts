/**
 * Win rate of every roster encounter against simulator level: the raw data the level table is fitted to.
 *   npx tsx tools/roster-curves.ts --enc harrier,spitter --out docs/slice/data/curves-a.json [--n 300]
 * Isolated fights in the legacy arena, balanced and survivor focus, three doctrines, the same method balance.js and level-calibrate.ts use.
 * Merge the part files with `npx tsx tools/roster-curves.ts --merge docs/slice/data/curves-a.json docs/slice/data/curves-b.json --out docs/slice/data/curves.json`.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { loadSim } from '../src/combat/loadSimNode';
import type { SimDoctrine } from '../src/combat/simApi';

export const LEVELS = [1, 4, 7, 10, 13, 16, 19, 22, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 80, 100, 120, 140, 160];
export const DOCTRINES: SimDoctrine[] = ['guarded', 'measured', 'pressing'];
export const FOCUSES = ['balanced', 'survivor'];
/** encounter > doctrine > focus > level > win rate */
export type Curves = Record<string, Record<string, Record<string, Record<number, number>>>>;
const arg = (k: string, d = '') => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };

if (process.argv[1]?.endsWith('roster-curves.ts')) {
  if (process.argv.includes('--merge')) {
    const at = process.argv.indexOf('--merge') + 1;
    const files: string[] = [];
    for (let i = at; i < process.argv.length && !process.argv[i].startsWith('--'); i++) files.push(process.argv[i]);
    const out: Curves = {};
    for (const f of files) Object.assign(out, JSON.parse(readFileSync(f, 'utf8')) as Curves);
    writeFileSync(arg('out'), JSON.stringify(out));
    console.log('merged', files.length, 'files,', Object.keys(out).length, 'encounters');
  } else {
    const sim = loadSim(), n = Number(arg('n', '300')), encs = arg('enc').split(',').filter(Boolean);
    const run = (sim as unknown as { runFight(c: object): { winner: string } }).runFight;
    const out: Curves = {};
    for (const e of encs) {
      out[e] = {};
      for (const d of DOCTRINES) {
        out[e][d] = {};
        for (const f of FOCUSES) {
          out[e][d][f] = {};
          for (const level of LEVELS) {
            const stats = sim.allocate(level, f);
            let w = 0;
            for (let seed = 1; seed <= n; seed++) if (run({ seed, stats, god: false, doctrine: d, encounter: e }).winner === 'adventurer') w++;
            out[e][d][f][level] = w / n;
          }
        }
      }
      console.log('done', e);
    }
    writeFileSync(arg('out'), JSON.stringify(out));
  }
}
