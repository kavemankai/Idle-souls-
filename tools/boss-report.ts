/**
 * Boss win rates through the shipped progression layer: `npx tsx tools/boss-report.ts [seeds] [levels...]`.
 * Two measures per boss and start level (design level 1 to 9, the level table's row, temporary levels and rations as shipped):
 *  - expedition: from camp, open the gate if a key is needed (one issued), challenge the boss. "reached" is how often the boss came into a fight, "won" how often it fell.
 *  - arena: the adventurer enters the arena at full health at that level's row and walks to the exit past the boss. No road before it, no rations.
 * Prints markdown. Nothing here is tuned; it only reads.
 */
import { loadSim } from '../src/combat/loadSimNode';
import { WorldGraph } from '../src/world/worldGraph';
import { defaultPlan, type Objective } from '../src/expedition/plan';
import { runExpedition } from '../src/expedition/run';
import { runRoom } from '../src/world/roomRunner';
import { ROOMS } from '../src/world/roomRegistry';
import { simLevel } from '../src/progression/levelTable';

const sim = loadSim(), graph = new WorldGraph(), ALL = [...graph.rooms.keys()];
const seeds = Number(process.argv[2] ?? 300);
const levels = process.argv.length > 3 ? process.argv.slice(3).map(Number) : [1, 3, 5, 7, 9];
const bosses = [
  { id: 'warden', room: 'MB', gate: ['T2', 'MB'], via: { x: 80, y: -40 }, enc: 'warden', entry: 'to-T2', exit: 'to-K2' },
  { id: 'castellan', room: 'B1', gate: ['K2', 'B1'], via: { x: 120, y: 0 }, enc: 'castellan', entry: 'to-K2', exit: 'to-K2' },
];
const pct = (n: number) => `${Math.round(n / seeds * 100)}%`;
console.log(`Boss win rates, ${seeds} seeds, focus balanced, doctrine measured.\n`);
console.log('| boss | start level | sim level | expedition: reached | expedition: won | expedition: died on the way | expedition: turned back | arena only: won |');
console.log('|---|---|---|---|---|---|---|---|');
for (const b of bosses) for (const L of levels) {
  let reached = 0, won = 0, early = 0, arena = 0;
  const objectives: Objective[] = [{ id: 'o', kind: 'open', room: b.gate[0], to: b.gate[1] }, { id: 'c', kind: 'challenge', room: b.room }];
  for (let seed = 1; seed <= seeds; seed++) {
    const plan = { ...defaultPlan(), objectives, retreatHpPct: Number(process.env.RETREAT ?? 40) };
    const { chronicle: c } = runExpedition(sim, { seed, level: 80, focus: 'balanced', plan, known: ALL.filter(r => r !== b.room), issueKeys: 1, progression: { startLevel: L } });
    if (c.bosses) reached++; else if (c.outcome === 'died') early++;
    if (c.bossesDefeated.includes(b.id)) won++;
    const r = runRoom(sim, { seed, level: simLevel(L), focus: 'balanced', doctrine: 'measured', room: ROOMS[b.room], encounter: b.enc, entryDoor: b.entry, exitDoor: b.exit, via: b.via });
    if (r.bossesDefeated?.includes(b.id)) arena++;
  }
  console.log(`| ${b.id} | ${L} | ${simLevel(L)} | ${pct(reached)} | ${pct(won)} | ${pct(early)} | ${pct(seeds - reached - early)} | ${pct(arena)} |`);
}
