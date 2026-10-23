import type { SimApi } from '../combat/simApi';
import type { Chronicle } from '../expedition/chronicle';
import type { ExpeditionRun } from '../expedition/run';
import { describeBank } from '../expedition/loot';
import { name } from '../expedition/plan';
import { upgradeById } from '../progression/experience';
import { WorldGraph } from '../world/worldGraph';
import { drawWorldMap } from './mapDraw';

type Kids = (Node | string | null | false)[];
function h<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Record<string, string | boolean | number> = {}, ...kids: Kids): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) { if (typeof v === 'boolean') { if (v) el.setAttribute(k, ''); } else el.setAttribute(k, String(v)); }
  for (const k of kids) if (k !== null && k !== false) el.append(k);
  return el;
}
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

/**
 * What killed the adventurer, in the simulator's own words: the last hit that landed and the causes that cost the most health. Read from the fight
 * state after a fall; null when the expedition did not end in one. This is blame, not advice: it never changes a run.
 */
export function describeDeath(sim: SimApi, graph: WorldGraph, run: ExpeditionRun): string | null {
  const w = run.world;
  if (w.state !== 'defeated') return null;
  const fight = w.runner?.fight;
  const room = name(graph, w.room);
  if (!fight) return `Fell in ${room}.`;
  const blame = Object.entries(fight.stats.dmgBy).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]).slice(0, 2)
    .map(([k, n]) => `${sim.CAUSES[k] ? sim.CAUSES[k][0] : k} (${Math.round(n)})`);
  const last = [...fight.events].reverse().find(e => e.kind === 'bad');
  const lastText = last ? last.text.replace(/\s*[A-Z][^.]*\.$/, '').replace(/\.$/, '') : '';
  return `Fell in ${room}.${lastText ? ` Last blow: ${lastText}.` : ''}${blame.length ? ` Most health lost to: ${blame.join(', ')}.` : ''}`;
}

export interface ChronicleViewOptions {
  graph: WorldGraph;
  /** What the settlement said: banked, cached, lost. */
  settlement: readonly string[];
  deathCause: string | null;
  /** Buttons the caller adds under the record (plan another, back to the list). */
  actions?: Node[];
  /** Hide the permanent-gains line when the caller shows it elsewhere. */
}

/**
 * The Chronicle as a readable page. Keeps the element ids the older result card used (#outcome, #summary, #progress-line, #settle-lines, #download) so
 * the same ids work in the run view and in the history. Sections: the walk on a map, each decision and its cause, what was gained and from where,
 * fights, what became of the loot, keys by provenance, and what stays for good.
 */
export function renderChronicle(c: Chronicle, o: ChronicleViewOptions): HTMLElement {
  const nm = (id: string) => name(o.graph, id);
  const routeCanvas = h('canvas', { width: 640, height: 360, role: 'img', class: 'route-map', id: 'route-map', 'aria-label': `Map of the walk: ${c.route.map(nm).join(', then ')}.` });
  // The map is drawn once the node is on the page (the 2d context needs no layout), from only what the Chronicle knows.
  queueMicrotask(() => drawWorldMap(routeCanvas, {
    graph: o.graph, known: new Set([...c.route, ...c.discovered, 'C0']), open: new Set(c.loot.opened), visited: new Set(c.route), avoid: new Set(c.plan.avoid),
    route: c.route, routeKind: 'confirmed', numberRoute: true, here: c.route[c.route.length - 1] ?? null,
  }));
  const decisions = c.intent.filter(i => ['route', 'skip', 'retreat', 'redirect', 'sweep', 'objective'].includes(i.kind));
  const gainsBySource = (src: string) => c.loot.gains.filter(g => g.source === src);
  const kills = gainsBySource('kill'), finds = gainsBySource('pickup'), cache = gainsBySource('cache');
  const fights = c.fights.length ? c.fights.map(f => `${nm(f.room)}: ${f.won ? 'won' : 'lost'}, ${f.enemiesDefeated} down, health ${f.hpLeft} of ${f.hpMax}`).join('; ') : 'none';
  const pg = c.progress;
  const keyLine = [
    c.loot.issued ? `${c.loot.issued} issued from camp` : null, c.loot.spent ? `${c.loot.spent} spent on a gate (gone for good)` : null,
    c.loot.carried.prepared ? `${c.loot.carried.prepared} issued key${c.loot.carried.prepared === 1 ? '' : 's'} unspent (${c.outcome === 'extracted' ? 'back in the bank' : c.loot.deathSpot ? 'in the cache, still usable at a gate' : 'carried'})` : null,
    c.loot.carried.keys ? `${c.loot.carried.keys} fresh key${c.loot.carried.keys === 1 ? '' : 's'} (${c.outcome === 'extracted' ? 'banked now; usable at a gate on a later expedition' : c.loot.deathSpot ? 'in the cache, not usable at a gate until banked' : 'carried, not usable until banked'})` : null,
  ].filter(Boolean).join('; ') || 'none';
  const permanent = [
    c.discovered.length ? `newly mapped: ${c.discovered.map(nm).join(', ')}` : null,
    c.loot.opened.length ? `opened for good: ${c.loot.opened.map(k => { const l = o.graph.links.find(x => WorldGraph.linkKey(x.from, x.to) === k); return l ? `${nm(l.from)} and ${nm(l.to)}` : k; }).join('; ')}` : null,
    c.loot.claimed.length ? `one-time finds claimed: ${c.loot.claimed.length}` : null,
    c.bossesDefeated.length ? `defeated for good: ${c.bossesDefeated.join(', ')}` : null,
  ].filter(Boolean).join('; ') || 'nothing new';
  return h('div', { class: 'chronicle' },
    h('h2', {}, 'Chronicle'),
    h('div', { class: `badge ${c.outcome}`, id: 'outcome', 'data-outcome': c.outcome }, cap(c.outcome)),
    h('p', { class: 'sum', id: 'summary' }, c.summary),
    o.deathCause ? h('p', { class: 'warn', id: 'death-cause' }, o.deathCause) : null,
    h('h3', {}, 'The walk'), routeCanvas,
    h('ol', { class: 'route-list', id: 'route-list' }, ...c.route.map(r => h('li', {}, nm(r)))),
    h('h3', {}, 'What it decided, and why'),
    h('ol', { class: 'decisions', id: 'decisions' }, ...decisions.map(d => h('li', { 'data-kind': d.kind }, h('b', {}, d.text), h('small', {}, `${Math.round(d.tick / 30)}s · ${d.cause}`)))),
    h('h3', {}, 'What it gained'),
    h('ul', { class: 'gains', id: 'gains' },
      h('li', {}, `Kills: ${kills.length ? kills.map(g => `${g.label.replace(' defeated', '')} in ${nm(g.room)} (${describeBank(g.bundle)})`).join('; ') : 'none'}.`),
      h('li', {}, `Finds: ${finds.length ? finds.map(g => `${g.label} in ${nm(g.room)}`).join('; ') : 'none'}.`),
      h('li', {}, `Cache picked up: ${cache.length ? describeBank(cache[0].bundle) : 'none'}.`)),
    h('dl', {}, h('dt', {}, 'Fights'), h('dd', {}, fights),
      pg ? h('dt', {}, 'Levels and supplies') : null,
      pg ? h('dd', { id: 'progress-line' }, `Level ${pg.startLevel} to ${pg.level} (${pg.xp} experience), ${pg.rationsUsed} ration${pg.rationsUsed === 1 ? '' : 's'} drunk, ${pg.rationsLeft} left. ${pg.sanctuary.visits ? `Sanctuary: ${pg.sanctuary.rested ? 'rested' : 'not rested'}, ${pg.sanctuary.upgrade ? upgradeById(pg.sanctuary.upgrade).name : 'no'} upgrade. No banking there.` : 'The sanctuary was not visited.'} Levels and upgrades are gone now; only banked loot stays.`) : null,
      h('dt', {}, 'Gate Keys'), h('dd', { id: 'key-line' }, keyLine),
      h('dt', {}, 'Stays for good'), h('dd', { id: 'permanent-line' }, permanent),
      h('dt', {}, 'Run id'), h('dd', {}, `seed ${c.seed} · ${c.digest}`)),
    h('h3', {}, 'What happened to the loot'),
    h('ul', { id: 'settle-lines' }, ...o.settlement.map(l => h('li', {}, l))),
    h('a', { class: 'btn', id: 'download', href: `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(c, null, 1))}`, download: `chronicle-seed${c.seed}.json` }, 'Download Chronicle (JSON)'),
    ...(o.actions ?? []));
}
