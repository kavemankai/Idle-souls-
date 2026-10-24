import { test } from 'node:test';
import assert from 'node:assert/strict';
import { defaultSave } from '../src/save/save';
import { TestDurableRepository, upgradeToV3 } from '../src/save/durable';
import { commitPurchase, permanentStartingLevel, permanentStatBonus, purchaseUpgrade, PERMANENT_UPGRADES } from '../src/progression/permanent';
import { defaultPlan } from '../src/expedition/plan';
import { runExpedition, startExpedition, type ExpeditionConfig } from '../src/expedition/run';
import { loadSim } from '../src/combat/loadSimNode';
import { checkpoint } from '../src/expedition/replayCheckpoint';

const sim = loadSim();
const base = () => upgradeToV3(defaultSave('earned-upgrade-test'));
const cfg = (seed = 2): ExpeditionConfig => ({
  seed, focus: 'balanced', level: 1,
  known: ['C0', 'O1'],
  progression: { startLevel: 1 },
  plan: { ...defaultPlan(), doctrine: 'guarded', objectives: [{ id: 'outer', room: 'O1', kind: 'survey' }] },
});
test('fresh saves contain no free ranks, power or paid resources', () => {
  const first = base();
  assert.deepEqual(first.camp.permanent, { training: 0, weapon: 0, shield: 0 });
  assert.equal(permanentStartingLevel(first), 1);
  assert.deepEqual(permanentStatBonus(first), { swingSkill: 0, guardStrength: 0 });
  assert.equal(first.camp.bank.gold, 0); assert.equal(first.camp.bank.mastery, 0);
  for (const offer of PERMANENT_UPGRADES) {
    const denied = purchaseUpgrade(first, { upgradeId: offer.id, expectedRank: 0 }, 'unearned:' + offer.id);
    assert.equal(denied.ok, false);
  }
});
test('mastery trains exactly one design level per paid rank, with a cap of level 4', () => {
  let save = base();
  save.camp.bank.mastery = 68; // Explicit isolated domain-test bank fixture; NOT fresh campaign evidence.
  for (const [rank, cost] of [8, 20, 40].entries()) {
    const paid = purchaseUpgrade(save, { upgradeId: 'training', expectedRank: rank }, 'train:' + rank);
    assert.ok(paid.ok, JSON.stringify(paid));
    assert.equal(paid.price.mastery, cost);
    save = paid.save;
    assert.equal(permanentStartingLevel(save), rank + 2);
  }
  assert.equal(save.camp.bank.mastery, 0);
  assert.equal(purchaseUpgrade(save, { upgradeId: 'training', expectedRank: 3 }, 'train:max').ok, false);
  assert.equal(purchaseUpgrade(save, { upgradeId: 'training', expectedRank: 0 }, 'train:stale').ok, false);
});
test('weapon and shield use gold AND mastery, never exceed rank or stat caps', () => {
  let save = base();
  save.camp.bank.gold = 130; save.camp.bank.mastery = 28;
  for (const id of ['weapon', 'shield'] as const) {
    for (let rank = 0; rank < 2; rank++) {
      const paid = purchaseUpgrade(save, { upgradeId: id, expectedRank: rank }, 'equip:' + id + ':' + rank);
      assert.ok(paid.ok);
      save = paid.save;
    }
    assert.equal(purchaseUpgrade(save, { upgradeId: id, expectedRank: 2 }, 'equip:cap:' + id).ok, false);
  }
  assert.equal(save.camp.bank.gold, 0); assert.equal(save.camp.bank.mastery, 0);
  assert.deepEqual(permanentStatBonus(save), { swingSkill: 4, guardStrength: 4 });
});
test('a failed purchase write grants nothing, same transaction ID cannot charge twice on retry', async () => {
  const starting = base(); starting.camp.bank.mastery = 8;
  const repo = new TestDurableRepository(starting);
  repo.failNextCommit = true;
  const failed = await commitPurchase(repo, 0, { upgradeId: 'training', expectedRank: 0 }, 'purchase:p1');
  assert.equal(failed.ok, false);
  const afterFail = await repo.load(); assert.ok(afterFail.ok); assert.equal(afterFail.save.camp.bank.mastery, 8);
  const passed = await commitPurchase(repo, 0, { upgradeId: 'training', expectedRank: 0 }, 'purchase:p1');
  assert.ok(passed.ok && !passed.duplicate);
  const retry = await commitPurchase(repo, 0, { upgradeId: 'training', expectedRank: 0 }, 'purchase:p1');
  assert.ok(retry.ok && retry.duplicate);
  const stored = await repo.load(); assert.ok(stored.ok);
  assert.equal(stored.save.camp.bank.mastery, 0); assert.equal(stored.save.camp.permanent.training, 1);
  assert.equal((await commitPurchase(repo, 0, { upgradeId: 'training', expectedRank: 1 }, 'purchase:p2')).ok, false);
});
test('an active expedition freezes earned power and refuses camp spending', () => {
  const save = base(); save.camp.bank.mastery = 8;
  const config = cfg(3), run = startExpedition(sim, config);
  save.activeExpedition = checkpoint('active3', config, run, []);
  const attempt = purchaseUpgrade(save, { upgradeId: 'training', expectedRank: 0 }, 'purchase:midrun');
  assert.equal(attempt.ok, false);
  assert.equal(save.camp.permanent.training, 0);
  assert.equal(run.world.levelNow, 1 === config.progression!.startLevel ? run.world.levelNow : -1);
});
test('earned stats are reflected in the next simulator-backed expedition, not existing baseline runs', () => {
  const starting = base(), config = cfg(5);
  const original = runExpedition(sim, config).chronicle;
  assert.deepEqual(runExpedition(sim, config).chronicle, original, 'baseline is still deterministic');
  starting.camp.bank.mastery = 8; starting.camp.bank.gold = 20;
  const a = purchaseUpgrade(starting, { upgradeId: 'training', expectedRank: 0 }, 'power:training');
  assert.ok(a.ok);
  const b = purchaseUpgrade(a.save, { upgradeId: 'weapon', expectedRank: 0 }, 'power:weapon');
  assert.ok(b.ok);
  const improved: ExpeditionConfig = {
    ...config, progression: { startLevel: permanentStartingLevel(b.save) },
    permanentBonus: permanentStatBonus(b.save),
  };
  const first = startExpedition(sim, config), next = startExpedition(sim, improved);
  assert.equal(next.world.progress?.startLevel, 2);
  assert.equal(first.world.progress?.startLevel, 1);
  assert.equal(next.world.runner!.stats.swingSkill >= first.world.runner!.stats.swingSkill, true);
  // Critically, the unmodified configuration still gives its original outcome.
  assert.deepEqual(runExpedition(sim, config).chronicle, original);
});
