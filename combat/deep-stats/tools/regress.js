// Regression: old six-stat builds mapped onto the 18-stat line must give fights identical to main.
//   node tools/regress.js        (run from deep-stats/)
// Only holds for builds with Guard = 10, because Guard Strength also sets perfect-block poise damage.
const path = require('path');
const MAIN = require(path.join(__dirname, '../../main/combat-sim.js'));
const SPLIT = require(path.join(__dirname, '../combat-sim.js'));
const builds = [
  { reflex: 1, perception: 1, discipline: 1, footwork: 1, guard: 10, composure: 1 },
  { reflex: 10, perception: 10, discipline: 10, footwork: 10, guard: 10, composure: 10 },
  { reflex: 20, perception: 5, discipline: 14, footwork: 17, guard: 10, composure: 8 },
  { reflex: 3, perception: 18, discipline: 6, footwork: 4, guard: 10, composure: 20 },
];
let same = 0, diff = 0; const ex = [];
for (const b of builds) for (const enc of Object.keys(MAIN.ENCOUNTERS)) for (const doc of ['measured', 'guarded', 'pressing']) for (let seed = 1; seed <= 15; seed++) {
  const A = MAIN.runFight({ seed, stats: b, doctrine: doc, encounter: enc });
  const B = SPLIT.runFight({ seed, stats: SPLIT.fromSix(b), doctrine: doc, encounter: enc, hpOverride: A.p.maxHp });
  if (A.winner === B.winner && A.tick === B.tick && A.p.hp === B.p.hp && A.events.length === B.events.length) same++;
  else { diff++; if (ex.length < 5) ex.push({ enc, doc, seed, main: [A.winner, A.tick, A.p.hp], split: [B.winner, B.tick, B.p.hp] }); }
}
console.log(`identical ${same}, different ${diff}`); if (diff) { console.log(ex); process.exit(1); }
