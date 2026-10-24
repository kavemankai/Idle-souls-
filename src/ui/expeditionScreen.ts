import { loadSim } from '../combat/loadSimBrowser';
import type { SimApi, SimDoctrine } from '../combat/simApi';
import { WorldGraph } from '../world/worldGraph';
import { gates, needText } from '../world/gates';
import { CAMP, MAX_OBJECTIVES, defaultPlan, frontierRooms, name, preflight, type Exploration, type ExpeditionPlan, type Objective, type ObjectiveKind, type ReturnRoute } from '../expedition/plan';
import { BOSSES, type RematchVariant } from '../world/bosses';
import { finishChronicle, runExpedition, startExpedition, type ExpeditionConfig, type ExpeditionRun } from '../expedition/run';
import type { Chronicle } from '../expedition/chronicle';
import { describeBank } from '../expedition/loot';
import { UPGRADES, upgradeById, type UpgradeId } from '../progression/experience';
import { MAX_DESIGN_LEVEL } from '../progression/levelTable';
import { PERMANENT_UPGRADES, commitPurchase, permanentStartingLevel, permanentStatBonus, type PermanentUpgradeId } from '../progression/permanent';
import { settle, type Settlement } from '../expedition/settle';
import { LocalStore, MemoryStore, defaultSave, exportSave, importSave, load, persist, type SaveStore } from '../save/save';
import { parseDurable, serializeDurable, toLegacy, type SaveV3 } from '../save/durable';
import { playerSaveRepository } from '../save/nativeRepository';
import { commitCheckpoint, commitDiscard, commitDispatch, commitSettlement } from '../save/durableSettlement';
import { ExpeditionCommandJournal, checkpoint, restoreExpedition } from '../expedition/replayCheckpoint';
import type { Save } from '../save/saveTypes';
import { PrefsStore } from './prefs';
import { History, entryId } from './history';
import { applyPalette } from './palette';
import { drawWorldMap } from './mapDraw';
import { CampMap } from './mapScreen';
import { Guide, glossaryDrawer } from './onboarding';
import { ExpeditionAudio } from './audioCues';
import { describeDeath, renderChronicle } from './chronicleView';
import './expedition.css';
import { lifecycle } from '../platform/lifecycle';

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
/** A text mark in front of the feed lines that matter, so no kind is told apart by colour alone. */
const MARK: Record<string, string> = { discovery: '◇ ', retreat: '↩ ', redirect: '↪ ', sanctuary: '✚ ', end: '■ ', level: '▲ ', loot: '● ' };
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
export function mountExpedition(root: HTMLElement, options: { developer?: boolean } = {}) {
  const developer = options.developer ?? true;
  const sim: SimApi = loadSim();
  const graph = new WorldGraph();
  const params = new URLSearchParams(developer ? location.search : '');
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
  // Developer fixtures retain their V2 storage. Shipped players use only V3 durable storage.
  const store: SaveStore = params.get('save') === 'memory' ? new MemoryStore() : new LocalStore();
  const loaded = developer ? load(store) : { save: defaultSave(), note: null };
  let save: Save = loaded.save;
  let saveNote = loaded.note ?? '';
  const durableRepo = developer ? null : playerSaveRepository();
  let durable: SaveV3 | null = null;
  let purchasePending = false;
  let storageBlocked = !developer;
  let dispatchPending = false, pauseAfterDispatch = false;
  let journal: ExpeditionCommandJournal | null = null;
  let activeId = '';
  let lastQueuedTick = 0, lastEventCount = 0, lastPickupCount = 0, lastRoom = '';
  let checkpointQueue: Promise<void> = Promise.resolve();
  let settlement: Settlement | null = null;
  let startedAt = 0;
  let issue = 0;

  const known = () => new Set<string>([...(KNOWLEDGE[knowledge].rooms === 'all' ? [...graph.rooms.keys()] : (KNOWLEDGE[knowledge].rooms as string[])), ...save.world.discovered]);
  // Temporary levels are on unless ?progress=0 (fixed level, kept for tests and comparisons).
  const progressOn = params.get('progress') !== '0';
  let startLevel = Math.max(1, Math.min(MAX_DESIGN_LEVEL, Math.round(Number(params.get('startlevel')) || 1)));
  const cfg = (): ExpeditionConfig => ({ seed, level, focus, progression: developer ? (progressOn ? { startLevel } : undefined) : { startLevel: durable ? permanentStartingLevel(durable) : 1 }, permanentBonus: !developer && durable ? permanentStatBonus(durable) : undefined, plan: { ...plan, objectives: objectives.map(o => ({ ...o })), avoid: plan.avoid.slice() }, known: [...known()], hpOverride, cache: save.camp.cache, issueKeys: Math.min(issue, 2, save.camp.bank.keys), claims: save.world.claims, openLinks: save.world.openedLinks, defeatedBosses: save.world.defeatedBosses });

  // Per-device settings and the Chronicle history live under their own keys, never in the save. ?save=memory keeps them in memory too (tests).
  const memory = params.get('save') === 'memory';
  const prefs = new PrefsStore(memory ? new MemoryStore() : new LocalStore('idle-souls.prefs'));
  const history = new History(memory ? new MemoryStore() : new LocalStore('idle-souls.history'));
  const guide = new Guide(prefs);
  const campMap = new CampMap();
  // The visual pair of every cue: a line of text in a live region that stays on every screen.
  const cueBanner = h('p', { class: 'cue-banner', id: 'cue-banner', role: 'status', 'aria-live': 'polite' });
  const audio = new ExpeditionAudio((text) => {
    cueBanner.textContent = text; cueBanner.classList.remove('flash'); void cueBanner.offsetWidth; cueBanner.classList.add('flash');
  });
  audio.setLevels(prefs.get().music, prefs.get().effects);
  if (developer) window.__EXPEDITION_AUDIO__ = audio;
  const motionQuery = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;
  let view: 'plan' | 'run' | 'history' | 'entry' = 'plan';
  let entryOpen = '';

  const screen = h('div', { class: 'xp', id: 'xp' });
  applyPalette(screen);
  root.setAttribute('aria-label', 'Expedition planner');   // the page's one main landmark (index.html) names this scene
  root.append(screen);
  function applyPrefs() {
    screen.classList.toggle('big', prefs.get().bigText);
    screen.classList.toggle('calm', prefs.reducedMotion(!!motionQuery?.matches));
  }
  applyPrefs();
  motionQuery?.addEventListener?.('change', applyPrefs);
  /** Skip link, settings row and the cue banner: shown on every screen. Each control is a labelled button of at least 44 px. */
  /** While an expedition is out, the buttons that would leave the screen are off, so a stray press cannot drop the run. */
  const busy = () => dispatchPending || (view === 'run' && !!run && (!run.world.terminal || (!developer && !!durable?.activeExpedition)));
  function toolbar(): Node {
    const wrap = h('div', { id: 'tools' });
    const rerender = () => wrap.replaceChildren(...build());
    wrap.append(...build());
    return wrap;
    function build(): Node[] {
    const p = prefs.get();
    return [
      h('a', { class: 'skip-link', href: '#main', onclick: (e) => { e.preventDefault(); (screen.querySelector('#main') as HTMLElement | null)?.focus(); } }, 'Skip to main content'),
      h('div', { class: 'toolbar', role: 'toolbar', 'aria-label': 'Settings' },
        h('button', { type: 'button', id: 'help-btn', disabled: busy(), onclick: () => { guide.open(); view = 'plan'; renderPlan(); } }, 'Help'),
        h('button', { type: 'button', id: 'history-btn', disabled: busy(), onclick: () => { cancelAnimationFrame(raf); run = null; renderHistory(); } }, 'Past expeditions'),
        h('button', { type: 'button', id: 'bigtext', 'aria-pressed': String(p.bigText), onclick: () => { prefs.set({ bigText: !prefs.get().bigText }); applyPrefs(); rerender(); } }, 'Larger text'),
        h('button', { type: 'button', id: 'calm-btn', 'aria-pressed': String(prefs.reducedMotion(!!motionQuery?.matches)), onclick: () => { prefs.set({ reduceMotion: !prefs.reducedMotion(!!motionQuery?.matches) }); applyPrefs(); rerender(); } }, 'Reduce motion'),
        h('button', { type: 'button', id: 'audio-btn', 'aria-pressed': String(audio.enabled), onclick: () => { if (audio.enabled) audio.disable(); else audio.enable(); rerender(); } }, audio.enabled ? 'Audio on' : 'Enable audio'),
        audio.enabled ? h('label', { class: 'vol' }, 'Music', h('input', { type: 'range', id: 'vol-music', min: '0', max: '100', value: String(Math.round(p.music * 100)), oninput: (e) => { const v = Number((e.target as HTMLInputElement).value) / 100; prefs.set({ music: v }); audio.setLevels(v, prefs.get().effects); } })) : null,
        audio.enabled ? h('label', { class: 'vol' }, 'Effects', h('input', { type: 'range', id: 'vol-effects', min: '0', max: '100', value: String(Math.round(p.effects * 100)), oninput: (e) => { const v = Number((e.target as HTMLInputElement).value) / 100; prefs.set({ effects: v }); audio.setLevels(prefs.get().music, v); } })) : null),
      cueBanner,
    ];
    }
  }

  // ---------- Planning ----------
  async function buyPermanentUpgrade(id: PermanentUpgradeId, rank: number) {
    if (!durableRepo || !durable || storageBlocked || purchasePending || durable.activeExpedition) return;
    const offer = PERMANENT_UPGRADES.find(x => x.id === id), price = offer?.prices[rank];
    if (!offer || !price) return;
    if (!window.confirm('Buy ' + offer.title + ' rank ' + (rank + 1) + ' for ' + price.gold + ' gold and ' + price.mastery + ' mastery?')) return;
    purchasePending = true; renderPlan();
    const txn = 'purchase:' + id + ':' + crypto.randomUUID();
    const result = await commitPurchase(durableRepo, durable.revision, { upgradeId: id, expectedRank: rank }, txn);
    if (result.ok) { durable = result.save; save = toLegacy(result.save); saveNote = offer.title + ' upgraded permanently for the next expedition.'; }
    else saveNote = 'Purchase refused, nothing granted: ' + result.error;
    purchasePending = false; renderPlan();
  }
  function renderPlan() {
    cancelAnimationFrame(raf);
    run = null; view = 'plan';
    audio.setSuspended(!lifecycle.active);
    if (developer) window.__EXPEDITION_STATE__ = () => ({ view: 'plan' });
    screen.replaceChildren(toolbar());
    const main = h('div', { id: 'main', tabindex: '-1' });
    screen.append(main);
    const k = known(), frontier = frontierRooms(graph, k, new Set(save.world.openedLinks));
    const choices = [...[...k].filter(r => r !== CAMP), ...frontier].sort((a, b) => a.localeCompare(b));
    objectives = objectives.filter(o => choices.includes(o.room));
    plan.avoid = plan.avoid.filter(r => k.has(r));
    plan.objectives = objectives;
    const openSet = new Set(save.world.openedLinks);
    const issued = Math.min(issue, 2, save.camp.bank.keys);
    const pf = preflight(plan, graph, k, CAMP, save.camp.cache, openSet, issued, new Set(save.world.defeatedBosses));
    const sealed = gates(graph, k, openSet).filter(g => g.state === 'sealed' && k.has(g.from));
    const seg = <T extends string>(label: string, id: string, opts: [T, string][], cur: T, set: (v: T) => void) =>
      h('fieldset', { class: 'seg' }, h('legend', {}, label), ...opts.map(([v, t]) => h('button', { type: 'button', 'aria-pressed': String(v === cur), 'data-seg': `${id}-${v}`, onclick: () => { set(v); renderPlan(); } }, t)));
    const objRows = objectives.map((o, i) => h('li', { class: `obj ${pf.objectives[i]?.status ?? ''}` },
      h('span', { class: 'n' }, String(i + 1)),
      h('select', { 'aria-label': `Objective ${i + 1} action`, 'data-obj-kind': String(i), onchange: (e) => { o.kind = (e.target as HTMLSelectElement).value as ObjectiveKind; if (o.kind === 'recover' && save.camp.cache) o.room = save.camp.cache.room; if (o.kind === 'open' && sealed[0]) { o.room = sealed[0].from; o.to = sealed[0].to; } else delete o.to; if (o.kind === 'challenge' || o.kind === 'rematch') { const b = Object.values(BOSSES).find(x => save.world.defeatedBosses.includes(x.id) === (o.kind === 'rematch')); if (b && choices.includes(b.room)) o.room = b.room; if (o.kind === 'rematch') o.variant ??= 'standard'; else delete o.variant; } renderPlan(); } },
        ...((['reach', 'survey', 'explore', ...(sealed.length ? ['open'] : []), ...(save.camp.cache ? ['recover'] : []), 'challenge', ...(save.world.defeatedBosses.length ? ['rematch'] : [])]) as ObjectiveKind[]).map(v => { const op = h('option', { value: v }, cap(v)); if (o.kind === v) op.selected = true; return op; })),
      o.kind === 'open'
        ? h('select', { 'aria-label': `Objective ${i + 1} gate`, 'data-obj-gate': String(i), onchange: (e) => { const [a, b] = (e.target as HTMLSelectElement).value.split('>'); o.room = a; o.to = b; renderPlan(); } },
          ...sealed.map(g => { const op = h('option', { value: `${g.from}>${g.to}` }, `${name(graph, g.from)} to ${name(graph, g.to)}`); if (o.room === g.from && o.to === g.to) op.selected = true; return op; }))
        : h('select', { 'aria-label': `Objective ${i + 1} place`, 'data-obj-room': String(i), disabled: o.kind === 'recover', onchange: (e) => { o.room = (e.target as HTMLSelectElement).value; renderPlan(); } },
        ...choices.map(r => { const op = h('option', { value: r }, `${name(graph, r)}${k.has(r) ? '' : ' (unexplored)'}`); if (o.room === r) op.selected = true; return op; })),
      o.kind === 'rematch' ? h('select', { 'aria-label': `Objective ${i + 1} rematch variant`, 'data-obj-variant': String(i), onchange: (e) => { o.variant = (e.target as HTMLSelectElement).value as RematchVariant; renderPlan(); } }, ...([['standard', 'Standard'], ['limited-healing', 'Limited healing (no rations)']] as [RematchVariant, string][]).map(([v, t]) => { const op = h('option', { value: v }, t); if ((o.variant ?? 'standard') === v) op.selected = true; return op; })) : null,
      h('span', { class: 'row-btns' },
        h('button', { type: 'button', 'aria-label': 'Move up', disabled: i === 0, onclick: () => { [objectives[i - 1], objectives[i]] = [objectives[i], objectives[i - 1]]; renderPlan(); } }, '↑'),
        h('button', { type: 'button', 'aria-label': 'Move down', disabled: i === objectives.length - 1, onclick: () => { [objectives[i + 1], objectives[i]] = [objectives[i], objectives[i + 1]]; renderPlan(); } }, '↓'),
        h('button', { type: 'button', 'aria-label': 'Remove', 'data-remove': String(i), onclick: () => { objectives.splice(i, 1); renderPlan(); } }, '✕')),
      h('p', { class: 'why' }, pf.objectives[i] ? `${STATUS_LABEL[pf.objectives[i].status]}. ${pf.objectives[i].reason}` : '')));
    const avoidable = [...k].filter(r => r !== CAMP).sort();
    // The map previews the route to the last objective as the preflight already judged it. A conflicted plan has no drawable route, so it shows as blocked.
    const lastPf = pf.objectives[pf.objectives.length - 1];
    const preview = lastPf ? { route: lastPf.route ? lastPf.route.rooms : null, kind: (lastPf.status === 'confirmed' || lastPf.status === 'frontier' ? lastPf.status : 'blocked') as 'confirmed' | 'frontier' | 'blocked' } : null;
    const mapCard = campMap.render({
      graph, known: k, open: openSet, avoid: plan.avoid, cache: save.camp.cache, preview, atCapacity: objectives.length >= MAX_OBJECTIVES,
      onAdd: (kind, room) => { objectives.push({ id: `o${nextId++}`, kind, room }); renderPlan(); (screen.querySelector('#add-objective') as HTMLElement | null)?.focus(); },
      onToggleAvoid: (room) => { plan.avoid = plan.avoid.includes(room) ? plan.avoid.filter(x => x !== room) : [...plan.avoid, room]; renderPlan(); (screen.querySelector(`[data-map-avoid="${room}"]`) as HTMLElement | null)?.focus(); },
    });
    main.append(
      h('div', { class: 'bar' }, h('div', {}, h('p', { class: 'eyebrow' }, developer ? 'CAMP · EXPEDITION PLAN · TRIAL SETTINGS' : 'CAMP'), h('h1', {}, 'Plan an expedition')),
        developer ? h('label', { class: 'know' }, 'Map ', h('select', { id: 'knowledge', onchange: (e) => { knowledge = (e.target as HTMLSelectElement).value; renderPlan(); } },
          ...Object.entries(KNOWLEDGE).map(([v, d]) => { const op = h('option', { value: v }, d.label); if (v === knowledge) op.selected = true; return op; }))) : null),
      guide.render(renderPlan) ?? '',
      h('section', { class: 'card', id: 'camp-card' }, h('h2', {}, 'Camp'),
        h('p', { id: 'bank-line' }, `Banked: ${describeBank(save.camp.bank)}.`),
        h('p', { class: 'hint', id: 'tally-line' }, `${save.camp.expeditions} expedition${save.camp.expeditions === 1 ? '' : 's'}, ${save.camp.deaths} fall${save.camp.deaths === 1 ? '' : 's'}. The starter sword and shield are never lost.`),
        h('p', { id: 'keys-line' }, `Gate Keys banked: ${save.camp.bank.keys}. Opened gates and shortcuts: ${save.world.openedLinks.length}.`),
        save.camp.bank.keys > 0 ? h('fieldset', { class: 'seg', id: 'issue-keys' }, h('legend', {}, 'Gate Keys to carry (eligible to open a gate; unspent ones come home)'), ...[0, 1, 2].filter(n => n <= save.camp.bank.keys).map(n => h('button', { type: 'button', 'data-issue': String(n), 'aria-pressed': String(n === issued), onclick: () => { issue = n; renderPlan(); } }, String(n)))) : null,
        sealed.length ? h('ul', { id: 'gates-seen' }, ...sealed.map(g => h('li', {}, `${name(graph, g.from)} to ${name(graph, g.to)}: sealed. It ${needText(g.need)}.`))) : null,
        save.camp.cache ? h('p', { class: 'warn', id: 'cache-line' }, `A recovery cache waits in ${name(graph, save.camp.cache.room)}: ${describeBank(save.camp.cache.contents)}. A new fall before you collect it replaces it, and what it holds is lost for good.`) : h('p', { class: 'hint', id: 'cache-line' }, 'No recovery cache is waiting.'),
        save.camp.cache ? h('button', { type: 'button', id: 'add-recover', disabled: objectives.length >= MAX_OBJECTIVES || objectives.some(o => o.kind === 'recover'), onclick: () => { objectives.push({ id: `o${nextId++}`, kind: 'recover', room: save.camp.cache!.room }); renderPlan(); } }, 'Add: recover the cache') : null,
        saveNote ? h('p', { class: 'warn' }, saveNote) : null,
        !developer && !durable ? h('p', { class: 'warn', id: 'durable-status' }, 'Checking durable storage. Dispatch is disabled until your save is safe.') : null,
        !developer && durable?.activeExpedition ? h('div', { id: 'saved-expedition' },
          h('p', { class: 'warn' }, 'An unfinished expedition is saved at tick ' + durable.activeExpedition.tick + '. Carried loot was not banked.'),
          h('button', { type: 'button', id: 'resume-saved', onclick: resumeSavedExpedition }, 'Resume saved expedition'),
          h('button', { type: 'button', id: 'discard-saved', onclick: () => { void discardSavedExpedition(); } }, 'Discard unfinished expedition')) : null),
      !developer && durable ? h('section', { class: 'card', id: 'permanent-upgrades' },
        h('h2', {}, 'Permanent character training'),
        h('p', { class: 'hint', id: 'effective-build' },
          'Next expedition: starting design level ' + permanentStartingLevel(durable) +
          ', swingSkill +' + (durable.camp.permanent.weapon * 2) +
          ', guardStrength +' + (durable.camp.permanent.shield * 2) +
          ' (simulator stat cap: 20). Temporary XP and sanctuary choices reset each expedition.'),
        h('p', { class: 'hint' }, 'Only banked gold and mastery can buy upgrades. Carried loot is unsafe until extraction. Permanent upgrades survive death and reload.'),
        ...PERMANENT_UPGRADES.map(u => {
          const rank = durable!.camp.permanent[u.id], offer = u.prices[rank];
          const affordable = !!offer && save.camp.bank.gold >= offer.gold && save.camp.bank.mastery >= offer.mastery;
          return h('div', { class: 'upgrade-row' },
            h('p', {}, u.title + ' · Rank ' + rank + '/' + u.prices.length + '. ' + u.description),
            h('button', { type: 'button', 'data-upgrade': u.id,
              disabled: purchasePending || storageBlocked || !!durable!.activeExpedition || !affordable,
              onclick: () => { void buyPermanentUpgrade(u.id, rank); } },
              !offer ? 'MAX' : 'Buy for ' + offer.gold + ' gold + ' + offer.mastery + ' mastery'));
        })) : '',
      mapCard,
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
      developer ? h('details', { class: 'card' }, h('summary', {}, 'Advanced: seed, level, focus'),
        h('div', { class: 'grid3' },
          h('label', {}, 'Seed', h('input', { type: 'number', id: 'seed', min: '1', value: String(seed), onchange: (e) => { seed = Math.max(1, Math.round(Number((e.target as HTMLInputElement).value) || 1)); } })),
          progressOn
            ? h('label', {}, 'Start level (1 to 9)', h('input', { type: 'number', id: 'startlevel', min: '1', max: String(MAX_DESIGN_LEVEL), value: String(startLevel), onchange: (e) => { startLevel = Math.max(1, Math.min(MAX_DESIGN_LEVEL, Math.round(Number((e.target as HTMLInputElement).value) || 1))); } }))
            : h('label', {}, 'Level', h('input', { type: 'number', id: 'level', min: '1', max: String(sim.MAX_LEVEL), value: String(level), onchange: (e) => { level = Math.max(1, Math.min(sim.MAX_LEVEL, Math.round(Number((e.target as HTMLInputElement).value) || 80))); } })),
          h('label', {}, 'Focus', h('select', { id: 'focus', onchange: (e) => { focus = (e.target as HTMLSelectElement).value; } }, ...['balanced', 'duelist', 'bulwark', 'skirmisher', 'survivor'].map(f => { const op = h('option', { value: f }, cap(f)); if (f === focus) op.selected = true; return op; }))))): '',
      h('details', { class: 'card', id: 'save-card' }, h('summary', {}, 'Save: export, import'),
        h('p', { class: 'hint' }, developer ? 'Developer save kept in this browser.' : 'Save backups require an explicit import confirmation. The previous durable save is retained.'),
        h('a', { class: 'btn', id: 'export-save', href: `data:application/json;charset=utf-8,${encodeURIComponent(!developer && durable ? serializeDurable(durable) : exportSave(save))}`, download: 'idle-souls-save.json' }, 'Export save'),
        h('textarea', { id: 'import-text', rows: '3', 'aria-label': 'Save text to import' }),
        h('button', { type: 'button', id: 'import-go', disabled: !developer && !durable, onclick: () => {
           const raw = (screen.querySelector('#import-text') as HTMLTextAreaElement).value;
           if (developer) {
             const r = importSave(store, raw);
             if (r.ok) { save = load(store).save; saveNote = 'Save imported.'; } else saveNote = r.error;
             renderPlan(); return;
           }
           const parsed = parseDurable(raw);
           if (!parsed.ok) { saveNote = parsed.error; renderPlan(); return; }
           if (!window.confirm('Replace existing progress and the unfinished expedition? The previous save is backed up.')) return;
           void durableRepo!.import(raw, true).then(r => {
             if (r.ok) { durable = r.save; save = toLegacy(r.save); storageBlocked = false; saveNote = 'Imported and verified durable save.'; }
             else saveNote = r.error;
             renderPlan();
           });
         } }, 'Import save')),
      h('section', { class: 'card launch' },
        h('div', { class: `badge ${pf.status}`, id: 'preflight', 'data-status': pf.status }, STATUS_LABEL[pf.status] ?? pf.status),
        h('p', { class: 'hint', id: 'home-line' }, objectives.length ? `Way home: ${pf.home.route ? pf.home.route.rooms.map(r => name(graph, r)).join(' > ') : pf.home.reason}` : ''),
        ...pf.messages.map(m => h('p', { class: 'warn' }, m)),
        h('p', { class: 'hint', id: 'risk-rule' }, 'Everything you win or pick up is carried and at risk until you reach camp alive. Only camp banks it: not a retreat, a quiet corner or a boss. If you fall, what you carry stays in one recovery cache where you fell.'),
        h('button', { type: 'button', id: 'launch', class: 'primary', disabled: !pf.launchable || (!developer && (storageBlocked || !durable || !!durable.activeExpedition)), onclick: launch }, 'Launch expedition')),
      glossaryDrawer());
    if (notice) { main.append(h('p', { class: 'warn', role: 'status' }, notice)); notice = ''; }
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
    if (!lifecycle.active) return;
    if (!developer) { void launchDurable(); return; }
    runCfg = cfg(); startedAt = save.camp.expeditions; settlement = null;
    run = startExpedition(sim, runCfg, graph);
    chronicle = null; paused = false; acc = 0; last = 0; toast = '';
    renderRun();
  }
  async function launchDurable() {
    if (!durableRepo || !durable || storageBlocked || durable.activeExpedition || dispatchPending) return;
    dispatchPending = true; pauseAfterDispatch = false;
    seed = crypto.getRandomValues(new Uint32Array(1))[0] || 1;
    const config = cfg(), candidate = startExpedition(sim, config, graph);
    const id = 'run:' + save.camp.expeditions + ':' + seed + ':' + Date.now();
    let first;
    try { first = checkpoint(id, config, candidate, []); }
    catch (error) { dispatchPending = false; saveNote = String(error); renderPlan(); return; }
    const written = await commitDispatch(durableRepo, durable.revision, first);
    if (!written.ok) { dispatchPending = false; saveNote = 'Cannot dispatch without a durable checkpoint: ' + written.error; renderPlan(); return; }
    durable = written.save; save = toLegacy(durable);
    runCfg = config; run = candidate; startedAt = save.camp.expeditions;
    activeId = id; journal = new ExpeditionCommandJournal(run);
    lastQueuedTick = 0; lastEventCount = 0; lastPickupCount = 0; lastRoom = run.world.room;
    checkpointQueue = Promise.resolve();
    settlement = null; chronicle = null; paused = pauseAfterDispatch; acc = 0; last = 0; toast = pauseAfterDispatch ? 'Paused by Back during dispatch.' : '';
    dispatchPending = false; renderRun();
  }
  function resumeSavedExpedition() {
    if (!durable?.activeExpedition || !durableRepo || storageBlocked) return;
    const snap = durable.activeExpedition;
    try {
      const restored = restoreExpedition(sim, snap, graph);
      runCfg = snap.config; run = restored; startedAt = durable.camp.expeditions;
      activeId = snap.id; journal = new ExpeditionCommandJournal(restored);
      journal.commands.push(...structuredClone(snap.commands));
      lastQueuedTick = snap.tick;
      lastEventCount = restored.expedition.events.length;
      lastPickupCount = restored.world.ledger.gains.length; lastRoom = restored.world.room;
      checkpointQueue = Promise.resolve();
      settlement = null; chronicle = null; paused = true; acc = 0; last = 0;
      toast = 'Restored exact checkpoint state. Press Resume when ready.';
      renderRun();
    } catch (error) {
      saveNote = 'Checkpoint could not be verified; original retained. ' + String(error);
      renderPlan();
    }
  }
  async function discardSavedExpedition() {
    if (!durable?.activeExpedition || !durableRepo || storageBlocked) return;
    if (!window.confirm('Discard carried loot and this unfinished expedition? Nothing will be banked.')) return;
    const result = await commitDiscard(durableRepo, durable.revision, durable.activeExpedition.id);
    if (result.ok) { durable = result.save; save = toLegacy(result.save); saveNote = 'The unfinished expedition was discarded.'; }
    else saveNote = 'Discard failed; the expedition is preserved: ' + result.error;
    renderPlan();
  }
  /** Serial checkpoint writer. Disk failure stops play instead of silently using volatile memory. */
  function queueCheckpoint(force = false): Promise<void> {
    if (developer || !durableRepo || !durable || !run || !runCfg || !journal || storageBlocked) return checkpointQueue;
    const w = run.world, ex = run.expedition;
    if (!force && w.tick - lastQueuedTick < 60 && w.room === lastRoom &&
      ex.events.length === lastEventCount && w.ledger.gains.length === lastPickupCount) return checkpointQueue;
    let snap;
    try { snap = checkpoint(activeId, runCfg, run, journal.commands); }
    catch (error) { storageBlocked = true; if (view === 'run') pauseRun('Cannot safely checkpoint: ' + String(error)); return checkpointQueue; }
    lastQueuedTick = snap.tick; lastRoom = w.room;
    lastEventCount = ex.events.length; lastPickupCount = w.ledger.gains.length;
    checkpointQueue = checkpointQueue.then(async () => {
      if (!durable || !durableRepo || storageBlocked) return;
      const result = await commitCheckpoint(durableRepo, durable.revision, snap);
      if (result.ok) { durable = result.save; save = toLegacy(result.save); }
      else {
        storageBlocked = true;
        if (view === 'run') pauseRun('Your progress is NOT safely saved: ' + result.error + '. Reload to recover the last committed checkpoint.');
      }
    }).catch(error => {
      storageBlocked = true;
      if (view === 'run') pauseRun('Your progress is NOT safely saved: ' + String(error));
    });
    return checkpointQueue;
  }
  /** An accepted order is committed before playback can advance another tick. */
  function issueOrder(order: { type: 'retreat' } | { type: 'redirect'; room: string }): string {
    if (!run) return 'No running expedition';
    if (developer || !journal) return run.expedition.order(order) ?? 'Order accepted.';
    if (storageBlocked) return 'Storage is unavailable. Expedition is paused; do not continue.';
    const wasPaused = paused;
    paused = true; acc = 0; last = 0; audio.setSuspended(true);
    const reason = journal.order(order);
    if (reason !== null) { paused = wasPaused; syncCtl(); return reason; }
    void queueCheckpoint(true).then(() => {
      if (!storageBlocked && !wasPaused && lifecycle.active) {
        paused = false; acc = 0; last = 0; audio.setSuspended(false);
      }
      if (view === 'run') syncCtl();
    });
    syncCtl();
    return 'Order recorded; saving before continuation.';
  }
  const canvas = h('canvas', { id: 'map', width: 640, height: 420, role: 'img', 'aria-label': 'Expedition map', 'aria-describedby': 'xstatus' });
  let feed: HTMLElement, objList: HTMLElement, status: HTMLElement, bar: HTMLElement, ctl: HTMLElement, result: HTMLElement, redirectSel: HTMLSelectElement;
  let feedCount = 0;
  let toast = '';
  let carriedEl: HTMLElement, levelEl: HTMLElement, sanctEl: HTMLElement;
  function renderRun() {
    view = 'run';
    screen.replaceChildren(toolbar());
    const r = run!;
    feed = h('ol', { class: 'feed', id: 'feed', role: 'log', 'aria-label': 'Intent feed', tabindex: '0' });
    objList = h('ol', { class: 'objstat', id: 'objstat' });
    status = h('p', { class: 'status', id: 'xstatus', role: 'status' });
    bar = h('div', { class: 'hpbar' }, h('i', {}));
    carriedEl = h('p', { id: 'carried-line' });
    levelEl = h('p', { id: 'level-line' });
    sanctEl = h('p', { id: 'sanctuary-line', class: 'hint' });
    result = h('section', { class: 'card result', id: 'result', hidden: true });
    const k = r.expedition.known;
    redirectSel = h('select', { id: 'redirect-room', 'aria-label': 'Redirect to' }, ...[...k, ...frontierRooms(graph, k, r.expedition.openLinks)].filter(x => x !== CAMP && !runCfg!.plan.avoid.includes(x)).sort().map(x => h('option', { value: x }, name(graph, x))));
    ctl = h('div', { class: 'ctl' },
      ...[1, 4, 16].map(s => h('button', { type: 'button', 'data-speed': String(s), 'aria-pressed': String(s === speed), onclick: () => { speed = s; syncCtl(); } }, `${s}x`)),
      h('button', { type: 'button', id: 'xp-pause', 'aria-pressed': String(paused), onclick: () => { if (!lifecycle.active) return; paused = !paused; acc = 0; last = 0; audio.setSuspended(paused); syncCtl(); } }, 'Pause'),
      developer ? h('button', { type: 'button', id: 'skip', onclick: () => { if (paused || !lifecycle.active) return; while (!r.world.terminal && r.world.tick < 30 * 3000) r.world.step(); draw(); } }, 'Skip to end') : null,
      h('button', { type: 'button', id: 'retreat-now', class: 'danger', onclick: () => { toast = issueOrder({ type: 'retreat' }); draw(); } }, 'Retreat to camp'));
    screen.append(h('div', { id: 'main', tabindex: '-1' },
      h('div', { class: 'bar' }, h('div', {}, h('p', { class: 'eyebrow' }, developer ? 'EXPEDITION · TRIAL SETTINGS' : 'EXPEDITION'), h('h1', {}, 'On the road')),
        h('button', { type: 'button', id: 'back-to-plan', disabled: busy(), onclick: renderPlan }, 'Back to plan')),
      h('div', { class: 'cols' },
        h('div', { class: 'left' }, h('section', { class: 'card mapcard' }, canvas, status, bar, levelEl, carriedEl, sanctEl), ctl,
          h('section', { class: 'card' }, h('h2', {}, 'Change course'), h('p', { class: 'hint' }, 'A redirect waits for the next doorway. A retreat does not.'),
            h('div', { class: 'redirect' }, redirectSel, h('button', { type: 'button', id: 'redirect-go', onclick: () => { toast = issueOrder({ type: 'redirect', room: redirectSel.value }); draw(); } }, 'Go there first'))),
          h('section', { class: 'card' }, h('h2', {}, 'Objectives'), objList)),
        h('div', { class: 'right' }, h('section', { class: 'card' }, h('h2', {}, 'Intent feed'), feed), result))));
    feedCount = 0; syncCtl();
    cancelAnimationFrame(raf); raf = requestAnimationFrame(frame);
    draw();
  }
  function syncCtl() {
    ctl.querySelectorAll<HTMLButtonElement>('[data-speed]').forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.speed) === speed)));
    const pause = ctl.querySelector<HTMLButtonElement>('#xp-pause')!;
    pause.setAttribute('aria-pressed', String(paused));
    pause.textContent = paused ? 'Resume expedition' : 'Pause';
    pause.disabled = !lifecycle.active || !!run?.world.terminal;
    const skip = ctl.querySelector<HTMLButtonElement>('#skip');
    if (skip) skip.disabled = paused || !lifecycle.active || !!run?.world.terminal;
  }
  function frame(t: number) {
    const r = run;
    if (!r) return;
    if (!lifecycle.active || paused) { acc = 0; last = 0; raf = requestAnimationFrame(frame); return; }
    if (last === 0) last = t;
    acc += Math.min(100, t - last) * speed * 30 / 1000; last = t;
    // Steps run in order, so the run is the same however many fit in a frame. A frame spends at most ~12 ms on them, so a heavy fight at 16x slows
    // the playback a little instead of freezing the page; the backlog is capped so it never snowballs.
    if (!paused) { const t0 = performance.now(); while (acc >= 1 && !r.world.terminal) { r.world.step(); acc -= 1; if (performance.now() - t0 > 12) break; } acc = Math.min(acc, 60); }
    if (!developer && !storageBlocked) void queueCheckpoint();
    draw();
    if (!r.world.terminal) raf = requestAnimationFrame(frame);
  }
  function draw() {
    const r = run; if (!r) return;
    const ex = r.expedition, w = r.world;
    while (feedCount < ex.intent.length) {
      const i = ex.intent[feedCount++];
      feed.append(h('li', { class: `k-${i.kind}`, 'data-kind': i.kind, 'data-mark': MARK[i.kind] ?? '' }, h('b', {}, i.text), h('small', {}, `${Math.round(i.tick / 30)}s · ${i.cause}`)));
      feed.scrollTop = feed.scrollHeight;
      audio.onIntent(i);
    }
    objList.replaceChildren(...ex.objectives.map((o, i) => h('li', { class: o.status }, h('span', { class: 'chip' }, OBJ_LABEL[o.status]), `${i + 1}. ${o.kind === 'open' ? `Open the way from ${name(graph, o.room)} to ${name(graph, o.to ?? o.room)}` : o.kind === 'explore' ? `Explore on from ${name(graph, o.room)}` : `${cap(o.kind)} ${name(graph, o.room)}`}`, o.note ? h('small', {}, o.note) : null)));
    const secs = Math.round(w.tick / 30);
    status.textContent = `${w.terminal ? (w.state === 'home' ? 'Home' : w.state === 'defeated' ? 'Fallen' : 'Stopped') : 'Out'} · ${name(graph, w.room)} · ${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')} · health ${Math.round(w.hp)} of ${w.hpMax}${toast ? ` · ${toast}` : ''}`;
    const pg = w.progress;
    levelEl.textContent = pg ? `Level ${pg.level} of ${MAX_DESIGN_LEVEL}${pg.xpToNext === null ? ' (highest)' : `, experience ${pg.xp} of ${pg.xpToNext}`} · rations ${w.ledger.rations} · upgrade: ${pg.sanctuary.upgrade ? upgradeById(pg.sanctuary.upgrade).name : 'none yet'}. Levels and upgrades end with the expedition.` : '';
    sanctEl.textContent = pg ? (pg.sanctuary.visits === 0 ? 'Sanctuary: not visited. It never banks: no banking here.' : `Sanctuary: ${pg.sanctuary.rested ? 'rested' : 'not rested'}, upgrade taken. No banking here.`) : '';
    carriedEl.textContent = `Carried, at risk until camp: ${describeBank(w.ledger.carried)}.${w.ledger.cache ? ` A recovery cache waits in ${name(graph, w.ledger.cache.room)}.` : ''}`;
    const hpPct = Math.max(0, Math.min(100, w.hp / w.hpMax * 100));
    (bar.firstChild as HTMLElement).style.width = `${hpPct}%`;
    (bar.firstChild as HTMLElement).classList.toggle('low', hpPct < runCfg!.plan.retreatHpPct);
    drawMap(r);
    if (w.terminal) for (const id of ['retreat-now', 'redirect-go', 'skip']) (ctl.parentElement!.querySelector(`#${id}`) as HTMLButtonElement | null)?.setAttribute('disabled', '');
    if (w.terminal && !chronicle) finish(r);
    if (developer) window.__EXPEDITION_STATE__ = () => ({ view: 'run', state: w.state, tick: w.tick, room: w.room, mode: ex.mode, hp: w.hp, intents: ex.intent.length, digest: w.digest, terminal: w.terminal, paused, active: lifecycle.active });
  }
  function drawMap(r: ExpeditionRun) {
    const ex = r.expedition;
    drawWorldMap(canvas, { graph, known: ex.known, open: ex.openLinks, visited: ex.visited, avoid: new Set(runCfg!.plan.avoid), route: ex.route ? ex.route.rooms : null, routeKind: 'confirmed', here: r.world.room, target: ex.target, hero: r.world.pos, cache: r.world.ledger.cache });
  }
  function finish(r: ExpeditionRun) {
    const c = finishChronicle(runCfg!, r).chronicle;
    chronicle = c; // Prevent a duplicate finish callback while an async save is pending.
    if (developer) {
      settlement = settle(save, c, startedAt);
      if (settlement.applied) {
        try { persist(store, settlement.save); save = settlement.save; }
        catch (e) {
          settlement = { ...settlement, applied: false, refused: 'The save could not be written: ' + String(e), lines: ['The save could not be written: ' + String(e)] };
        }
      }
      presentSettlement(c, r);
      return;
    }
    void commitFinalSettlement(c, r);
  }
  async function commitFinalSettlement(c: Chronicle, r: ExpeditionRun) {
    await queueCheckpoint(true);
    if (!durableRepo || !durable || storageBlocked) {
      const reason = 'Your expedition is NOT safely settled. Keep this screen and retry after storage is available; the previous checkpoint remains intact.';
      settlement = { ...settle(save, c, startedAt), applied: false, refused: reason, lines: [reason] };
      presentSettlement(c, r);
      return;
    }
    // Domain settlement is computed once from the pre-commit bank. Only the
    // repository transaction may make that outcome visible as banked.
    const preview = settle(save, c, startedAt);
    if (!preview.applied) { settlement = preview; presentSettlement(c, r); return; }
    const written = await commitSettlement(durableRepo, durable.revision, activeId, c, startedAt);
    if (written.ok) {
      durable = written.save; save = toLegacy(written.save);
      settlement = preview;
    } else {
      const reason = 'Settlement was NOT committed: ' + written.error;
      settlement = { ...preview, applied: false, refused: reason, lines: [reason] };
    }
    presentSettlement(c, r);
  }
  function presentSettlement(c: Chronicle, r: ExpeditionRun) {
    const current = settlement!;
    const deathCause = describeDeath(sim, graph, r);
    const opened = current.applied ? c.loot.opened.map(k => {
      const l = graph.links.find(x => WorldGraph.linkKey(x.from, x.to) === k);
      return 'Opened for good: ' + (l ? name(graph, l.from) + ' and ' + name(graph, l.to) : k) + '.';
    }) : [];
    const lines = [...current.lines, ...opened];
    if (current.applied) history.add({ id: entryId(c, save.camp.expeditions), at: Date.now(), chronicle: c, settlement: lines, deathCause });
    if (c.outcome === 'died') audio.cue('death');
    result.hidden = false;
    const actions = current.applied || developer ?
      [h('button', { type: 'button', id: 'again', onclick: renderPlan }, 'Plan another')] :
      [h('button', { type: 'button', id: 'retry-settlement', onclick: () => { storageBlocked = false; void commitFinalSettlement(c, r); } }, 'Retry durable settlement')];
    result.replaceChildren(renderChronicle(c, { graph, settlement: lines, deathCause, actions }));
    syncCtl();
    screen.querySelector<HTMLButtonElement>('#back-to-plan')!.disabled = busy();
    screen.querySelector('#tools')?.replaceWith(toolbar());
  }

  // ---------- Past expeditions ----------
  function renderHistory() {
    view = entryOpen ? 'entry' : 'history';
    if (developer) window.__EXPEDITION_STATE__ = () => ({ view: 'history', open: entryOpen });
    screen.replaceChildren(toolbar());
    const all = history.list();
    const e = entryOpen ? history.get(entryOpen) : undefined;
    const main = h('div', { id: 'main', tabindex: '-1' });
    screen.append(main);
    if (e) {
      main.append(h('div', { class: 'bar' }, h('div', {}, h('p', { class: 'eyebrow' }, 'PAST EXPEDITION'), h('h1', {}, 'Chronicle')),
        h('button', { type: 'button', id: 'history-back', onclick: () => { entryOpen = ''; renderHistory(); } }, 'Back to the list')),
        h('section', { class: 'card result', id: 'history-entry' }, renderChronicle(e.chronicle, { graph, settlement: e.settlement, deathCause: e.deathCause })));
      return;
    }
    entryOpen = '';
    main.append(h('div', { class: 'bar' }, h('div', {}, h('p', { class: 'eyebrow' }, 'CAMP · RECORDS'), h('h1', {}, 'Past expeditions')),
      h('button', { type: 'button', id: 'history-plan', onclick: renderPlan }, 'Back to plan')),
      h('section', { class: 'card' }, h('h2', {}, `Last ${all.length} of up to 20`),
        h('p', { class: 'hint' }, 'Kept in this browser only, apart from the save. Clearing it never touches your bank, cache or map.'),
        all.length
          ? h('ol', { class: 'history', id: 'history-list' }, ...all.map(x => h('li', {}, h('button', { type: 'button', 'data-history': x.id, onclick: () => { entryOpen = x.id; renderHistory(); } },
            `${new Date(x.at).toLocaleString()} · ${cap(x.chronicle.outcome)} · ${x.chronicle.route.length} rooms · seed ${x.chronicle.seed}`))))
          : h('p', { class: 'hint', id: 'history-empty' }, 'Nothing here yet. Finished expeditions appear in this list.'),
        all.length ? h('button', { type: 'button', id: 'history-clear', onclick: () => { history.clear(); renderHistory(); } }, 'Clear the list') : null));
  }

  if (developer) {
    window.__EXPEDITION_RUN__ = (c: ExpeditionConfig) => runExpedition(sim, c, 30 * 3000, graph).chronicle;
    window.__EXPEDITION_SAVE__ = () => save;
  }
  // Test hook, only with ?save=memory: put the camp in a known state without playing to it.
  if (developer && params.get('save') === 'memory') window.__EXPEDITION_SET_SAVE__ = (next: Save) => { save = next; persist(store, save); renderPlan(); };
  if (developer) window.__EXPEDITION_READY__ = true;
  const pauseRun = (message: string) => {
    paused = true; acc = 0; last = 0; toast = message;
    audio.setSuspended(true); syncCtl(); draw();
  };
  const unsubscribe = lifecycle.subscribe(active => {
    if (!active && busy()) {
      pauseRun('Paused while away. Resume when ready.');
      if (!developer) void queueCheckpoint(true); // Best effort; periodic commits guarantee the prior checkpoint.
    }
    audio.setSuspended(!active || (busy() && paused));
    if (view === 'run' && run) { acc = 0; last = 0; syncCtl(); }
  });
  const removeBack = lifecycle.onBack(() => {
    if (dispatchPending) { pauseAfterDispatch = true; return true; }
    const drawer = screen.querySelector<HTMLDetailsElement>('details[open]');
    if (drawer) { drawer.open = false; drawer.querySelector('summary')?.focus(); return true; }
    if (busy()) { pauseRun('Paused. Resume the expedition or retreat to camp.'); return true; }
    if (view === 'plan' && guide.visible) { guide.finish(); renderPlan(); return true; }
    if (view === 'entry') { entryOpen = ''; renderHistory(); return true; }
    if (view === 'history' || view === 'run') { renderPlan(); return true; }
    return false;
  });
  renderPlan();
  if (durableRepo) {
    void durableRepo.load().then(loadedDurable => {
      if (loadedDurable.ok) {
        durable = loadedDurable.save;
        save = toLegacy(loadedDurable.save);
        storageBlocked = false;
        if (loadedDurable.migratedFrom !== null) saveNote = 'Legacy save migrated to durable version 3. Original retained.';
      } else {
        storageBlocked = true;
        saveNote = 'Your save is NOT safely available: ' + loadedDurable.error +
          (loadedDurable.backupAvailable ? '. A backup exists; export it before attempting recovery.' : '');
      }
      renderPlan();
    }).catch(error => { storageBlocked = true; saveNote = 'Cannot open durable saves: ' + String(error); renderPlan(); });
  }
  return () => { cancelAnimationFrame(raf); unsubscribe(); removeBack(); audio.disable(); motionQuery?.removeEventListener?.('change', applyPrefs); screen.remove(); };
}
declare global {
  interface Window {
    __EXPEDITION_READY__: boolean; __EXPEDITION_RUN__: (c: ExpeditionConfig) => Chronicle;
    __EXPEDITION_STATE__: () => Record<string, unknown>; __EXPEDITION_AUDIO__: ExpeditionAudio; __EXPEDITION_SAVE__: () => Save; __EXPEDITION_SET_SAVE__?: (s: Save) => void;
  }
}
