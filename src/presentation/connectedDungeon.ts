import Phaser from 'phaser';
import type { RoomManifest } from '../world/roomTypes';
import { WorldGraph } from '../world/worldGraph';
import { ROOMS } from '../world/roomRegistry';
import { hallwayFor, visibleDungeon, type Hallway, type Vec } from './dungeonGeometry';

const FLOOR_DEPTH = -2400, HALL_DEPTH = -2500, SEAL_DEPTH = -1700;
const COLORS = { floor: 0x354640, edge: 0x8b8d79, mortar: 0x202e2b, seal: 0x7b5548 } as const;

function paintRoom(scene: Phaser.Scene, room: RoomManifest): Phaser.GameObjects.Container {
  const container = scene.add.container(0, 0).setDepth(FLOOR_DEPTH);
  const c = room.plan!.center;
  const [x0, x1] = room.floor.x, [y0, y1] = room.floor.y;
  const width = x1 - x0, height = y1 - y0;
  const cx = c.x + (x0 + x1) / 2, cy = c.y + (y0 + y1) / 2;
  const stone = scene.add.tileSprite(cx, cy, width, height, 'paving-0');
  stone.setTileScale(1).setTint(0xbac6bb);
  container.add(stone);
  // Wear and scattered paving: reused existing environment textures; no
  // collision geometry is generated from these decorative objects.
  const underlay = scene.add.image(cx, cy, 'road-underpaint')
    .setDisplaySize(width, height).setAlpha(.16);
  container.add(underlay);
  let seed = Array.from(room.id).reduce((n, x) => n * 31 + x.charCodeAt(0), 17);
  for (let n = 0; n < 15; n++) {
    seed = Math.imul(seed, 1664525) + 1013904223 | 0;
    const rx = (seed >>> 0) / 0x100000000;
    seed = Math.imul(seed, 1664525) + 1013904223 | 0;
    const ry = (seed >>> 0) / 0x100000000;
    const x = c.x + x0 + 30 + rx * Math.max(1, width - 60);
    const y = c.y + y0 + 30 + ry * Math.max(1, height - 60);
    container.add(scene.add.image(x, y, n % 3 === 0 ? 'rubble' : 'moss')
      .setDisplaySize(n % 3 === 0 ? 35 : 48, 32).setAlpha(.20));
  }
  // Actual collision rectangle geometry owns wall placement. Its deliberate
  // breaks align with the authoritative door spans.
  for (const rect of room.solids.rects) {
    const [ax, ay, bx, by] = rect, w = bx - ax, h = by - ay;
    if (w <= 0 || h <= 0) continue;
    const horizontal = w >= h, length = horizontal ? w : h;
    const steps = Math.max(1, Math.ceil(length / 92));
    for (let i = 0; i < steps; i++) {
      const portion = Math.min(92, length - i * 92);
      const x = c.x + (horizontal ? ax + i * 92 + portion / 2 : (ax + bx) / 2);
      const y = c.y + (horizontal ? (ay + by) / 2 : ay + i * 92 + portion / 2);
      const key = horizontal ? 'wall' : x <= c.x ? 'wall-return-west' : 'wall-return-east';
      container.add(scene.add.image(x, y, key).setDisplaySize(
        horizontal ? portion : Math.min(w, 60), horizontal ? Math.min(h, 57) : portion
      ));
    }
  }
  // Name only in the player's known rooms, never on undiscovered geometry.
  container.add(scene.add.text(c.x + x0 + 13, c.y + y0 + 13, room.name, {
    fontFamily: 'Georgia', fontSize: '15px', color: '#ddd4b9',
    backgroundColor: '#1b2921a0', padding: { x: 5, y: 3 },
  }).setAlpha(.82));
  return container;
}

function paintHall(scene: Phaser.Scene, hall: Hallway): Phaser.GameObjects.Container {
  const container = scene.add.container(0, 0).setDepth(HALL_DEPTH);
  const g = scene.add.graphics();
  const [a, b, c, d] = hall.polygon;
  g.fillStyle(COLORS.mortar, 1).fillPoints([a, b, c, d], true);
  g.lineStyle(7, COLORS.edge, .9).lineBetween(a.x, a.y, b.x, b.y)
    .lineBetween(c.x, c.y, d.x, d.y);
  g.lineStyle(2, COLORS.floor, 1).lineBetween(a.x, a.y, b.x, b.y)
    .lineBetween(c.x, c.y, d.x, d.y);
  container.add(g);
  const angle = Math.atan2(hall.end.y - hall.start.y, hall.end.x - hall.start.x);
  // A small strip of the same paving tiles, centred on the EXACT simulated
  // straight-line walk. Texture strips also work for diagonal linked doors.
  const count = Math.max(1, Math.ceil(hall.length / 32));
  for (let i = 0; i < count; i++) {
    const t = (i + .5) / count;
    const x = hall.start.x + (hall.end.x - hall.start.x) * t;
    const y = hall.start.y + (hall.end.y - hall.start.y) * t;
    const length = hall.length / count;
    const tile = scene.add.image(x, y, `paving-${i % 6}`)
      .setDisplaySize(length + 1, hall.width - 7).setRotation(angle).setAlpha(.75);
    container.add(tile);
  }
  return container;
}

function paintSeal(scene: Phaser.Scene, x: number, y: number, horizontal: boolean): Phaser.GameObjects.Container {
  const container = scene.add.container(0, 0).setDepth(SEAL_DEPTH);
  const wall = scene.add.image(x, y, horizontal ? 'wall' : 'wall-return-east')
    .setDisplaySize(horizontal ? 114 : 35, horizontal ? 35 : 114).setTint(COLORS.seal);
  container.add(wall);
  container.add(scene.add.text(x, y - 5, 'SEALED', {
    fontFamily: 'Arial', fontSize: '11px', fontStyle: 'bold',
    color: '#f6c7a4', stroke: '#16201d', strokeThickness: 3,
  }).setOrigin(.5, .5));
  return container;
}

/** Cached art-only world. Culls distant geometry without resetting the camera
 * or live actor renderers. Fog and gate visibility is provided by Expedition. */
export class ConnectedDungeon {
  private rooms = new Map<string, Phaser.GameObjects.Container>();
  private halls = new Map<string, Phaser.GameObjects.Container>();
  private seals = new Map<string, Phaser.GameObjects.Container>();
  private readonly graph = new WorldGraph();
  readonly roomBuilds = new Map<string, number>();
  constructor(private readonly scene: Phaser.Scene) {}

  sync(position: Vec, currentRoom: string, crossing: boolean, known: ReadonlySet<string>, open: ReadonlySet<string>) {
    const visible = visibleDungeon(this.graph, ROOMS, known, open, position, currentRoom, crossing);
    const roomKeys = new Set(visible.rooms);
    for (const [id, c] of this.rooms) if (!roomKeys.has(id)) { c.destroy(true); this.rooms.delete(id); }
    for (const id of visible.rooms) if (!this.rooms.has(id)) {
      this.rooms.set(id, paintRoom(this.scene, ROOMS[id]));
      this.roomBuilds.set(id, (this.roomBuilds.get(id) ?? 0) + 1);
    }
    const hallKeys = new Set(visible.halls.map(h => h.key));
    for (const [key, c] of this.halls) if (!hallKeys.has(key)) { c.destroy(true); this.halls.delete(key); }
    for (const hall of visible.halls) if (!this.halls.has(hall.key)) this.halls.set(hall.key, paintHall(this.scene, hall));
    const gateKeys = new Set(visible.sealed.map(s => `${s.room}:${s.x}:${s.y}`));
    for (const [key, c] of this.seals) if (!gateKeys.has(key)) { c.destroy(true); this.seals.delete(key); }
    for (const seal of visible.sealed) {
      const key = `${seal.room}:${seal.x}:${seal.y}`;
      if (!this.seals.has(key)) this.seals.set(key, paintSeal(this.scene, seal.x, seal.y, seal.horizontal));
    }
    return { rooms: this.rooms.size, hallways: this.halls.size, seals: this.seals.size };
  }
  destroy() {
    for (const cache of [this.rooms, this.halls, this.seals])
      { for (const c of cache.values()) c.destroy(true); cache.clear(); }
  }
}
