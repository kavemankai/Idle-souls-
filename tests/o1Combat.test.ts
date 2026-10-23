import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadSim } from '../src/combat/loadSimNode';
import { O1Controller, type O1Config } from '../src/world/o1Controller';
import { O1PresentationAdapter } from '../src/world/o1Adapter';
import { describeStat } from '../src/world/o1Combat';
import { VisualSequence } from '../src/presentation/visualSequence';

const sim = loadSim();
const cfg = (over: Partial<O1Config> = {}): O1Config => ({ seed: 2, opponent: 'sentry', level: 80, focus: 'balanced', doctrine: 'measured', ...over });
const MOVES = (sim as unknown as { MOVES: Record<string, { range: number; arc: number }> }).MOVES;

test('combat detail equals the simulator tick by tick', () => {
  const c = new O1Controller(sim, cfg()), a = new O1PresentationAdapter(c);
  c.dispatch();
  let checked = 0, attacks = 0;
  while (!c.terminal && c.tick < 30 * 120) {
    c.step();
    const v = a.read().combat;
    if (!c.fight) { assert.equal(v, undefined, 'no combat detail before a fight'); continue; }
    const S = c.fight, [hero, enemy] = v!.combatants;
    assert.equal(hero.hp.value, Math.max(0, S.p.hp)); assert.equal(hero.hp.max, S.p.maxHp);
    assert.equal(hero.stamina.value, S.p.st); assert.equal(hero.poise.value, S.p.poise);
    assert.equal(enemy.hp.value, Math.max(0, S.enemies[0].hp)); assert.equal(enemy.stamina.max, S.enemies[0].maxSt);
    assert.equal(hero.invulnerable, S.p.iframe); assert.equal(hero.blocking, S.p.blocking); assert.equal(enemy.staggered, S.enemies[0].stagger > 0);
    const t = S.stats;
    assert.deepEqual([v!.totals.dealt, v!.totals.taken, v!.totals.blocks, v!.totals.dodges], [t.dealt, t.taken, t.blocks, t.dodges]);
    assert.equal(v!.mind.thought, S.ai.readout || ''); assert.equal(v!.events.length, S.events.length);
    assert.equal(v!.causes.reduce((n, x) => n + x.damage, 0), Object.values(t.dmgBy).reduce((n, x) => n + x, 0));
    const m = S.enemies[0].act;
    if (m && m.kind === 'attack') { attacks++; assert.equal(enemy.attack!.range, MOVES[m.id].range); assert.equal(enemy.attack!.arc, MOVES[m.id].arc); }
    else assert.equal(enemy.attack, null);
    checked++;
  }
  assert.ok(checked > 100 && attacks > 0, `checked ${checked} ticks, ${attacks} with an enemy attack`);
});
test('the adventurer attack arc uses its own effective move numbers', () => {
  const c = new O1Controller(sim, cfg({ seed: 3 })), a = new O1PresentationAdapter(c);
  c.dispatch();
  let seen = false;
  while (!c.terminal && c.tick < 30 * 120 && !seen) {
    c.step(); const m = c.fight?.p.act;
    if (m && m.kind === 'attack') { const hero = a.read().combat!.combatants[0]; assert.equal(hero.attack!.range, m.range); assert.equal(hero.attack!.arc, m.arc); seen = true; }
  }
  assert.ok(seen, 'the adventurer attacked');
});
test('reading the adapter never changes the run', () => {
  const run = (read: boolean) => {
    const c = new O1Controller(sim, cfg({ seed: 5, doctrine: 'guarded' })), a = new O1PresentationAdapter(c);
    c.dispatch();
    while (!c.terminal && c.tick < 30 * 300) { c.step(); if (read) a.read(); }
    return c.result();
  };
  assert.deepEqual(run(true), run(false));
});
test('the build block quotes the simulator numbers for all 18 stats', () => {
  const c = new O1Controller(sim, cfg()), b = new O1PresentationAdapter(c).read().build!;
  const stats = b.families.flatMap(f => f.stats);
  assert.equal(stats.length, 18);
  assert.equal(b.level, 80); assert.equal(b.doctrine, 'Measured'); assert.equal(b.health, sim.derive(c.stats, false).hp);
  assert.ok(stats.every(s => s.line.length > 0 && !s.line.includes('undefined') && !s.line.includes('NaN')));
  const d = sim.derive(c.stats, false);
  assert.equal(describeStat('vitality', d, sim.playerMoves(d), sim.HZ), `Health ${d.hp}`);
  assert.equal(c.fight, null, 'building the view does not start a fight');
});
test('the visual study never sets combat detail', () => {
  const s = new VisualSequence().read();
  assert.equal(s.combat, undefined); assert.equal(s.build, undefined); assert.equal(s.source, 'visual-only');
});
