import { frontierRooms, name, CAMP } from '../expedition/plan';
import { describeBank } from '../expedition/loot';
import type { Cache } from '../save/saveTypes';
import { DANGER } from '../expedition/planner';
import type { WorldGraph } from '../world/worldGraph';
import { drawWorldMap, roomAt, type MapGeom } from './mapDraw';

type Kids = (Node | string | null | false)[];
function h<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Record<string, string | boolean | number | ((e: Event) => void)> = {}, ...kids: Kids): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (typeof v === 'function') el.addEventListener(k.replace(/^on/, ''), v);
    else if (typeof v === 'boolean') { if (v) el.setAttribute(k, ''); } else el.setAttribute(k, String(v));
  }
  for (const k of kids) if (k !== null && k !== false) el.append(k);
  return el;
}

export interface CampMapOptions {
  graph: WorldGraph;
  /** Rooms the player has entered, and links open for good. */
  known: ReadonlySet<string>; open: ReadonlySet<string>;
  avoid: readonly string[];
  cache: Cache | null;
  /** What the plan screen's preflight says about the route to the last objective. Drawn as it is; no odds are invented. */
  preview: { route: readonly string[] | null; kind: 'confirmed' | 'frontier' | 'blocked' } | null;
  atCapacity: boolean;
  onAdd(kind: 'reach' | 'survey' | 'explore', room: string): void;
  onToggleAvoid(room: string): void;
}
const PREVIEW_TEXT = { confirmed: 'Route preview: a known route, every room on it has been entered.', frontier: 'Route preview: partly unmapped. It stops at the edge of the map; what lies beyond is not drawn.', blocked: 'Route preview: blocked. No permitted known route reaches the last objective.' } as const;
const LONG_PRESS_MS = 600;

/**
 * The camp's world map: what you have entered, sealed and open gates, the cache and the route the plan would take. Tap or click a room to choose it; the
 * actions for it are always visible buttons under the map, and the same rooms are listed as buttons for keyboard and screen-reader use. A long press
 * toggles Avoid as a shortcut; it is never the only way.
 */
export class CampMap {
  selected: string | null = null;
  private geom: MapGeom = { rooms: [] };
  render(o: CampMapOptions): HTMLElement {
    const shown = [...new Set([...o.known, ...frontierRooms(o.graph, o.known, o.open)])].filter(r => r !== CAMP).sort((a, b) => a.localeCompare(b));
    if (this.selected && !shown.includes(this.selected)) this.selected = null;
    const canvas = h('canvas', { id: 'camp-canvas', width: 640, height: 420, role: 'img', tabindex: '0', 'aria-describedby': 'map-help',
      'aria-label': `World map. ${o.known.size} rooms entered, ${shown.filter(r => !o.known.has(r)).length} at the edge of the map.` });
    const status = h('p', { id: 'map-status', role: 'status', 'aria-live': 'polite', class: 'hint' }, '');
    const panel = h('div', { id: 'map-select', class: 'map-select' });
    const say = (t: string) => { status.textContent = t; };
    const describe = (r: string) => {
      const k = o.known.has(r), dz = DANGER[o.graph.room(r).difficulty] ?? 0;
      return `${name(o.graph, r)}: ${k ? 'entered' : 'edge of the map, not entered yet'}${k && dz >= 3 ? `, danger mark ${dz >= 6 ? 'two' : 'one'}` : ''}${o.avoid.includes(r) ? ', on the avoid list' : ''}${o.cache?.room === r ? `, recovery cache here (${describeBank(o.cache.contents)})` : ''}.`;
    };
    const draw = () => {
      this.geom = drawWorldMap(canvas, { graph: o.graph, known: o.known, open: o.open, visited: o.known, avoid: new Set(o.avoid), route: o.preview?.route ?? null, routeKind: o.preview?.kind, selected: this.selected, cache: o.cache });
    };
    const refreshPanel = () => {
      const r = this.selected;
      panel.replaceChildren();
      if (!r) { panel.append(h('p', { class: 'hint' }, 'Choose a room on the map or in the list to see what you can ask for.')); return; }
      const k = o.known.has(r), avoided = o.avoid.includes(r);
      panel.append(h('p', { id: 'map-picked' }, describe(r)), h('div', { class: 'chips' },
        k ? h('button', { type: 'button', 'data-map-add': 'reach', disabled: o.atCapacity || avoided, onclick: () => o.onAdd('reach', r) }, 'Reach it') : null,
        k ? h('button', { type: 'button', 'data-map-add': 'survey', disabled: o.atCapacity || avoided, onclick: () => o.onAdd('survey', r) }, 'Survey it') : null,
        !k ? h('button', { type: 'button', 'data-map-add': 'explore', disabled: o.atCapacity || avoided, onclick: () => o.onAdd('explore', r) }, 'Explore from here') : null,
        h('button', { type: 'button', 'data-map-avoid': r, 'aria-pressed': String(avoided), onclick: () => o.onToggleAvoid(r) }, avoided ? 'Stop avoiding it' : 'Avoid it')));
    };
    const pick = (r: string | null) => { this.selected = r; draw(); refreshPanel(); if (r) say(describe(r)); };
    // Pointer: a tap picks; holding without moving toggles Avoid (a shortcut, the buttons do the same).
    let timer: ReturnType<typeof setTimeout> | null = null, startX = 0, startY = 0, held = false;
    const at = (e: PointerEvent) => { const b = canvas.getBoundingClientRect(); return roomAt(this.geom, (e.clientX - b.left) * canvas.width / b.width, (e.clientY - b.top) * canvas.height / b.height); };
    canvas.addEventListener('pointerdown', e => {
      held = false; startX = e.clientX; startY = e.clientY;
      const r = at(e);
      if (r && r.id !== CAMP) timer = setTimeout(() => { held = true; o.onToggleAvoid(r.id); }, LONG_PRESS_MS);
    });
    canvas.addEventListener('pointermove', e => { if (timer && Math.hypot(e.clientX - startX, e.clientY - startY) > 8) { clearTimeout(timer); timer = null; } });
    canvas.addEventListener('pointerup', e => { if (timer) { clearTimeout(timer); timer = null; } if (held) return; const r = at(e); pick(r && r.id !== CAMP ? r.id : null); });
    canvas.addEventListener('pointercancel', () => { if (timer) { clearTimeout(timer); timer = null; } });
    canvas.addEventListener('keydown', e => {
      if (!['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Escape'].includes(e.key)) return;
      e.preventDefault();
      if (e.key === 'Escape') { pick(null); return; }
      const i = this.selected ? shown.indexOf(this.selected) : -1, step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1;
      pick(shown[(i + step + shown.length) % shown.length]);
    });
    const list = h('details', { class: 'map-list', id: 'map-list' }, h('summary', {}, 'Rooms on the map, as a list'),
      h('ul', {}, ...shown.map(r => h('li', {}, h('button', { type: 'button', 'data-map-room': r, 'aria-pressed': String(this.selected === r), onclick: () => { pick(r); (list.querySelector(`[data-map-room="${r}"]`) as HTMLElement | null)?.focus(); } }, describe(r))))));
    const section = h('section', { class: 'card', id: 'camp-map' }, h('h2', {}, 'Map'),
      h('p', { class: 'hint', id: 'map-help' }, 'Tap a room to choose it. Arrow keys move between rooms. Hold a room to toggle Avoid, or use the buttons. ▣ sealed gate, ◇ open gate, ◆ recovery cache, ! danger, ⊘ avoided, ? edge of the map.'),
      canvas, h('p', { class: 'hint', id: 'map-preview' }, o.preview ? PREVIEW_TEXT[o.preview.kind] : 'No route yet: choose a room and ask for it.'), status, panel, list);
    draw(); refreshPanel();
    return section;
  }
}
