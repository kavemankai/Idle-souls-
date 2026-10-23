import { ROOMS } from '../world/roomRegistry';
import { toWorld } from '../world/worldRunner';
import { gates, type GateInfo } from '../world/gates';
import { frontierRooms } from '../expedition/plan';
import { DANGER } from '../expedition/planner';
import type { WorldGraph } from '../world/worldGraph';
import { COLORS } from './palette';

/** Everything the one map drawing needs. The run view, the camp map and the Chronicle's route map all use it, so a mark means the same thing on each. */
export interface MapState {
  graph: WorldGraph;
  known: ReadonlySet<string>;
  /** Gates and shortcuts open for good (link keys). */
  open: ReadonlySet<string>;
  visited?: ReadonlySet<string>;
  avoid?: ReadonlySet<string>;
  /** Rooms of a route to draw, in order, and what the preview says about it. Known route is solid; partly unmapped is dashed and stops at the edge; blocked is dotted and ends in a cross. */
  route?: readonly string[] | null;
  routeKind?: 'confirmed' | 'frontier' | 'blocked';
  /** Number the stops along the route (the Chronicle map). */
  numberRoute?: boolean;
  here?: string | null; target?: string | null; selected?: string | null;
  /** The adventurer in world coordinates. */
  hero?: { x: number; y: number } | null;
  /** The recovery cache: room only is enough to mark the room; x, y are room-local. */
  cache?: { room: string } | null;
}
export interface MapRoom { id: string; x: number; y: number; w: number; h: number; known: boolean }
export interface MapGeom { rooms: MapRoom[] }

export const worldPos = (id: string) => toWorld(ROOMS[id], { x: 0, y: 0 });
const OUT = { west: [-1, 0], east: [1, 0], north: [0, -1], south: [0, 1] } as const;

/** Room-local rooms at 0.6 of their real floor so neighbours do not overlap on the schematic. */
const SCALE = 0.6;

/** Draw the map; returns where each room landed on the canvas, for hit testing. */
export function drawWorldMap(canvas: HTMLCanvasElement, s: MapState): MapGeom {
  const geom: MapGeom = { rooms: [] };
  const g = canvas.getContext('2d');
  if (!g) return geom;
  const shown = [...new Set([...s.known, ...frontierRooms(s.graph, s.known, s.open)])];
  const W = canvas.width, H = canvas.height, pad = 40;
  const pts = shown.map(id => ({ id, p: worldPos(id), f: { w: s.graph.room(id).floor.w * SCALE, h: s.graph.room(id).floor.h * SCALE } }));
  // Gates seen from a known room: a link to a shown room, or a short stub out of the door's wall; the room beyond a sealed gate stays hidden.
  const gateLines = gates(s.graph, s.known, s.open).filter(x => x.state !== 'unseen').map(x => {
    const a = s.known.has(x.from) ? x.from : x.to, b = a === x.from ? x.to : x.from, pa = worldPos(a);
    let end = worldPos(b);
    if (!shown.includes(b)) { const d = OUT[ROOMS[a].doors.find(dd => dd.to === b)!.side]; end = { x: pa.x + d[0] * 420, y: pa.y + d[1] * 420 }; }
    return { g: x as GateInfo, from: pa, to: end };
  });
  const xs = [...pts.flatMap(q => [q.p.x - q.f.w / 2, q.p.x + q.f.w / 2]), ...gateLines.map(l => l.to.x)], ys = [...pts.flatMap(q => [q.p.y - q.f.h / 2, q.p.y + q.f.h / 2]), ...gateLines.map(l => l.to.y)];
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const sc = Math.min((W - pad * 2) / (x1 - x0), (H - pad * 2) / (y1 - y0));
  const X = (x: number) => pad + (x - x0) * sc + ((W - pad * 2) - (x1 - x0) * sc) / 2, Y = (y: number) => pad + (y - y0) * sc + ((H - pad * 2) - (y1 - y0) * sc) / 2;
  g.clearRect(0, 0, W, H); g.fillStyle = COLORS.map; g.fillRect(0, 0, W, H);
  g.lineWidth = 2; g.strokeStyle = COLORS.line;
  for (const l of s.graph.links) if (shown.includes(l.from) && shown.includes(l.to) && l.type === 'ordinary') { g.beginPath(); g.moveTo(X(worldPos(l.from).x), Y(worldPos(l.from).y)); g.lineTo(X(worldPos(l.to).x), Y(worldPos(l.to).y)); g.stroke(); }
  for (const l of gateLines) {
    const open = l.g.state === 'open';
    g.setLineDash(open ? [] : [6, 5]); g.strokeStyle = open ? COLORS.lineOk : COLORS.lineBad; g.lineWidth = 3;
    g.beginPath(); g.moveTo(X(l.from.x), Y(l.from.y)); g.lineTo(X(l.to.x), Y(l.to.y)); g.stroke(); g.setLineDash([]);
    g.fillStyle = open ? COLORS.lineOk : COLORS.warn; g.font = 'bold 14px Arial, sans-serif'; g.textAlign = 'center';
    g.fillText(open ? '◇' : '▣', X((l.from.x + l.to.x) / 2), Y((l.from.y + l.to.y) / 2) + 5);
  }
  if (s.route && s.route.length > 1) {
    const kind = s.routeKind ?? 'confirmed';
    g.strokeStyle = COLORS.lineWarn; g.lineWidth = 4; g.setLineDash(kind === 'confirmed' ? [] : kind === 'frontier' ? [10, 6] : [2, 7]);
    g.beginPath(); s.route.forEach((id, i) => { const p = worldPos(id); if (i) g.lineTo(X(p.x), Y(p.y)); else g.moveTo(X(p.x), Y(p.y)); }); g.stroke(); g.setLineDash([]);
    if (kind === 'blocked') { const p = worldPos(s.route[s.route.length - 1]); g.fillStyle = COLORS.bad; g.font = 'bold 20px Arial, sans-serif'; g.textAlign = 'center'; g.fillText('✕', X(p.x), Y(p.y) - 18); }
  }
  g.textAlign = 'center';
  for (const q of pts) {
    const isKnown = s.known.has(q.id), w = q.f.w * sc, hh = q.f.h * sc, x = X(q.p.x) - w / 2, y = Y(q.p.y) - hh / 2;
    geom.rooms.push({ id: q.id, x, y, w, h: hh, known: isKnown });
    g.fillStyle = isKnown ? (s.visited?.has(q.id) ? COLORS.mapSeen : COLORS.mapKnown) : COLORS.mapFog;
    g.fillRect(x, y, w, hh);
    g.setLineDash(isKnown ? [] : [5, 4]);
    g.strokeStyle = q.id === s.here ? COLORS.accent : q.id === s.target ? COLORS.lineWarn : COLORS.line; g.lineWidth = q.id === s.here ? 3 : 1.5;
    g.strokeRect(x, y, w, hh); g.setLineDash([]);
    if (q.id === s.selected) { g.strokeStyle = COLORS.accent; g.lineWidth = 3; g.setLineDash([2, 2]); g.strokeRect(x - 4, y - 4, w + 8, hh + 8); g.setLineDash([]); }
    if (s.avoid?.has(q.id)) {
      g.save(); g.beginPath(); g.rect(x, y, w, hh); g.clip(); g.strokeStyle = COLORS.lineBad; g.lineWidth = 1.5;
      for (let d = -hh; d < w; d += 10) { g.beginPath(); g.moveTo(x + d, y + hh); g.lineTo(x + d + hh, y); g.stroke(); }
      g.restore(); g.fillStyle = COLORS.bad; g.font = 'bold 13px Arial, sans-serif'; g.fillText('⊘', x + w - 9, y + 13);
    }
    g.fillStyle = COLORS.text; g.font = '12px Arial, sans-serif'; g.fillText(isKnown ? q.id : '?', X(q.p.x), Y(q.p.y) + 4);
    const dz = DANGER[s.graph.room(q.id).difficulty] ?? 0;
    if (isKnown && dz >= 3) { g.fillStyle = dz >= 6 ? COLORS.warn : COLORS.accent; g.font = 'bold 12px Arial, sans-serif'; g.fillText(dz >= 6 ? '!!' : '!', X(q.p.x), y + 14); }
    if (s.cache && s.cache.room === q.id) { g.fillStyle = COLORS.accent; g.font = 'bold 14px Arial, sans-serif'; g.fillText('◆', x + 10, y + hh - 5); }
    if (s.numberRoute && s.route) {
      const at = s.route.map((id, i) => (id === q.id ? i + 1 : 0)).filter(Boolean);
      if (at.length) { g.fillStyle = COLORS.accent; g.font = 'bold 11px Arial, sans-serif'; g.fillText(at.slice(0, 4).join(','), X(q.p.x), y + hh - 4); }
    }
  }
  if (s.hero) { g.fillStyle = COLORS.pressedText; g.beginPath(); g.arc(X(s.hero.x), Y(s.hero.y), 6, 0, Math.PI * 2); g.fill(); g.strokeStyle = COLORS.map; g.lineWidth = 2; g.stroke(); }
  return geom;
}

/** The room under a point of the canvas (canvas pixels), or null. */
export function roomAt(geom: MapGeom, x: number, y: number): MapRoom | null {
  for (let i = geom.rooms.length - 1; i >= 0; i--) { const r = geom.rooms[i]; if (x >= r.x - 4 && x <= r.x + r.w + 4 && y >= r.y - 4 && y <= r.y + r.h + 4) return r; }
  return null;
}
