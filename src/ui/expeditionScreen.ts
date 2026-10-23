import { loadSim } from '../combat/loadSimBrowser';
import type { SimApi, SimDoctrine } from '../combat/simApi';
import { WorldGraph } from '../world/worldGraph';
import { ROOMS } from '../world/roomRegistry';
import { toWorld } from '../world/worldRunner';
import { DANGER } from '../expedition/planner';
import { CAMP, MAX_OBJECTIVES, defaultPlan, frontierRooms, name, preflight, type Exploration, type ExpeditionPlan, type Objective, type ObjectiveKind, type ReturnRoute } from '../expedition/plan';
import { finishChronicle, runExpedition, startExpedition, type ExpeditionConfig, type ExpeditionRun } from '../expedition/run';
import type { Chronicle } from '../expedition/chronicle';
import './expedition.css';

const KNOWLEDGE: Record<string, { label: string; rooms: string[] | 'all' }> = {
  fresh: { label: 'Fresh map (Camp, Outer Road)', rooms: ['C0', 'O1'] },
  oldroad: { label: 'Old Road mapped', rooms: ['C0', 'O1', 'O2', 'O3', 'KT'] },
  all: { label: 'Everything seen (testing)', rooms: 'all' },
};
interface Preset { label: string; plan: Omit<Partial<ExpeditionPlan>, 'objectives'> & { objectives: [ObjectiveKind, string][] } }
const PRESETS: Record<string, Preset> = {
  cross: { label: 'Cross the Old Road', plan: { objectives: [['reach', 'O3']], exploration: 'direct', doctrine: 'measured', retreatHpPct: 40 } },
  tower: { label: 'Survey the Watchtower edge', plan: { objectives: [['survey', 'T1']], exploration: 'thorough', doctrine: 'guarded', retreatHpPct: 50 } },
  careful: { label: 'Careful sweep', plan: { objectives: [['reach', 'O3'], ['reach', 'KT']], exploration: 'safe', doctrine: 'guarded', retreatHpPct: 60 } },
};
const STATUS_LABEL: Record<string, string> = { confirmed: 'Known route', frontier: 'Ends at unexplored ground', blocked: 'Blocked', conflicted: 'Conflicted' };
const OBJ_LABEL: Record<string, string> = { queued: 'Queued', active: 'Active', completed: 'Completed', skipped_blocked: 'Skipped, blocked', cancelled: 'Cancelled', suspended: 'Suspended by retreat' };

type Kids = (Node | string | null | false)[];
function h<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Record<string, string | boolean | number | ((e: Event) => void)> = {}, ...kids: Kids): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (typeof v === 'function') el.addEventListener(k.replace(/^on/, ''), v);
    else if (typeof v === 'boolean') { if (v) el.setAttribute(k, ''); }
    else el.setAttribute(k, String(v));
  }
  for (const k of kids) if (k !== null && k !== false) el.append(k);
  return el;
}
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

/** The camp planner and the expedition screen. DOM and one canvas; it reads the expedition layer and never decides anything itself. */
export function mountExpedition(root: HTMLElement) {
  const sim: SimApi = loadSim();
  const graph = new WorldGraph();
  const params = new URLSearchParams(location.search);
  let knowledge = params.get('known') && KNOWLEDGE[params.get('known')!] ? params.get('known')! : 'oldroad';
  let plan: ExpeditionPlan = defaultPlan();
  let objectives: Objective[] = [];
  let seed = Math.max(1, Math.round(Number(params.get('seed')) || 1)), level = Math.max(1, Math.min(sim.MAX_LEVEL, Math.round(Number(params.get('level')) || 80))), focus = 'balanced';
  const hpOverride: number | undefined = params.get('hp') ? Math.max(1, Math.round(Number(params.get('hp')))) : undefined;
  let nextId = 1;
  let speed = 4, paused = false;
  let run: ExpeditionRun | null = null;
  let runCfg: ExpeditionConfig | null = null;
  let chronicle: Chronicle | null = null;
  let acc = 0, last = 0, raf = 0;
  let notice = '';

  const known = () => new Set<string>(KNOWLEDGE[knowledge].rooms === 'all' ? [...graph.rooms.keys()] : (KNOWLEDGE[knowledge].rooms as string[]));
  const cfg = (): ExpeditionConfig => ({ seed, level, focus, plan: { ...plan, objectives: objectives.map(o => ({ ...o })), avoid: plan.avoid.slice() }, known: [...known()], hpOverride });

  const screen = h('div', { class: 'xp', id: 'xp' });
  root.append(screen);

  // ---------- Planning ----------
  function renderPlan() {
    cancelAnimationFrame(raf);
    run = null;
    window.__EXPEDITION_STATE__ = () => ({ view: 'plan' });
    screen.replaceChildren();
    const k = known(), frontier = frontierRooms(graph, k);
    const choices = [...[...k].filter(r => r !== CAMP), ...frontier].sort((a, b) => a.localeCompare(b));
    objectives = objectives.filter(o => choices.includes(o.room));
    plan.avoid = plan.avoid.filter(r => k.has(r));
    plan.objectives = objectives;
    const pf = preflight(plan, graph, k);
    const seg = <T extends string>(label: string, id: string, opts: [T, string][], cur: T, set: (v: T) => void) =>
      h('fieldset', { class: 'seg' }, h('legend', {}, label), ...opts.map(([v, t]) => h('button', { type: 'button', 'aria-pressed': String(v === cur), 'data-seg': `${id}-${v}`, onclick: () => { set(v); renderPlan(); } }, t)));
    const objRows = objectives.map((o, i) => h('li', { class: `obj ${pf.objectives[i]?.status ?? ''}` },
      h('span', { class: 'n' }, String(i + 1)),
      h('select', { 'aria-label': `Objective ${i + 1} action`, 'data-obj-kind': String(i), onchange: (e) => { o.kind = (e.target as HTMLSelectElement).value as ObjectiveKind; renderPlan(); } },
        ...(['reach', 'survey'] as const).map(v => { const op = h('option', { value: v }, cap(v)); if (o.kind === v) op.selected = true; return op; })),
      h('select', { 'aria-label': `Objective ${i + 1} place`, 'data-obj-room': String(i), onchange: (e) => { o.room = (e.target as HTMLSelectElement).value; renderPlan(); } },
        ...choices.map(r => { const op = h('option', { value: r }, `${name(graph, r)}${k.has(r) ? '' : ' (unexplored)'}`); if (o.room === r) op.selected = true; return op; })),
      h('span', { class: 'row-btns' },
        h('button', { type: 'button', 'aria-label': 'Move up', disabled: i === 0, onclick: () => { [objectives[i - 1], objectives[i]] = [objectives[i], objectives[i - 1]]; renderPlan(); } }, '↑'),
        h('button', { type: 'button', 'aria-label': 'Move down', disabled: i === objectives.length - 1, onclick: () => { [objectives[i + 1], objectives[i]] = [objectives[i], objectives[i + 1]]; renderPlan(); } }, '↓'),
        h('button', { type: 'button', 'aria-label': 'Remove', 'data-remove': String(i), onclick: () => { objectives.splice(i, 1); renderPlan(); } }, '✕')),
      h('p', { class: 'why' }, pf.objectives[i] ? `${STATUS_LABEL[pf.objectives[i].status]}. ${pf.objectives[i].reason}` : '')));
    const avoidable = [...k].filter(r => r !== CAMP).sort();
    screen.append(
      h('div', { class: 'bar' }, h('div', {}, h('p', { class: 'eyebrow' }, 'CAMP · EXPEDITION PLAN · TRIAL SETTINGS'), h('h1', {}, 'Plan an expedition')),
        h('label', { class: 'know' }, 'Map ', h('select', { id: 'knowledge', onchange: (e) => { knowledge = (e.target as HTMLSelectElement).value; renderPlan(); } },
          ...Object.entries(KNOWLEDGE).map(([v, d]) => { const op = h('option', { value: v }, d.label); if (v === knowledge) op.selected = true; return op; })))),
      h('section', { class: 'card' }, h('h2', {}, 'Quick start'),
        h('div', { class: 'presets' }, ...Object.entries(PRESETS).map(([id, p]) => h('button', { type: 'button', 'data-preset': id, onclick: () => applyPreset(p) }, p.label)))),
      h('section', { class: 'card' }, h('h2', {}, `Objectives (${objectives.length} of ${MAX_OBJECTIVES})`),
        objectives.length ? h('ol', { class: 'objs' }, ...objRows) : h('p', { class: 'hint' }, 'Nothing yet. Add a place to go, or pick a quick start.'),
        h('button', { type: 'button', id: 'add-objective', disabled: objectives.length >= MAX_OBJECTIVES || !choices.length, onclick: () => { objectives.push({ id: `o${nextId++}`, kind: 'reach', room: choices[0] }); renderPlan(); } }, 'Add objective'),
        h('p', { class: 'hint' }, 'Return to Camp is always added at the end. The way home is physical and can fail.')),
      h('section', { class: 'card' }, h('h2', {}, 'Standing orders'),
        seg<Exploration>('Exploration', 'exploration', [['safe', 'Safe'], ['thorough', 'Thorough'], ['direct', 'Direct']], plan.exploration, v => { plan.exploration = v; }),
        seg<SimDoctrine>('Combat doctrine', 'doctrine', [['guarded', 'Guarded'], ['measured', 'Measured'], ['pressing', 'Pressing']], plan.doctrine, v => { plan.doctrine = v; }),
        seg<ReturnRoute>('Way home', 'return', [['safest', 'Safest'], ['shortest', 'Shortest']], plan.returnRoute, v => { plan.returnRoute = v; }),
        h('label', { class: 'range' }, `Head home when health is below ${plan.retreatHpPct}%`, h('input', { type: 'range', id: 'retreat', min: '0', max: '90', step: '5', value: String(plan.retreatHpPct), oninput: (e) => { plan.retreatHpPct = Number((e.target as HTMLInputElement).value); (e.target as HTMLElement).parentElement!.firstChild!.textContent = `Head home when health is below ${plan.retreatHpPct}%`; } })),
        h('p', { class: 'hint' }, 'Checked at each doorway. A fight already under way is not interrupted (that needs the disengage work in M3).')),
      h('section', { class: 'card' }, h('h2', {}, 'Avoid'),
        h('p', { class: 'hint' }, 'The adventurer will not enter these rooms for any reason, including the way home.'),
        h('div', { class: 'chips' }, ...avoidable.map(r => h('button', { type: 'button', 'data-avoid': r, 'aria-pressed': String(plan.avoid.includes(r)), onclick: () => { plan.avoid = plan.avoid.includes(r) ? plan.avoid.filter(x => x !== r) : [...plan.avoid, r]; renderPlan(); } }, name(graph, r))))),
      h('details', { class: 'card' }, h('summary', {}, 'Advanced: seed, level, focus'),
        h('div', { class: 'grid3' },
          h('label', {}, 'Seed', h('input', { type: 'number', id: 'seed', min: '1', value: String(seed), onchange: (e) => { seed = Math.max(1, Math.round(Number((e.target as HTMLInputElement).value) || 1)); } })),
          h('label', {}, 'Level', h('input', { type: 'number', id: 'level', min: '1', max: String(sim.MAX_LEVEL), value: String(level), onchange: (e) => { level = Math.max(1, Math.min(sim.MAX_LEVEL, Math.round(Number((e.target as HTMLInputElement).value) || 80))); } })),
          h('label', {}, 'Focus', h('select', { id: 'focus', onchange: (e) => { focus = (e.target as HTMLSelectElement).value; } }, ...['balanced', 'duelist', 'bulwark', 'skirmisher', 'survivor'].map(f => { const op = h('option', { value: f }, cap(f)); if (f === focus) op.selected = true; return op; }))))),
      h('section', { class: 'card launch' },
        h('div', { class: `badge ${pf.status}`, id: 'preflight', 'data-status': pf.status }, STATUS_LABEL[pf.status] ?? pf.status),
        h('p', { class: 'hint', id: 'home-line' }, objectives.length ? `Way home: ${pf.home.route ? pf.home.route.rooms.map(r => name(graph, r)).join(' > ') : pf.home.reason}` : ''),
        ...pf.messages.map(m => h('p', { class: 'warn' }, m)),
        h('p', { class: 'hint' }, 'Nothing is carried, banked or lost yet. That arrives with the loss rules in M3.'),
        h('button', { type: 'button', id: 'launch', class: 'primary', disabled: !pf.launchable, onclick: launch }, 'Launch expedition')));
    if (notice) { screen.append(h('p', { class: 'warn' }, notice)); notice = ''; }
  }
  function applyPreset(p: Preset) {
    const k = known(), frontier = frontierRooms(graph, k);
    const ok = p.plan.objectives.filter(([, r]) => k.has(r) || frontier.includes(r));
    objectives = ok.map(([kind, room]) => ({ id: `o${nextId++}`, kind, room }));
    plan = { ...defaultPlan(), ...p.plan, objectives, avoid: [] } as ExpeditionPlan;
    if (ok.length < p.plan.objectives.length) notice = 'Some places in that preset are not on this map yet, so they were left out.';
    renderPlan();
  }

  // ---------- Expedition ----------
  function launch() {
    runCfg = cfg();
    run = startExpedition(sim, runCfg, graph);
    chronicle = null; paused = false; acc = 0; last = 0; toast = '';
    renderRun();
  }
  const canvas = h('canvas', { id: 'map', width: 640, height: 420, role: 'img', 'aria-label': 'Expedition map' });
  let feed: HTMLElement, objList: HTMLElement, status: HTMLElement, bar: HTMLElement, ctl: HTMLElement, result: HTMLElement, redirectSel: HTMLSelectElement;
  let feedCount = 0;
  let toast = '';
  function renderRun() {
    screen.replaceChildren();
    const r = run!;
    feed = h('ol', { class: 'feed', id: 'feed', 'aria-live': 'polite' });
    objList = h('ol', { class: 'objstat', id: 'objstat' });
    status = h('p', { class: 'status', id: 'xstatus' });
    bar = h('div', { class: 'hpbar' }, h('i', {}));
    result = h('section', { class: 'card result', id: 'result', hidden: true });
    const k = r.expedition.known;
    redirectSel = h('select', { id: 'redirect-room', 'aria-label': 'Redirect to' }, ...[...k, ...frontierRooms(graph, k)].filter(x => x !== CAMP && !runCfg!.plan.avoid.includes(x)).sort().map(x => h('option', { value: x }, name(graph, x))));
    ctl = h('div', { class: 'ctl' },
      ...[1, 4, 16].map(s => h('button', { type: 'button', 'data-speed': String(s), 'aria-pressed': String(s === speed), onclick: () => { speed = s; syncCtl(); } }, `${s}x`)),
      h('button', { type: 'button', id: 'xp-pause', 'aria-pressed': String(paused), onclick: () => { paused = !paused; syncCtl(); } }, 'Pause'),
      h('button', { type: 'button', id: 'skip', onclick: () => { while (!r.world.terminal && r.world.tick < 30 * 3000) r.world.step(); draw(); } }, 'Skip to end'),
      h('button', { type: 'button', id: 'retreat-now', class: 'danger', onclick: () => { toast = r.expedition.order({ type: 'retreat' }) ?? 'Retreat ordered. It takes effect at the next doorway.'; draw(); } }, 'Retreat to camp'));
    screen.append(
      h('div', { class: 'bar' }, h('div', {}, h('p', { class: 'eyebrow' }, 'EXPEDITION · TRIAL SETTINGS'), h('h1', {}, 'On the road')),
        h('button', { type: 'button', id: 'back-to-plan', onclick: renderPlan }, 'Back to plan')),
      h('div', { class: 'cols' },
        h('div', { class: 'left' }, h('section', { class: 'card mapcard' }, canvas, status, bar), ctl,
          h('section', { class: 'card' }, h('h2', {}, 'Change course'), h('p', { class: 'hint' }, 'Orders wait for the next doorway.'),
            h('div', { class: 'redirect' }, redirectSel, h('button', { type: 'button', id: 'redirect-go', onclick: () => { toast = r.expedition.order({ type: 'redirect', room: redirectSel.value }) ?? `Redirect to ${name(graph, redirectSel.value)} queued for the next doorway.`; draw(); } }, 'Go there first'))),
          h('section', { class: 'card' }, h('h2', {}, 'Objectives'), objList)),
        h('div', { class: 'right' }, h('section', { class: 'card' }, h('h2', {}, 'Intent feed'), feed), result)));
    feedCount = 0; syncCtl();
    cancelAnimationFrame(raf); raf = requestAnimationFrame(frame);
    draw();
  }
  function syncCtl() {
    ctl.querySelectorAll<HTMLButtonElement>('[data-speed]').forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.speed) === speed)));
    ctl.querySelector('#xp-pause')!.setAttribute('aria-pressed', String(paused));
  }
  function frame(t: number) {
    const r = run;
    if (!r) return;
    if (last === 0) last = t;
    acc += Math.min(100, t - last) * speed * 30 / 1000; last = t;
    if (!paused) while (acc >= 1 && !r.world.terminal) { r.world.step(); acc -= 1; }
    draw();
    if (!r.world.terminal) raf = requestAnimationFrame(frame);
  }
  const worldPos = (id: string) => toWorld(ROOMS[id], { x: 0, y: 0 });
  function draw() {
    const r = run; if (!r) return;
    const ex = r.expedition, w = r.world;
    while (feedCount < ex.intent.length) {
      const i = ex.intent[feedCount++];
      feed.append(h('li', { class: `k-${i.kind}`, 'data-kind': i.kind }, h('b', {}, i.text), h('small', {}, `${Math.round(i.tick / 30)}s · ${i.cause}`)));
      feed.scrollTop = feed.scrollHeight;
    }
    objList.replaceChildren(...ex.objectives.map((o, i) => h('li', { class: o.status }, h('span', { class: 'chip' }, OBJ_LABEL[o.status]), `${i + 1}. ${cap(o.kind)} ${name(graph, o.room)}`, o.note ? h('small', {}, o.note) : null)));
    const secs = Math.round(w.tick / 30);
    status.textContent = `${w.terminal ? (w.state === 'home' ? 'Home' : w.state === 'defeated' ? 'Fallen' : 'Stopped') : 'Out'} · ${name(graph, w.room)} · ${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')} · health ${Math.round(w.hp)} of ${w.hpMax}${toast ? ` · ${toast}` : ''}`;
    (bar.firstChild as HTMLElement).style.width = `${Math.max(0, Math.min(100, w.hp / w.hpMax * 100))}%`;
    drawMap(r);
    if (w.terminal) for (const id of ['retreat-now', 'redirect-go', 'skip']) (ctl.parentElement!.querySelector(`#${id}`) as HTMLButtonElement | null)?.setAttribute('disabled', '');
    if (w.terminal && !chronicle) finish(r);
    window.__EXPEDITION_STATE__ = () => ({ view: 'run', state: w.state, tick: w.tick, room: w.room, mode: ex.mode, hp: w.hp, intents: ex.intent.length, digest: w.digest, terminal: w.terminal });
  }
  function drawMap(r: ExpeditionRun) {
    const g = canvas.getContext('2d'); if (!g) return;
    const ex = r.expedition, shown = [...ex.known, ...frontierRooms(graph, ex.known)];
    const W = canvas.width, H = canvas.height, pad = 40;
    // Drawn at 0.6 of the real floor so neighbouring rooms do not overlap on the schematic.
    const pts = shown.map(id => ({ id, p: worldPos(id), f: { w: graph.room(id).floor.w * 0.6, h: graph.room(id).floor.h * 0.6 } }));
    const x0 = Math.min(...pts.map(q => q.p.x - q.f.w / 2)), x1 = Math.max(...pts.map(q => q.p.x + q.f.w / 2));
    const y0 = Math.min(...pts.map(q => q.p.y - q.f.h / 2)), y1 = Math.max(...pts.map(q => q.p.y + q.f.h / 2));
    const s = Math.min((W - pad * 2) / (x1 - x0), (H - pad * 2) / (y1 - y0));
    const X = (x: number) => pad + (x - x0) * s + ((W - pad * 2) - (x1 - x0) * s) / 2, Y = (y: number) => pad + (y - y0) * s + ((H - pad * 2) - (y1 - y0) * s) / 2;
    g.clearRect(0, 0, W, H); g.fillStyle = '#10201d'; g.fillRect(0, 0, W, H);
    const avoid = new Set(runCfg!.plan.avoid), here = r.world.room, target = ex.target;
    g.lineWidth = 2; g.strokeStyle = '#3d5a50';
    for (const l of graph.links) if (shown.includes(l.from) && shown.includes(l.to) && l.type === 'ordinary') { g.beginPath(); g.moveTo(X(worldPos(l.from).x), Y(worldPos(l.from).y)); g.lineTo(X(worldPos(l.to).x), Y(worldPos(l.to).y)); g.stroke(); }
    if (ex.route) { g.strokeStyle = '#e1b862'; g.lineWidth = 4; g.beginPath(); ex.route.rooms.forEach((id, i) => { const p = worldPos(id); if (i) g.lineTo(X(p.x), Y(p.y)); else g.moveTo(X(p.x), Y(p.y)); }); g.stroke(); }
    g.font = '12px Arial, sans-serif'; g.textAlign = 'center';
    for (const q of pts) {
      const isKnown = ex.known.has(q.id), w = q.f.w * s, hh = q.f.h * s, x = X(q.p.x) - w / 2, y = Y(q.p.y) - hh / 2;
      g.fillStyle = isKnown ? (ex.visited.has(q.id) ? '#2d4a40' : '#223a33') : '#17262a';
      g.fillRect(x, y, w, hh);
      g.setLineDash(isKnown ? [] : [5, 4]); g.strokeStyle = q.id === here ? '#f1d49a' : q.id === target ? '#e1b862' : '#6f8a7c'; g.lineWidth = q.id === here ? 3 : 1.5; g.strokeRect(x, y, w, hh); g.setLineDash([]);
      if (avoid.has(q.id)) { g.save(); g.beginPath(); g.rect(x, y, w, hh); g.clip(); g.strokeStyle = '#c0594a'; g.lineWidth = 1.5; for (let d = -hh; d < w; d += 10) { g.beginPath(); g.moveTo(x + d, y + hh); g.lineTo(x + d + hh, y); g.stroke(); } g.restore(); }
      g.fillStyle = '#e0decb'; g.fillText(isKnown ? q.id : '?', X(q.p.x), Y(q.p.y) + 4);
      const dz = DANGER[graph.room(q.id).difficulty] ?? 0;
      if (isKnown && dz >= 3) { g.fillStyle = dz >= 6 ? '#d98c6a' : '#c9b06a'; g.fillText(dz >= 6 ? '!!' : '!', X(q.p.x), y + 14); }
    }
    const hp = r.world.pos;
    g.fillStyle = '#f6efd0'; g.beginPath(); g.arc(X(hp.x), Y(hp.y), 6, 0, Math.PI * 2); g.fill(); g.strokeStyle = '#10201d'; g.lineWidth = 2; g.stroke();
  }
  function finish(r: ExpeditionRun) {
    const c = finishChronicle(runCfg!, r).chronicle; chronicle = c;
    const fights = c.fights.length ? c.fights.map(f => `${name(graph, f.room)}: ${f.won ? 'won' : 'lost'}, ${f.enemiesDefeated} down, health ${f.hpLeft} of ${f.hpMax}`).join('; ') : 'none';
    result.hidden = false;
    result.replaceChildren(h('h2', {}, 'Chronicle'), h('div', { class: `badge ${c.outcome}`, id: 'outcome', 'data-outcome': c.outcome }, cap(c.outcome)), h('p', { class: 'sum', id: 'summary' }, c.summary),
      h('dl', {}, h('dt', {}, 'Route'), h('dd', {}, c.route.map(x => name(graph, x)).join(' > ')), h('dt', {}, 'Fights'), h('dd', {}, fights),
        h('dt', {}, 'Newly mapped'), h('dd', {}, c.discovered.length ? c.discovered.map(x => name(graph, x)).join(', ') : 'nothing'),
        h('dt', {}, 'Run id'), h('dd', {}, `seed ${c.seed} · ${c.digest}`)),
      h('p', { class: 'hint' }, 'Nothing was carried, banked or lost. Loot and the death cache arrive in M3.'),
      h('a', { class: 'btn', id: 'download', href: `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(c, null, 1))}`, download: `chronicle-seed${c.seed}.json` }, 'Download Chronicle (JSON)'),
      h('button', { type: 'button', id: 'again', onclick: renderPlan }, 'Plan another'));
  }

  window.__EXPEDITION_RUN__ = (c: ExpeditionConfig) => runExpedition(sim, c, 30 * 3000, graph).chronicle;
  window.__EXPEDITION_READY__ = true;
  renderPlan();
}
declare global {
  interface Window {
    __EXPEDITION_READY__: boolean; __EXPEDITION_RUN__: (c: ExpeditionConfig) => Chronicle;
    __EXPEDITION_STATE__: () => Record<string, unknown>;
  }
}
