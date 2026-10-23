// Headless balance runner for combat-sim.js.
//   node balance.js                        all encounters, all doctrines, balanced focus, 300 seeds
//   node balance.js --enc sentry,mireling2 --doc measured --prof balanced,duelist,bulwark,skirmisher,survivor,random --n 300
//   node balance.js --levels 1,40,80,140,god
// Deep-stats split: levels are points above a fresh adventurer (body 7, mind 1). Focus profiles:
// balanced, duelist, bulwark, skirmisher, survivor, random. god = fresh body with a perfect mind.
// Each cell: win %, draws (timeouts), mean fight seconds, mean health left after a win.
const SIM = require('./combat-sim.js');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const encs = arg('enc', Object.keys(SIM.ENCOUNTERS).join(',')).split(',');
const docs = arg('doc', 'measured,guarded,pressing').split(',');
const profs = arg('prof', 'balanced').split(',');
const levels = arg('levels', '1,40,80,140,god').split(',');
const N = +arg('n', 300);
console.log(`seeds 1-${N}, ${new Date().toISOString()}`);
for (const encounter of encs) for (const doctrine of docs) for (const prof of profs) {
  const cells = levels.map(L => {
    let w = 0, dr = 0, ticks = 0, hp = 0;
    for (let seed = 1; seed <= N; seed++) {
      const god = L === 'god';
      const stats = god ? SIM.allocate(1, 'even') : SIM.allocate(+L, prof, seed);
      const S = SIM.runFight({ seed, stats, god, doctrine, encounter });
      if (S.winner === 'adventurer') { w++; hp += S.p.hp / S.p.maxHp; } else if (S.winner === 'draw') dr++;
      ticks += S.tick;
    }
    return `${L === 'god' ? 'god' : 'L' + L} ${Math.round(w / N * 100)}%${dr ? ` d${dr}` : ''} ${Math.round(ticks / N / SIM.HZ)}s ${w ? Math.round(hp / w * 100) + '%hp' : '-'}`;
  });
  console.log(`${encounter.padEnd(15)} ${doctrine.padEnd(9)} ${prof.padEnd(8)} ${cells.join(' | ')}`);
}
