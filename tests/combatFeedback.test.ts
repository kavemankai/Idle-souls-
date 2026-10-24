import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { CombatView, CombatantView } from '../src/contracts/presentation';
import { CombatFeedbackTracker, combatHealthBars } from '../src/presentation/combatFeedback';
import type { ExpeditionVisualState } from '../src/presentation/expeditionVisual';

function state(tick: number, heroHp: number, foeHp: number, blocks = 0, parries = 0,
  perfects = 0, key = 'O1:1:1'): ExpeditionVisualState {
  const fighter = (name: string, hp: number, max: number): CombatantView => ({
    id: name, name, x: name === 'Hero' ? 0 : 35, y: 0, radius: 10,
    hp: { value: hp, max }, stamina: { value: 20, max: 40 }, poise: { value: 20, max: 40 },
    staggered: false, blocking: false, guardStance: false, parryActive: false,
    parryWindowLive: false, invulnerable: false, flash: 0, heading: 0, guardArc: 1,
    attack: null,
  });
  const hero = fighter('Hero', heroHp, 100), foe = fighter('Mireling', foeHp, 35);
  const combat = {
    combatants: [hero, foe],
    totals: { blocks, perfects, parries, dealt: 0, taken: 0, dodges: 0, punishes: 0,
      dodgeCounters: 0, guardBreaksDealt: 0, counteredHits: 0 },
  } as CombatView;
  return {
    room: 'O1', tick, fightKey: key, fighting: true, passage: false,
    heroHealth: hero.hp, combat,
    actors: [
      { id: 'hero', archetype: 'adventurer', illustrated: true, x: 0, y: 0, facing: 'E',
        action: 'guard', phase: 'active', progress: .5, visible: true, combatSlot: 0 },
      { id: 'foe-0', archetype: 'mireling', illustrated: true, x: 35, y: 0, facing: 'W',
        action: 'light', phase: 'active', progress: .5, visible: true, combatSlot: 1 },
    ],
  };
}
test('HP bars use real hero and enemy gauge values including exact combat slot mapping', () => {
  const v = state(40, 88.5, 20.25);
  assert.deepEqual(combatHealthBars(v).map(b => [b.actorId, b.hp.value, b.hp.max]),
    [['hero', 88.5, 100], ['foe-0', 20.25, 35]]);
  const travelling: ExpeditionVisualState = { ...v, fighting: false, combat: undefined, fightKey: null };
  assert.equal(combatHealthBars(travelling).length, 1);
  assert.equal(combatHealthBars(travelling)[0].hp.value, 88.5);
});
test('combat popup values are actual net HP changes, never estimates from animations', () => {
  const tracker = new CombatFeedbackTracker();
  assert.deepEqual(tracker.sample(state(40, 100, 35)), [], 'first view, including restore, establishes baseline');
  assert.deepEqual(tracker.sample(state(40, 100, 35)), [], 'repaint at same simulation tick must not duplicate');
  assert.deepEqual(tracker.sample(state(42, 89, 30.5)).map(c => [c.actorId, c.kind, c.amount, c.label]),
    [['hero', 'damage', 11, '−11'], ['foe-0', 'damage', 4.5, '−4.5']]);
  assert.deepEqual(tracker.sample(state(45, 94, 30.5)).map(c => [c.actorId, c.kind, c.amount, c.label]),
    [['hero', 'heal', 5, '+5']]);
  assert.deepEqual(tracker.sample(state(46, 94, 30.5)), [], 'no HP change: no invented attack number');
});
test('block, perfect block and parry only appear when authoritative counters advance', () => {
  const tracker = new CombatFeedbackTracker();
  tracker.sample(state(100, 100, 35));
  assert.deepEqual(tracker.sample(state(101, 100, 35)).map(e => e.kind), []);
  assert.deepEqual(tracker.sample(state(102, 100, 35, 1)).map(e => e.label), ['BLOCK']);
  assert.deepEqual(tracker.sample(state(103, 100, 35, 1, 0, 1)).map(e => e.label), ['PERFECT BLOCK']);
  assert.deepEqual(tracker.sample(state(104, 100, 35, 1, 1, 1)).map(e => e.label), ['PARRY']);
  assert.deepEqual(tracker.sample(state(104, 100, 35, 2, 2, 2)), [], 'same tick does not repeat events');
});
test('new fight, restored state, and leaving combat reset the baseline without phantom numbers', () => {
  const tracker = new CombatFeedbackTracker();
  tracker.sample(state(70, 100, 35));
  assert.equal(tracker.sample(state(71, 80, 20)).length, 2);
  assert.deepEqual(tracker.sample(state(72, 50, 35, 0, 0, 0, 'O1:1:2')), [], 'second fight is fresh baseline');
  assert.deepEqual(tracker.sample(state(50, 30, 20, 0, 0, 0, 'O1:1:2')), [], 'rewind on restored checkpoint');
  assert.deepEqual(tracker.sample({ ...state(51, 30, 20), fighting: false, combat: undefined, fightKey: null }), []);
  assert.deepEqual(tracker.sample(state(52, 12, 3)), [], 'returning to combat is again a baseline');
});
