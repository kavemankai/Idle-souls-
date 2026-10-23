import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadSim } from '../src/combat/loadSimNode';
import type { SimApi } from '../src/combat/simApi';
import { WorldGraph } from '../src/world/worldGraph';
import { DEFAULT_ENCOUNTERS, OLD_ROAD_ENCOUNTERS } from '../src/world/worldRunner';
import { ROOMS } from '../src/world/roomRegistry';
import { defaultPlan, preflight, type ExpeditionPlan, type Objective } from '../src/expedition/plan';
import { finishChronicle, runExpedition, startExpedition, type ExpeditionConfig } from '../src/expedition/run';
import { settle } from '../src/expedition/settle';
import { defaultSave, type Save } from '../src/save/saveTypes';
import { validateInvariants } from '../src/save/save';
import type { Chronicle } from '../src/expedition/chronicle';

const sim = loadSim();
const graph = new WorldGraph();
const ALL = [...graph.rooms.keys()];
const MB_GATE = WorldGraph.linkKey('T2', 'MB'), SHORTCUT = WorldGraph.linkKey('MB', 'K2'), B1_GATE = WorldGraph.linkKey('K2', 'B1');
const obj = (room: string, kind: Objective['kind'] = 'reach', to?: string, variant?: Objective['variant']): Objective => ({ id: `${kind}-${room}${to ? `-${to}` : ''}`, kind, room, ...(to ? { to } : {}), ...(variant ? { variant } : {}) });
const planOf = (objectives: Objective[], over: Partial<ExpeditionPlan> = {}): ExpeditionPlan => ({ ...defaultPlan(), retreatHpPct: 0, objectives, ...over });
const fresh = (): Save => defaultSave('test');
const withKeys = (n: number): Save => { const s = fresh(); s.camp.bank.keys = n; return s; };
const cleared = (...bosses: string[]): Save => {
  const s = fresh();
  for (const b of bosses) { s.world.defeatedBosses.push(b); if (b === 'warden') s.world.openedLinks.push(MB_GATE, SHORTCUT); else s.world.openedLinks.push(B1_GATE); }
  return s;
};
interface Opts { seed?: number; hp?: number | null; issue?: number; known?: string[]; progression?: number; engine?: SimApi }
function cfgOf(save: Save, plan: ExpeditionPlan, o: Opts = {}): ExpeditionConfig {
  return {
    seed: o.seed ?? 1, level: 80, focus: 'balanced', plan, known: o.known ?? ALL, cache: save.camp.cache, issueKeys: o.issue ?? 0, claims: save.world.claims, openLinks: save.world.openedLinks, defeatedBosses: save.world.defeatedBosses,
    ...(o.hp === null ? {} : { hpOverride: o.hp ?? 5000 }), ...(o.progression ? { progression: { startLevel: o.progression } } : {}),
  };
}
const run = (save: Save, plan: ExpeditionPlan, o: Opts = {}) => runExpedition(o.engine ?? sim, cfgOf(save, plan, o));
const done = (save: Save, c: Chronicle) => { const s = settle(save, c, save.camp.expeditions); assert.ok(s.applied, s.refused ?? ''); assert.deepEqual(validateInvariants(s.save), []); return s; };
const unseen = ALL.filter(r => r !== 'MB' && r !== 'B1');
const fell = (c: Chronicle, room: string): Chronicle => ({ ...c, outcome: 'died', loot: { ...c.loot, deathSpot: { room, x: 0, y: 0 } } });
const spent = (s: Save) => s.camp.bank.keys;

test('the default encounter table covers every authored room, names real encounters, and leaves the Old Road as it was', () => {
  for (const [room, m] of Object.entries(ROOMS)) {
    const has = Object.keys(m.encounters ?? {}).length > 0;
    if (!has) { assert.equal(DEFAULT_ENCOUNTERS[room], undefined, `${room} has no encounters to stand in it`); continue; }
    assert.ok(DEFAULT_ENCOUNTERS[room], `${room} has no default encounter`);
    assert.ok(m.encounters[DEFAULT_ENCOUNTERS[room]], `${room} has no encounter ${DEFAULT_ENCOUNTERS[room]}`);
  }
  for (const [room, e] of Object.entries(OLD_ROAD_ENCOUNTERS)) assert.equal(DEFAULT_ENCOUNTERS[room], e);
  assert.equal(DEFAULT_ENCOUNTERS.MB, 'warden');
  assert.equal(DEFAULT_ENCOUNTERS.B1, 'castellan');
});

test('scenario 1 / D05 / D11: a sealed boss gate with no key changes the map only; the challenge is skipped and the next objective still runs', () => {
  const save = fresh();
  const plan = planOf([obj('MB', 'challenge'), obj('O3')]);
  const pf = preflight(plan, graph, new Set(unseen), 'C0', null, new Set(), 0, new Set());
  assert.equal(pf.objectives[0].status, 'blocked');
  assert.match(pf.objectives[0].reason, /sealed/);
  const { chronicle: c } = run(save, plan, { known: unseen });
  assert.equal(c.objectives[0].status, 'skipped_blocked');
  assert.equal(c.objectives[1].status, 'completed');
  assert.equal(c.bosses, null);
  assert.ok(!c.route.includes('MB'));
  assert.deepEqual(c.loot.opened, []);
  assert.equal(c.loot.spent, 0);
  assert.ok(c.events.every(e => e.kind !== 'boss_engaged'));
});

test('scenario 2 / D06: a key in hand and a sealed gate passed by: nothing spent, nothing engaged, the key goes back to the bank', () => {
  const save = withKeys(1);
  const { chronicle: c } = run(save, planOf([obj('T2', 'survey')]), { issue: 1, known: unseen });
  assert.equal(c.outcome, 'extracted');
  assert.equal(c.loot.spent, 0);
  assert.deepEqual(c.loot.opened, []);
  assert.equal(c.bosses, null);
  assert.ok(!c.route.includes('MB'));
  assert.equal(spent(done(save, c).save), 1);
});

test('scenario 4 / D07 / D08: confirming the gate spends exactly one key, opens it for good, and the boss is untouched; the key does not come back', () => {
  const save = withKeys(1);
  const { chronicle: c } = run(save, planOf([obj('T2', 'open', 'MB')]), { issue: 1, known: unseen });
  assert.equal(c.loot.spent, 1);
  assert.deepEqual(c.loot.opened, [MB_GATE]);
  assert.equal(c.bosses, null);
  assert.deepEqual(c.bossesDefeated, []);
  assert.equal(c.events.filter(e => e.kind === 'gate_opened').length, 1);
  const s = done(save, c);
  assert.equal(spent(s.save), 0);
  assert.deepEqual(s.save.world.openedLinks, [MB_GATE]);
  assert.deepEqual(s.save.world.defeatedBosses, []);
  // Next expedition: the gate is open, no key is issued, the challenge goes ahead and spends nothing.
  const next = run(s.save, planOf([obj('MB', 'challenge')]), { known: unseen });
  assert.equal(next.chronicle.loot.spent, 0);
  assert.equal(next.chronicle.loot.issued, 0);
  assert.deepEqual(next.chronicle.bossesDefeated, ['warden']);
});

test('scenario 5: death after the unlock and before any fight keeps the gate open and recreates no key, in the bank or in the cache', () => {
  const save = withKeys(1);
  const { chronicle: c } = run(save, planOf([obj('T2', 'open', 'MB')]), { issue: 1, known: unseen });
  const s = done(save, fell(c, 'T2'));
  assert.deepEqual(s.save.world.openedLinks, [MB_GATE]);
  assert.equal(s.save.camp.bank.keys, 0);
  assert.equal(s.save.camp.cache?.contents.keys ?? 0, 0);
  assert.equal(s.save.camp.cache?.contents.prepared ?? 0, 0);
});

test('scenario 6: dying in the boss fight keeps the gate open, records no first clear and opens no shortcut', () => {
  const save = withKeys(1);
  const { chronicle: c } = run(save, planOf([obj('T2', 'open', 'MB'), obj('MB', 'challenge')]), { issue: 1, known: unseen, progression: 9, hp: null });
  assert.equal(c.outcome, 'died');
  assert.deepEqual(c.bosses?.engaged, ['warden']);
  assert.deepEqual(c.bosses?.firstClears, []);
  assert.deepEqual(c.bossesDefeated, []);
  const s = done(save, c);
  assert.deepEqual(s.save.world.defeatedBosses, []);
  assert.deepEqual(s.save.world.openedLinks, [MB_GATE]);
  assert.equal(s.save.camp.cache?.room, 'MB');
  assert.equal(s.save.camp.bank.gold, 0);
});

/** The real simulator, except that the Warden's fight ends on its twentieth tick with the Warden and the adventurer both at zero health. */
type Loose = { enemies: { hp: number; dead: boolean }[]; p: { hp: number }; over: boolean; winner: string };
function sameTickEngine(): SimApi {
  const ticks = new WeakMap<object, number>();
  const createFight: SimApi['createFight'] = c => { const S = sim.createFight(c); if (c.encounter === 'warden') ticks.set(S, 0); return S; };
  const step: SimApi['step'] = S => {
    sim.step(S);
    const L = S as unknown as Loose;
    if (!ticks.has(S) || L.over) return;
    const n = ticks.get(S)! + 1; ticks.set(S, n);
    if (n === 20) { for (const e of L.enemies) { e.hp = 0; e.dead = true; } L.p.hp = 0; L.over = true; L.winner = 'adventurer'; }
  };
  return Object.assign(Object.create(sim) as SimApi, { createFight, step });
}

test('scenario 7 / D13: the kill and the death on the same tick: the kill stands, the adventurer is dead, nothing is banked', () => {
  const save = withKeys(1);
  const { chronicle: c } = run(save, planOf([obj('T2', 'open', 'MB'), obj('MB', 'challenge')]), { issue: 1, known: unseen, engine: sameTickEngine() });
  assert.equal(c.outcome, 'died');
  assert.deepEqual(c.bossesDefeated, ['warden']);
  assert.ok(c.loot.opened.includes(SHORTCUT));
  assert.ok(c.events.some(e => e.kind === 'boss_defeated'));
  assert.ok(c.events.some(e => e.kind === 'loot_cached'));
  assert.ok(c.events.every(e => e.kind !== 'loot_banked'));
  const s = done(save, c);
  assert.deepEqual(s.save.world.defeatedBosses, ['warden']);
  assert.ok(s.save.world.openedLinks.includes(SHORTCUT));
  assert.equal(s.save.camp.bank.gold, 0);
  assert.deepEqual(s.save.camp.bank.gear, []);
  assert.ok(s.save.camp.cache!.contents.gear.includes('warden-bell-clapper'));
  assert.ok(s.save.camp.cache!.contents.gold >= 80);
  assert.equal(s.save.camp.deaths, 1);
});

test('a win banks nothing by itself: the Warden pays gold and one gear item into what is carried, and camp banks it once', () => {
  const save = withKeys(1);
  const { chronicle: c } = run(save, planOf([obj('T2', 'open', 'MB'), obj('MB', 'challenge')]), { issue: 1, known: unseen });
  assert.equal(c.outcome, 'extracted');
  assert.deepEqual(c.bossesDefeated, ['warden']);
  assert.deepEqual(c.bosses?.firstClears, ['warden']);
  assert.ok(c.loot.carried.gold >= 80 && c.loot.carried.gear.includes('warden-bell-clapper'));
  assert.equal(c.loot.carried.gear.filter(g => g === 'warden-bell-clapper').length, 1);
  assert.equal(save.camp.bank.gold, 0);   // the chronicle changed nothing
  assert.deepEqual(c.events.map(e => e.kind), ['gate_opened', 'boss_engaged', 'boss_defeated', 'loot_banked']);
  const s = done(save, c);
  assert.deepEqual(s.save.world.defeatedBosses, ['warden']);
  assert.ok(s.save.world.openedLinks.includes(SHORTCUT) && s.save.world.openedLinks.includes(MB_GATE));
  assert.ok(s.save.camp.bank.gear.includes('warden-bell-clapper'));
  assert.ok(s.lines.some(l => /defeated for good/.test(l)));
});

test('H12: a boss cleared and the adventurer lost on the way home: the world change stays, the carried reward goes to the cache', () => {
  const save = withKeys(1);
  const { chronicle: c } = run(save, planOf([obj('T2', 'open', 'MB'), obj('MB', 'challenge')]), { issue: 1, known: unseen });
  const s = done(save, fell(c, 'K3'));
  assert.deepEqual(s.save.world.defeatedBosses, ['warden']);
  assert.ok(s.save.world.openedLinks.includes(SHORTCUT));
  assert.equal(s.save.camp.bank.gold, 0);
  assert.ok(s.save.camp.cache!.contents.gear.includes('warden-bell-clapper'));
});

test('the first clear is written exactly once: settling the same expedition twice is refused', () => {
  const save = withKeys(1);
  const { chronicle: c } = run(save, planOf([obj('T2', 'open', 'MB'), obj('MB', 'challenge')]), { issue: 1, known: unseen });
  const first = done(save, c);
  const again = settle(first.save, c, save.camp.expeditions);
  assert.equal(again.applied, false);
  assert.deepEqual(first.save.world.defeatedBosses, ['warden']);
  assert.equal(first.save.world.openedLinks.filter(l => l === SHORTCUT).length, 1);
});

test('scenario 8 / D14: a rematch is opt-in, costs no key, leaves the first clear alone and pays a quarter of the gold and no gear', () => {
  const save = cleared('warden');
  const { chronicle: c } = run(save, planOf([obj('MB', 'rematch')]), { known: unseen.concat('MB') });
  assert.equal(c.loot.issued, 0);
  assert.equal(c.loot.spent, 0);
  assert.deepEqual(c.loot.opened, []);
  assert.deepEqual(c.bossesDefeated, []);   // not a first clear
  assert.deepEqual(c.bosses?.rematches, [{ boss: 'warden', variant: 'standard', won: true }]);
  assert.deepEqual(c.bosses?.firstClears, []);
  const win = c.loot.gains.find(g => g.label.includes('rematch'))!;
  assert.equal(win.bundle.gold, 20);
  assert.deepEqual(win.bundle.gear, []);
  const s = done(save, c);
  assert.deepEqual(s.save.world.defeatedBosses, ['warden']);
  assert.deepEqual([...s.save.world.openedLinks].sort(), [...save.world.openedLinks].sort());
  assert.ok(!s.save.camp.bank.gear.includes('warden-bell-clapper'));
});

test('B13: a first-time challenge on a boss already cleared is not counted as done; a rematch before the first clear is refused', () => {
  const save = cleared('warden');
  const plan = planOf([obj('MB', 'challenge'), obj('O3')]);
  const pf = preflight(plan, graph, new Set(ALL), 'C0', null, new Set(save.world.openedLinks), 0, new Set(['warden']));
  assert.equal(pf.objectives[0].status, 'blocked');
  assert.match(pf.objectives[0].reason, /Rematch/);
  const { chronicle: c } = run(save, plan);
  assert.equal(c.objectives[0].status, 'skipped_blocked');
  assert.equal(c.objectives[1].status, 'completed');
  assert.equal(c.bosses, null);
  const early = run(fresh(), planOf([obj('MB', 'rematch'), obj('O3')]), { known: unseen });
  assert.equal(early.chronicle.objectives[0].status, 'skipped_blocked');
  assert.equal(early.chronicle.bosses, null);
});

test('a defeated boss stays absent: passing through its arena later starts no fight, and a reach objective there is just a walk', () => {
  const save = cleared('warden');
  const r = run(save, planOf([obj('MB', 'reach')]), { known: ALL.filter(x => x !== 'B1') });
  assert.equal(r.chronicle.bosses, null);
  assert.equal(r.chronicle.objectives[0].status, 'completed');
  assert.ok(r.chronicle.route.includes('MB'));
  assert.ok(!r.chronicle.fights.some(f => f.room === 'MB'));
});

test('a plain walk never enters a living boss arena: reach and survey of it are refused, and exploring and sweeping skip it', () => {
  const save = withKeys(1);
  const open = save; open.world.openedLinks.push(MB_GATE);
  const reach = run(open, planOf([obj('MB', 'reach'), obj('T2', 'survey')]), { known: unseen });
  assert.equal(reach.chronicle.objectives[0].status, 'skipped_blocked');
  assert.ok(!reach.chronicle.route.includes('MB'));
  const thorough = run(open, planOf([obj('T2', 'survey')], { exploration: 'thorough' }), { known: unseen });
  assert.ok(!thorough.chronicle.route.includes('MB'));
  const explore = run(open, planOf([{ id: 'e', kind: 'explore', room: 'T2', depth: 4 }]), { known: unseen });
  assert.ok(!explore.chronicle.route.includes('MB'));
  assert.equal(explore.chronicle.bosses, null);
});

test('retreat is physical: abandoning the Warden leaves by the door in, the boss resets, nothing is cleared, the shortcut stays shut', () => {
  const save = withKeys(1);
  // The level table decides how often the adventurer meets the Warden at full strength: take the first seed where it engages, gets hurt and walks out.
  const attempt = (seed: number) => {
    const cfg = cfgOf(save, planOf([obj('T2', 'open', 'MB'), obj('MB', 'challenge')], { retreatHpPct: 40 }), { seed, issue: 1, known: unseen, progression: 9, hp: null });
    return finishChronicle(cfg, (() => { const r = startExpedition(sim, cfg); while (!r.world.terminal && r.world.tick < 90000) r.world.step(); return r; })());
  };
  let found: ReturnType<typeof attempt> | null = null;
  for (let seed = 1; seed <= 60 && !found; seed++) { const t = attempt(seed); if (t.chronicle.events.some(e => e.kind === 'boss_reset')) found = t; }
  assert.ok(found, 'some seed engages the Warden and retreats from it');
  const { result, chronicle: c } = found!;
  assert.ok(c.events.some(e => e.kind === 'boss_engaged'));
  assert.ok(c.events.some(e => e.kind === 'boss_reset'));
  const i = c.route.indexOf('MB');
  assert.equal(c.route[i + 1], 'T2');
  assert.deepEqual(c.bossesDefeated, []);
  assert.ok(!c.loot.opened.includes(SHORTCUT));
  assert.deepEqual(result.dead.MB, [false]);
  const mb = result.legs.filter(l => l.room === 'MB');
  assert.ok(mb.some(l => l.result.escaped));
  assert.equal(c.outcome, 'extracted');
  const s = done(save, c);
  assert.deepEqual(s.save.world.defeatedBosses, []);
  assert.deepEqual(s.save.world.openedLinks, [MB_GATE]);
});

test('a boss fights alone: one fight, one enemy', () => {
  const { chronicle: c } = run(withKeys(1), planOf([obj('T2', 'open', 'MB'), obj('MB', 'challenge')]), { issue: 1, known: unseen });
  const f = c.fights.find(x => x.room === 'MB')!;
  assert.equal(f.enemiesDefeated, 1);
  assert.equal(c.fights.filter(x => x.room === 'MB').length, 1);
});

test('scenario 9 / D12: an excluded room is never approached even with the key in hand', () => {
  const save = withKeys(1);
  const plan = planOf([obj('T2', 'open', 'MB'), obj('MB', 'challenge')], { avoid: ['T2'] });
  const pf = preflight(plan, graph, new Set(unseen), 'C0', null, new Set(), 1, new Set());
  assert.notEqual(pf.objectives[0].status, 'confirmed');
  const { chronicle: c } = run(save, plan, { issue: 1, known: unseen });
  assert.ok(!c.route.includes('T2') && !c.route.includes('MB'));
  assert.equal(c.loot.spent, 0);
  assert.deepEqual(c.loot.opened, []);
  const mbOnly = planOf([obj('T2', 'open', 'MB'), obj('MB', 'challenge')], { avoid: ['MB'] });
  const r = run(save, mbOnly, { issue: 1, known: unseen });
  assert.ok(!r.chronicle.route.includes('MB'));
  assert.equal(r.chronicle.bosses, null);
});

test('the Castellan: first clear records the campaign route; the reward is one gear item and it opens no link', () => {
  const save = withKeys(1);
  const { chronicle: c } = run(save, planOf([obj('K2', 'open', 'B1'), obj('B1', 'challenge')]), { issue: 1, known: unseen });
  assert.equal(c.outcome, 'extracted');
  assert.deepEqual(c.bossesDefeated, ['castellan']);
  assert.ok(c.bosses!.world.includes('campaign-route-unlocked'));
  assert.ok(c.loot.carried.gear.includes('castellan-silt-crest'));
  const s = done(save, c);
  assert.deepEqual(s.save.world.defeatedBosses, ['castellan']);
  assert.deepEqual(s.save.world.openedLinks, [B1_GATE]);
  assert.ok(s.lines.some(l => /campaign route is unlocked/.test(l)));
  // A rematch needs no key and pays no gear.
  const again = run(s.save, planOf([obj('B1', 'rematch')]), { known: unseen.concat('B1') });
  assert.equal(again.chronicle.loot.issued, 0);
  assert.deepEqual(again.chronicle.bossesDefeated, []);
  assert.ok(!again.chronicle.loot.carried.gear.includes('castellan-silt-crest'));
});

test('the limited-healing rematch: no rations all expedition, and winning or losing never reverts the clear', () => {
  const save = cleared('warden');
  const plan = planOf([obj('MB', 'rematch', undefined, 'limited-healing')]);
  const { chronicle: c } = run(save, plan, { known: unseen.concat('MB'), progression: 9 });
  assert.equal(c.progress?.rationsLeft, 0);
  assert.equal(c.progress?.rationsUsed, 0);
  assert.equal(c.bosses?.rematches[0].variant, 'limited-healing');
  const s = done(save, c);
  assert.deepEqual(s.save.world.defeatedBosses, ['warden']);
  assert.ok(s.save.world.openedLinks.includes(SHORTCUT));
  const lost = done(save, fell(c, 'MB'));
  assert.deepEqual(lost.save.world.defeatedBosses, ['warden']);
  assert.ok(lost.save.world.openedLinks.includes(SHORTCUT));
});

test('the preflight explains gate state, key need and boss status', () => {
  const plan = planOf([obj('T2', 'open', 'MB'), obj('MB', 'challenge')]);
  const none = preflight(plan, graph, new Set(unseen), 'C0', null, new Set(), 0, new Set());
  assert.equal(none.objectives[0].status, 'blocked');
  assert.match(none.objectives[0].reason, /Gate Key/);
  const keyed = preflight(plan, graph, new Set(unseen), 'C0', null, new Set(), 1, new Set());
  assert.match(keyed.objectives[1].reason, /opens earlier in this plan/);
  assert.match(keyed.objectives[1].reason, /Not yet defeated/);
  assert.ok(keyed.launchable);
  const rematch = preflight(planOf([obj('MB', 'rematch')]), graph, new Set(ALL), 'C0', null, new Set([MB_GATE, SHORTCUT]), 0, new Set(['warden']));
  assert.match(rematch.objectives[0].reason, /quarter/);
});
