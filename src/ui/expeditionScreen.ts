import { loadSim } from '../combat/loadSimBrowser';
import type { SimApi, SimDoctrine } from '../combat/simApi';
import { WorldGraph } from '../world/worldGraph';
import { ROOMS } from '../world/roomRegistry';
import { toWorld } from '../world/worldRunner';
import { DANGER } from '../expedition/planner';
import { gates, needText } from '../world/gates';
import { CAMP, MAX_OBJECTIVES, defaultPlan, frontierRooms, name, preflight, type Exploration, type ExpeditionPlan, type Objective, type ObjectiveKind, type ReturnRoute } from '../expedition/plan';
import { finishChronicle, runExpedition, startExpedition, type ExpeditionConfig, type ExpeditionRun } from '../expedition/run';
import type { Chronicle } from '../expedition/chronicle';
import { describeBank } from '../expedition/loot';
import { UPGRADES, upgradeById, type UpgradeId } from '../progression/experience';
import { MAX_DESIGN_LEVEL } from '../progression/levelTable';
import { settle, type Settlement } from '../expedition/settle';
import { LocalStore, MemoryStore, exportSave, importSave, load, persist, type SaveStore } from '../save/save';
import type { Save } from '../save/saveTypes';
import './expedition.css';

const KNOWLEDGE: Record<string, { label: string; rooms: string[] | 'all' }> = {
  save: { label: 'My map (fog stays until entered)', rooms: [] },
  fresh: { label: 'Fresh map (Camp, Outer Road)', rooms: ['C0', 'O1'] },
  oldroad: { label: 'Old Road mapped', rooms: ['C0', 'O1', 'O2', 'O3', 'KT'] },
  all: { label: 'Everything seen (testing)', rooms: 'all' },
};
interface Preset { label: string; plan: Omit<Partial<ExpeditionPlan>, 'objectives'> & { objectives: [ObjectiveKind, string][] } }
const PRESETS: Record<string, Preset> = {
  first: { label: 'First look: the Outer Road', plan: { objectives: [['survey', 'O1']], exploration: 'safe', doctrine: 'guarded', retreatHpPct: 50 } },
  trial: { label: 'Key Trial: the Watchpost', plan: { objectives: [['reach', 'KT']], exploration: 'safe', doctrine: 'guarded', retreatHpPct: 50 } },
  ahead: { label: 'Explore ahead of the Causeway', plan: { objectives: [['explore', 'S1']], exploration: 'safe', doctrine: 'guarded', retreatHpPct: 50 } },
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
  let knowledge = params.get('known') && KNOWLEDGE[params.get('known')!] ? params.get('known')! : 'save';
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
  // The save lives in browser storage (memory only with ?save=memory, for tests). Nothing changes it except a finished expedition and an import.
  const store: SaveStore = params.get('save') === 'memory' ? new MemoryStore() : new LocalStore();
  const loaded = load(store);
  let save: Save = loaded.save;
  let saveNote = loaded.note ?? '';
  let settlement: Settlement | null = null;
  let startedAt = 0;
  let issue = 0;

  const known = () => new Set<string>([...(KNOWLEDGE[knowledge].rooms === 'all' ? [...graph.rooms.keys()] : (KNOWLEDGE[knowledge].rooms as string[])), ...save.world.discovered]);
  // Temporary levels are on unless ?progress=0 (fixed level, kept for tests and comparisons).
  const progressOn = params.get('progress') !== '0';
  let startLevel = Math.max(1, Math.min(MAX_DESIGN_LEVEL, Math.round(Number(params.get('startlevel')) || 1)));
  const cfg = (): ExpeditionConfig => ({ seed, level, focus, progression: progressOn ? { startLevel } : undefined, plan: { ...plan, objectives: objectives.map(o => ({ ...o })), avoid: plan.avoid.slice() }, known: [...known()], hpOverride, cache: save.camp.cache, issueKeys: Math.min(issue, 2, save.camp.bank.keys), claims: save.world.claims, openLinks: save.world.openedLinks });

  const screen = h('div', { class: 'xp', id: 'xp' });
  root.append(screen);

  // ---------- Planning ----------
  function renderPlan() {
    cancelAnimationFrame(raf);
    run = null;
    window.__EXPEDITION_STATE__ = () => ({ view: 'plan' });
    screen.replaceChildren();
    const k = known(), frontier = frontierRooms(graph, k, new Set(save.world.openedLinks));
    const choices = [...[...k].filter(r => r !== CAMP), ...frontier].sort((a, b) => a.localeCompare(b));
    objectives = objectives.filter(o => choices.includes(o.room));
    plan.avoid = plan.avoid.filter(r => k.has(r));
    plan.objectives = objectives;
    const openSet = new Set(save.world.openedLinks);
    const issued = Math.min(issue, 2, save.camp.bank.keys);
    const pf = preflight(plan, graph, k, CAMP, save.camp.cache, openSet, issued);
    const sealed = gates(graph, k, openSet).filter(g => g.state === 'sealed' && k.has(g.from));
    const seg = <T extends string>(label: string, id: string, opts: [T, string][], cur: T, set: (v: T) => void) =>
      h('fieldset', { class: 'seg' }, h('legend', {}, label), ...opts.map(([v, t]) => h('button', { type: 'button', 'aria-pressed': String(v === cur), 'data-seg': `${id}-${v}`, onclick: () => { set(v); renderPlan(); } }, t)));
    const objRows = objectives.map((o, i) => h('li', { class: `obj ${pf.objectives[i]?.status ?? ''}` },
      h('span', { class: 'n' }, String(i + 1)),
      h('select', { 'aria-label': `Objective ${i + 1} action`, 'data-obj-kind': String(i), onchange: (e) => { o.kind = (e.target as HTMLSelectElement).value as ObjectiveKind; if (o.kind === 'recover' && save.camp.cache) o.room = save.camp.cache.room; if (o.kind === 'open' && sealed[0]) { o.room = sealed[0].from; o.to = sealed[0].to; } else delete o.to; renderPlan(); } },
        ...((['reach', 'survey', 'explore', ...(sealed.length ? ['open'] : []), ...(save.camp.cache ? ['recover'] : [])]) as ObjectiveKind[]).map(v => { const op = h('option', { value: v }, cap(v)); if (o.kind === v) op.selected = true; return op; })),
      o.kind === 'open'
        ? h('select', { 'aria-label': `Objective ${i + 1} gate`, 'data-obj-gate': String(i), onchange: (e) => { const [a, b] = (e.target as HTMLSelectElement).value.split('>'); o.room = a; o.to = b; renderPlan(); } },
          ...sealed.map(g => { const op = h('option', { value: `${g.from}>${g.to}` }, `${name(graph, g.from)} to ${name(graph, g.to)}`); if (o.room === g.from && o.to === g.to) op.selected = true; return op; }))
        : h('select', { 'aria-label': `Objective ${i + 1} place`, 'data-obj-room': String(i), disabled: o.kind === 'recover', onchange: (e) => { o.room = (e.target as HTMLSelectElement).value; renderPlan(); } },
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
      h('section', { class: 'card', id: 'camp-card' }, h('h2', {}, 'Camp'),
        h('p', { id: 'bank-line' }, `Banked: ${describeBank(save.camp.bank)}.`),
        h('p', { class: 'hint', id: 'tally-line' }, `${save.camp.expeditions} expedition${save.camp.expeditions === 1 ? '' : 's'}, ${save.camp.deaths} fall${save.camp.deaths === 1 ? '' : 's'}. The starter sword and shield are never lost.`),
        h('p', { id: 'keys-line' }, `Gate Keys banked: ${save.camp.bank.keys}. Opened gates and shortcuts: ${save.world.openedLinks.length}.`),
        save.camp.bank.keys > 0 ? h('fieldset', { class: 'seg', id: 'issue-keys' }, h('legend', {}, 'Gate Keys to carry (eligible to open a gate; unspent ones come home)'), ...[0, 1, 2].filter(n => n <= save.camp.bank.keys).map(n => h('button', { type: 'button', 'data-issue': String(n), 'aria-pressed': String(n === issued), onclick: () => { issue = n; renderPlan(); } }, String(n)))) : null,
        sealed.length ? h('ul', { id: 'gates-seen' }, ...sealed.map(g => h('li', {}, `${name(graph, g.from)} to ${name(graph, g.to)}: sealed. It ${needText(g.need)}.`))) : null,
        save.camp.cache ? h('p', { class: 'warn', id: 'cache-line' }, `A recovery cache waits in ${name(graph, save.camp.cache.room)}: ${describeBank(save.camp.cache.contents)}. A new fall before you collect it replaces it, and what it holds is lost for good.`) : h('p', { class: 'hint', id: 'cache-line' }, 'No recovery cache is waiting.'),
        save.camp.cache ? h('button', { type: 'button', id: 'add-recover', disabled: objectives.length >= MAX_OBJECTIVES || objectives.some(o => o.kind === 'recover'), onclick: () => { objectives.push({ id: `o${nextId++}`, kind: 'recover', room: save.camp.cache!.room }); renderPlan(); } }, 'Add: recover the cache') : null,
        saveNote ? h('p', { class: 'warn' }, saveNote) : null),
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
        h('p', { class: 'hint' }, 'Checked all the time. In a fight the adventurer stops attacking and walks out by the nearest permitted way; enemies stay in their room, but they can still hit it on the way.'),
        progressOn ? h('label', { class: 'range' }, `Drink a ration below ${plan.drinkBelowPct}% health`, h('input', { type: 'range', id: 'drink', min: '0', max: '90', step: '10', value: String(plan.drinkBelowPct), oninput: (e) => { plan.drinkBelowPct = Number((e.target as HTMLInputElement).value); (e.target as HTMLElement).parentElement!.firstChild!.textContent = `Drink a ration below ${plan.drinkBelowPct}% health`; } })) : null,
        progressOn ? h('label', { class: 'range' }, 'Head home when rations are down to', h('select', { id: 'reserve', onchange: (e) => { plan.healingReserve = Number((e.target as HTMLSelectElement).value); renderPlan(); } }, ...[[0, 'Never (off)'], [1, '1 ration'], [2, '2 rations']].map(([v, t]) => { const op = h('option', { value: String(v) }, String(t)); if (plan.healingReserve === v) op.selected = true; return op; }))) : null,
        progressOn ? h('p', { class: 'hint', id: 'ration-rule' }, 'You start with 2 starter rations. They are not loot: they are never banked or left in a cache. A ration heals about a third of your health, is drunk only when no enemy is near, one at a time, and never in a fight. Found rations are drunk after the starter ones.') : null,
        progressOn ? seg<UpgradeId>('Sanctuary upgrade (one choice, taken for you)', 'upgrade', UPGRADES.map(u => [u.id, u.name] as [UpgradeId, string]), plan.sanctuaryChoice, v => { plan.sanctuaryChoice = v; }) : null,
        progressOn ? h('p', { class: 'hint', id: 'sanctuary-rule' }, `${upgradeById(plan.sanctuaryChoice).text} The Broken Pump sanctuary lets you rest once and take that upgrade for this expedition. It never banks, protects a cache or takes you home. No banking here.`) : null),
      h('section', { class: 'card' }, h('h2', {}, 'Avoid'),
        h('p', { class: 'hint' }, 'The adventurer will not enter these rooms for any reason, including the way home.'),
        h('div', { class: 'chips' }, ...avoidable.map(r => h('button', { type: 'button', 'data-avoid': r, 'aria-pressed': String(plan.avoid.includes(r)), onclick: () => { plan.avoid = plan.avoid.includes(r) ? plan.avoid.filter(x => x !== r) : [...plan.avoid, r]; renderPlan(); } }, name(graph, r))))),
      h('details', { class: 'card' }, h('summary', {}, 'Advanced: seed, level, focus'),
        h('div', { class: 'grid3' },
          h('label', {}, 'Seed', h('input', { type: 'number', id: 'seed', min: '1', value: String(seed), onchange: (e) => { seed = Math.max(1, Math.round(Number((e.target as HTMLInputElement).value) || 1)); } })),
          progressOn
            ? h('label', {}, 'Start level (1 to 9)', h('input', { type: 'number', id: 'startlevel', min: '1', max: String(MAX_DESIGN_LEVEL), value: String(startLevel), onchange: (e) => { startLevel = Math.max(1, Math.min(MAX_DESIGN_LEVEL, Math.round(Number((e.target as HTMLInputElement).value) || 1))); } }))
            : h('label', {}, 'Level', h('input', { type: 'number', id: 'level', min: '1', max: String(sim.MAX_LEVEL), value: String(level), onchange: (e) => { level = Math.max(1, Math.min(sim.MAX_LEVEL, Math.round(Number((e.target as HTMLInputElement).value) || 80))); } })),
          h('label', {}, 'Focus', h('select', { id: 'focus', onchange: (e) => { focus = (e.target as HTMLSelectElement).value; } }, ...['balanced', 'duelist', 'bulwark', 'skirmisher', 'survivor'].map(f => { const op = h('option', { value: f }, cap(f)); if (f === focus) op.selected = true; return op; }))))),
      h('details', { class: 'card', id: 'save-card' }, h('summary', {}, 'Save: export, import'),
        h('p', { class: 'hint' }, 'The save is one text kept in this browser. Export it as a backup; import replaces it, after checking it.'),
        h('a', { class: 'btn', id: 'export-save', href: `data:application/json;charset=utf-8,${encodeURIComponent(exportSave(save))}`, download: 'idle-souls-save.json' }, 'Export save'),
        h('textarea', { id: 'import-text', rows: '3', 'aria-label': 'Save text to import' }),
        h('button', { type: 'button', id: 'import-go', onclick: () => { const r = importSave(store, (screen.querySelector('#import-text') as HTMLTextAreaElement).value); if (r.ok) { save = load(store).save; saveNote = 'Save imported.'; } else saveNote = r.error; renderPlan(); } }, 'Import save')),
      h('section', { class: 'card launch' },
        h('div', { class: `badge ${pf.status}`, id: 'preflight', 'data-status': pf.status }, STATUS_LABEL[pf.status] ?? pf.status),
        h('p', { class: 'hint', id: 'home-line' }, objectives.length ? `Way home: ${pf.home.route ? pf.home.route.rooms.map(r => name(graph, r)).join(' > ') : pf.home.reason}` : ''),
        ...pf.messages.map(m => h('p', { class: 'warn' }, m)),
        h('p', { class: 'hint', id: 'risk-rule' }, 'Everything you win or pick up is carried and at risk until you reach camp alive. Only camp banks it: not a retreat, a quiet corner or a boss. If you fall, what you carry stays in one recovery cache where you fell.'),
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
    runCfg = cfg(); startedAt = save.camp.expeditions; settlement = null;
    run = startExpedition(sim, runCfg, graph);
    chronicle = null; paused = false; acc = 0; last = 0; toast = '';
    renderRun();
  }
  const canvas = h('canvas', { id: 'map', width: 640, height: 420, role: 'img', 'aria-label': 'Expedition map' });
  let feed: HTMLElement, objList: HTMLElement, status: HTMLElement, bar: HTMLElement, ctl: HTMLElement, result: HTMLElement, redirectSel: HTMLSelectElement;
  let feedCount = 0;
  let toast = '';
  let carriedEl: HTMLElement, levelEl: HTMLElement, sanctEl: HTMLElement;
  function renderRun() {
    screen.replaceChildren();
    const r = run!;
    feed = h('ol', { class: 'feed', id: 'feed', 'aria-live': 'polite' });
    objList = h('ol', { class: 'objstat', id: 'objstat' });
    status = h('p', { class: 'status', id: 'xstatus' });
    bar = h('div', { class: 'hpbar' }, h('i', {}));
    carriedEl = h('p', { id: 'carried-line' });
    levelEl = h('p', { id: 'level-line' });
    sanctEl = h('p', { id: 'sanctuary-line', class: 'hint' });
    result = h('section', { class: 'card result', id: 'result', hidden: true });
    const k = r.expedition.known;
    redirectSel = h('select', { id: 'redirect-room', 'aria-label': 'Redirect to' }, ...[...k, ...frontierRooms(graph, k, r.expedition.openLinks)].filter(x => x !== CAMP && !runCfg!.plan.avoid.includes(x)).sort().map(x => h('option', { value: x }, name(graph, x))));
    ctl = h('div', { class: 'ctl' },
      ...[1, 4, 16].map(s => h('button', { type: 'button', 'data-speed': String(s), 'aria-pressed': String(s === speed), onclick: () => { speed = s; syncCtl(); } }, `${s}x`)),
      h('button', { type: 'button', id: 'xp-pause', 'aria-pressed': String(paused), onclick: () => { paused = !paused; syncCtl(); } }, 'Pause'),
      h('button', { type: 'button', id: 'skip', onclick: () => { while (!r.world.terminal && r.world.tick < 30 * 3000) r.world.step(); draw(); } }, 'Skip to end'),
      h('button', { type: 'button', id: 'retreat-now', class: 'danger', onclick: () => { toast = r.expedition.order({ type: 'retreat' }) ?? 'Retreat ordered. It starts now; in a fight the adventurer disengages first.'; draw(); } }, 'Retreat to camp'));
    screen.append(
      h('div', { class: 'bar' }, h('div', {}, h('p', { class: 'eyebrow' }, 'EXPEDITION · TRIAL SETTINGS'), h('h1', {}, 'On the road')),
        h('button', { type: 'button', id: 'back-to-plan', onclick: renderPlan }, 'Back to plan')),
      h('div', { class: 'cols' },
        h('div', { class: 'left' }, h('section', { class: 'card mapcard' }, canvas, status, bar, levelEl, carriedEl, sanctEl), ctl,
          h('section', { class: 'card' }, h('h2', {}, 'Change course'), h('p', { class: 'hint' }, 'A redirect waits for the next doorway. A retreat does not.'),
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
    objList.replaceChildren(...ex.objectives.map((o, i) => h('li', { class: o.status }, h('span', { class: 'chip' }, OBJ_LABEL[o.status]), `${i + 1}. ${o.kind === 'open' ? `Open the way from ${name(graph, o.room)} to ${name(graph, o.to ?? o.room)}` : o.kind === 'explore' ? `Explore on from ${name(graph, o.room)}` : `${cap(o.kind)} ${name(graph, o.room)}`}`, o.note ? h('small', {}, o.note) : null)));
    const secs = Math.round(w.tick / 30);
    status.textContent = `${w.terminal ? (w.state === 'home' ? 'Home' : w.state === 'defeated' ? 'Fallen' : 'Stopped') : 'Out'} · ${name(graph, w.room)} · ${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')} · health ${Math.round(w.hp)} of ${w.hpMax}${toast ? ` · ${toast}` : ''}`;
    const pg = w.progress;
    levelEl.textContent = pg ? `Level ${pg.level} of ${MAX_DESIGN_LEVEL}${pg.xpToNext === null ? ' (highest)' : `, experience ${pg.xp} of ${pg.xpToNext}`} · rations ${w.ledger.rations} · upgrade: ${pg.sanctuary.upgrade ? upgradeById(pg.sanctuary.upgrade).name : 'none yet'}. Levels and upgrades end with the expedition.` : '';
    sanctEl.textContent = pg ? (pg.sanctuary.visits === 0 ? 'Sanctuary: not visited. It never banks: no banking here.' : `Sanctuary: ${pg.sanctuary.rested ? 'rested' : 'not rested'}, upgrade taken. No banking here.`) : '';
    carriedEl.textContent = `Carried, at risk until camp: ${describeBank(w.ledger.carried)}.${w.ledger.cache ? ` A recovery cache waits in ${name(graph, w.ledger.cache.room)}.` : ''}`;
    (bar.firstChild as HTMLElement).style.width = `${Math.max(0, Math.min(100, w.hp / w.hpMax * 100))}%`;
    drawMap(r);
    if (w.terminal) for (const id of ['retreat-now', 'redirect-go', 'skip']) (ctl.parentElement!.querySelector(`#${id}`) as HTMLButtonElement | null)?.setAttribute('disabled', '');
    if (w.terminal && !chronicle) finish(r);
    window.__EXPEDITION_STATE__ = () => ({ view: 'run', state: w.state, tick: w.tick, room: w.room, mode: ex.mode, hp: w.hp, intents: ex.intent.length, digest: w.digest, terminal: w.terminal });
  }
  function drawMap(r: ExpeditionRun) {
    const g = canvas.getContext('2d'); if (!g) return;
    const ex = r.expedition, shown = [...ex.known, ...frontierRooms(graph, ex.known, ex.openLinks)];
    const W = canvas.width, H = canvas.height, pad = 40;
    // Drawn at 0.6 of the real floor so neighbouring rooms do not overlap on the schematic.
    const pts = shown.map(id => ({ id, p: worldPos(id), f: { w: graph.room(id).floor.w * 0.6, h: graph.room(id).floor.h * 0.6 } }));
    // Gates seen from a known room: a link to a shown room, or a short stub out of the door's wall (the room beyond stays hidden).
    const gateLines = gates(graph, ex.known, ex.openLinks).filter(g => g.state !== 'unseen').map(g => {
      const a = ex.known.has(g.from) ? g.from : g.to, b = a === g.from ? g.to : g.from, pa = worldPos(a);
      let end = worldPos(b);
      if (!shown.includes(b)) { const dir = { west: [-1, 0], east: [1, 0], north: [0, -1], south: [0, 1] }[ROOMS[a].doors.find(d => d.to === b)!.side]; end = { x: pa.x + dir[0] * 420, y: pa.y + dir[1] * 420 }; }
      return { g, from: pa, to: end };
    });
    const xs = [...pts.flatMap(q => [q.p.x - q.f.w / 2, q.p.x + q.f.w / 2]), ...gateLines.map(l => l.to.x)], ys = [...pts.flatMap(q => [q.p.y - q.f.h / 2, q.p.y + q.f.h / 2]), ...gateLines.map(l => l.to.y)];
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const s = Math.min((W - pad * 2) / (x1 - x0), (H - pad * 2) / (y1 - y0));
    const X = (x: number) => pad + (x - x0) * s + ((W - pad * 2) - (x1 - x0) * s) / 2, Y = (y: number) => pad + (y - y0) * s + ((H - pad * 2) - (y1 - y0) * s) / 2;
    g.clearRect(0, 0, W, H); g.fillStyle = '#10201d'; g.fillRect(0, 0, W, H);
    const avoid = new Set(runCfg!.plan.avoid), here = r.world.room, target = ex.target;
    g.lineWidth = 2; g.strokeStyle = '#3d5a50';
    for (const l of graph.links) if (shown.includes(l.from) && shown.includes(l.to) && l.type === 'ordinary') { g.beginPath(); g.moveTo(X(worldPos(l.from).x), Y(worldPos(l.from).y)); g.lineTo(X(worldPos(l.to).x), Y(worldPos(l.to).y)); g.stroke(); }
    for (const l of gateLines) {
      g.setLineDash(l.g.state === 'open' ? [] : [6, 5]); g.strokeStyle = l.g.state === 'open' ? '#8fc29a' : '#c0594a'; g.lineWidth = 3;
      g.beginPath(); g.moveTo(X(l.from.x), Y(l.from.y)); g.lineTo(X(l.to.x), Y(l.to.y)); g.stroke(); g.setLineDash([]);
      g.fillStyle = l.g.state === 'open' ? '#8fc29a' : '#e8a27c'; g.font = 'bold 13px Arial, sans-serif'; g.fillText(l.g.state === 'open' ? '◇' : '▣', X((l.from.x + l.to.x) / 2), Y((l.from.y + l.to.y) / 2) + 4);
    }
    g.font = '12px Arial, sans-serif';
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
    settlement = settle(save, c, startedAt);
    if (settlement.applied) { try { persist(store, settlement.save); save = settlement.save; } catch (e) { settlement = { ...settlement, applied: false, refused: `The save could not be written: ${(e as Error).message}`, lines: [`The save could not be written: ${(e as Error).message}`] }; } }
    const fights = c.fights.length ? c.fights.map(f => `${name(graph, f.room)}: ${f.won ? 'won' : 'lost'}, ${f.enemiesDefeated} down, health ${f.hpLeft} of ${f.hpMax}`).join('; ') : 'none';
    result.hidden = false;
    result.replaceChildren(h('h2', {}, 'Chronicle'), h('div', { class: `badge ${c.outcome}`, id: 'outcome', 'data-outcome': c.outcome }, cap(c.outcome)), h('p', { class: 'sum', id: 'summary' }, c.summary),
      h('dl', {}, h('dt', {}, 'Route'), h('dd', {}, c.route.map(x => name(graph, x)).join(' > ')), h('dt', {}, 'Fights'), h('dd', {}, fights),
        h('dt', {}, 'Newly mapped'), h('dd', {}, c.discovered.length ? c.discovered.map(x => name(graph, x)).join(', ') : 'nothing'),
        c.progress ? h('dt', {}, 'Levels and supplies') : null,
        c.progress ? h('dd', { id: 'progress-line' }, `Level ${c.progress.startLevel} to ${c.progress.level} (${c.progress.xp} experience), ${c.progress.rationsUsed} ration${c.progress.rationsUsed === 1 ? '' : 's'} drunk, ${c.progress.rationsLeft} left. ${c.progress.sanctuary.visits ? `Sanctuary: ${c.progress.sanctuary.rested ? 'rested' : 'not rested'}, ${c.progress.sanctuary.upgrade ? upgradeById(c.progress.sanctuary.upgrade).name : 'no'} upgrade. No banking there.` : 'The sanctuary was not visited.'} Levels and upgrades are gone now; only banked loot stays.`) : null,
        h('dt', {}, 'Run id'), h('dd', {}, `seed ${c.seed} · ${c.digest}`)),
      h('h2', {}, 'What happened to the loot'),
      h('ul', { id: 'settle-lines' }, ...settlement!.lines.map(l => h('li', {}, l)), ...(settlement!.applied ? c.loot.opened.map(k => { const l = graph.links.find(x => WorldGraph.linkKey(x.from, x.to) === k); return h('li', {}, `Opened for good: ${l ? `${name(graph, l.from)} and ${name(graph, l.to)}` : k}.`); }) : [])),
      h('a', { class: 'btn', id: 'download', href: `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(c, null, 1))}`, download: `chronicle-seed${c.seed}.json` }, 'Download Chronicle (JSON)'),
      h('button', { type: 'button', id: 'again', onclick: renderPlan }, 'Plan another'));
  }

  window.__EXPEDITION_RUN__ = (c: ExpeditionConfig) => runExpedition(sim, c, 30 * 3000, graph).chronicle;
  window.__EXPEDITION_SAVE__ = () => save;
  // Test hook, only with ?save=memory: put the camp in a known state without playing to it.
  if (params.get('save') === 'memory') window.__EXPEDITION_SET_SAVE__ = (next: Save) => { save = next; persist(store, save); renderPlan(); };
  window.__EXPEDITION_READY__ = true;
  renderPlan();
}
declare global {
  interface Window {
    __EXPEDITION_READY__: boolean; __EXPEDITION_RUN__: (c: ExpeditionConfig) => Chronicle;
    __EXPEDITION_STATE__: () => Record<string, unknown>; __EXPEDITION_SAVE__: () => Save; __EXPEDITION_SET_SAVE__?: (s: Save) => void;
  }
}
