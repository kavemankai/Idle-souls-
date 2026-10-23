import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { loadSim } from '../src/combat/loadSimNode';
import { ROOMS } from '../src/world/roomRegistry';
import { WorldRunner, runWorld, toWorld, type WorldRunConfig } from '../src/world/worldRunner';
import { worldGoldenRuns } from '../tools/world-golden';

const sim = loadSim();
const base: WorldRunConfig = { seed: 1, level: 80, focus: 'balanced', doctrine: 'measured', from: 'C0', to: 'O3' };
const CAMP = toWorld(ROOMS.C0, { x: 0, y: 0 });

test('the walk follows the graph path out and back and ends at the camp centre', () => {
  const r = runWorld(sim, { ...base, encounters: {} });
  assert.equal(r.outcome, 'home');
  assert.deepEqual(r.rooms, ['C0', 'O1', 'O2', 'O3']);
  assert.deepEqual(r.legs.map(l => `${l.room}:${l.phase}`), ['C0:out', 'O1:out', 'O2:out', 'O3:out', 'O3:back', 'O2:back', 'O1:back', 'C0:back']);
  assert.deepEqual(r.finalPos, CAMP);
  assert.equal(r.fights, 0);
  assert.equal(r.hpLeft, r.hpMax);
});

test('the adventurer never jumps: walking steps stay within walking speed, across rooms and passages', () => {
  const w = new WorldRunner(sim, { ...base });
  const speed = sim.ARCH.adventurer.speed * sim.derive(sim.allocate(80, 'balanced', 1), false).moveMult;
  const sets: (Record<string, string> | undefined)[] = [{}, undefined, { O1: 'mireling2', O2: 'mireling', O3: 'sentry' }];
  for (const encounters of sets) for (const seed of [1, 2, 3]) {
    const r = runWorld(sim, { ...base, seed, encounters, hpOverride: 5000 });
    assert.ok(r.maxWalkStep <= speed + 1e-3, `seed ${seed}: walked ${r.maxWalkStep} in one tick, speed ${speed}`);
  }
  assert.ok(w.legs.length === 8);
});

test('a killed enemy stays dead for the rest of the walk', () => {
  const r = runWorld(sim, { ...base, hpOverride: 5000 });
  assert.equal(r.outcome, 'home');
  assert.equal(r.enemiesDefeated, 4);   // Mireling, Ashen Sentry, Two Mirelings
  assert.deepEqual(r.dead, { C0: [], O1: [true], O2: [true], O3: [true, true] });
  for (const l of r.legs.filter(l => l.phase === 'back')) assert.equal(l.result.fights, 0, `${l.room} on the way back`);
  assert.ok(r.legs.filter(l => l.phase === 'out').some(l => l.result.fights > 0));
});

test('health carries between rooms and a fall ends the walk where it happened', () => {
  const r = runWorld(sim, { ...base, hpOverride: 30 });
  assert.equal(r.outcome, 'defeated');
  assert.equal(r.hpLeft, 0);
  assert.equal(r.legs[r.legs.length - 1].result.outcome, 'defeated');
  assert.ok(r.legs.length < 8);
  const healthy = runWorld(sim, { ...base, hpOverride: 5000 });
  const second = healthy.legs.find(l => l.room === 'O2' && l.phase === 'out')!.result;
  assert.ok(second.hpMax === 5000 && second.hpLeft < 5000, 'a later room starts with the health the earlier fights left');
});

test('the walk is deterministic, and the seed changes the fights', () => {
  const a = runWorld(sim, base), b = runWorld(sim, base), c = runWorld(sim, { ...base, seed: 2 });
  assert.deepEqual(a, b);
  assert.notEqual(a.digest, c.digest);
});

test('rooms without encounters are empty and unknown encounters are refused', () => {
  assert.equal(runWorld(sim, { ...base, encounters: { O1: 'mireling' } }).fights <= 1, true);
  assert.throws(() => runWorld(sim, { ...base, encounters: { O1: 'nope' } }), /no encounter nope/);
});

test('the walk can turn at any room and start at any room', () => {
  const r = runWorld(sim, { ...base, to: 'O1', encounters: {}, turnDoor: 'to-O2' });
  assert.deepEqual(r.legs.map(l => `${l.room}:${l.phase}`), ['C0:out', 'O1:out', 'O1:back', 'C0:back']);
  assert.equal(r.outcome, 'home');
  assert.throws(() => new WorldRunner(sim, { ...base, to: 'O1', turnDoor: 'to-ZZ' }), /no door/);
  assert.throws(() => new WorldRunner(sim, { ...base, to: 'MB' }), /no ordinary route/);
});

test('the walking-expedition results and digests are identical to the recorded golden runs', () => {
  const gold = JSON.parse(readFileSync('tests/golden/world-runs.json', 'utf8')) as Record<string, unknown>, now = worldGoldenRuns();
  assert.deepEqual(Object.keys(now), Object.keys(gold));
  for (const k of Object.keys(gold)) assert.deepEqual(now[k], gold[k], k);
});
