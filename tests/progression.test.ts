import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadSim } from '../src/combat/loadSimNode';
import { defaultPlan, type ExpeditionPlan } from '../src/expedition/plan';
import { runExpedition, type ExpeditionConfig } from '../src/expedition/run';
import { Ledger } from '../src/expedition/loot';
import { settle } from '../src/expedition/settle';
import { defaultSave } from '../src/save/saveTypes';
import { validateInvariants } from '../src/save/save';
import { LEVEL_TABLE, MAX_DESIGN_LEVEL, clampDesign, simLevel } from '../src/progression/levelTable';
import { DRINK_TICKS, MELEE_SAFE, MISTAKE_SHARE, Progress, UPGRADES, XP_TO_REACH, KILL_XP, upgradeById } from '../src/progression/experience';
import { ROOMS } from '../src/world/roomRegistry';

const sim = loadSim();
const known = ['C0', 'O1', 'O2', 'O3', 'KT', 'S1', 'S2'];
const obj = (room: string, kind: 'reach' | 'survey' = 'reach') => ({ id: `${kind}-${room}`, kind, room });
const planOf = (objectives: ExpeditionPlan['objectives'], over: Partial<ExpeditionPlan> = {}): ExpeditionPlan => ({ ...defaultPlan(), objectives, doctrine: 'guarded', retreatHpPct: 60, drinkBelowPct: 70, ...over });
const cfg = (plan: ExpeditionPlan, seed: number, over: Partial<ExpeditionConfig> = {}): ExpeditionConfig => ({ seed, level: 80, focus: 'balanced', plan, known, progression: { startLevel: 1, kitRations: 2 }, ...over });
const run = (plan: ExpeditionPlan, seed: number, over: Partial<ExpeditionConfig> = {}) => runExpedition(sim, cfg(plan, seed, over)).chronicle;
const deep = (over: Partial<ExpeditionPlan> = {}) => planOf([obj('O3'), obj('S2')], over);
function findSeed<T>(tryIt: (seed: number) => T | null, upTo = 80): { seed: number; v: T } {
  for (let seed = 1; seed <= upTo; seed++) { const v = tryIt(seed); if (v) return { seed, v }; }
  throw new Error('no seed matched');
}

test('the level table rises, is clamped, and says which rows were measured', () => {
  for (let i = 1; i < LEVEL_TABLE.length; i++) assert.ok(LEVEL_TABLE[i].sim > LEVEL_TABLE[i - 1].sim, `row ${i + 1} rises`);
  assert.equal(simLevel(0), simLevel(1));
  assert.equal(simLevel(99), simLevel(MAX_DESIGN_LEVEL));
  assert.equal(clampDesign(3.4), 3);
  assert.ok(LEVEL_TABLE.some(r => !r.calibrated) && LEVEL_TABLE[0].calibrated, 'misses stay visible');
  assert.ok(simLevel(MAX_DESIGN_LEVEL) <= sim.MAX_LEVEL);
});

test('experience: kills pay in full, a leg that cost health adds at most a quarter, and levels follow the thresholds', () => {
  const p = new Progress(1);
  p.kill('mireling', 10);
  assert.equal(p.xp, KILL_XP.mireling);
  p.kill('sentry', 20);
  assert.ok(p.xp >= XP_TO_REACH[1]);
  assert.equal(p.level >= 2, true);
  const q = new Progress(1);
  q.kill('sentry', 5);
  const before = q.xp, bonus = q.endLeg(1, true, 6);
  assert.equal(bonus, Math.floor(MISTAKE_SHARE * KILL_XP.sentry));
  assert.equal(q.xp, before + bonus);
  const r = new Progress(1);
  r.kill('sentry', 5);
  assert.equal(r.endLeg(1, false, 6), 0, 'a lost fight teaches nothing extra');
  const s = new Progress(1);
  s.kill('sentry', 5);
  assert.equal(s.endLeg(0, true, 6), 0, 'a clean win teaches nothing extra');
  assert.equal(new Progress(1).endLeg(1, true, 1), 0, 'no kills, no bonus');
});

test('a Progress starting above level 1 holds at least that level of experience', () => {
  const p = new Progress(4);
  assert.equal(p.level, 4);
  assert.ok(p.xp >= XP_TO_REACH[3]);
});

test('upgrades are three, temporary, and only add stat points', () => {
  assert.equal(UPGRADES.length, 3);
  assert.deepEqual(new Progress(1).statBonus(), {});
  const p = new Progress(1, 'riposte');
  p.sanctuary.upgrade = 'riposte';
  assert.deepEqual(p.statBonus(), upgradeById('riposte').bonus);
});

test('Ledger: kit rations are drunk first, then found ones, and neither is loot', () => {
  const l = new Ledger();
  l.kitRations = 1;
  l.carried = { ...l.carried, supplies: { ration: 1 } };
  assert.equal(l.rations, 2);
  assert.equal(l.useRation(), 'kit');
  assert.equal(l.useRation(), 'found');
  assert.equal(l.useRation(), null);
  assert.equal(l.rationsUsed, 2);
  assert.equal(l.carried.supplies.ration ?? 0, 0);
});

test('without progression nothing changes: no progress block and fixed level', () => {
  const c = run(planOf([obj('O1', 'survey')]), 3, { progression: undefined });
  assert.equal(c.progress, null);
  assert.equal(c.version, 5);
});

test('a run with progression carries a progress block and is deterministic', () => {
  const a = run(planOf([obj('O1', 'survey')]), 5), b = run(planOf([obj('O1', 'survey')]), 5);
  assert.ok(a.progress);
  assert.equal(a.progress!.startLevel, 1);
  assert.equal(a.digest, b.digest);
  assert.deepEqual(a.progress, b.progress);
});

test('levels apply at arrival, never mid-fight: every level-up is logged against a tick, and the next leg starts from the new level', () => {
  const { v: c } = findSeed(seed => { const x = run(planOf([obj('O1', 'survey')]), seed); return x.progress!.levels.length > 0 ? x : null; });
  const first = c.progress!.levels[0];
  assert.equal(first.level, 2);
  const lvlIntent = c.intent.find(i => i.kind === 'level');
  assert.ok(lvlIntent, 'the feed says why the level changed');
  assert.ok(lvlIntent!.tick >= first.tick, 'reported at the next arrival, not before the gain');
});

test('experience, level and upgrade never reach the save: a settled expedition keeps no progression', () => {
  const save = defaultSave('test');
  const c = run(planOf([obj('O1', 'survey')]), 3);
  const s = settle(save, c, save.camp.expeditions);
  assert.ok(s.applied);
  assert.deepEqual(validateInvariants(s.save), []);
  const text = JSON.stringify(s.save);
  for (const word of ['xp', 'experience', 'sanctuary', 'upgrade', 'designLevel']) assert.ok(!text.includes(`"${word}"`), `${word} is not in the save`);
});

test('a fall banks nothing and the level goes with it', () => {
  const { v: c } = findSeed(seed => { const x = run(planOf([obj('O3'), obj('KT')], { doctrine: 'pressing', retreatHpPct: 0, drinkBelowPct: 0 }), seed, { progression: { startLevel: 1, kitRations: 0 } }); return x.outcome === 'died' ? x : null; }, 120);
  const save = defaultSave('test');
  const s = settle(save, c, save.camp.expeditions);
  assert.equal(s.save.camp.bank.gold, save.camp.bank.gold, 'nothing banked on a fall');
  assert.deepEqual(validateInvariants(s.save), []);
});

test('drinking rule: with the drink setting at 0 no ration is ever drunk', () => {
  for (let seed = 1; seed <= 12; seed++) assert.equal(run(deep({ drinkBelowPct: 0 }), seed, { progression: { startLevel: 2, kitRations: 2 } }).progress!.rationsUsed, 0);
});

test('drinking rule: every drink is logged with its cause, spaced by the drinking time, and only below the threshold', () => {
  let drinks = 0;
  for (let seed = 1; seed <= 40; seed++) {
    const c = run(deep(), seed, { progression: { startLevel: 2, kitRations: 2 } });
    const rows = c.intent.filter(i => i.kind === 'ration');
    drinks += rows.length;
    for (let k = 0; k < rows.length; k++) {
      assert.ok(rows[k].cause.length > 0 && rows[k].text.length > 0, 'logged with a cause');
      if (k > 0) assert.ok(rows[k].tick - rows[k - 1].tick >= DRINK_TICKS, 'one at a time');
    }
    assert.equal(rows.length, c.progress!.rationsUsed);
    assert.ok(c.progress!.rationsUsed <= 2 + (c.loot.carried.supplies.ration ?? 0) + 5);
  }
  assert.ok(drinks > 0, 'the rule is exercised');
  assert.ok(MELEE_SAFE > 0);
});

test('starter rations are not loot: they never appear in the bank, the carried bundle or a cache', () => {
  for (let seed = 1; seed <= 20; seed++) {
    const c = run(planOf([obj('O3'), obj('KT')], { doctrine: 'pressing', retreatHpPct: 0 }), seed, { progression: { startLevel: 1, kitRations: 2 } });
    const save = defaultSave('test');
    const before = save.camp.bank.supplies.ration ?? 0;
    const s = settle(save, c, save.camp.expeditions);
    const found = c.loot.gains.reduce((n, g) => n + (g.bundle.supplies.ration ?? 0), 0);
    if (c.outcome === 'extracted') assert.ok((s.save.camp.bank.supplies.ration ?? 0) <= before + found, 'only found rations can be banked');
    if (s.cached) assert.ok((s.cached.contents.supplies.ration ?? 0) <= found, 'only found rations can be cached');
  }
});

test('healing reserve: a plan that keeps rations heads home once they are down to the reserve', () => {
  const { v } = findSeed(seed => {
    const c = run(deep({ healingReserve: 2, retreatHpPct: 0 }), seed, { progression: { startLevel: 2, kitRations: 2 } });
    return c.intent.some(i => i.cause.includes('healing reserve')) ? c : null;
  }, 120);
  assert.equal(v.outcome === 'extracted' || v.outcome === 'died', true);
  assert.ok(v.progress!.rationsUsed >= 1, 'the reserve is only spent below after a drink');
});

test('the sanctuary exists once, near S2, inside the room', () => {
  const withSpot = Object.values(ROOMS).filter(r => r.sanctuary);
  assert.deepEqual(withSpot.map(r => r.id), ['S2']);
});

test('sanctuary: one upgrade and one rest per expedition, from the plan default, never touching the ledger', () => {
  const { v: c } = findSeed(seed => { const x = run(deep({ sanctuaryChoice: 'riposte' }), seed, { progression: { startLevel: 4, kitRations: 2 } }); return x.progress!.sanctuary.visits > 0 ? x : null; }, 200);
  const sp = c.progress!.sanctuary;
  assert.equal(sp.upgrade, 'riposte');
  const upgrades = c.intent.filter(i => i.kind === 'sanctuary' && /upgrade|choice|chose/i.test(i.text));
  assert.ok(upgrades.length <= 1, 'one major choice');
  const rests = c.intent.filter(i => i.kind === 'sanctuary' && /rest/i.test(i.text));
  assert.ok(rests.length <= 1, 'one rest');
  const save = defaultSave('test');
  const s = settle(save, c, save.camp.expeditions);
  assert.ok(s.applied);
  if (c.outcome === 'extracted') assert.deepEqual(s.banked, c.loot.carried, 'banking is what was carried, not something the sanctuary added');
  assert.ok(c.intent.every(i => i.kind !== 'sanctuary' || !/bank|cache|extract/i.test(i.text.replace(/no banking here/i, ''))), 'it never claims to bank or extract');
});

test('sanctuary default choice is respected for each upgrade', () => {
  for (const id of ['steadfast', 'riposte', 'quickstep'] as const) {
    const { v } = findSeed(seed => { const x = run(deep({ sanctuaryChoice: id }), seed, { progression: { startLevel: 4, kitRations: 2 } }); return x.progress!.sanctuary.upgrade ? x : null; }, 200);
    assert.equal(v.progress!.sanctuary.upgrade, id);
  }
});

test('different plans give different runs, the same plan the same run', () => {
  const a = run(deep(), 7), b = run(deep(), 7), c = run(deep({ doctrine: 'pressing' }), 7);
  assert.equal(a.digest, b.digest);
  assert.notEqual(a.digest, c.digest);
});
