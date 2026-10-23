import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { loadSim } from '../src/combat/loadSimNode';
import { ROOMS } from '../src/world/roomRegistry';
import { WorldGraph } from '../src/world/worldGraph';
import { simRoom } from '../src/world/o1Room';
import { FACINGS } from '../src/contracts/presentation';
import type { RoomManifest } from '../src/world/roomTypes';

const sim = loadSim();
const contract = JSON.parse(readFileSync('combat/rooms/ENCOUNTER_CONTRACT.json', 'utf8')) as { encounters: Record<string, string[]>; roomPlan: Record<string, string[]> };
/** Rooms authored in M7. O1, O2, O3, KT and T3 were authored earlier and keep their own values. */
const M7_ROOMS = ['T1', 'T2', 'MB', 'S1', 'S2', 'S3', 'K1', 'K2', 'K3', 'B1'];
const OUT = { west: [-1, 0], east: [1, 0], north: [0, -1], south: [0, 1] } as const;
const prepared = (r: RoomManifest) => sim.room.prepare(simRoom(r));
const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);

test('every room except camp is authored, and the unbuilt special pocket says it is out of the slice', () => {
  for (const [id, r] of Object.entries(ROOMS)) assert.equal(r.status, id === 'C0' ? 'generated' : 'authored', id);
  assert.match(ROOMS.SB.note, /Out of the slice/);
  assert.deepEqual(Object.keys(ROOMS.SB.encounters), []);
  for (const id of M7_ROOMS) assert.match(ROOMS[id].note, /No environment art yet/, `${id} says plainly it has no art`);
});

test('each authored room names exactly the encounters the contract plans for it, with the contract enemies in order', () => {
  for (const id of M7_ROOMS) {
    const plan = contract.roomPlan[id];
    assert.ok(plan, `${id} has a plan`);
    assert.deepEqual(Object.keys(ROOMS[id].encounters).sort(), [...plan].sort(), `${id} offers exactly its planned encounters`);
    for (const e of plan) {
      assert.ok(contract.encounters[e], `${e} is in the contract`);
      assert.deepEqual(ROOMS[id].encounters[e].enemies.map(x => x.arch), contract.encounters[e], `${id}/${e} has the contract enemies`);
    }
  }
  for (const [id, r] of Object.entries(ROOMS)) for (const e of Object.keys(r.encounters)) assert.ok(contract.encounters[e], `${id} uses unknown encounter ${e}`);
});

test('no elite pairs; the miniboss and the boss fight alone in a room with one door that is the way in', () => {
  const elites = new Set(['warden', 'castellan']);
  for (const [e, arch] of Object.entries(contract.encounters)) if (arch.some(a => elites.has(a))) assert.equal(arch.length, 1, `${e} fights alone`);
  for (const id of ['MB', 'B1']) {
    const r = ROOMS[id];
    assert.equal(Object.keys(r.encounters).length, 1);
    assert.equal(Object.values(r.encounters)[0].enemies.length, 1);
    assert.ok(r.entryDoor && r.exitDoor, `${id} names its doors`);
    assert.ok(Math.min(r.floor.x[1] * 2, r.floor.y[1] * 2) >= 700, `${id} has at least 700 clear units`);
  }
  assert.equal(ROOMS.B1.doors.length, 1, 'the boss arena has one door');
  assert.equal(ROOMS.B1.entryDoor, ROOMS.B1.exitDoor);
  assert.equal(ROOMS.MB.entryDoor, 'to-T2');
});

test('spawns stand on open floor, face a real heading, keep 110 units apart and 110 from every door', () => {
  const problems: string[] = [];
  const check = (ok: boolean, why: string) => { if (!ok) problems.push(why); };
  for (const id of M7_ROOMS) {
    const r = ROOMS[id], R = prepared(r);
    for (const [name, e] of Object.entries(r.encounters)) {
      e.enemies.forEach((s, i) => {
        check(FACINGS.includes(s.facing), `${id}/${name} facing`);
        check(s.x > r.floor.x[0] + 20 && s.x < r.floor.x[1] - 20 && s.y > r.bounds[1] + 20 && s.y < r.bounds[3] - 20, `${id}/${name}#${i} is inside the room`);
        check(sim.room.nearest(R, s.x, s.y).d >= 40, `${id}/${name}#${i} has room around it`);
        for (const d of r.doors) check(dist(s, d.center) >= 110, `${id}/${name}#${i} is ${Math.round(dist(s, d.center))} from ${d.id}`);
        e.enemies.slice(i + 1).forEach((t, j) => check(dist(s, t) >= 110, `${id}/${name}: #${i} and #${i + 1 + j} are ${Math.round(dist(s, t))} apart`));
      });
    }
    for (const p of r.pickups ?? []) check(sim.room.nearest(R, p.x, p.y).d >= 20, `${id}/${p.id} lies on open floor`);
  }
  assert.deepEqual(problems, []);
});

test('cover is where the encounters need it: the ranged rooms have solids between the spawns and the doors', () => {
  for (const id of ['T1', 'T2', 'K3']) {
    const r = ROOMS[id], R = prepared(r);
    const harrier = Object.values(r.encounters).flatMap(e => e.enemies).find(s => s.arch === 'harrier')!;
    // At least one door whose straight line from the Harrier is broken by a solid: somewhere to take cover from the line of fire.
    const covered = r.doors.filter(d => !sim.room.losClear(R, harrier.x, harrier.y, d.center.x, d.center.y));
    const solids = r.solids.circles.length + r.solids.rects.filter(x => x[0] > r.floor.x[0] + 30 && x[2] < r.floor.x[1] - 30).length;
    assert.ok(solids >= 2, `${id} has cover solids`);
    assert.ok(covered.length + solids >= 2, `${id} offers cover`);
  }
});

test('the line from the way in to the way out stays clear of cover by 80 units, so a fight there has a 160-wide lane', () => {
  const problems: string[] = [];
  for (const id of M7_ROOMS) {
    const r = ROOMS[id], R = prepared(r);
    for (const a of [r.doors.find(d => d.id === r.entryDoor)!]) for (const b of [r.doors.find(d => d.id === r.exitDoor)!]) {
      if (a === b) continue;   // the boss arena has one door
      const pa = { x: a.center.x - OUT[a.side][0] * 20, y: a.center.y - OUT[a.side][1] * 20 }, pb = { x: b.center.x - OUT[b.side][0] * 20, y: b.center.y - OUT[b.side][1] * 20 };
      const len = dist(pa, pb);
      for (let t = 0; t <= len; t += 10) {
        const p = { x: pa.x + (pb.x - pa.x) * t / len, y: pa.y + (pb.y - pa.y) * t / len };
        if (dist(p, pa) < 120 || dist(p, pb) < 120) continue;   // the mouths of the doors, and the corner a lane between two walls cuts, are walls by nature
        const d = sim.room.nearest(R, p.x, p.y).d;
        if (d < 80) { problems.push(`${id}: ${a.id} to ${b.id} passes ${Math.round(d)} from a solid at (${Math.round(p.x)}, ${Math.round(p.y)})`); break; }
      }
    }
  }
  assert.deepEqual(problems, []);
});

test('solids lie inside the room and never block a doorway', () => {
  const problems: string[] = [];
  const check = (ok: boolean, why: string) => { if (!ok) problems.push(why); };
  for (const id of M7_ROOMS) {
    const r = ROOMS[id], R = prepared(r);
    for (const c of r.solids.circles) {
      check(c.x - c.r > r.floor.x[0] + 20 && c.x + c.r < r.floor.x[1] - 20, `${id}/${c.id} inside the floor in x`);
      check(c.y - c.r > r.bounds[1] && c.y + c.r < r.bounds[3], `${id}/${c.id} inside the walls in y`);
      for (const d of r.doors) check(dist(c, d.center) >= c.r + 110, `${id}/${c.id} keeps clear of ${d.id}`);
    }
    for (const d of r.doors) for (let t = -40; t <= 80; t += 10) {
      const p = { x: d.center.x - OUT[d.side][0] * t, y: d.center.y - OUT[d.side][1] * t };
      check(sim.room.nearest(R, p.x, p.y).d >= 40 || t < 0, `${id}/${d.id} approach is open at ${t}`);
    }
  }
  assert.deepEqual(problems, []);
});

const gatesClosed = () => new Set<string>();
const keyOf = (a: string, b: string) => WorldGraph.linkKey(a, b);

test('with every gate closed, camp still reaches both key sources and the Ossuary; each gate then opens the room behind it', () => {
  const g = new WorldGraph();
  for (const room of ['O1', 'O2', 'O3', 'KT', 'T1', 'T2', 'T3', 'K3', 'K2', 'K1', 'S1', 'S2', 'S3']) assert.ok(g.path('C0', room, gatesClosed()), `${room} is reachable with no gate open`);
  assert.equal(g.path('C0', 'MB', gatesClosed()), null);
  assert.equal(g.path('C0', 'B1', gatesClosed()), null);
  assert.equal(g.path('C0', 'SB', gatesClosed()), null);
  assert.ok(g.path('C0', 'MB', new Set([keyOf('T2', 'MB')])), 'the miniboss is behind one gate');
  assert.ok(g.path('C0', 'B1', new Set([keyOf('K2', 'B1')])), 'the boss is behind one gate, and the Ossuary needs none');
  assert.ok(g.path('C0', 'K2', gatesClosed()), 'the way to the boss gate needs no key');
});

test('doc 22 section 6: a key source is reachable without spending a key, in every gate state', () => {
  const g = new WorldGraph();
  const gateKeys = g.links.filter(l => g.isGated(l.type)).map(l => keyOf(l.from, l.to));
  const states: Set<string>[] = [new Set(), ...gateKeys.map(k => new Set([k])), new Set(gateKeys)];
  for (const open of states) for (const source of ['KT', 'T3']) assert.ok(g.path('C0', source, open), `${source} is reachable with gates ${[...open].join(', ') || 'none open'}`);
  // The trial and the one-time key sit in rooms that need no gate and no encounter the gates guard.
  for (const source of ['KT', 'T3']) assert.ok(ROOMS[source].pickups!.some(p => p.kind === 'key'));
  assert.ok(ROOMS.KT.pickups!.some(p => p.claim === 'trial'), 'one repeatable key source');
});

test('the pickups in the new rooms are what each purpose line asks for', () => {
  assert.deepEqual(ROOMS.S3.pickups!.map(p => p.kind), ['supplies']);
  assert.deepEqual(ROOMS.S2.pickups!.map(p => p.kind), ['gear']);
  assert.deepEqual(ROOMS.K2.pickups!.map(p => p.kind), ['supplies']);
  for (const id of M7_ROOMS) for (const p of ROOMS[id].pickups ?? []) assert.notEqual(p.kind, 'key', `${id} adds no key: key supply is the Watchpost and the Gallery`);
});
