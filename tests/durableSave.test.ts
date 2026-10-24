import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadSim } from '../src/combat/loadSimNode';
import { defaultPlan } from '../src/expedition/plan';
import { finishChronicle, runExpedition, startExpedition, type ExpeditionConfig } from '../src/expedition/run';
import { ExpeditionCommandJournal, checkpoint, continuationFingerprint, restoreExpedition } from '../src/expedition/replayCheckpoint';
import { defaultSave, wrap } from '../src/save/save';
import { commitCheckpoint, commitDispatch, commitSettlement } from '../src/save/durableSettlement';
import {
  parseDurable, serializeDurable, TestDurableRepository, upgradeToV3, validateV3,
} from '../src/save/durable';

const sim = loadSim();
const config = (seed = 4): ExpeditionConfig => ({
  seed, level: 80, focus: 'balanced', hpOverride: 5000,
  plan: { ...defaultPlan(), objectives: [{ id: 'road', kind: 'reach', room: 'O3' }] },
  known: ['C0', 'O1', 'O2', 'O3', 'KT'], progression: { startLevel: 1 },
});
test('V3 accepts a round-trip, migrates legacy, retains bank/cache/world/settings and refuses malformed nesting', () => {
  const v2 = defaultSave('migration');
  v2.camp.bank.gold = 40; v2.camp.bank.mastery = 7; v2.camp.bank.keys = 2;
  v2.world.discovered.push('O1'); v2.world.defeatedBosses.push('warden');
  v2.settings.music = 0.2;
  const upgraded = upgradeToV3(v2);
  const original = serializeDurable(upgraded);
  const again = parseDurable(original);
  assert.ok(again.ok); assert.deepEqual(again.save, upgraded); assert.equal(again.migratedFrom, null);
  const migration = parseDurable(wrap(v2));
  assert.ok(migration.ok, JSON.stringify(migration)); assert.equal(migration.migratedFrom, 2);
  assert.equal(migration.save.camp.bank.gold, 40);
  assert.equal(migration.save.camp.bank.mastery, 7);
  assert.equal(migration.save.camp.bank.keys, 2);
  assert.deepEqual(migration.save.world.defeatedBosses, ['warden']);
  assert.equal(migration.save.settings.music, 0.2);
  assert.deepEqual(migration.save.camp.permanent, { training: 0, weapon: 0, shield: 0 });
  const v0 = parseDurable(wrap({ version: 0, build: 'sketch', gold: 12, discovered: ['C0', 'O1'] }));
  assert.ok(v0.ok); assert.equal(v0.save.camp.bank.gold, 12);
  const v1 = parseDurable(wrap({
    version: 1, build: 'old',
    world: { discovered: ['C0', 'O1'], openedLinks: [], defeatedBosses: [], keysBanked: 2 },
    camp: { bank: { gold: 10, supplies: {}, gear: [], mastery: 4 }, cache: null, expeditions: 1, deaths: 0 },
    settings: { music: 0.5, effects: 0.8, reducedFx: false },
  }));
  assert.ok(v1.ok); assert.equal(v1.save.camp.bank.keys, 2);
  for (const bad of [
    { ...upgraded, world: [] },
    { ...upgraded, camp: null },
    { ...upgraded, camp: { ...upgraded.camp, bank: { ...upgraded.camp.bank, gold: NaN } } },
    { ...upgraded, camp: { ...upgraded.camp, permanent: { ...upgraded.camp.permanent, weapon: 300 } } },
    { ...upgraded, world: { ...upgraded.world, discovered: ['C0', 'not-a-room'] } },
    { ...upgraded, processedTransactionIds: ['duplicate', 'duplicate'] },
  ]) assert.ok(validateV3(bad).length, JSON.stringify(bad));
  assert.equal(parseDurable(original.slice(0, -12)).ok, false);
});

test('durable revisions reject stale writers and do not acknowledge interrupted writes', async () => {
  const repo = new TestDurableRepository(upgradeToV3(defaultSave()));
  const initial = await repo.load(); assert.ok(initial.ok);
  repo.failNextCommit = true;
  const failed = await repo.commit(0, 'gold:1', s => ({ ...s, camp: { ...s.camp, bank: { ...s.camp.bank, gold: 10 } } }));
  assert.ok(!failed.ok);
  const afterFailure = await repo.load(); assert.ok(afterFailure.ok); assert.equal(afterFailure.save.camp.bank.gold, 0);
  const success = await repo.commit(0, 'gold:1', s => ({ ...s, camp: { ...s.camp, bank: { ...s.camp.bank, gold: 10 } } }));
  assert.ok(success.ok && !success.duplicate);
  const repeat = await repo.commit(0, 'gold:1', s => ({ ...s, camp: { ...s.camp, bank: { ...s.camp.bank, gold: 999 } } }));
  assert.ok(repeat.ok && repeat.duplicate);
  const stale = await repo.commit(0, 'gold:2', s => s);
  assert.ok(!stale.ok && stale.conflict);
  const final = await repo.load(); assert.ok(final.ok); assert.equal(final.save.camp.bank.gold, 10);
  const backup = await repo.readBackup(); assert.ok(backup);
  const parsed = parseDurable(backup); assert.ok(parsed.ok); assert.equal(parsed.save.camp.bank.gold, 0);
});
test('a journal restores the exact running mid-fight state and later Chronicle, without modifying the simulator', () => {
  const cfg = config(7);
  const a = startExpedition(sim, cfg);
  const journal = new ExpeditionCommandJournal(a);
  for (let i = 0; i < 50000 && !(a.world.runner?.state === 'fighting' && (a.world.runner.fight?.tick ?? 0) >= 10); i++) a.world.step();
  assert.equal(a.world.runner?.state, 'fighting', 'test must really checkpoint during combat');
  const before = continuationFingerprint(a);
  const snap = checkpoint('combat7', cfg, a, journal.commands);
  const b = restoreExpedition(sim, snap);
  assert.equal(continuationFingerprint(b), before);
  assert.deepEqual(b.world.runner?.fight, a.world.runner?.fight);
  // Same future sequence from the identical save tick.
  while (!a.world.terminal && a.world.tick < 50000) a.world.step();
  while (!b.world.terminal && b.world.tick < 50000) b.world.step();
  assert.deepEqual(finishChronicle(cfg, b), finishChronicle(cfg, a));
  assert.deepEqual(b.world.result(), a.world.result());
});
test('an order entered at the saved tick replays before the next tick', () => {
  const cfg = config(3);
  const a = startExpedition(sim, cfg);
  for (let i = 0; i < 100; i++) a.world.step();
  const journal = new ExpeditionCommandJournal(a);
  assert.equal(journal.order({ type: 'retreat' }), null);
  const snap = checkpoint('retreat3', cfg, a, journal.commands);
  const b = restoreExpedition(sim, snap);
  assert.deepEqual(b.expedition.pendingOrders, a.expedition.pendingOrders);
  for (let i = 0; i < 200 && !a.world.terminal; i++) a.world.step();
  for (let i = 0; i < 200 && !b.world.terminal; i++) b.world.step();
  assert.equal(continuationFingerprint(a), continuationFingerprint(b));
});
test('dispatch, checkpoint and settlement each commit exactly once with immutable identity', async () => {
  const cfg = config(13);
  const started = startExpedition(sim, cfg);
  const saved = upgradeToV3(defaultSave());
  const repo = new TestDurableRepository(saved);
  const dispatch = await commitDispatch(repo, 0, checkpoint('run13', cfg, started, []));
  assert.ok(dispatch.ok);
  const tick0 = await repo.load(); assert.ok(tick0.ok);
  for (let i = 0; i < 50; i++) started.world.step();
  const savedTick = checkpoint('run13', cfg, started, []);
  const updated = await commitCheckpoint(repo, tick0.save.revision, savedTick);
  assert.ok(updated.ok);
  const duplicateCheckpoint = await commitCheckpoint(repo, tick0.save.revision, savedTick);
  assert.ok(duplicateCheckpoint.ok && duplicateCheckpoint.duplicate);
  const settled = runExpedition(sim, cfg).chronicle;
  const active = await repo.load(); assert.ok(active.ok);
  const done = await commitSettlement(repo, active.save.revision, 'run13', settled, 0);
  assert.ok(done.ok, JSON.stringify(done));
  const again = await commitSettlement(repo, active.save.revision, 'run13', settled, 0);
  assert.ok(again.ok && again.duplicate);
  const end = await repo.load(); assert.ok(end.ok);
  assert.equal(end.save.camp.expeditions, 1);
  assert.equal(end.save.activeExpedition, null);
  assert.equal(end.save.camp.bank.gold, done.save.camp.bank.gold);
  const attack = await commitSettlement(repo, end.save.revision, 'run13', settled, 1);
  assert.ok(attack.ok && attack.duplicate);
});
