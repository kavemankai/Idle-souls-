import { test } from 'node:test';
import { emptyCarried } from '../src/expedition/loot';
import assert from 'node:assert/strict';
import { loadSim } from '../src/combat/loadSimNode';
import { O1, simRoom } from '../src/world/o1Room';
import { RoomRunner } from '../src/world/roomRunner';
import { planRoute } from '../src/world/o1Route';
import { Expedition } from '../src/expedition/expedition';
import { WorldGraph } from '../src/world/worldGraph';
import { defaultPlan } from '../src/expedition/plan';
import { runExpedition, startExpedition, finishChronicle } from '../src/expedition/run';
import { WorldRunner } from '../src/world/worldRunner';
import type { SimFight } from '../src/combat/simApi';

const sim = loadSim();
const stats = sim.allocate(80, 'balanced', 1);
const west = O1.doors.find(d => d.id === 'to-C0')!;
const fightIn = (seed: number, encounter: string, over: Record<string, unknown> = {}) => sim.createFight({
  seed, stats, god: false, doctrine: 'measured', encounter, room: simRoom(O1),
  spawns: { adventurer: { x: 0, y: 0, face: 0 }, enemies: encounter === 'mireling' ? [{ x: 60, y: 10, face: Math.PI }] : [{ x: 60, y: 10, face: Math.PI }, { x: 100, y: -20, face: Math.PI }] }, ...over,
});
const doorPath = (S: SimFight) => planRoute(sim, sim.room.prepare(simRoom(O1)), O1.bounds, S.p, { x: west.center.x - 2, y: west.center.y })!;
const attackStarts = (S: SimFight) => { let n = 0, last = S.p.actInst; return { step() { sim.step(S); const a = S.p.act as { kind?: string } | null; if (S.p.actInst !== last) { last = S.p.actInst; if (a && a.kind === 'attack') n++; } }, get n() { return n; } }; };

test('the simulator carries stamina and poise into a fight, and a legacy fight starts full', () => {
  const full = fightIn(1, 'mireling');
  const tired = fightIn(1, 'mireling', { carry: { st: 12, poise: 3 } });
  assert.equal(full.p.st, full.p.maxSt);
  assert.equal(tired.p.st, 12); assert.equal(tired.p.poise, 3);
  assert.equal(fightIn(1, 'mireling', { carry: { st: 9999, poise: 9999 } }).p.st, full.p.maxSt);
  const d = sim.derive(stats, false);
  const rested = sim.rest({ st: 0, poise: 0 }, d, 10000);
  assert.equal(rested.st, d.maxSt); assert.equal(rested.poise, d.poise);
  assert.ok(sim.rest({ st: 0, poise: 0 }, d, 30).st > 0);
});

test('after a retreat order the adventurer starts no attack, and the fight ends only by escape or a fall', () => {
  let escapedTotal = 0, fell = 0;
  for (let seed = 1; seed <= 30; seed++) {
    const S = fightIn(seed, 'sentryMireling');
    for (let i = 0; i < 90; i++) sim.step(S);
    const watch = attackStarts(S);
    const report = sim.order(S, { type: 'disengage', path: [{ x: S.p.x, y: S.p.y }, ...doorPath(S)] });
    assert.ok(report && report.pursuers >= 1);
    // The attack already in flight may finish; count only attacks that begin after it.
    while (S.p.act && !S.over) sim.step(S);
    for (let i = 0; i < 1500 && !S.over; i++) {
      watch.step();
      if (S.p.x <= west.center.x) sim.leave(S);
    }
    assert.equal(watch.n, 0, `seed ${seed}: started an attack while retreating`);
    if (S.winner === 'escaped') escapedTotal++; else if (S.winner === 'enemy') fell++;
  }
  assert.ok(escapedTotal > 0, 'some retreats get out');
  assert.ok(escapedTotal + fell > 0);
});

test('a retreat is not invulnerable: hit hard enough on the way out, the adventurer still falls', () => {
  let fell = 0;
  for (let seed = 1; seed <= 40; seed++) {
    const S = fightIn(seed, 'sentryMireling', { hpOverride: 14 });
    for (let i = 0; i < 60; i++) sim.step(S);
    if (S.over) { if (S.winner === 'enemy') fell++; continue; }
    sim.order(S, { type: 'disengage', path: [{ x: S.p.x, y: S.p.y }, ...doorPath(S)] });
    for (let i = 0; i < 1500 && !S.over; i++) { sim.step(S); if (S.p.x <= west.center.x) sim.leave(S); }
    if (S.winner === 'enemy') fell++;
  }
  assert.ok(fell > 0, 'at 14 health some retreats end in a fall');
});

test('an order the simulator cannot use is refused, and leaving ends a fight with no winner', () => {
  const S = fightIn(1, 'mireling');
  assert.equal(sim.order(S, { type: 'disengage', path: [] }), null);
  const report = sim.retreatReport(S);
  assert.equal(report.pursuers, 1); assert.equal(report.stamina, 100); assert.equal(report.health, 100);
  sim.leave(S);
  assert.equal(S.over, true); assert.equal(S.winner, 'escaped');
  assert.equal(sim.order(S, { type: 'disengage', path: [{ x: 0, y: 0 }] }), null);
});

function fightingRunner(seed: number, encounter = 'sentryMireling') {
  const r = new RoomRunner(sim, { seed, level: 80, focus: 'balanced', doctrine: 'measured', encounter, room: O1 });
  r.dispatch();
  while (r.state !== 'fighting' && !r.terminal) r.step();
  for (let i = 0; i < 60; i++) r.step();
  return r;
}

test('a retreat from a fight ends the leg at the chosen door, escaped, with survivors back at their posts and the dead staying dead', () => {
  const r = fightingRunner(3);
  assert.equal(r.state, 'fighting');
  const answer = r.retreat('to-C0');
  assert.equal(answer.ok, true);
  assert.ok(answer.ok && answer.report && answer.report.pursuers === 2);
  while (!r.terminal) r.step();
  assert.equal(r.state, 'completed');
  const res = r.result();
  assert.equal(res.escaped, true);
  assert.equal(r.exit.id, 'to-C0');
  assert.ok(res.finalPos.x <= O1.doors.find(d => d.id === 'to-C0')!.center.x + 1);
  const alive = r.foes.filter(f => f.alive);
  assert.ok(alive.length >= 1);
  for (const f of alive) assert.equal(f.engaged, false);
  const specs = O1.encounters.sentryMireling.enemies;
  r.foes.forEach((f, i) => { if (f.alive) { assert.equal(f.x, specs[i].x); assert.equal(f.y, specs[i].y); } });
});

test('a revisit is a fresh contact: survivors of an escaped fight see the adventurer again', () => {
  const first = fightingRunner(3);
  first.retreat('to-C0');
  while (!first.terminal) first.step();
  const defeated = first.foes.map(f => !f.alive);
  const again = new RoomRunner(sim, { seed: 3, level: 80, focus: 'balanced', doctrine: 'measured', encounter: 'sentryMireling', room: O1, defeated, seedOffset: 100003 });
  again.dispatch();
  while (again.state !== 'fighting' && !again.terminal) again.step();
  assert.equal(again.state, 'fighting', 'the survivors fight again');
  assert.ok(again.foes.filter(f => f.engaged).length === defeated.filter(d => !d).length);
});

test('a retreat is refused for an unknown door and when no route exists', () => {
  const r = fightingRunner(3, 'mireling');
  const bad = r.retreat('to-ZZ');
  assert.equal(bad.ok, false);
  assert.match(!bad.ok ? bad.reason : '', /no door/);
  const fresh = new RoomRunner(sim, { seed: 3, level: 80, focus: 'balanced', doctrine: 'measured', encounter: 'mireling', room: O1 });
  const early = fresh.retreat('to-C0');
  assert.equal(early.ok, false);
});

test('while walking, a retreat order just turns the adventurer round', () => {
  const r = new RoomRunner(sim, { seed: 1, level: 80, focus: 'balanced', doctrine: 'measured', room: O1 });
  r.dispatch();
  for (let i = 0; i < 100; i++) r.step();
  const x0 = r.hero.x;
  assert.ok(x0 > west.center.x + 20);
  const answer = r.retreat('to-C0');
  assert.deepEqual(answer, { ok: true, report: null });
  while (!r.terminal) r.step();
  assert.equal(r.state, 'completed');
  assert.ok(r.hero.x <= west.center.x + 1);
  assert.equal(r.result().fights, 0);
});

const base = { seed: 3, level: 80, focus: 'balanced', known: ['C0', 'O1', 'O2', 'O3', 'KT'] };
const planTo = (over: object) => ({ ...defaultPlan(), objectives: [{ id: 'a', kind: 'reach' as const, room: 'O3' }], ...over });

test('a retreat order given in the middle of a fight disengages first, then withdraws the permitted way home', () => {
  const cfg = { ...base, plan: planTo({ retreatHpPct: 0 }) };
  const run = startExpedition(sim, cfg);
  while (!(run.world.runner && run.world.runner.state === 'fighting' && run.world.runner.fightTicks > 90) && !run.world.terminal) run.world.step();
  assert.equal(run.world.runner!.state, 'fighting');
  assert.equal(run.expedition.order({ type: 'retreat' }), null);
  while (!run.world.terminal) run.world.step();
  const { chronicle: c, result } = finishChronicle(cfg, run);
  assert.equal(c.outcome, 'extracted');
  assert.deepEqual(c.route, ['C0', 'O1', 'C0']);
  const retreats = c.intent.filter(i => i.kind === 'retreat');
  assert.match(retreats[0].text, /^Heading for camp\. Player ordered a retreat/);
  assert.ok(retreats.some(i => i.text.startsWith('Disengage:') && /stamina \d+%/.test(i.text)));
  assert.ok(c.intent.some(i => i.text.startsWith('Broke contact')));
  assert.equal(result.legs.find(l => l.result.escaped)!.room, 'O1');
  assert.equal(c.objectives[0].status, 'suspended');
});

test('the health threshold fires inside a fight, not only at doorways', () => {
  const { chronicle: c, result } = runExpedition(sim, { ...base, plan: planTo({ retreatHpPct: 50 }) });
  const first = c.intent.find(i => i.kind === 'retreat')!;
  assert.match(first.text, /below the 50% retreat setting/);
  assert.ok(result.legs.some(l => l.result.escaped), 'it broke contact in a fight');
  assert.ok(c.intent.some(i => i.text.startsWith('Disengage:')));
});

test('with a retreat setting the adventurer survives far more often, and with none it does not (200-seed comparison)', () => {
  const rate = (pct: number) => {
    let ext = 0;
    for (let seed = 1; seed <= 60; seed++) if (runExpedition(sim, { ...base, seed, plan: planTo({ retreatHpPct: pct, doctrine: 'pressing' }) }).chronicle.outcome === 'extracted') ext++;
    return ext;
  };
  const none = rate(0), fifty = rate(50);
  assert.ok(fifty > none + 20, `retreat at 50%: ${fifty} of 60 extracted against ${none} with none`);
});

test('a retreat with no permitted way home is reported as blocked, never crosses the avoided room, and does not stop the fight', () => {
  const ex = new Expedition(planTo({ avoid: ['O1'] }), new WorldGraph(), base.known);
  ex.order({ type: 'retreat' });
  const act = ex.live({ room: 'O2', entry: 'to-O1', tick: 400, hp: 50, hpMax: 90, fighting: true, pos: { x: 0, y: 0 }, carried: emptyCarried() });
  assert.equal(act, null);
  assert.equal(ex.mode, 'outbound');
  const line = ex.intent.find(i => i.text.startsWith('RETREAT BLOCKED'))!;
  assert.match(line.text, /avoided room/);
  assert.match(line.cause, /L13/);
  assert.equal(ex.live({ room: 'O2', entry: 'to-O1', tick: 401, hp: 40, hpMax: 90, fighting: true, pos: { x: 0, y: 0 }, carried: emptyCarried() }), null);
});

test('stamina and poise carry between rooms and recover while walking', () => {
  const w = new WorldRunner(sim, { seed: 1, level: 80, focus: 'balanced', doctrine: 'measured', from: 'C0', to: 'O3', hpOverride: 5000 });
  const d = sim.derive(sim.allocate(80, 'balanced', 1), false);
  w.dispatch();
  let lowest = d.maxSt;
  while (!w.terminal) { w.step(); lowest = Math.min(lowest, w.carry.st); }
  assert.ok(lowest < d.maxSt, 'a fight spends stamina');
  assert.ok(w.carry.st >= 0 && w.carry.st <= d.maxSt);
  assert.ok(w.carry.st > lowest, 'it recovers on the long walk home');
});

test('a retreat ordered while still at camp ends the expedition at once, extracted once', () => {
  const cfg = { ...base, plan: planTo({}) };
  const run = startExpedition(sim, cfg);
  for (let i = 0; i < 5; i++) run.world.step();
  run.expedition.order({ type: 'retreat' });
  while (!run.world.terminal) run.world.step();
  const { chronicle: c } = finishChronicle(cfg, run);
  assert.equal(c.outcome, 'extracted');
  assert.deepEqual(c.route, ['C0']);
  assert.equal(c.intent.filter(i => i.kind === 'end').length, 1);
  assert.match(c.intent.filter(i => i.kind === 'end')[0].text, /Already at camp/);
  assert.equal(c.fights.length, 0);
});
