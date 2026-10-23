// Focus balance check: win % per training focus at one level, and the max-min spread.
//   node tools/focus-spread.js [--enc breaker,stalker,sentryMireling] [--level 80] [--doc measured] [--n 300] [--from 1]
//   node tools/focus-spread.js --ablate survivor     revert each boosted stat of one focus to its balanced value, one at a time
// Run from deep-stats/. Target at level 80: the focus averages over the encounters within 15 points of each other.
// Single cells differ more, because a focus has matchups (Survivor beats the Breaker, not Sentry + Mireling).
const SIM = require('../combat-sim.js');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const encs = arg('enc', 'breaker,stalker,sentryMireling').split(',');
const level = +arg('level', 80);
const docs = arg('doc', 'measured').split(',');
const N = +arg('n', 300), SEED0 = +arg('from', 1);
const ablate = arg('ablate', null);
// Experiments: --hp 1.8 sets HP per Vitality point.
if (arg('hp', null)) SIM.setPhys(0.35, +arg('hp'));
// --profiles '{"survivor":{"vitality":2}}' replaces a focus's boosted stats (every other stat weighs 1).
if (arg('profiles', null)) { const o = JSON.parse(arg('profiles')); for (const f in o) SIM.PROFILES[f] = Object.assign(Object.fromEntries(SIM.STATS.map(s => [s.key, 1])), o[f]); }
const FOCUSES = ['balanced', 'duelist', 'bulwark', 'skirmisher', 'survivor'];

function win(encounter, doctrine, mk) {
  let w = 0, dr = 0;
  for (let seed = SEED0; seed < SEED0 + N; seed++) {
    const S = SIM.runFight({ seed, stats: mk(seed), god: false, doctrine, encounter });
    if (S.winner === 'adventurer') w++; else if (S.winner === 'draw') dr++;
  }
  return { pct: Math.round(w / N * 100), dr };
}
const cell = r => `${String(r.pct).padStart(3)}%${r.dr ? ` d${r.dr}` : ''}`;

if (ablate) {
  const base = SIM.allocate(level, 'balanced'), full = SIM.allocate(level, ablate);
  const boosted = SIM.STATS.map(s => s.key).filter(k => SIM.PROFILES[ablate][k] > 1);
  for (const encounter of encs) for (const doctrine of docs) {
    const ref = win(encounter, doctrine, () => full);
    const rows = boosted.map(k => {
      const st = Object.assign({}, full, { [k]: base[k] });
      const r = win(encounter, doctrine, () => st);
      return `${k} ${full[k]}->${base[k]}: ${cell(r)} (${r.pct - ref.pct >= 0 ? '+' : ''}${r.pct - ref.pct})`;
    });
    console.log(`${encounter} ${doctrine} L${level} ${ablate} ${cell(ref)} | ${rows.join(' | ')}`);
  }
} else {
  const tot = FOCUSES.map(() => 0); let cells = 0;
  for (const encounter of encs) for (const doctrine of docs) {
    const rs = FOCUSES.map(f => win(encounter, doctrine, seed => SIM.allocate(level, f, seed)));
    const pcts = rs.map(r => r.pct);
    rs.forEach((r, i) => tot[i] += r.pct); cells++;
    console.log(`${encounter.padEnd(15)} ${doctrine.padEnd(9)} L${level} ${FOCUSES.map((f, i) => `${f} ${cell(rs[i])}`).join(' | ')} | spread ${Math.max(...pcts) - Math.min(...pcts)}`);
  }
  const av = tot.map(t => t / cells);
  console.log(`mean over ${cells} cells: ${FOCUSES.map((f, i) => `${f} ${av[i].toFixed(1)}`).join(' | ')} | range ${(Math.max(...av) - Math.min(...av)).toFixed(1)}`);
}
