import { test } from 'node:test';
import assert from 'node:assert/strict';
import { WorldGraph } from '../src/world/worldGraph';
import { ROOMS } from '../src/world/roomRegistry';
import { hallwayFor, distanceToHallway, visibleDungeon, worldPoint } from '../src/presentation/dungeonGeometry';
import { loadSim } from '../src/combat/loadSimNode';
import { defaultPlan } from '../src/expedition/plan';
import { finishChronicle, startExpedition, type ExpeditionConfig } from '../src/expedition/run';
import { readExpeditionVisual, heroActionStatus } from '../src/presentation/expeditionVisual';

const graph = new WorldGraph();
const sim = loadSim();

test('each visual hallway begins/ends at the real paired doors used by WorldRunner', () => {
  for (const link of graph.links) {
    const hall = hallwayFor(link, ROOMS);
    const from = ROOMS[link.from], to = ROOMS[link.to];
    const doorFrom = from.doors.find(x => x.id === link.doors.from)!;
    const doorTo = to.doors.find(x => x.id === link.doors.to)!;
    assert.deepEqual(hall.start, worldPoint(from, doorFrom.center), link.from);
    assert.deepEqual(hall.end, worldPoint(to, doorTo.center), link.to);
    assert.ok(hall.length > 0 && Number.isFinite(hall.length), hall.key);
    assert.ok(hall.width > 0 && hall.width <= 112, hall.key);
    assert.ok(distanceToHallway({ x: (hall.start.x + hall.end.x) / 2,
      y: (hall.start.y + hall.end.y) / 2 }, hall) < 1e-6);
  }
});

test('fog never exposes unknown rooms; ordinary passages can be shown; sealed links do not show fake open halls', () => {
  const known = new Set(['C0', 'O1', 'O2', 'T2']);
  const first = visibleDungeon(graph, ROOMS, known, new Set(), { x: 950, y: 1750 }, 'O1', false);
  assert.ok(first.rooms.includes('C0') && first.rooms.includes('O1'));
  assert.ok(!first.rooms.includes('T1') && !first.rooms.includes('MB'));
  assert.ok(first.halls.some(h => h.key === WorldGraph.linkKey('C0', 'O1')));
  const gate = visibleDungeon(graph, ROOMS, known, new Set(), ROOMS.T2.plan!.center, 'T2', false);
  assert.ok(gate.sealed.some(s => s.room === 'T2'));
  assert.ok(!gate.halls.some(h => h.key === WorldGraph.linkKey('T2', 'MB')));
  const opened = visibleDungeon(graph, ROOMS, known, new Set([WorldGraph.linkKey('T2', 'MB')]),
    ROOMS.T2.plan!.center, 'T2', false);
  assert.ok(!opened.sealed.some(s => s.room === 'T2' &&
    s.x === worldPoint(ROOMS.T2, ROOMS.T2.doors.find(d => d.to === 'MB')!.center).x));
  assert.ok(!opened.rooms.includes('MB'), 'opening a gate does not reveal its undiscovered room');
});

test('an actual multi-room expedition crosses a depicted hallway with no coordinate snap, and visuals cannot alter results', () => {
  const cfg: ExpeditionConfig = {
    seed: 7, level: 80, focus: 'balanced', hpOverride: 5000,
    known: ['C0', 'O1', 'O2', 'O3', 'KT'],
    plan: { ...defaultPlan(), objectives: [{ id: 'road', kind: 'reach', room: 'O2' }] },
    progression: { startLevel: 1 },
  };
  const actual = startExpedition(sim, cfg), control = startExpedition(sim, cfg);
  let hadPassage = false, enteredAnotherRoom = false;
  let previous = { ...actual.world.pos }, beforeRoom = actual.world.room;
  const hall = hallwayFor(graph.links.find(x => x.from === 'C0' && x.to === 'O1')!, ROOMS);
  for (let n = 0; n < 18000 && !actual.world.terminal; n++) {
    actual.world.step();
    control.world.step();
    const w = actual.world, snap = readExpeditionVisual(w);
    const moved = Math.hypot(w.pos.x - previous.x, w.pos.y - previous.y);
    assert.ok(moved < 40, `unexpected teleport at tick ${w.tick}: moved ${moved}`);
    assert.deepEqual({ x: snap.actors[0].x, y: snap.actors[0].y }, w.pos);
    if (snap.passage && beforeRoom === 'C0') {
      hadPassage = true;
      assert.equal(snap.heroStatus, '• Crossing passage');
      assert.ok(distanceToHallway(w.pos, hall) <= hall.width / 2 + 12,
        'passage rendering must contain actual hero path');
    }
    if (w.room !== beforeRoom) enteredAnotherRoom = true;
    previous = { ...w.pos }; beforeRoom = w.room;
  }
  assert.ok(hadPassage, 'must observe real door-to-door corridor travel');
  assert.ok(enteredAnotherRoom, 'must enter a second room');
  assert.ok(heroActionStatus(actual.world).startsWith('• '));
  assert.deepEqual(finishChronicle(cfg, actual), finishChronicle(cfg, control),
    'visual reads and hallway geometry must not influence the simulation or banking');
});
