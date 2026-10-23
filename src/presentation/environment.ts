import Phaser from 'phaser';
import type { RoomManifest } from '../world/o1Room';
export const ENVIRONMENT_TEXTURES = ['earth', 'road-underpaint', 'moss', 'rubble', 'wall', 'pillar', 'marker', 'warm-light', 'wall-return-west', 'wall-return-east', 'doorway-jamb-west', 'doorway-jamb-east', 'endpoint-threshold', ...Array.from({ length: 6 }, (_, i) => `paving-${i}`)];
export interface PaintOptions { /** Draw walls on the collision faces of this room instead of the fixed study layout. */ room?: RoomManifest; eastLabel?: string }
export function paintOldRoad(scene: Phaser.Scene, options: PaintOptions = {}) {
  const image = (x: number, y: number, key: string, w: number, h: number, depth: number, alpha = 1) => scene.add.image(x, y, key).setDisplaySize(w, h).setDepth(depth).setAlpha(alpha);
  const ground = scene.add.tileSprite(0, 0, 1400, 1100, 'earth').setDepth(-1000);
  ground.setTileScale(1.35);
  image(0,0,'road-underpaint',680,510,-995,.75);
  // Individually composed paving, sparse edge breaks: 480x440 O1 reference envelope.
  for (let row = -6; row <= 6; row++) {
    for (let col = -7; col <= 7; col++) {
      const edge = Math.abs(row) > 3;
      if (edge && ((col * col + row * row * 3) > 96 || (col * 17 + row * 7) % 5 === 0)) continue;
      const x = col * 32 + (row % 2 ? 12 : 0);
      const y = row * 32;
      const n = Math.abs(col * 13 + row * 7);
      image(x, y, `paving-${n % 6}`, 32, 32, -990, edge ? .46 : .65).setAngle((n % 4) * 90);
    }
  }
  // Open west/east road continuations; no gates, banking or transition logic.
  for (const side of [-1, 1]) {
    for (let x = 8; x <= 13; x++) {
      for (let row = -2; row <= 2; row++) image(side * x * 32, row * 32, `paving-${(x + row + 9) % 6}`, 32, 32, -990, .75 - (x - 8) * .07);
    }
    image(side * 258, 0, 'paving-0', 18, 174, -985, .7);
  }
  const moss = [[-225,-130],[-176,-180],[-80,-196],[170,-164],[222,125],[-203,137],[22,177],[-252,82],[250,-98],[88,-102],[36,-157]];
  moss.forEach(([x,y], i) => image(x,y,'moss',72+(i%3)*14,60,-980,.52).setAngle(i*43));
  const walls = [[-210,-196,0],[-100,-201,-3],[180,-198,4],[-206,185,5],[-91,191,0],[180,180,-5]];
  if (options.room) {
    paintWalls(image, options.room);
    // Jamb caps remain entirely on the blocked ends of the real 174-unit openings.
    // Decorative only: simulation collision is exclusively combat/rooms/o1.json.
    for (const x of [-270, 270]) for (const y of [-113, 113]) {
      image(x, y, x < 0 ? 'doorway-jamb-west' : 'doorway-jamb-east', 50, 48, y + 29);
    }
  }
  else walls.forEach(([x,y,a]) => image(x,y,'wall',114,57,y+20).setAngle(a));
  [[-257,-179],[-125,-182],[108,-202],[234,-170],[-245,165],[40,187],[245,155],[109,185]].forEach(([x,y],i) => image(x,y,'rubble',64,43,y+15,.8).setAngle(i*31));
  image(10,-125,'pillar',79,92,-125+10).setOrigin(.5,.78);
  image(-157,153,'marker',49,74,153).setOrigin(.5,.86);
  image(-290,-12,'warm-light',460,460,900,.7);
  const textStyle = { fontFamily: 'Georgia', fontSize: '10px', color: '#c7c7ab', letterSpacing: 2 };
  scene.add.text(-294, 105, '← CAMPWARD', textStyle).setOrigin(.5).setAlpha(.68).setDepth(950);
  if (options.eastLabel !== '') scene.add.text(294, -95, options.eastLabel ?? 'CROSSROADS →', textStyle).setOrigin(.5).setAlpha(.68).setDepth(950);
  scene.add.text(195,-157,'O1', { ...textStyle, fontSize:'19px', color:'#bec1a2' }).setAlpha(.22).setDepth(-970);
}
/** Walls follow the collision rectangles: the painted face sits on the rectangle's inner edge. */
function paintWalls(image: (x: number, y: number, key: string, w: number, h: number, depth: number, alpha?: number) => Phaser.GameObjects.Image, room: RoomManifest) {
  room.solids.rects.forEach(([x0, y0, x1, y1], n) => {
    const horizontal = x1 - x0 >= y1 - y0, north = (y0 + y1) / 2 < 0, west = (x0 + x1) / 2 < 0, lip = 4;
    const tiles = Math.max(1, Math.ceil((horizontal ? x1 - x0 : y1 - y0) / 100));
    for (let i = 0; i < tiles; i++) {
      const t = tiles === 1 ? .5 : i / (tiles - 1), jitter = ((n * 7 + i * 5) % 5) - 2;
      if (horizontal) {
        const x = x0 + 57 + t * (x1 - x0 - 114), y = north ? y1 - 28.5 + lip : y0 + 28.5 - lip;
        image(x, y, 'wall', 114, 57, y + 20).setAngle(jitter);
      } else {
        const y = y0 + 57 + t * (y1 - y0 - 114), x = west ? x1 - 28.5 + lip : x0 + 28.5 - lip;
        // Separate prelit vertical-return art: never rotate the horizontal wall light.
        image(x, y, west ? 'wall-return-west' : 'wall-return-east', 57, 114, y + 20);
      }
    }
  });
}
