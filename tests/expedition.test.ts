import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadSim } from '../src/combat/loadSimNode';
import { WorldGraph } from '../src/world/worldGraph';
import type { WorldFile } from '../src/world/roomTypes';
import { planRooms } from '../src/expedition/planner';
import { defaultPlan, frontierRooms, preflight, type ExpeditionPlan } from '../src/expedition/plan';
import { Expedition } from '../src/expedition/expedition';
import { finishChronicle, runExpedition, startExpedition, type ExpeditionConfig } from '../src/expedition/run';
import type { ArrivalCtx } from '../src/world/worldRunner';

const sim = loadSim();
const graph = new WorldGraph();
const ALL = [...graph.rooms.keys()];
const OLD_ROAD = ['C0', 'O1', 'O2', 'O3', 'KT'];
const plan = (over: Partial<ExpeditionPlan>): ExpeditionPlan => ({ ...defaultPlan(), ...over });
const obj = (room: string, kind: 'reach' | 'survey' = 'reach', id = room) => ({ id, kind, room });
const cfg = (p: ExpeditionPlan, over: Partial<ExpeditionConfig> = {}): ExpeditionConfig => ({ seed: 3, level: 80, focus: 'balanced', plan: p, known: OLD_ROAD, hpOverride: 5000, ...over });

// A diamond: A to D through B (short, a HIGH room) or through C (longer, an EARLY room).
const diamond: WorldFile = {
  version: 1,
  rooms: [['A', 0, 0, 'SAFE'], ['B', 500, -50, 'HIGH'], ['C', 500, 500, 'EARLY'], ['D', 1000, 0, 'EARLY']].map(([id, x, y, d]) => ({
    id: id as string, name: `Room ${id}`, region: 'T', center: { x: x as number, y: y as number }, floor: { w: 400, h: 400 }, difficulty: d as string, candidateEncounter: 'None', purpose: '', status: 'generated',
  })),
  links: [['A', 'B'], ['B', 'D'], ['A', 'C'], ['C', 'D']].map(([a, b]) => ({ from: a, to: b, type: 'ordinary', doors: { from: `to-${b}`, to: `to-${a}` } })),
};

test('Safe and Direct pick different routes when a short way crosses a dangerous region', () => {
  const g = new WorldGraph(diamond), known = new Set(['A', 'B', 'C', 'D']);
  const direct = planRooms({ graph: g, known, from: 'A', to: 'D', avoid: new Set(), style: 'shortest' })!;
  const safe = planRooms({ graph: g, known, from: 'A', to: 'D', avoid: new Set(), style: 'safe' })!;
  assert.deepEqual(direct.rooms, ['A', 'B', 'D']);
  assert.deepEqual(safe.rooms, ['A', 'C', 'D']);
  assert.ok(safe.distance > direct.distance && safe.danger < direct.danger);
  assert.deepEqual(planRooms({ graph: g, known, from: 'A', to: 'D', avoid: new Set(), style: 'safe' }), safe);   // same query, same route
});

test('in the real world today Safe and Direct agree on the only loop (to the Ossuary), because the short way is also the quiet one', () => {
  const known = new Set(ALL);
  const direct = planRooms({ graph, known, from: 'C0', to: 'K2', avoid: new Set(), style: 'shortest' })!;
  const safe = planRooms({ graph, known, from: 'C0', to: 'K2', avoid: new Set(), style: 'safe' })!;
  assert.deepEqual(direct.rooms, ['C0', 'O1', 'O2', 'T1', 'T2', 'K3', 'K2']);
  assert.deepEqual(safe.rooms, direct.rooms);
  const south = planRooms({ graph, known, from: 'C0', to: 'K2', avoid: new Set(['T1']), style: 'safe' })!;
  assert.deepEqual(south.rooms, ['C0', 'O1', 'O2', 'O3', 'S1', 'S2', 'K1', 'K2']);
});

test('avoid, fog and closed gates are walls for the planner', () => {
  const known = new Set(OLD_ROAD);
  assert.equal(planRooms({ graph, known, from: 'C0', to: 'O3', avoid: new Set(['O2']), style: 'safe' }), null);
  assert.equal(planRooms({ graph, known, from: 'C0', to: 'T2', avoid: new Set(), style: 'safe' }), null, 'T1 is unexplored, so T2 lies behind fog');
  const t1 = planRooms({ graph, known, from: 'C0', to: 'T1', avoid: new Set(), style: 'safe' })!;
  assert.equal(t1.frontier, true);
  assert.deepEqual(t1.rooms, ['C0', 'O1', 'O2', 'T1']);
  const all = new Set(ALL);
  assert.equal(planRooms({ graph, known: all, from: 'C0', to: 'MB', avoid: new Set(), style: 'shortest' }), null, 'the fog gate is closed');
  assert.deepEqual(planRooms({ graph, known: all, from: 'C0', to: 'MB', avoid: new Set(), style: 'shortest', open: new Set([WorldGraph.linkKey('T2', 'MB')]) })!.rooms.slice(-2), ['T2', 'MB']);
  assert.deepEqual(frontierRooms(graph, known), ['S1', 'T1']);
});

test('the preflight reports confirmed, frontier, blocked and conflicted plans and only launches the first two', () => {
  const known = new Set(OLD_ROAD);
  const ok = preflight(plan({ objectives: [obj('O3')] }), graph, known);
  assert.equal(ok.status, 'confirmed'); assert.ok(ok.launchable); assert.ok(ok.home.route);
  const edge = preflight(plan({ objectives: [obj('T1', 'survey')] }), graph, known);
  assert.equal(edge.status, 'frontier'); assert.ok(edge.launchable);
  const fog = preflight(plan({ objectives: [obj('T2')] }), graph, known);
  assert.equal(fog.status, 'blocked'); assert.equal(fog.launchable, false);
  const clash = preflight(plan({ objectives: [obj('O3')], avoid: ['O2'] }), graph, known);
  assert.equal(clash.status, 'conflicted'); assert.equal(clash.launchable, false);
  assert.match(clash.objectives[0].reason, /avoided room/);
  assert.equal(preflight(plan({ objectives: [obj('O3')], avoid: ['O3'] }), graph, known).status, 'conflicted');
  assert.equal(preflight(plan({}), graph, known).launchable, false);
  assert.equal(preflight(plan({ objectives: ['a', 'b', 'c', 'd', 'e', 'f'].map(x => obj('O1', 'reach', x)) }), graph, known).launchable, false);
});

test('an expedition is deterministic and the seed changes the fights', () => {
  const p = plan({ objectives: [obj('O3'), obj('KT')] });
  const a = runExpedition(sim, cfg(p, { hpOverride: undefined })), b = runExpedition(sim, cfg(p, { hpOverride: undefined })), c = runExpedition(sim, cfg(p, { seed: 4, hpOverride: undefined }));
  assert.deepEqual(a, b);
  assert.notEqual(a.chronicle.digest, c.chronicle.digest);
});

test('every decision in the intent feed has a cause, and every route choice names its alternatives', () => {
  const { chronicle: c } = runExpedition(sim, cfg(plan({ objectives: [obj('T1', 'survey'), obj('O3')] })));
  assert.equal(c.outcome, 'extracted');
  assert.ok(c.intent.length > 8);
  for (const i of c.intent) assert.ok(i.cause.length > 3, `${i.kind}: ${i.text}`);
  const routes = c.intent.filter(i => i.kind === 'route');
  assert.ok(routes.length >= 3);
  for (const r of routes) assert.match(r.text, /Next best|No other permitted way/);
  assert.deepEqual(c.objectives.map(o => o.status), ['completed', 'completed']);
  assert.deepEqual(c.discovered, ['T1']);
  assert.deepEqual(c.route.slice(0, 5), ['C0', 'O1', 'O2', 'T1', 'O2']);
  assert.equal(c.route[c.route.length - 1], 'C0');
});

test('Thorough surveys look into the rooms beside the target and Direct does not', () => {
  const objs = [obj('T1', 'survey')];
  const direct = runExpedition(sim, cfg(plan({ objectives: objs, exploration: 'direct' }))).chronicle;
  const thorough = runExpedition(sim, cfg(plan({ objectives: objs, exploration: 'thorough' }))).chronicle;
  assert.ok(!direct.route.includes('T2'));
  assert.ok(thorough.route.includes('T2'));
  assert.ok(thorough.ticks > direct.ticks);
  assert.ok(thorough.intent.some(i => i.kind === 'sweep'));
});

test('avoid is absolute: the walk and the way home never enter an avoided room', () => {
  const p = plan({ objectives: [obj('K2')], avoid: ['T1'], returnRoute: 'shortest' });
  const { chronicle: c } = runExpedition(sim, cfg(p, { known: ALL }));
  assert.equal(c.outcome, 'extracted');
  for (const room of ['T1', 'T2', 'K3']) assert.ok(!c.route.includes(room), room);
  assert.ok(c.route.includes('S2') && c.route.includes('K1'));
  const without = runExpedition(sim, cfg(plan({ objectives: [obj('K2')], returnRoute: 'shortest' }), { known: ALL })).chronicle;
  assert.ok(without.route.includes('K3') && !without.route.includes('S2'));
});

test('a health threshold sends the adventurer home at the next junction, and says so', () => {
  const p = plan({ objectives: [obj('O3'), obj('KT')], retreatHpPct: 95 });
  const { chronicle: c } = runExpedition(sim, cfg(p, { seed: 5, hpOverride: undefined }));
  const retreat = c.intent.find(i => i.kind === 'retreat')!;
  assert.ok(retreat, 'a retreat is logged');
  assert.match(retreat.text, /below the 95% retreat setting/);
  assert.match(retreat.cause, /Survival policy/);
  assert.ok(c.objectives.some(o => o.status === 'suspended'));
  assert.equal(c.route[c.route.length - 1], 'C0');
  assert.ok(!c.route.includes('KT'));
});

test('a retreat order takes effect at once, in the room, and outranks the objectives', () => {
  const p = plan({ objectives: [obj('O3')] });
  const run = startExpedition(sim, cfg(p));
  while (run.expedition.rooms.length < 2) run.world.step();   // standing in O1
  assert.equal(run.expedition.order({ type: 'retreat' }), null);
  while (!run.world.terminal) run.world.step();
  const { chronicle: c } = finishChronicle(cfg(p), run);
  assert.equal(c.outcome, 'extracted');
  assert.ok(c.intent.some(i => i.kind === 'retreat' && i.cause.startsWith('Manual retreat')));
  assert.deepEqual(c.route, ['C0', 'O1', 'C0']);
  assert.equal(c.objectives[0].status, 'suspended');
});

test('a redirect is accepted at a junction, goes first, and bad redirects are refused', () => {
  const p = plan({ objectives: [obj('O3')], avoid: ['T1'] });
  const run = startExpedition(sim, cfg(p));
  assert.match(run.expedition.order({ type: 'redirect', room: 'T1' })!, /avoid list/);
  assert.match(run.expedition.order({ type: 'redirect', room: 'K3' })!, /not on the map/);
  assert.equal(run.expedition.order({ type: 'redirect', room: 'KT' }), null);
  while (!run.world.terminal) run.world.step();
  const { chronicle: c } = finishChronicle(cfg(p), run);
  assert.equal(c.outcome, 'extracted');
  assert.ok(c.route.indexOf('KT') < c.route.indexOf('O3'));
  assert.equal(c.objectives[0].room, 'KT');
  assert.ok(c.intent.some(i => i.kind === 'redirect'));
});

test('an objective that cannot be reached is skipped with its reason and the plan carries on (L14)', () => {
  const p = plan({ objectives: [obj('MB'), obj('O3')] });
  assert.equal(preflight(p, graph, new Set(ALL)).objectives[0].status, 'blocked');
  const { chronicle: c } = runExpedition(sim, cfg(p, { known: ALL }));
  assert.equal(c.outcome, 'extracted');
  assert.equal(c.objectives[0].status, 'skipped_blocked');
  assert.match(c.objectives[0].note, /No known open route/);
  assert.equal(c.objectives[1].status, 'completed');
  assert.ok(c.intent.some(i => i.kind === 'skip' && i.cause.startsWith('L14')));
});

test('with no permitted way home the expedition reports a blocked extraction and does not cross the avoided room', () => {
  const ex = new Expedition(plan({ objectives: [obj('O3')], avoid: ['O1'] }), graph, OLD_ROAD);
  ex.order({ type: 'retreat' });
  const ctx: ArrivalCtx = { room: 'O2', entry: 'to-O1', tick: 500, hp: 80, hpMax: 90, pos: { x: 0, y: 0 }, leg: 2, dead: new Map(), results: [] };
  const d = ex.arrive(ctx);
  assert.ok('halt' in d && /Extraction blocked by your exclusion/.test(d.halt));
  assert.equal(ex.mode, 'blocked');
});

test('a fall ends the Chronicle as a death with the room it happened in', () => {
  const { chronicle: c } = runExpedition(sim, cfg(plan({ objectives: [obj('O3')], doctrine: 'pressing' }), { hpOverride: 8 }));
  assert.equal(c.outcome, 'died');
  assert.match(c.summary, /^Fell in /);
});

test('the Chronicles of the golden expeditions are identical to the recorded ones', async () => {
  const { readFileSync } = await import('node:fs');
  const { expeditionGoldenRuns } = await import('../tools/expedition-golden');
  const gold = JSON.parse(readFileSync('tests/golden/expedition-runs.json', 'utf8')) as Record<string, unknown>, now = expeditionGoldenRuns();
  assert.deepEqual(Object.keys(now), Object.keys(gold));
  for (const k of Object.keys(gold)) assert.deepEqual(now[k], gold[k], k);
});
