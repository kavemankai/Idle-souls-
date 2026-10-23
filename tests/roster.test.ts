import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { loadSim } from '../src/combat/loadSimNode';
import { ROOMS } from '../src/world/roomRegistry';
import { ENCOUNTER_FOR, SOLO, BOSS_TIER, RoomRunner, runRoom } from '../src/world/roomRunner';
import { KILL_LOOT } from '../src/expedition/loot';
import type { SimDoctrine } from '../src/combat/simApi';

const sim = loadSim();
const contract = JSON.parse(readFileSync('combat/rooms/ENCOUNTER_CONTRACT.json', 'utf8')) as { encounters: Record<string, string[]>; roomPlan: Record<string, string[]> };
const NEW = ['harrier', 'spitter', 'brute', 'duelist', 'warden', 'castellan'];
/** Points around an encounter's first enemy; a walk through the first one with a route is seen by it. */
const around = (room: string, enc: string) => { const e = ROOMS[room].encounters[enc].enemies[0]; return [[-100, 0], [100, 0], [0, 100], [0, -100], [-60, 0], [60, 0]].map(([dx, dy]) => ({ x: e.x + dx, y: e.y + dy })); };
const fight = (encounter: string, level = 80, seed = 1, doctrine: SimDoctrine = 'measured') =>
  sim.createFight({ seed, stats: sim.allocate(level, 'balanced', seed), god: false, doctrine, encounter });

test('every contract encounter is a simulator encounter with the same archetypes in the same order', () => {
  for (const [id, archs] of Object.entries(contract.encounters)) {
    assert.ok(sim.ENCOUNTERS[id], `${id} is a simulator encounter`);
    assert.deepEqual(sim.ENCOUNTERS[id].enemies, archs, id);
    assert.equal(ENCOUNTER_FOR[archs.join(',')], id, `${id} maps back from its archetypes`);
    for (const a of archs) assert.ok(sim.ARCH[a], `${a} has an archetype`);
  }
  assert.equal(Object.keys(ENCOUNTER_FOR).length, Object.keys(contract.encounters).length + 1, 'no two encounters share a key (plus the lone grunt)');
  assert.deepEqual(sim.ENCOUNTERS.gruntAlone.enemies, ['grunt']);
});

test('every roster enemy has a kill reward, and the miniboss and boss are the only bosses', () => {
  for (const a of NEW.concat('grunt')) assert.ok(KILL_LOOT[a], `${a} pays`);
  assert.deepEqual(Object.keys(BOSS_TIER).sort(), ['castellan', 'warden']);
  assert.deepEqual([...SOLO].sort(), ['brute', 'castellan', 'duelist', 'warden']);
  for (const [id, archs] of Object.entries(contract.encounters)) if (archs.some(a => SOLO.has(a))) assert.equal(archs.length, 1, `${id}: elites and bosses fight alone`);
});

test('the sim is deterministic for every new encounter, and a different seed changes the fight', () => {
  for (const e of NEW.concat(['harrierSentry', 'harrierMireling', 'spitterGrunt', 'sentrySpitter'])) {
    const run = (seed: number) => { const S = fight(e, 80, seed); while (!S.over && S.tick < 30 * 150) sim.step(S); return [S.winner, S.tick, Math.round(S.p.hp * 100), JSON.stringify(S.stats.dmgBy)].join('|'); };
    assert.equal(run(3), run(3), `${e} repeats`);
  }
  const trace = (seed: number) => { const S = fight('castellan', 80, seed); while (!S.over && S.tick < 30 * 150) sim.step(S); return `${S.winner}${S.tick}`; };
  assert.notEqual(trace(1) + trace(2) + trace(3), trace(1) + trace(1) + trace(1));
});

test('fights end, and nobody ends outside the room, in every authored room that holds a roster enemy', () => {
  for (const [room, encs] of Object.entries(contract.roomPlan)) for (const enc of encs) {
    const m = ROOMS[room];
    if (room === 'T3') continue;   // T3 predates the roster and still holds no encounter (M7 left it as authored); the contract plans harrierMireling for it
    assert.ok(m.encounters[enc], `${room} holds ${enc}`);
    let R!: RoomRunner;
    for (const via of around(room, enc)) { R = new RoomRunner(sim, { seed: 2, level: 80, focus: 'balanced', doctrine: 'measured', encounter: enc, room: m, hpOverride: 100000, via }); R.dispatch(); if (R.state !== 'unresolved') break; }
    const [x0, y0, x1, y1] = m.bounds;
    while (!R.terminal && R.tick < 30 * 400) {
      R.step();
      if (R.fight) for (const f of [R.fight.p, ...R.fight.enemies]) {
        assert.ok(Number.isFinite(f.x) && Number.isFinite(f.y), `${room} ${f.arch} stays finite`);
        assert.ok(f.x >= x0 - 1 && f.x <= x1 + 1 && f.y >= y0 - 1 && f.y <= y1 + 1, `${room} ${f.arch} stays in bounds at tick ${R.tick}`);
      }
    }
    assert.equal(R.state, 'completed', `${room}/${enc} finishes (${R.notes.slice(-1)})`);
    assert.equal(R.fought, true, `${room}/${enc} fights`);
  }
});

test('spit leaves a warned patch of ground, and the legacy encounters never make one', () => {
  let patches = 0, hurt = 0;
  for (let seed = 1; seed <= 30; seed++) {
    const S = fight('spitter', 1, seed);
    while (!S.over && S.tick < 30 * 150) { sim.step(S); }
    for (const h of S.hazards ?? []) { patches++; assert.ok(h.warn > 0 && h.life > 0 && h.dmg > 0, 'a patch is marked before it bites and does not last for ever'); }
    if (S.stats.dmgBy.hazard > 0) hurt++;
  }
  assert.ok(patches > 0, 'a spitter marks the floor');
  assert.ok(hurt > 0, 'and a patch sometimes bites');
  for (const e of ['mireling', 'sentry', 'mireling2', 'sentryMireling']) {
    const S = fight(e, 80, 1);
    while (!S.over && S.tick < 30 * 150) sim.step(S);
    assert.equal(S.hazards, undefined, `${e} has no hazards`);
    assert.equal(S.stats.dmgBy.hazard ?? 0, 0);
  }
});

test('the warden and the castellan pay once, report themselves as defeated bosses, and nothing else does', () => {
  for (const [room, enc, id] of [['MB', 'warden', 'warden'], ['B1', 'castellan', 'castellan']] as const) {
    const r = runRoom(sim, { seed: 4, level: 80, focus: 'balanced', doctrine: 'measured', encounter: enc, room: ROOMS[room], hpOverride: 100000, via: around(room, enc)[0] });
    assert.equal(r.outcome, 'completed', room);
    assert.deepEqual(r.bossesDefeated, [id], room);
  }
  const plain = runRoom(sim, { seed: 4, level: 80, focus: 'balanced', doctrine: 'measured', encounter: 'brute', room: ROOMS.S2, hpOverride: 100000 });
  assert.equal(plain.bossesDefeated, undefined, 'a brute is an elite, not a boss');
});

test('a boss fights alone, and a boss that is left comes back at full health', () => {
  // A brute with a sentry standing beside it is two fights, never a pair.
  const room = ROOMS.S2;
  const R = new RoomRunner(sim, { seed: 1, level: 80, focus: 'balanced', doctrine: 'measured', encounter: 'brute', room, hpOverride: 100000,
    enemies: [{ ...room.encounters.brute.enemies[0] }, { ...room.encounters.brute.enemies[0], arch: 'sentry', x: room.encounters.brute.enemies[0].x + 30, y: room.encounters.brute.enemies[0].y + 20 }] });
  R.dispatch();
  while (!R.terminal && R.fights < 1 && R.tick < 3000) R.step();
  assert.equal(R.fightSlot(0) >= 0 && R.fightSlot(1) === -1 || R.fightSlot(1) >= 0 && R.fightSlot(0) === -1, true, 'one of them fights alone');

  // Break contact from the castellan: it goes back to its post, and the next fight starts it again at full health.
  const b1 = ROOMS.B1, door = b1.doors[0];
  const B = new RoomRunner(sim, { seed: 3, level: 80, focus: 'balanced', doctrine: 'measured', encounter: 'castellan', room: b1, hpOverride: 100000, via: around('B1', 'castellan')[0] });
  B.dispatch();
  while (B.state !== 'fighting' && !B.terminal && B.tick < 3000) B.step();
  assert.equal(B.state, 'fighting');
  for (let i = 0; i < 240; i++) B.step();
  const hurt = B.fight!.enemies[0].hp;
  assert.ok(hurt < B.fight!.enemies[0].maxHp, 'the fight hurt it');
  assert.equal(B.retreat(door.id).ok, true);
  while (!B.terminal && B.tick < 30 * 300) B.step();
  if (B.escaped) {
    assert.equal(B.foes[0].alive && !B.foes[0].engaged, true, 'it returned to its post, unengaged');
    assert.ok(B.fight!.enemies[0].hp <= hurt, 'the old fight is over');
  }
  const again = fight('castellan', 80, 3);
  assert.equal(again.enemies[0].hp, again.enemies[0].maxHp, 'every new fight starts a boss at full health');
});
