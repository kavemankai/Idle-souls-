import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadSim } from '../src/combat/loadSimNode';
import { WorldGraph } from '../src/world/worldGraph';
import { gates } from '../src/world/gates';
import { planRooms } from '../src/expedition/planner';
import { defaultPlan, frontierRooms, preflight, type ExpeditionPlan, type Objective } from '../src/expedition/plan';
import { runExpedition, type ExpeditionConfig } from '../src/expedition/run';
import { settle } from '../src/expedition/settle';
import { defaultSave, type Save } from '../src/save/saveTypes';
import { parse, serialize, validateInvariants } from '../src/save/save';
import type { Chronicle } from '../src/expedition/chronicle';

const sim = loadSim();
const graph = new WorldGraph();
const ALL = [...graph.rooms.keys()];
const MB_GATE = WorldGraph.linkKey('T2', 'MB'), SLUICE = WorldGraph.linkKey('S3', 'C0');
const obj = (room: string, kind: Objective['kind'] = 'reach', to?: string, id = `${kind}-${room}${to ? `-${to}` : ''}`): Objective => ({ id, kind, room, ...(to ? { to } : {}) });
const planOf = (objectives: Objective[], over: Partial<ExpeditionPlan> = {}): ExpeditionPlan => ({ ...defaultPlan(), retreatHpPct: 0, objectives, ...over });
const fresh = (): Save => defaultSave('test');
const withKeys = (n: number): Save => { const s = fresh(); s.camp.bank.keys = n; return s; };
function run(save: Save, plan: ExpeditionPlan, o: { seed?: number; hp?: number; known?: string[]; issue?: number } = {}): Chronicle {
  const cfg: ExpeditionConfig = { seed: o.seed ?? 1, level: 80, focus: 'balanced', plan, known: o.known ?? ALL, hpOverride: o.hp ?? 5000, cache: save.camp.cache, issueKeys: o.issue ?? 0, claims: save.world.claims, openLinks: save.world.openedLinks };
  return runExpedition(sim, cfg).chronicle;
}
const done = (save: Save, c: Chronicle) => { const s = settle(save, c, save.camp.expeditions); assert.ok(s.applied, s.refused ?? ''); return s; };

test('a gate is unseen until a neighbouring room has been entered, sealed once seen, and open for good after it is worked', () => {
  const g = (disc: string[], open: string[] = []) => gates(graph, new Set(disc), new Set(open)).find(x => x.key === MB_GATE)!;
  assert.equal(g(['C0', 'O1']).state, 'unseen');
  assert.equal(g(['C0', 'T2']).state, 'sealed');
  assert.equal(g(['C0', 'T2'], [MB_GATE]).state, 'open');
  assert.equal(g(['C0', 'T2']).need, 'key');
  assert.equal(gates(graph, new Set(['S3']), new Set()).find(x => x.key === SLUICE)!.need, 'activation');
  assert.equal(gates(graph, new Set(['MB']), new Set()).find(x => x.type === 'post_miniboss_shortcut')!.need, 'boss');
});

test('closed gates are walls for the planner and open ones are doors; fog does not show a room behind a sealed gate', () => {
  const known = new Set(ALL.filter(r => r !== 'MB'));
  assert.equal(planRooms({ graph, known: new Set(ALL), from: 'C0', to: 'MB', avoid: new Set(), style: 'shortest' }), null);
  const open = planRooms({ graph, known: new Set(ALL), from: 'C0', to: 'MB', avoid: new Set(), style: 'shortest', open: new Set([MB_GATE]) })!;
  assert.deepEqual(open.rooms.slice(-2), ['T2', 'MB']);
  assert.ok(!frontierRooms(graph, new Set(['C0', 'O1', 'O2', 'T1', 'T2'])).includes('MB'), 'MB is not offered while the gate is sealed');
  assert.ok(frontierRooms(graph, known, new Set([MB_GATE])).includes('MB'), 'MB is offered once the gate is open');
});

test('the Key Trial pays one fresh key per expedition, and it is not first-use eligible until banked (L18, L19)', () => {
  const save = fresh();
  const c = run(save, planOf([obj('KT')]), { known: ['C0', 'O1', 'O2', 'O3', 'KT'] });
  assert.equal(c.outcome, 'extracted');
  assert.equal(c.loot.carried.keys, 1); assert.equal(c.loot.carried.prepared, 0);
  assert.deepEqual(c.loot.claimed, [], 'a trial is not a one-time claim');
  const s = done(save, c);
  assert.equal(s.save.camp.bank.keys, 1);
  const again = run(s.save, planOf([obj('KT')]), { known: ['C0', 'O1', 'O2', 'O3', 'KT'] });
  assert.equal(again.loot.carried.keys, 1, 'the trial can be repeated on a later expedition');
  assert.equal(done(s.save, again).save.camp.bank.keys, 2);
});

test('a key found on the same run cannot open a gate; the objective is skipped with the reason', () => {
  const save = fresh();
  const c = run(save, planOf([obj('KT'), obj('T2', 'open', 'MB')]));
  const open = c.objectives.find(o => o.kind === 'open')!;
  assert.equal(open.status, 'skipped_blocked');
  assert.match(open.note, /cannot open a gate until it has been banked/);
  assert.equal(c.loot.opened.length, 0);
  assert.ok(c.intent.some(i => i.kind === 'skip' && i.cause.startsWith('L14')));
});

test('an issued key opens the gate once, for good, without a fight and without entering the room beyond', () => {
  const save = withKeys(1);
  const c = run(save, planOf([obj('T2', 'open', 'MB')]), { issue: 1 });
  assert.equal(c.outcome, 'extracted');
  assert.deepEqual(c.loot.opened, [MB_GATE]);
  assert.equal(c.loot.spent, 1); assert.equal(c.loot.carried.prepared, 0);
  assert.ok(!c.route.includes('MB'), 'opening is not entering');
  assert.equal(c.objectives[0].status, 'completed');
  assert.ok(c.intent.some(i => /Spent 1 Gate Key/.test(i.text)));
  const s = done(save, c);
  assert.deepEqual(s.save.world.openedLinks, [MB_GATE]);
  assert.equal(s.save.camp.bank.keys, 0, 'the issued key left the bank and was spent');
  assert.equal(s.save.camp.cache, null);
  assert.deepEqual(validateInvariants(s.save), []);
});

test('an unspent issued key returns to the bank on extraction, and a gate already open costs nothing', () => {
  const save = withKeys(2);
  const c = run(save, planOf([obj('T2', 'open', 'MB')]), { issue: 2 });
  assert.equal(c.loot.spent, 1); assert.equal(c.loot.carried.prepared, 1);
  const s = done(save, c);
  assert.equal(s.save.camp.bank.keys, 1, 'two issued, one spent, one back');
  const again = run(s.save, planOf([obj('T2', 'open', 'MB')]), { issue: 1 });
  assert.equal(again.loot.spent, 0);
  assert.match(again.objectives[0].note, /Open for good/);
  assert.equal(done(s.save, again).save.camp.bank.keys, 1);
});

test('no issued key means no unlock, and issuing more than the bank holds is refused', () => {
  const save = withKeys(1);
  const c = run(save, planOf([obj('T2', 'open', 'MB')]), { issue: 0 });
  assert.equal(c.objectives[0].status, 'skipped_blocked');
  assert.match(c.objectives[0].note, /No Gate Key was issued/);
  const greedy = run(save, planOf([obj('T2', 'open', 'MB')]), { issue: 2 });
  const s = settle(save, greedy, 0);
  assert.equal(s.applied, false); assert.match(s.refused!, /issued than the camp holds/);
});

test('a fall after the unlock keeps the gate open, never puts the spent key in the cache, and keeps the unspent one eligible', () => {
  const save = withKeys(2);
  const c = run(save, planOf([obj('T2', 'open', 'MB')]), { issue: 2 });
  const died: Chronicle = { ...c, outcome: 'died', loot: { ...c.loot, deathSpot: { room: 'T2', x: 0, y: 0 } } };
  const s = done(save, died);
  assert.deepEqual(s.save.world.openedLinks, [MB_GATE]);
  assert.equal(s.save.camp.bank.keys, 0, 'nothing was banked');
  assert.equal(s.save.camp.cache!.contents.prepared, 1, 'the unspent issued key is in the cache, still eligible');
  assert.equal(s.save.camp.cache!.contents.keys, 0);
  const next = run(s.save, planOf([obj('T2', 'open', 'MB')]), { issue: 0 });
  assert.match(next.objectives[0].note, /Open for good/, 'the open gate persisted across the fall');
});

test('the one-time discovery key is claimed for good, even if it was dropped, and never pays twice', () => {
  const save = fresh();
  const c = run(save, planOf([obj('T3')]));
  assert.equal(c.loot.carried.keys, 1);
  assert.deepEqual(c.loot.claimed, ['t3-first-key']);
  const died: Chronicle = { ...c, outcome: 'died', loot: { ...c.loot, deathSpot: { room: 'T3', x: 0, y: 40 } } };
  const lost = done(save, died);
  assert.deepEqual(lost.save.world.claims, ['t3-first-key']);
  assert.equal(lost.save.camp.cache!.contents.keys, 1);
  const second = run(lost.save, planOf([obj('T3')]));
  assert.ok(!second.loot.gains.some(g => g.source === 'pickup' && g.label === 'gate-key'), 'the claimed discovery is not rewarded again');
  assert.ok(second.loot.gains.some(g => g.source === 'cache'), 'the dropped key can still be picked up from the cache, which is not a second reward');
  assert.deepEqual(second.loot.claimed, []);
});

test('a fresh key recovered from a cache is still ineligible, and an issued key recovered keeps its eligibility', () => {
  const save = fresh();
  save.camp.cache = { room: 'O1', x: -100, y: 0, contents: { gold: 0, supplies: {}, gear: [], mastery: 0, keys: 1, prepared: 1 } };
  const c = run(save, planOf([obj('O1', 'recover'), obj('T2', 'open', 'MB')]));
  assert.equal(c.loot.cacheRecovered, true);
  assert.equal(c.loot.spent, 1, 'the recovered eligible key opened the gate');
  assert.equal(c.loot.carried.keys, 1, 'the fresh one is still fresh');
  const s = done(save, c);
  assert.equal(s.save.camp.bank.keys, 1);
  assert.equal(s.save.camp.cache, null);
});

test('the sluice shortcut is worked by hand, stays open, and the way home from the Low Gallery shortens by over a fifth in distance and skips the rooms between', () => {
  const noShortcut = planRooms({ graph, known: new Set(ALL), from: 'S3', to: 'C0', avoid: new Set(), style: 'shortest' })!;
  const shortcut = planRooms({ graph, known: new Set(ALL), from: 'S3', to: 'C0', avoid: new Set(), style: 'shortest', open: new Set([SLUICE]) })!;
  assert.deepEqual(shortcut.rooms, ['S3', 'C0']);
  assert.ok(noShortcut.rooms.length >= 7);
  assert.ok(shortcut.distance < noShortcut.distance * 0.8, `${shortcut.distance} against ${noShortcut.distance}`);
  assert.ok(shortcut.danger < noShortcut.danger / 2, 'it also skips the rooms of the long way');
  const save = fresh();
  const plain = run(save, planOf([obj('S3')], { returnRoute: 'shortest' }));
  const worked = run(save, planOf([obj('S3'), obj('S3', 'open', 'C0')], { returnRoute: 'shortest' }));
  assert.deepEqual(worked.loot.opened, [SLUICE]);
  assert.deepEqual(worked.route.slice(-2), ['S3', 'C0'], 'it walks the sluice home');
  assert.equal(worked.loot.spent, 0, 'no key');
  assert.ok(worked.ticks < plain.ticks, `${worked.ticks} ticks with the sluice, ${plain.ticks} without`);
  const s = done(save, worked);
  const later = run(s.save, planOf([obj('S3')], { returnRoute: 'shortest' }));
  assert.deepEqual(later.route.slice(-2), ['S3', 'C0'], 'a later expedition uses it without being asked');
  assert.ok(later.ticks < plain.ticks);
});

test('a gate that opens with the miniboss, or an optional special door, is skipped with its reason', () => {
  const c = run(fresh(), planOf([obj('MB', 'open', 'K2'), obj('K3', 'open', 'SB')]));
  assert.deepEqual(c.objectives.map(o => o.status), ['skipped_blocked', 'skipped_blocked']);
  assert.match(c.objectives[0].note, /No known open route|miniboss/);
});

test('preflight explains a gate plan before launch, and an avoided gate room is a conflict', () => {
  const known = new Set(ALL);
  const plan = planOf([obj('T2', 'open', 'MB')]);
  assert.equal(preflight(plan, graph, known, 'C0', null, new Set(), 0).status, 'blocked');
  assert.match(preflight(plan, graph, known, 'C0', null, new Set(), 0).objectives[0].reason, /banked Gate Key issued at camp/);
  assert.equal(preflight(plan, graph, known, 'C0', null, new Set(), 1).status, 'confirmed');
  assert.equal(preflight(planOf([obj('T2', 'open', 'MB')], { avoid: ['T2'] }), graph, known, 'C0', null, new Set(), 1).status, 'conflicted');
  assert.match(preflight(plan, graph, known, 'C0', null, new Set([MB_GATE]), 0).objectives[0].reason, /Already open/);
});

test('bounded exploration enters a few new rooms beyond the edge of the map, then comes home, and the map is kept after a fall', () => {
  const save = fresh();
  const known = ['C0', 'O1', 'O2', 'O3'];
  const c = run(save, planOf([obj('S1', 'explore')]), { known });
  assert.equal(c.outcome, 'extracted');
  assert.deepEqual(c.discovered, ['K1', 'S1', 'S2']);
  assert.equal(c.objectives[0].status, 'completed');
  const s = done(save, c);
  assert.ok(['S1', 'S2', 'K1'].every(r => s.save.world.discovered.includes(r)));
  const died: Chronicle = { ...c, outcome: 'died', loot: { ...c.loot, deathSpot: { room: 'K1', x: 0, y: 0 } } };
  const d = done(save, died);
  assert.ok(d.save.world.discovered.includes('K1'), 'map memory survives a fall');
  const back = parse(serialize(d.save));
  assert.ok(back.ok && back.save.world.discovered.includes('K1'));
});
