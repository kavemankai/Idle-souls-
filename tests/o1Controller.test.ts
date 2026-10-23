import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadSim } from '../src/combat/loadSimNode';
import { O1Controller, runO1, type O1Config } from '../src/world/o1Controller';
import { O1 } from '../src/world/o1Room';

const sim = loadSim();
const cfg = (over: Partial<O1Config> = {}): O1Config => ({ seed: 1, opponent: 'mireling', level: 80, focus: 'balanced', doctrine: 'measured', ...over });

test('states run ready, travelling, fighting, travelling, completed and the controller never picks a tactic', () => {
  const c = new O1Controller(sim, cfg());
  assert.equal(c.state, 'ready');
  c.step();
  assert.equal(c.state, 'ready', 'stepping before dispatch does nothing');
  c.dispatch();
  const seen: string[] = [c.state];
  while (!c.terminal && c.tick < 30 * 300) { c.step(); if (seen[seen.length - 1] !== c.state) seen.push(c.state); }
  assert.deepEqual(seen, ['travelling', 'fighting', 'travelling', 'completed']);
  assert.ok(c.fought);
  assert.ok(c.hero.x >= O1.threshold.x);
});
test('detection hands the current positions to the simulator', () => {
  const c = new O1Controller(sim, cfg());
  c.dispatch();
  let before = { x: 0, y: 0 };
  while (c.state === 'travelling') { before = { x: c.hero.x, y: c.hero.y }; c.step(); }
  assert.equal(c.state, 'fighting');
  const S = c.fight!;
  assert.equal(S.tick, 0, 'fresh fight');
  assert.ok(Math.hypot(S.p.x - before.x, S.p.y - before.y) < 1e-9, 'adventurer starts where it was seen');
  assert.ok(Math.abs(S.enemies[0].x - O1.spawns.mireling.x) < 1e-9 && Math.abs(S.enemies[0].y - O1.spawns.mireling.y) < 1e-9, 'enemy starts at its fixed spawn');
  const range = Math.hypot(before.x - O1.spawns.mireling.x, before.y - O1.spawns.mireling.y);
  assert.ok(range <= O1.detection.range + 3 && range >= 110, `detected at ${range.toFixed(1)} units (provisional range 160, spawn separation at least 110)`);
  assert.ok(c.detectedAtTick! > 0);
});
test('after a win travel resumes from the simulator position and finishes', () => {
  const c = new O1Controller(sim, cfg({ seed: 3 }));
  c.dispatch();
  while (c.state !== 'fighting') c.step();
  while (c.state === 'fighting') c.step();
  assert.equal(c.state, 'travelling');
  const S = c.fight!;
  assert.equal(S.winner, 'adventurer');
  assert.equal(c.hero.x, S.p.x); assert.equal(c.hero.y, S.p.y);
  assert.equal(c.hp, S.p.hp, 'health carries over from the simulator');
  assert.ok(c.notes.some(n => n.includes('Travel resumes')));
  while (!c.terminal) c.step();
  assert.equal(c.state, 'completed');
  assert.equal(c.fight!.tick, S.tick, 'the fight is not stepped again after it ended');
});
test('an enemy that cannot see the route is never fought and traversal still completes', () => {
  const r = runO1(sim, cfg({ enemy: { x: 150, y: 150, facing: 'SE' } }));
  assert.equal(r.outcome, 'completed');
  assert.equal(r.fought, false);
  assert.equal(r.detectedAtTick, null);
  assert.equal(r.hpLeft, r.hpMax);
});
test('death stops travel', () => {
  const c = new O1Controller(sim, cfg({ opponent: 'sentry', hpOverride: 1 }));
  c.dispatch();
  while (!c.terminal && c.tick < 30 * 300) c.step();
  assert.equal(c.state, 'defeated');
  const at = { tick: c.tick, x: c.hero.x };
  for (let i = 0; i < 30; i++) c.step();
  assert.equal(c.tick, at.tick, 'a finished run does not advance');
  assert.ok(c.hero.x < O1.threshold.x, 'never reached the threshold');
});
test('a fight that runs past its tick cap is unresolved and travel stops', () => {
  const r = runO1(sim, cfg({ maxFightTicks: 15 }));
  assert.equal(r.outcome, 'unresolved');
  assert.equal(r.fought, true);
  assert.ok(r.finalPos.x < O1.threshold.x);
  assert.equal(r.fightTicks, 15);
});
test('no route reports unresolved instead of walking through a solid', () => {
  const r = runO1(sim, cfg({ start: { x: 10, y: -125 } }));
  assert.equal(r.outcome, 'unresolved');
  assert.equal(r.fought, false);
});
test('the same configuration always produces the same run', () => {
  const a = runO1(sim, cfg({ seed: 7, opponent: 'sentry', doctrine: 'guarded' }));
  const b = runO1(sim, cfg({ seed: 7, opponent: 'sentry', doctrine: 'guarded' }));
  assert.deepEqual(a, b);
  const other = runO1(sim, cfg({ seed: 8, opponent: 'sentry', doctrine: 'guarded' }));
  assert.notEqual(other.digest, a.digest, 'a different seed gives a different fight');
});
