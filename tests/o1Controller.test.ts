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
  assert.ok(Math.abs(S.enemies[0].x - O1.encounters.mireling.enemies[0].x) < 1e-9 && Math.abs(S.enemies[0].y - O1.encounters.mireling.enemies[0].y) < 1e-9, 'enemy starts at its fixed spawn');
  const range = Math.hypot(before.x - O1.encounters.mireling.enemies[0].x, before.y - O1.encounters.mireling.enemies[0].y);
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

import { O1PresentationAdapter } from '../src/world/o1Adapter';
const pair = { seed: 3, opponent: 'mireling2' as const, level: 80, focus: 'balanced', doctrine: 'measured' as const };

test('when one enemy sees the adventurer its ally within the alert radius joins the same fight', () => {
  for (const opponent of ['mireling2', 'sentryMireling'] as const) {
    const c = new O1Controller(sim, { ...pair, opponent });
    c.dispatch();
    while (c.state === 'travelling') c.step();
    assert.equal(c.state, 'fighting');
    assert.equal(c.fight!.enemies.length, 2, `${opponent}: both enemies are in the fight`);
    assert.ok(c.foes.every(f => f.engaged), `${opponent}: both engaged`);
    assert.ok(c.notes.some(n => n.includes('ally joins')));
    c.fight!.enemies.forEach((e, i) => assert.ok(Math.hypot(e.x - O1.encounters[opponent].enemies[i].x, e.y - O1.encounters[opponent].enemies[i].y) < 1e-9, 'enemy starts at its spawn'));
    while (!c.terminal && c.tick < 30 * 300) c.step();
    assert.ok(['completed', 'defeated'].includes(c.state));
    assert.equal(c.fights, 1);
  }
});
test('an ally outside the alert radius stays out, then starts a second fight with the carried-over health', () => {
  const far = [{ ...O1.encounters.mireling2.enemies[0] }, { arch: 'mireling', x: 180, y: -60, facing: 'SW' as const }];
  const c = new O1Controller(sim, { ...pair, enemies: far });
  c.dispatch();
  while (c.state === 'travelling') c.step();
  assert.equal(c.fight!.enemies.length, 1, 'only the seer fights');
  assert.deepEqual(c.foes.map(f => f.engaged), [true, false]);
  while (c.state === 'fighting') c.step();
  assert.equal(c.state, 'travelling');
  const hpAfterFirst = c.hp;
  assert.deepEqual(c.foes.map(f => f.alive), [false, true], 'the far ally is untouched');
  while (c.state === 'travelling') c.step();
  assert.equal(c.state, 'fighting', 'the second enemy saw the adventurer later');
  assert.equal(c.fights, 2);
  assert.equal(c.fight!.p.hp, hpAfterFirst, 'health carries over');
  assert.equal(c.fight!.p.maxHp, c.hpMax);
  while (!c.terminal && c.tick < 30 * 300) c.step();
  const r = c.result();
  assert.equal(r.outcome, 'completed'); assert.equal(r.enemiesDefeated, 2); assert.equal(r.fights, 2);
});
test('a pair that cannot see the route is never fought', () => {
  const away = O1.encounters.mireling2.enemies.map(e => ({ ...e, x: 150 + (e.x > 100 ? 40 : 0), y: 150, facing: 'SE' as const }));
  const r = runO1(sim, { ...pair, enemies: away });
  assert.equal(r.outcome, 'completed'); assert.equal(r.fought, false); assert.equal(r.fights, 0); assert.equal(r.hpLeft, r.hpMax);
});
test('death in a pair fight stops travel and reports one fight', () => {
  const r = runO1(sim, { ...pair, opponent: 'sentryMireling', hpOverride: 1 });
  assert.equal(r.outcome, 'defeated'); assert.equal(r.fights, 1); assert.ok(r.finalPos.x < O1.threshold.x);
});
test('pair runs are deterministic', () => {
  assert.deepEqual(runO1(sim, { ...pair, seed: 9 }), runO1(sim, { ...pair, seed: 9 }));
});
test('the adapter reports every enemy and idles the ones outside the fight', () => {
  const far = [{ ...O1.encounters.mireling2.enemies[0] }, { arch: 'mireling', x: 180, y: -60, facing: 'SW' as const }];
  const c = new O1Controller(sim, { ...pair, enemies: far }), a = new O1PresentationAdapter(c);
  assert.equal(a.read().actors.length, 3);
  c.dispatch();
  while (c.state === 'travelling') c.step();
  const [, seer, bystander] = a.read().actors;
  assert.equal(seer.id, 'enemy0'); assert.equal(bystander.id, 'enemy1');
  assert.equal(bystander.action, 'idle'); assert.equal(bystander.visible, true);
  assert.equal(a.read().combat!.combatants.length, 2, 'combat detail covers only the fight in progress');
});
