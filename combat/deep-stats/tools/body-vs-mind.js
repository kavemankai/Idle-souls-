// Guardrail for the stat line: a strong body must not drown out a sharp mind, or the reverse.
//   node tools/body-vs-mind.js [seeds]      (run from deep-stats/)
// Compares a max body with a stat-1 mind against a stat-1 body with a perfect mind, plus each focus at level 80.
const SIM = require('../combat-sim.js');
const N = +(process.argv[2] || 120);
const encs = ['mireling2', 'sentry', 'sentryMireling', 'mob', 'breaker', 'stalker', 'mixed'];
const all = (phys, mind) => Object.fromEntries(SIM.STATS.map(s => [s.key, s.family === 'mind' ? mind : phys]));
function run(label, mk, god = false) {
  const row = encs.map(en => { let w = 0; for (let i = 1; i <= N; i++) if (SIM.runFight({ seed: i, stats: mk(i), god, doctrine: 'measured', encounter: en }).winner === 'adventurer') w++; return `${en} ${Math.round(w / N * 100)}`; });
  console.log(label.padEnd(24), row.join(' | '));
}
run('body 20, mind 1', () => all(20, 1));
run('body 1, perfect mind', () => all(1, 1), true);
run('body 10, mind 10', () => all(10, 10));
for (const f of ['balanced', 'duelist', 'bulwark', 'skirmisher', 'survivor']) run(`L80 ${f}`, () => SIM.allocate(80, f));
