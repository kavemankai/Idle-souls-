import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { loadSim } from '../src/combat/loadSimNode';
import { O1, simRoom } from '../src/world/o1Room';
import type { SimFight, SimFightConfig, SimFighter } from '../src/combat/simApi';

const sim = loadSim();
const room = sim.room.prepare(simRoom());
const MOVES = (sim as unknown as { MOVES: Record<string, never> }).MOVES;
const base = (over: Partial<SimFightConfig>): SimFightConfig => ({ seed: 1, stats: sim.allocate(80, 'balanced'), god: false, doctrine: 'measured', encounter: 'mireling', room: simRoom(), ...over });
const inside = (f: SimFighter) => sim.room.nearest(room, f.x, f.y).d >= f.r - 1e-6;
const freeze = (S: SimFight) => { S.p.stagger = 600; };

test('a dodge into the north wall stops at the wall', () => {
  const S = sim.createFight(base({ spawns: { adventurer: { x: -150, y: -185, face: 0 }, enemies: [{ x: 200, y: 100, face: 0 }] } }));
  Object.assign(S.p, { act: MOVES.dodge, actT: 0, dodgeDir: -Math.PI / 2 });
  let top = Infinity;
  for (let i = 0; i < 12; i++) { sim.step(S); top = Math.min(top, S.p.y); assert.ok(S.p.y >= -200 + S.p.r - 1e-6, `y=${S.p.y} at tick ${i}`); assert.ok(inside(S.p)); }
  assert.ok(top < -186, 'the dodge did press into the wall');
});
test('a dodge toward the pillar never enters it', () => {
  const S = sim.createFight(base({ spawns: { adventurer: { x: 10, y: -50, face: 0 }, enemies: [{ x: 200, y: 100, face: 0 }] } }));
  Object.assign(S.p, { act: MOVES.dodge, actT: 0, dodgeDir: -Math.PI / 2 });
  for (let i = 0; i < 14; i++) { sim.step(S); assert.ok(inside(S.p), `inside a solid at tick ${i}: ${S.p.x},${S.p.y}`); }
  assert.ok(Math.hypot(S.p.x - 10, S.p.y + 125) >= 27 + 13 - 1e-6);
});
test('an enemy lunge toward the pillar stops at the pillar', () => {
  const S = sim.createFight(base({ encounter: 'stalker', spawns: { adventurer: { x: -150, y: 100, face: 0 }, enemies: [{ x: 10, y: -30, face: -Math.PI / 2 }] } }));
  freeze(S);
  Object.assign(S.enemies[0], { act: MOVES.lunge, actT: 0, actInst: 99 });
  for (let i = 0; i < 40; i++) { sim.step(S); assert.ok(inside(S.enemies[0]), `lunge entered a solid at tick ${i}`); }
});
test('body separation cannot push a fighter through a wall', () => {
  const S = sim.createFight(base({ encounter: 'sentry', spawns: { adventurer: { x: 0, y: -186, face: 0 }, enemies: [{ x: 0, y: -170, face: 0 }] } }));
  for (let i = 0; i < 60; i++) { sim.step(S); assert.ok(inside(S.p) && inside(S.enemies[0]), `tick ${i}`); }
});
test('no fighter is ever inside a solid across whole fights', () => {
  for (const encounter of ['mireling', 'sentry']) for (let seed = 1; seed <= 12; seed++) {
    const S = sim.createFight(base({ seed, encounter, doctrine: seed % 3 === 0 ? 'pressing' : seed % 3 === 1 ? 'measured' : 'guarded', spawns: { adventurer: { x: -100, y: -60, face: 0 }, enemies: [{ x: 20, y: -60, face: Math.PI }] } }));
    while (!S.over) { sim.step(S); assert.ok(inside(S.p) && S.enemies.every(inside), `${encounter} seed ${seed} tick ${S.tick}`); }
  }
});
test('a melee hit does not land through the pillar, but does without it', () => {
  const run = (withRoom: boolean) => {
    const cfg = base({ encounter: 'breaker', spawns: { adventurer: { x: 10, y: -165, face: 0 }, enemies: [{ x: 10, y: -80, face: -Math.PI / 2 }] } });
    if (!withRoom) delete cfg.room;
    const S = sim.createFight(cfg);
    freeze(S);
    Object.assign(S.enemies[0], { act: MOVES.swing, actT: 0, actInst: 99 });
    const before = S.p.hp;
    for (let i = 0; i < 40; i++) sim.step(S);
    return before - S.p.hp;
  };
  assert.ok(run(false) > 0, 'control: the swing lands in the open arena');
  assert.equal(run(true), 0, 'the pillar blocks the same swing');
});
test('legacy circular-arena fights are unchanged', () => {
  const r = spawnSync(process.execPath, ['combat/deep-stats/tools/legacy-check.js'], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /different 0/);
});
test('the manifest rooms keep spawns inside the floor and clear of solids', () => {
  for (const [name, s] of Object.entries(O1.spawns)) assert.ok(sim.room.nearest(room, s.x, s.y).d >= sim.ARCH[name].r, `${name} spawn is clear`);
});
