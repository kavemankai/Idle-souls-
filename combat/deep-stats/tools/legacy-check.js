// Guard for the optional room/spawns support: legacy circular-arena fights must not change.
//   node tools/legacy-check.js            compare against tools/legacy-golden.json, prints "different 0" when identical
//   node tools/legacy-check.js --record   rewrite the golden file (only when a change to legacy outcomes is intended)
// Run from deep-stats/. Covers every encounter, all doctrines, 20 seeds, an L80 balanced build and a fresh one.
// regress.js compares the split against main; it does not detect a change to the legacy arena, this does.
const fs = require('fs');
const path = require('path');
const SIM = require('../combat-sim.js');
const FILE = path.join(__dirname, 'legacy-golden.json');
const SEEDS = 20;

function digest() {
  const out = {};
  for (const encounter of Object.keys(SIM.ENCOUNTERS)) for (const doctrine of Object.keys(SIM.DOCTRINES)) for (const lvl of [1, 80]) {
    const rows = [];
    for (let seed = 1; seed <= SEEDS; seed++) {
      const S = SIM.runFight({ seed, stats: SIM.allocate(lvl, 'balanced'), god: false, doctrine, encounter });
      rows.push([S.winner, S.tick, Math.round(S.p.hp * 100) / 100, S.events.length, Math.round(S.p.x * 100) / 100, Math.round(S.p.y * 100) / 100].join(':'));
    }
    out[`${encounter}/${doctrine}/L${lvl}`] = rows.join(',');
  }
  return out;
}

const now = digest();
if (process.argv.includes('--record')) {
  fs.writeFileSync(FILE, JSON.stringify(now, null, 1) + '\n');
  console.log(`recorded ${Object.keys(now).length} cells x ${SEEDS} seeds`);
} else {
  const gold = JSON.parse(fs.readFileSync(FILE, 'utf8'));
  let same = 0, diff = 0;
  for (const k of Object.keys(gold)) { if (gold[k] === now[k]) same++; else { diff++; console.log('differs:', k); } }
  console.log(`identical ${same}, different ${diff}`);
  process.exit(diff ? 1 : 0);
}
