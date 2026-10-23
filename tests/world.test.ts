import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { buildWorld, files } from '../tools/world/build-rooms';
import { loadSim } from '../src/combat/loadSimNode';
import { ROOMS } from '../src/world/roomRegistry';
import { WorldGraph } from '../src/world/worldGraph';
import { planRoute } from '../src/world/o1Route';
import { simRoom } from '../src/world/o1Room';
import type { WorldFile } from '../src/world/roomTypes';

const sim = loadSim();
const { rooms, world } = buildWorld();

test('the committed room files are exactly what the generator produces', () => {
  assert.deepEqual(files(), files(), 'deterministic');
  for (const [path, text] of Object.entries(files())) { assert.ok(existsSync(path), `${path} exists`); assert.equal(readFileSync(path, 'utf8'), text, `${path} is current`); }
});
test('the world has the 17 rooms and 19 links of the slice schedule', () => {
  assert.equal(world.rooms.length, 17); assert.equal(world.links.length, 19);
  assert.deepEqual(Object.keys(ROOMS).sort(), world.rooms.map(r => r.id).sort(), 'the registry lists every room');
  assert.deepEqual(world.rooms.map(r => r.id).sort(), Object.keys(rooms).sort());
});
test('every link has a door in both rooms, 174 wide, on the wall that faces the neighbour', () => {
  for (const l of world.links) for (const [room, id, other] of [[l.from, l.doors.from, l.to], [l.to, l.doors.to, l.from]]) {
    const door = rooms[room].doors.find(d => d.id === id);
    assert.ok(door, `${room} has ${id}`); assert.equal(door.to, other); assert.equal(door.linkType, l.type);
    assert.equal(door.span[1] - door.span[0], 174);
  }
  for (const r of Object.values(rooms)) assert.equal(r.doors.length, world.links.filter(l => l.from === r.id || l.to === r.id).length, `${r.id} has one door per link`);
});
test('doors sit inside their wall with solid wall at both ends and between doors', () => {
  for (const r of Object.values(rooms)) {
    const hh = r.floor.y[1], hw = r.floor.x[1];
    for (const side of ['west', 'east', 'north', 'south'] as const) {
      const spans = r.doors.filter(d => d.side === side).map(d => d.span).sort((a, b) => a[0] - b[0]);
      const half = side === 'west' || side === 'east' ? hh - 20 : hw - 20 + 40;   // wall piece reaches a little further on north and south
      spans.forEach(([a, b], i) => {
        assert.ok(a >= -half && b <= half, `${r.id} ${side} door span ${a}..${b} fits the wall`);
        if (i > 0) assert.ok(a - spans[i - 1][1] >= 26, `${r.id} ${side} doors leave at least a body width between them`);
      });
    }
  }
});
test('a radius-13 body can walk the centre line of every door and the room between every pair of doors', () => {
  const R = 13;
  for (const r of Object.values(rooms)) {
    const room = sim.room.prepare(simRoom(r));
    const out = { west: [-1, 0], east: [1, 0], north: [0, -1], south: [0, 1] } as const;
    for (const d of r.doors) {
      for (let t = -30; t <= 30; t += 5) { // from inside the room to the end of the doorway
        const p = { x: d.center.x + out[d.side][0] * t, y: d.center.y + out[d.side][1] * t };
        assert.ok(sim.room.nearest(room, p.x, p.y).d >= R, `${r.id} ${d.id} is clear at ${t}`);
      }
    }
    for (const a of r.doors) for (const b of r.doors) {
      if (a === b) continue;
      const inside = { x: a.center.x - out[a.side][0] * 20, y: a.center.y - out[a.side][1] * 20 };
      const goal = { x: b.center.x + out[b.side][0] * 2, y: b.center.y + out[b.side][1] * 2 };
      assert.ok(planRoute(sim, room, r.bounds, inside, goal), `${r.id}: route from ${a.id} to ${b.id}`);
    }
  }
});
test('solids stay inside the bounds and the floor matches the schedule', () => {
  for (const wr of world.rooms) {
    const r = rooms[wr.id];
    assert.equal(r.floor.x[1] * 2, wr.floor.w); assert.equal(r.floor.y[1] * 2, wr.floor.h);
    for (const [x0, y0, x1, y1] of r.solids.rects) { assert.ok(x1 > x0 && y1 > y0, `${wr.id} rect is not empty`); assert.ok(x0 >= r.bounds[0] - 60 && x1 <= r.bounds[2] + 60 && y0 >= r.bounds[1] - 60 && y1 <= r.bounds[3] + 60, `${wr.id} walls stay within one wall thickness of the bounds`); }
  }
});
test('O1 keeps the values it had before the generator', () => {
  const o1 = rooms.O1;
  assert.deepEqual(o1.entry, { x: -240, y: 0 }); assert.deepEqual(o1.threshold, { x: 240, y: [-87, 87] });
  assert.equal(o1.solids.rects.length, 6); assert.deepEqual(o1.solids.circles, [{ id: 'pillar', x: 10, y: -125, r: 27 }]);
  assert.deepEqual(Object.keys(o1.encounters).sort(), ['mireling', 'mireling2', 'sentry', 'sentryMireling']);
  assert.equal(o1.status, 'authored'); assert.equal(rooms.C0.status, 'generated');
});

test('the world graph loads, finds neighbours and paths, and keeps gated links closed', () => {
  const g = new WorldGraph();
  assert.equal(g.rooms.size, 17); assert.equal(g.links.length, 19);
  assert.deepEqual(g.neighbours('O1').map(n => n.room), ['C0', 'O2']);
  assert.deepEqual(g.path('C0', 'O3'), ['C0', 'O1', 'O2', 'O3']);
  assert.equal(g.path('C0', 'MB'), null, 'the miniboss door is a fog gate');
  assert.deepEqual(g.path('C0', 'S3', new Set([WorldGraph.linkKey('S3', 'C0')])), ['C0', 'S3'], 'the sluice shortcut opens a direct return');
  assert.equal(WorldGraph.linkKey('O1', 'C0'), WorldGraph.linkKey('C0', 'O1'));
});
test('the world graph rejects bad files with readable reasons', () => {
  const good = JSON.parse(JSON.stringify(world)) as WorldFile;
  const bad = (f: (w: WorldFile) => void) => { const w = JSON.parse(JSON.stringify(good)) as WorldFile; f(w); return WorldGraph.validate(w).join(' | '); };
  assert.match(bad(w => { w.rooms.push({ ...w.rooms[0] }); }), /duplicate room C0/);
  assert.match(bad(w => { w.links[0].to = 'ZZ'; }), /unknown room ZZ/);
  assert.match(bad(w => { w.links[0].type = 'teleport'; }), /unknown type teleport/);
  assert.match(bad(w => { w.links.push({ ...w.links[0] }); }), /duplicate link/);
  assert.match(bad(w => { w.links[0].doors.from = 'to-X'; }), /do not name the other room/);
  assert.deepEqual(WorldGraph.validate(good), []);
});
