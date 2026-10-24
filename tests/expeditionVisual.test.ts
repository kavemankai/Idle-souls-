import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadSim } from '../src/combat/loadSimNode';
import { defaultPlan } from '../src/expedition/plan';
import { startExpedition, finishChronicle, type ExpeditionConfig } from '../src/expedition/run';
import { readExpeditionVisual } from '../src/presentation/expeditionVisual';

const sim = loadSim();
const config: ExpeditionConfig = {
  seed: 7, level: 80, focus: 'balanced', hpOverride: 5000,
  known: ['C0', 'O1', 'O2', 'O3', 'KT'],
  plan: { ...defaultPlan(), objectives: [{ id: 'first', kind: 'survey', room: 'O1' }] },
  progression: { startLevel: 1 },
};

test('visual adapter reads REAL room fighters and never changes expedition outcome', () => {
  const visible = startExpedition(sim, config);
  const reference = startExpedition(sim, config);
  let observedCombat = false, observedMovement = false;
  for (let n = 0; n < 20000 && !visible.world.terminal; n++) {
    visible.world.step();
    reference.world.step();
    const w = visible.world;
    const before = { tick: w.tick, digest: w.digest, hp: w.hp, state: w.state,
      fighting: w.runner?.fight?.tick ?? null, bank: JSON.stringify(w.ledger.carried) };
    const snapshot = readExpeditionVisual(w);
    assert.equal(snapshot.tick, w.tick);
    assert.equal(snapshot.room, w.room);
    assert.equal(snapshot.actors[0].archetype, 'adventurer');
    assert.equal(snapshot.actors[0].illustrated, true);
    assert.equal(snapshot.actors[0].x, w.pos.x, 'hero must use the continuous world runner x');
    assert.equal(snapshot.actors[0].y, w.pos.y, 'hero must use the continuous world runner y');
    assert.ok(snapshot.heroStatus.startsWith('• '), 'read-only short action label exists');
    if (snapshot.actors[0].action === 'walk') observedMovement = true;
    if (snapshot.fighting && w.runner?.fight) {
      observedCombat = true;
      assert.equal(snapshot.combat?.combatants[0].hp.value, w.runner.fight.p.hp);
      assert.equal(snapshot.actors[0].x, w.pos.x);
      assert.equal(snapshot.actors[0].y, w.pos.y);
      assert.equal(snapshot.actors.length, w.runner.foes.length + 1);
      for (let i = 0; i < w.runner.foes.length; i++) {
        const fighter = w.runner.fighterOf(i);
        if (fighter) {
          assert.equal(snapshot.actors[i + 1].x, fighter.x + w.runner.cfg.room.plan!.center.x);
          assert.equal(snapshot.actors[i + 1].y, fighter.y + w.runner.cfg.room.plan!.center.y);
        }
      }
    }
    assert.deepEqual({ tick: w.tick, digest: w.digest, hp: w.hp, state: w.state,
      fighting: w.runner?.fight?.tick ?? null, bank: JSON.stringify(w.ledger.carried) }, before);
  }
  assert.ok(observedMovement, 'visible walking must use the authoritative runner');
  assert.ok(observedCombat, 'the chosen seeded run must reach real combat');
  assert.deepEqual(finishChronicle(config, visible), finishChronicle(config, reference),
    'reading animated poses must not affect seeded outcome, loot, RNG or Chronicle');
});
