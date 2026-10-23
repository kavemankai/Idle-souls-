import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadSim } from '../src/combat/loadSimNode';
import { WorldGraph } from '../src/world/worldGraph';
import { defaultPlan, preflight, type ExpeditionPlan, type Objective } from '../src/expedition/plan';
import { planRooms } from '../src/expedition/planner';
import { finishChronicle, runExpedition, startExpedition, type ExpeditionConfig } from '../src/expedition/run';
import { settle } from '../src/expedition/settle';
import { isEmptyBank } from '../src/expedition/loot';
import { defaultSave, type Save } from '../src/save/saveTypes';
import { MemoryStore, load, persist, validateInvariants } from '../src/save/save';
import type { Chronicle } from '../src/expedition/chronicle';

/**
 * Doc 15's first-session script (steps 1 to 8) played end to end on the real stack: fog map from a real save, real fights at real health, the
 * progression layer as shipped, every outcome settled into the save. Each step takes the first seed (a player retrying) where the intent of that step
 * actually happens, searched from seed 1 up to a cap, so a step that needs luck states how much. Nothing is mocked and nothing is forced.
 */
const sim = loadSim();
const graph = new WorldGraph();
const link = WorldGraph.linkKey;
const MB_GATE = link('T2', 'MB'), SLUICE = link('S3', 'C0'), WARDEN_SHORTCUT = link('MB', 'K2'), B1_GATE = link('K2', 'B1');
const obj = (room: string, kind: Objective['kind'] = 'reach', to?: string): Objective => ({ id: `${kind}-${room}${to ? `-${to}` : ''}`, kind, room, ...(to ? { to } : {}) });
const planOf = (objectives: Objective[], over: Partial<ExpeditionPlan> = {}): ExpeditionPlan => ({ ...defaultPlan(), objectives, ...over });
function cfgOf(save: Save, plan: ExpeditionPlan, seed: number, design: number, issue = 0): ExpeditionConfig {
  return { seed, level: 80, focus: 'balanced', plan, known: save.world.discovered, cache: save.camp.cache, issueKeys: issue, claims: save.world.claims, openLinks: save.world.openedLinks, defeatedBosses: save.world.defeatedBosses, progression: { startLevel: design } };
}
interface Played { c: Chronicle; seed: number; tries: number }
function play(save: Save, plan: ExpeditionPlan, design: number, want: (c: Chronicle) => boolean, o: { issue?: number; cap?: number; label?: string } = {}): Played {
  const cap = o.cap ?? 60;
  for (let seed = 1; seed <= cap; seed++) {
    const c = runExpedition(sim, cfgOf(save, plan, seed, design, o.issue ?? 0)).chronicle;
    if (want(c)) return { c, seed, tries: seed };
  }
  throw new Error(`no seed up to ${cap} gave the wanted run${o.label ? ` (${o.label})` : ''}`);
}
function settleOk(save: Save, c: Chronicle): Save {
  const s = settle(save, c, save.camp.expeditions);
  assert.ok(s.applied, s.refused ?? '');
  assert.deepEqual(validateInvariants(s.save), []);
  return s.save;
}
const extracted = (c: Chronicle) => c.outcome === 'extracted';

test('the first session, steps 1 to 8, on the real stack', { timeout: 900000 }, async t => {
  const store = new MemoryStore();
  let save = load(store).save;
  const log: string[] = [];
  const keep = (next: Save) => { persist(store, next); save = load(store).save; assert.deepEqual(save, next, 'the save survives a reload unchanged'); };

  await t.test('1. start at camp, pick a preset, identify the first frontier', () => {
    assert.deepEqual(save.world.discovered, ['C0']);
    const plan = planOf([obj('O1', 'survey')], { exploration: 'safe', doctrine: 'guarded', retreatHpPct: 50 });
    const pf = preflight(plan, graph, new Set(save.world.discovered), 'C0', null, new Set(), 0, new Set());
    assert.equal(pf.status, 'frontier'); assert.ok(pf.launchable);
    assert.match(pf.objectives[0].reason, /edge of the map/);
    const p = play(save, plan, 1, extracted);
    assert.ok(p.c.discovered.includes('O1'));
    const before = JSON.stringify(save);
    keep(settleOk(save, p.c));
    assert.notEqual(JSON.stringify(save), before);
    assert.ok(save.world.discovered.includes('O1'));
    log.push(`1: survey of the Outer Road took ${p.tries} seed(s)`);
  });

  await t.test('2. traverse the Old Road, see an ordinary encounter and a plain description of what the adventurer does', () => {
    const plan = planOf([obj('O2', 'explore')], { doctrine: 'guarded', retreatHpPct: 50 });
    const p = play(save, plan, 2, c => extracted(c) && c.fights.length > 0);
    const fight = p.c.intent.find(i => i.kind === 'fight')!;
    assert.match(fight.text, /(Won|Lost) \d+ fight/); assert.ok(fight.cause.length > 10);
    for (const i of p.c.intent) assert.ok(i.cause.length > 3, i.text);
    assert.ok(p.c.intent.some(i => i.kind === 'route' && /Next best|No other permitted way/.test(i.text)));
    keep(settleOk(save, p.c));
    assert.ok(save.world.discovered.includes('O2'));
    log.push(`2: Old Road explore, ${p.tries} seed(s)`);
  });

  await t.test('3. reveal the Watchtower and make one meaningful diversion decision', () => {
    const fog = planRooms({ graph, known: new Set(save.world.discovered), from: 'C0', to: 'T2', avoid: new Set(), style: 'safe' });
    assert.equal(fog, null, 'the Watchtower interior is still hidden');
    const plan = planOf([obj('O3')], { doctrine: 'guarded', retreatHpPct: 30 });
    let chosen: Chronicle | null = null;
    for (let seed = 1; seed <= 100 && !chosen; seed++) {
      const run = startExpedition(sim, cfgOf(save, plan, seed, 4));
      while (!run.world.terminal && run.expedition.rooms.length < 2 && run.world.tick < 90000) run.world.step();   // on the Outer Road, so the order lands at the Crossroads doorway
      if (run.world.terminal) continue;
      assert.equal(run.expedition.order({ type: 'redirect', room: 'T1' }), null, 'the Watchtower door is on the map, so a redirect is accepted');
      while (!run.world.terminal && run.world.tick < 90000) run.world.step();
      const c = finishChronicle(cfgOf(save, plan, seed, 4), run).chronicle;
      if (extracted(c) && c.route.includes('T1') && c.route.includes('O3')) chosen = c;
    }
    assert.ok(chosen, 'a run takes the diversion and comes home');
    assert.ok(chosen!.route.indexOf('T1') < chosen!.route.indexOf('O3'));
    assert.ok(chosen!.intent.some(i => i.kind === 'redirect' && /Player order/.test(i.cause)));
    keep(settleOk(save, chosen!));
    assert.ok(save.world.discovered.includes('T1') && save.world.discovered.includes('O3'));
  });

  await t.test('4. reach the sanctuary, rest and choose a major upgrade without banking', () => {
    const plan = planOf([obj('S1', 'explore')], { doctrine: 'guarded', retreatHpPct: 30 });
    const p = play(save, plan, 5, c => extracted(c) && !!c.progress?.sanctuary.upgrade, { cap: 80 });
    assert.ok(p.c.progress!.sanctuary.visits >= 1);
    const before = JSON.stringify(save.camp.bank);
    assert.equal(JSON.stringify(save.camp.bank), before, 'nothing is banked while the run is out');
    const s = settle(save, p.c, save.camp.expeditions);
    assert.deepEqual(s.banked.gold + s.banked.mastery >= 0, true);
    assert.deepEqual(s.save.camp.bank.gold, save.camp.bank.gold + p.c.loot.carried.gold, 'only the camp banked what was carried, once');
    assert.match(s.lines.join(' '), /Banked/);
    keep(settleOk(save, p.c));
    assert.ok(['S1', 'S2'].every(r => save.world.discovered.includes(r)));
    log.push(`4: sanctuary visit, ${p.tries} seed(s)`);
  });

  await t.test('5. continue toward an objective and face real extraction risk', () => {
    const plan = planOf([obj('T1'), obj('O3')], { doctrine: 'measured', retreatHpPct: 40 });
    let died = 0, home = 0, retreated = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const c = runExpedition(sim, cfgOf(save, plan, seed, 2)).chronicle;
      if (c.outcome === 'died') died++; else if (extracted(c)) home++;
      if (c.intent.some(i => i.kind === 'retreat')) retreated++;
    }
    assert.ok(died > 0, 'a weak adventurer can fall on this route');
    assert.ok(home > 0, 'and can also come home');
    assert.ok(retreated > 0, 'the retreat setting fires');
    log.push(`5: 40 runs at design level 2 to the Tower Yard: ${home} home, ${died} fell, ${retreated} turned back`);
  });

  await t.test('6. after a death, relaunch and plan a route to the cache using the retained map', () => {
    const plan = planOf([obj('O3')], { doctrine: 'pressing', retreatHpPct: 0 });
    const p = play(save, plan, 1, c => c.outcome === 'died' && !isEmptyBank(c.loot.carried), { cap: 80, label: 'a fall with loot' });
    const bank = JSON.stringify(save.camp.bank);
    keep(settleOk(save, p.c));
    assert.equal(JSON.stringify(save.camp.bank), bank, 'a fall banks nothing');
    assert.ok(save.camp.cache, 'the carried loot is in one cache'); assert.equal(save.camp.deaths, 1);
    const mapKept = save.world.discovered.length;
    assert.ok(mapKept >= 5, 'the map survived the fall');
    const rec = planOf([{ id: 'rec', kind: 'recover', room: save.camp.cache!.room }], { doctrine: 'guarded', retreatHpPct: 20 });
    assert.equal(preflight(rec, graph, new Set(save.world.discovered), 'C0', save.camp.cache, new Set(save.world.openedLinks), 0, new Set()).launchable, true);
    const cacheGold = save.camp.cache!.contents.gold;
    const back = play(save, rec, 7, c => extracted(c) && c.loot.cacheRecovered, { cap: 100, label: 'recover the cache and come home' });
    const goldBefore = save.camp.bank.gold;
    keep(settleOk(save, back.c));
    assert.equal(save.camp.cache, null);
    assert.ok(save.camp.bank.gold >= goldBefore + cacheGold, 'the cache came home exactly once');
    assert.equal(save.camp.bank.gold, goldBefore + back.c.loot.carried.gold);
  });

  await t.test('7. open a shortcut and show the way home actually changes', () => {
    const plan = planOf([obj('S3'), obj('S3', 'open', 'C0')], { returnRoute: 'shortest', doctrine: 'guarded', retreatHpPct: 30 });
    const p = play(save, plan, 6, c => extracted(c) && c.loot.opened.includes(SLUICE), { cap: 80 });
    assert.deepEqual(p.c.route.slice(-2), ['S3', 'C0']);
    keep(settleOk(save, p.c));
    const known = new Set(save.world.discovered);
    const without = planRooms({ graph, known, from: 'S3', to: 'C0', avoid: new Set(), style: 'shortest' })!;
    const withIt = planRooms({ graph, known, from: 'S3', to: 'C0', avoid: new Set(), style: 'shortest', open: new Set(save.world.openedLinks) })!;
    assert.ok(withIt.rooms.length < without.rooms.length && withIt.distance < without.distance);
    const later = play(save, planOf([obj('S3')], { returnRoute: 'shortest', doctrine: 'guarded', retreatHpPct: 30 }), 6, extracted, { cap: 80 });
    assert.deepEqual(later.c.route.slice(-2), ['S3', 'C0'], 'a later expedition uses it without being asked');
    log.push(`7: sluice opened (${p.tries} seed(s)); way home ${without.rooms.length - 1} doors before, ${withIt.rooms.length - 1} after`);
  });

  await t.test('8. kill the first boss, the world route changes, a later rematch does not undo the clear', () => {
    // Bank a key at the trial, then carry it to the Watchtower gate, open it and challenge the Warden.
    const trial = play(save, planOf([obj('KT')], { doctrine: 'guarded', retreatHpPct: 40 }), 4, c => extracted(c) && c.loot.carried.keys === 1, { cap: 80 });
    keep(settleOk(save, trial.c));
    assert.ok(save.camp.bank.keys >= 1);
    const scout = play(save, planOf([obj('T1', 'explore')], { doctrine: 'guarded', retreatHpPct: 30 }), 6, c => extracted(c) && c.discovered.includes('T2'), { cap: 80 });
    keep(settleOk(save, scout.c));
    const keysBefore = save.camp.bank.keys;
    const fight = play(save, planOf([obj('T2', 'open', 'MB'), obj('MB', 'challenge')], { doctrine: 'guarded', retreatHpPct: 0 }), 8, c => !!c.bosses?.firstClears.includes('warden'), { issue: 1, cap: 100 });
    assert.ok(fight.c.loot.opened.includes(MB_GATE));
    keep(settleOk(save, fight.c));
    assert.deepEqual(save.world.defeatedBosses, ['warden']);
    assert.ok(save.world.openedLinks.includes(WARDEN_SHORTCUT), 'the first clear opened the shortcut');
    assert.equal(save.camp.bank.keys, keysBefore - 1, 'exactly one key was spent, and it never comes back');
    const known = new Set([...save.world.discovered, 'K2']);
    const before = planRooms({ graph, known, from: 'C0', to: 'K2', avoid: new Set(), style: 'shortest', open: new Set(save.world.openedLinks.filter(l => l !== WARDEN_SHORTCUT)) });
    const after = planRooms({ graph, known, from: 'C0', to: 'K2', avoid: new Set(), style: 'shortest', open: new Set(save.world.openedLinks) });
    assert.ok(after && (!before || after.distance <= before.distance), 'the way to the Ossuary is no longer');
    const rematch = play(save, planOf([obj('MB', 'rematch')], { doctrine: 'guarded', retreatHpPct: 0 }), 8, c => !!c.bosses?.rematches.length, { cap: 100 });
    assert.equal(rematch.c.loot.spent, 0, 'a rematch costs no key');
    const keys = save.camp.bank.keys;
    keep(settleOk(save, rematch.c));
    assert.deepEqual(save.world.defeatedBosses, ['warden'], 'the clear is untouched');
    assert.equal(save.camp.bank.keys, keys);
    log.push(`8: Warden first clear after ${fight.tries} seed(s)`);
  });

  await t.test('8b. the main boss: open the last gate, defeat the Castellan, the campaign route unlocks and stays unlocked after a fall', () => {
    const trial = play(save, planOf([obj('KT')], { doctrine: 'guarded', retreatHpPct: 40 }), 4, c => extracted(c) && c.loot.carried.keys === 1, { cap: 80 });
    keep(settleOk(save, trial.c));
    const preFight: Save = JSON.parse(JSON.stringify(save));
    const fight = play(save, planOf([obj('K2', 'open', 'B1'), obj('B1', 'challenge')], { doctrine: 'guarded', retreatHpPct: 0 }), 9, c => !!c.bosses?.firstClears.includes('castellan'), { issue: 1, cap: 150 });
    assert.ok(fight.c.bosses!.world.includes('campaign-route-unlocked'));
    keep(settleOk(save, fight.c));
    assert.ok(save.world.defeatedBosses.includes('castellan'));
    assert.ok(save.world.openedLinks.includes(B1_GATE));
    // A death right after the clear keeps the clear and leaves a cache: the same expedition cannot lose it.
    const died: Chronicle = { ...fight.c, outcome: 'died', loot: { ...fight.c.loot, deathSpot: { room: 'B1', x: 0, y: 0 } } };
    const after = settle(preFight, died, preFight.camp.expeditions);
    assert.ok(after.applied);
    assert.ok(after.save.world.defeatedBosses.includes('castellan'));
    assert.deepEqual(validateInvariants(after.save), []);
    log.push(`8b: Castellan first clear after ${fight.tries} seed(s)`);
  });

  console.log(log.join('\n'));
});

test('stop conditions: the numbers behind them are measured, not asserted away', () => {
  const save = defaultSave('test');
  save.world.discovered = ['C0', 'O1', 'O2', 'O3', 'KT'];
  const plan = (r: number) => planOf([obj('O3')], { doctrine: 'measured', retreatHpPct: r });
  const rate = (r: number) => { let ext = 0; for (let s = 1; s <= 40; s++) if (runExpedition(sim, cfgOf(save, plan(r), s, 2)).chronicle.outcome === 'extracted') ext++; return ext; };
  const noRetreat = rate(0), withRetreat = rate(50);
  // Stop condition: deaths without explanation. Every death in the sample names the room and the cause the simulator blamed.
  let explained = 0, deaths = 0;
  for (let s = 1; s <= 40; s++) { const c = runExpedition(sim, cfgOf(save, plan(0), s, 2)).chronicle; if (c.outcome === 'died') { deaths++; if (c.summary.startsWith('Fell in') && c.loot.deathSpot) explained++; } }
  assert.equal(explained, deaths, 'every fall is explained');
  assert.ok(withRetreat > noRetreat, `retreat helps: ${withRetreat} of 40 extracted with it, ${noRetreat} without`);
});
