import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadSim } from '../src/combat/loadSimNode';
import { defaultPlan } from '../src/expedition/plan';
import { runExpedition, startExpedition, type ExpeditionConfig } from '../src/expedition/run';
import { checkpoint } from '../src/expedition/replayCheckpoint';
import { defaultSave } from '../src/save/save';
import { TestDurableRepository, upgradeToV3 } from '../src/save/durable';
import { commitDiscard, commitDispatch, commitSettlement } from '../src/save/durableSettlement';
import { commitPurchase, permanentStartingLevel } from '../src/progression/permanent';

const sim = loadSim();

/**
 * Closed-loop E2E economic test: no inserted bank values, cheats, debug
 * HP/levels, or modified simulator results. Each resource is awarded by a
 * real encounter, returned to camp, and atomically settled. The fixed seeds
 * are a reproducible sample, NOT hand-picked victorious runs.
 */
test('a fresh character can earn and bank mastery through real expeditions, then pay for permanent training', async () => {
  const repo = new TestDurableRepository(upgradeToV3(defaultSave('fresh-campaign')));
  let extracted = 0, deaths = 0, stopped = 0, attempts = 0;
  for (const seed of Array.from({ length: 24 }, (_, i) => i + 1)) {
    const before = await repo.load();
    assert.ok(before.ok);
    if (before.save.camp.bank.mastery >= 8) break;
    attempts++;
    const c: ExpeditionConfig = {
      seed, level: 1, focus: 'balanced',
      progression: { startLevel: permanentStartingLevel(before.save) },
      known: before.save.world.discovered,
      cache: before.save.camp.cache,
      claims: before.save.world.claims, openLinks: before.save.world.openedLinks,
      defeatedBosses: before.save.world.defeatedBosses,
      plan: { ...defaultPlan(), doctrine: 'guarded', objectives: [{ id: 'outer-road', kind: 'survey', room: 'O1' }] },
    };
    const id = 'organic:' + seed;
    const run = startExpedition(sim, c);
    const dispatch = await commitDispatch(repo, before.save.revision, checkpoint(id, c, run, []));
    assert.ok(dispatch.ok, JSON.stringify(dispatch));
    const chronicle = runExpedition(sim, c, 30000).chronicle;
    if (chronicle.outcome === 'blocked' || chronicle.outcome === 'stopped') {
      stopped++;
      const discard = await commitDiscard(repo, dispatch.save.revision, id);
      assert.ok(discard.ok);
      continue;
    }
    if (chronicle.outcome === 'extracted') extracted++; else deaths++;
    const settlement = await commitSettlement(repo, dispatch.save.revision, id, chronicle, before.save.camp.expeditions);
    assert.ok(settlement.ok, JSON.stringify(settlement));
  }
  const beforePurchase = await repo.load(); assert.ok(beforePurchase.ok);
  const earned = beforePurchase.save.camp.bank.mastery;
  assert.ok(earned >= 8, 'Organic 24-seed sample could not afford training: ' + JSON.stringify({ attempts, extracted, deaths, stopped, earned }));
  const paid = await commitPurchase(repo, beforePurchase.save.revision, { upgradeId: 'training', expectedRank: 0 }, 'organic:purchase:training');
  assert.ok(paid.ok, JSON.stringify(paid));
  assert.equal(paid.save.camp.bank.mastery, earned - 8);
  assert.equal(paid.save.camp.permanent.training, 1);
  assert.equal(permanentStartingLevel(paid.save), 2);
});
