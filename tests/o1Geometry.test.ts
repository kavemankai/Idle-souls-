import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadSim } from '../src/combat/loadSimNode';
import { O1, simRoom } from '../src/world/o1Room';
import { planRoute, type Point } from '../src/world/o1Route';
import { sees } from '../src/world/o1Sight';

const sim = loadSim();
const room = sim.room.prepare(simRoom());
const R = 13;
const length = (a: Point, pts: Point[]) => pts.reduce((sum, p, i) => sum + Math.hypot(p.x - (i ? pts[i - 1].x : a.x), p.y - (i ? pts[i - 1].y : a.y)), 0);
const along = (a: Point, pts: Point[]) => {
  const out: Point[] = []; let from = a;
  for (const p of pts) { const n = Math.ceil(Math.hypot(p.x - from.x, p.y - from.y)); for (let k = 0; k <= n; k++) out.push({ x: from.x + (p.x - from.x) * k / n, y: from.y + (p.y - from.y) * k / n }); from = p; }
  return out;
};

test('O1 keeps the 480x440 floor, a pillar at (10,-125) and one manifest for every consumer', () => {
  assert.deepEqual(O1.floor, { x: [-240, 240], y: [-220, 220] });
  assert.deepEqual(O1.solids.circles.find(c => c.id === 'pillar'), { id: 'pillar', x: 10, y: -125, r: 27 });
  assert.equal(O1.solids.rects.length, 6);
});
test('north and south boundaries are continuous across the whole room', () => {
  for (let x = -290; x <= 290; x += 5) {
    assert.ok(sim.room.nearest(room, x, -201).d < 0, `a body cannot stand in the north wall at x=${x}`);
    assert.ok(sim.room.nearest(room, x, 201).d < 0, `a body cannot stand in the south wall at x=${x}`);
  }
  for (let x = -225; x <= 225; x += 5) {
    assert.ok(sim.room.nearest(room, x, -200 + R).d >= R - 1e-9, `body fits against the north wall at x=${x}`);
    assert.ok(sim.room.nearest(room, x, 200 - R).d >= R - 1e-9, `body fits against the south wall at x=${x}`);
  }
});
test('west and east openings are 174 wide and leave clearance for a radius-13 body along the road', () => {
  for (let x = -285; x <= 285; x += 4) assert.ok(sim.room.nearest(room, x, 0).d >= R + 2, `doorway clearance at x=${x}`);
  for (const x of [-270, 270]) {
    assert.ok(sim.room.nearest(room, x, 74).d >= R - 1e-9 && sim.room.nearest(room, x, -74).d >= R - 1e-9, 'a body fits at the edge of the opening');
    assert.ok(sim.room.nearest(room, x, 80).d < R, 'a body does not fit beside the opening');
  }
});
test('route bends around the pillar and never touches it', () => {
  const from = { x: -60, y: -125 }, to = { x: 80, y: -125 };
  assert.equal(sim.room.losClear(room, from.x, from.y, to.x, to.y), false, 'straight line crosses the pillar');
  const route = planRoute(sim, room, O1.bounds, from, to)!;
  assert.ok(route, 'route exists');
  assert.ok(route.length >= 2, 'route needs a waypoint beside the pillar');
  assert.ok(length(from, route) > 140 + 5, 'longer than the blocked straight line');
  for (const p of along(from, route)) assert.ok(sim.room.nearest(room, p.x, p.y).d >= R, `clear of solids at ${p.x.toFixed(1)},${p.y.toFixed(1)}`);
  assert.deepEqual(route[route.length - 1], to);
});
test('route is deterministic and reports no route into a solid', () => {
  const a = planRoute(sim, room, O1.bounds, { x: -240, y: 0 }, { x: 242, y: 0 });
  const b = planRoute(sim, room, O1.bounds, { x: -240, y: 0 }, { x: 242, y: 0 });
  assert.deepEqual(a, b);
  assert.equal(planRoute(sim, room, O1.bounds, { x: -240, y: 0 }, { x: 10, y: -125 }), null, 'goal inside the pillar');
  assert.equal(planRoute(sim, room, O1.bounds, { x: -240, y: 0 }, { x: 0, y: -230 }), null, 'goal inside the north wall');
});
test('sight is blocked by the pillar and limited by range and arc', () => {
  const s = { range: 160, arcDegrees: 120 };
  const watcher = { x: 10, y: -175, face: Math.PI / 2 };
  assert.equal(sees(sim, room, watcher, { x: 10, y: -70 }, s), false, 'pillar between watcher and target');
  assert.equal(sees(sim, room, watcher, { x: 120, y: -70 }, s), true, 'same range, clear of the pillar');
  const west = { x: 0, y: 0, face: 0 };
  assert.equal(sees(sim, room, west, { x: 159, y: 0 }, s), true);
  assert.equal(sees(sim, room, west, { x: 161, y: 0 }, s), false, 'just beyond range');
  const at = (deg: number) => ({ x: 100 * Math.cos(deg * Math.PI / 180), y: 100 * Math.sin(deg * Math.PI / 180) });
  assert.equal(sees(sim, room, west, at(59), s), true);
  assert.equal(sees(sim, room, west, at(61), s), false, 'just outside the 120 degree cone');
});
