import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadSim } from '../src/combat/loadSimNode';
import { ROOMS } from '../src/world/roomRegistry';
import { WorldGraph } from '../src/world/worldGraph';
import { defaultPlan, preflight, type ExpeditionPlan } from '../src/expedition/plan';
import { runExpedition, type ExpeditionConfig } from '../src/expedition/run';
import { addBanks, cloneBank, describeBank, emptyCarried, isEmptyBank, KILL_LOOT, Ledger, PICKUP_REACH } from '../src/expedition/loot';
import { settle } from '../src/expedition/settle';
import { defaultSave, STARTER_KIT, type Cache, type Save } from '../src/save/saveTypes';
import { MemoryStore, load, persist, parse, serialize, validateInvariants } from '../src/save/save';
import { simRoom } from '../src/world/o1Room';

const sim = loadSim();
const known = ['C0', 'O1', 'O2', 'O3', 'KT'];
const obj = (room: string, kind: 'reach' | 'survey' | 'recover' = 'reach') => ({ id: `${kind}-${room}`, kind, room });
const planOf = (objectives: ExpeditionPlan['objectives'], over: Partial<ExpeditionPlan> = {}): ExpeditionPlan => ({ ...defaultPlan(), retreatHpPct: 0, objectives, ...over });
const cfg = (save: Save, plan: ExpeditionPlan, seed: number, hpOverride?: number): ExpeditionConfig => ({ seed, level: 80, focus: 'balanced', plan, known, hpOverride, cache: save.camp.cache });
const run = (save: Save, plan: ExpeditionPlan, seed: number, hp?: number) => runExpedition(sim, cfg(save, plan, seed, hp)).chronicle;
function findSeed<T>(tryIt: (seed: number) => T | null): { seed: number; v: T } {
  for (let seed = 1; seed <= 60; seed++) { const v = tryIt(seed); if (v) return { seed, v }; }
  throw new Error('no seed matched');
}
const fresh = (): Save => defaultSave('test');
const cacheOf = (room: string, gold: number): Cache => ({ room, x: -50, y: 128, contents: { gold, supplies: { ration: 1 }, gear: [], mastery: 3, keys: 0, prepared: 0 } });

test('a kill pays once, a pickup is taken once, and the cache is carried like any find', () => {
  const l = new Ledger(cacheOf('O2', 40));
  assert.deepEqual(l.kill('mireling', 'O1', 0)!.bundle, { gold: KILL_LOOT.mireling.gold, supplies: {}, gear: [], mastery: KILL_LOOT.mireling.mastery, keys: 0, prepared: 0 });
  assert.equal(l.kill('mireling', 'O1', 0), null, 'the same enemy does not pay twice');
  assert.ok(l.kill('mireling', 'O1', 1), 'another enemy pays');
  const pk = ROOMS.O2.pickups![0];
  assert.ok(l.pickup('O2', pk)); assert.equal(l.pickup('O2', pk), null);
  assert.equal(l.carried.supplies.ration, 1);
  assert.ok(l.recoverCache()); assert.equal(l.recoverCache(), null);
  assert.equal(l.cache, null);
  assert.equal(l.carried.gold, KILL_LOOT.mireling.gold * 2 + 40);
  assert.match(describeBank(l.carried), /gold/);
  assert.equal(isEmptyBank(emptyCarried()), true);
  assert.deepEqual(addBanks(emptyCarried(), emptyCarried()), emptyCarried());
});

test('authored pickups lie on open floor, inside their rooms, and are not starter kit', () => {
  for (const m of Object.values(ROOMS)) for (const pk of m.pickups ?? []) {
    const R = sim.room.prepare(simRoom(m));
    assert.ok(sim.room.nearest(R, pk.x, pk.y).d >= 20, `${pk.id} is clear of solids`);
    assert.ok(pk.x > m.floor.x[0] && pk.x < m.floor.x[1] && pk.y > m.floor.y[0] && pk.y < m.floor.y[1], `${pk.id} is on the floor`);
    assert.ok(!STARTER_KIT.includes(pk.item));
    assert.ok(PICKUP_REACH > 0);
  }
});

test('a full Old Road walk carries the kills and finds, and extraction banks them exactly once', () => {
  const save = fresh();
  const c = run(save, planOf([obj('O3')]), 1, 5000);
  assert.equal(c.outcome, 'extracted');
  assert.equal(c.loot.carried.gold, 33); assert.equal(c.loot.carried.mastery, 11);
  assert.equal(c.loot.carried.supplies.ration, 1); assert.deepEqual(c.loot.carried.gear, ['cracked-buckler']);
  assert.equal(c.loot.gains.filter(g => g.source === 'kill').length, 4);
  assert.deepEqual(save.camp.bank, emptyCarried(), 'nothing is banked before settlement');
  const s = settle(save, c, save.camp.expeditions);
  assert.equal(s.applied, true);
  assert.deepEqual(s.save.camp.bank, c.loot.carried);
  assert.equal(s.save.camp.expeditions, 1); assert.equal(s.save.camp.deaths, 0);
  assert.ok(s.save.world.discovered.includes('O3'));
  assert.match(s.lines[0], /^Banked: 33 gold/);
  const again = settle(s.save, c, 0);
  assert.equal(again.applied, false); assert.match(again.refused!, /already settled/);
  assert.deepEqual(again.save, s.save, 'a second settlement changes nothing');
});

test('a death banks nothing and leaves the carried loot in one cache where the adventurer fell', () => {
  const save = fresh();
  const { seed, v: c } = findSeed(sd => { const x = run(save, planOf([obj('O3')]), sd, 45); return x.outcome === 'died' && !isEmptyBank(x.loot.carried) ? x : null; });
  const s = settle(save, c, 0);
  assert.equal(s.applied, true);
  assert.deepEqual(s.save.camp.bank, save.camp.bank, `seed ${seed}: bank untouched`);
  assert.deepEqual(s.save.camp.cache, { room: c.loot.deathSpot!.room, x: c.loot.deathSpot!.x, y: c.loot.deathSpot!.y, contents: c.loot.carried });
  assert.equal(s.save.camp.deaths, 1);
  const R = sim.room.prepare(simRoom(ROOMS[s.save.camp.cache!.room]));
  assert.ok(sim.room.nearest(R, s.save.camp.cache!.x, s.save.camp.cache!.y).d >= 13, 'the cache lies on open floor');
  assert.match(s.lines.join(' '), /never lost/);
  assert.deepEqual(validateInvariants(s.save), []);
});

test('a death carrying nothing leaves no ghost marker and does not disturb an earlier cache', () => {
  const save = fresh(); save.camp.cache = cacheOf('O2', 40);
  const { v: c } = findSeed(sd => { const x = run(save, planOf([obj('O3')]), sd, 3); return x.outcome === 'died' && isEmptyBank(x.loot.carried) ? x : null; });
  const s = settle(save, c, 0);
  assert.deepEqual(s.save.camp.cache, save.camp.cache);
  assert.match(s.lines[0], /earlier cache is untouched/);
  const none = fresh();
  assert.equal(settle(none, c, 0).save.camp.cache, null);
});

test('only one cache exists: a new death before recovery replaces the old one, and what it held is lost for good', () => {
  const save = fresh(); save.camp.cache = cacheOf('O1', 70);
  const { v: c } = findSeed(sd => { const x = run(save, planOf([obj('O3')]), sd, 45); return x.outcome === 'died' && !isEmptyBank(x.loot.carried) && !x.loot.cacheRecovered ? x : null; });
  const s = settle(save, c, 0);
  assert.equal(s.save.camp.cache!.contents.gold, c.loot.carried.gold, 'the new cache holds only what was just carried');
  assert.equal(s.lost.gold, 70);
  assert.match(s.lines.join(' '), /replaced.*Lost for good/);
});

test('recovering the cache and getting home secures it once; dying again after the pickup carries it forward without duplicating it', () => {
  const save = fresh(); save.camp.cache = cacheOf('O1', 50); save.camp.cache.x = -100; save.camp.cache.y = 0;
  const recover = planOf([obj('O1', 'recover')]);
  assert.equal(preflight(recover, new WorldGraph(), new Set(known), 'C0', save.camp.cache).status, 'confirmed');
  assert.equal(preflight(recover, new WorldGraph(), new Set(known), 'C0', null).status, 'blocked');
  const home = run(save, recover, 2, 5000);
  assert.equal(home.outcome, 'extracted');
  assert.equal(home.loot.cacheRecovered, true);
  assert.equal(home.objectives[0].status, 'completed');
  assert.ok(home.intent.some(i => i.kind === 'loot' && /Recovered the cache/.test(i.text)));
  const s = settle(save, home, 0);
  assert.equal(s.save.camp.cache, null);
  assert.ok(home.loot.carried.gold >= 50);
  assert.equal(s.save.camp.bank.gold, home.loot.carried.gold, 'the cache gold is in the bank, and only once');
  assert.equal(s.save.camp.bank.supplies.ration, 1, 'the cache ration is banked once');
  // Pick it up, then die further out: the new cache holds the old contents once.
  const { v: dead } = findSeed(sd => { const x = run(save, planOf([obj('O1', 'recover'), obj('O3')]), sd, 30); return x.outcome === 'died' && x.loot.cacheRecovered ? x : null; });
  const t = settle(save, dead, 0);
  assert.equal(t.save.camp.bank.gold, 0);
  assert.ok(t.save.camp.cache!.contents.gold >= 50, 'the recovered gold travels in the new cache');
  assert.equal(t.save.camp.cache!.contents.gold, dead.loot.carried.gold);
  assert.equal(isEmptyBank(t.lost), true, 'the picked-up cache is not counted as lost');
});

test('an expedition that is not over (extraction blocked) is not settled: nothing is banked or lost', () => {
  const save = fresh();
  const c = { ...run(save, planOf([obj('O3')]), 1, 5000), outcome: 'blocked' as const };
  const s = settle(save, c, 0);
  assert.equal(s.applied, false); assert.deepEqual(s.save, save);
  assert.match(s.refused!, /not over/);
});

test('a boss defeated before a death stays defeated, and the death still leaves a cache', () => {
  const save = fresh();
  const { v: c } = findSeed(sd => { const x = run(save, planOf([obj('O3')]), sd, 45); return x.outcome === 'died' && !isEmptyBank(x.loot.carried) ? x : null; });
  const s = settle(save, { ...c, bossesDefeated: ['castellan'] }, 0);
  assert.deepEqual(s.save.world.defeatedBosses, ['castellan']);
  assert.ok(s.save.camp.cache);
  assert.deepEqual(s.save.camp.bank, save.camp.bank, 'a boss kill banks nothing');
});

test('starter kit never enters a bank or a cache, and a broken save is refused', () => {
  const save = fresh();
  const c = run(save, planOf([obj('O3')]), 1, 5000);
  assert.throws(() => settle(save, { ...c, loot: { ...c.loot, carried: { ...c.loot.carried, gear: ['starter-sword'] } } }, 0), /starter kit/);
  const bad = fresh(); bad.camp.cache = { room: 'O1', x: 0, y: 0, contents: emptyCarried() };
  assert.match(validateInvariants(bad).join(' '), /empty cache/);
  const neg = fresh(); neg.camp.deaths = 3;
  assert.match(validateInvariants(neg).join(' '), /more deaths/);
  assert.throws(() => persist(new MemoryStore(), bad), /broken state/);
});

test('a settled save survives export, reload and a second expedition without drifting', () => {
  const store = new MemoryStore();
  let save = load(store).save;
  for (let i = 0; i < 3; i++) {
    const c = run(save, planOf([obj('O3')]), 10 + i, i === 1 ? 45 : 5000);
    const s = settle(save, c, save.camp.expeditions);
    assert.equal(s.applied, true);
    save = s.save; persist(store, save);
    save = load(store).save;
  }
  assert.equal(save.camp.expeditions, 3);
  const text = serialize(save), back = parse(text);
  assert.ok(back.ok); assert.deepEqual(back.ok && back.save, save);
  assert.deepEqual(validateInvariants(save), []);
  const total = addBanks(save.camp.bank, save.camp.cache ? save.camp.cache.contents : emptyCarried());
  assert.ok(total.gold > 0);
  assert.deepEqual(cloneBank(save.camp.bank), save.camp.bank);
});
