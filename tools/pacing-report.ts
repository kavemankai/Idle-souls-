/**
 * Campaign pacing, with the real expedition runner (real health, the shipped progression layer, the level table, the full roster in its rooms).
 *   npx tsx tools/pacing-report.ts --part routes   [--n 300]            how far plans get, by route, doctrine and start level
 *   npx tsx tools/pacing-report.ts --part farming  [--n 300]            gold, mastery and experience per expedition and per game hour, safe loop against dangerous route
 *   npx tsx tools/pacing-report.ts --part retreat  [--n 300]            extraction and objective completion with and without a retreat threshold, roster routes
 *   npx tsx tools/pacing-report.ts --part campaign --policy cautious|pressing --from 1 --count 20   whole-game journeys with a scripted player (see below)
 *   npx tsx tools/pacing-report.ts --assemble                           merge docs/slice/data/pacing-*.json into docs/slice/CALIBRATION_NUMBERS.md
 * Every part writes docs/slice/data/pacing-<part>[-n].json so parts can run in separate processes.
 * Use --out-dir <directory> for an isolated run; --assemble --out <file> selects the assembled Markdown destination.
 *
 * The scripted player of the campaign part knows the map (it never wanders) and follows one policy: explore toward the next goal, bank a Gate Key at the Key Trial,
 * issue it, open the gate, fight what is behind it, recover a dropped cache first. It is a lower bound on a thoughtful player and an upper bound on a careless one,
 * not a model of either. The goals are: open the Watchtower gate and fight the Bell Warden, then open the Crypt gate and fight the Castellan.
 */
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadSim } from '../src/combat/loadSimNode';
import { defaultPlan, type ExpeditionPlan, type Objective } from '../src/expedition/plan';
import { runExpedition, type ExpeditionConfig } from '../src/expedition/run';
import { settle } from '../src/expedition/settle';
import { defaultSave, type Save } from '../src/save/saveTypes';
import { LEVEL_TABLE, ROOM_ARRIVAL } from '../src/progression/levelTable';
import { WorldGraph } from '../src/world/worldGraph';
import type { Chronicle } from '../src/expedition/chronicle';

const arg = (k: string, d = '') => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };
const N = Number(arg('n', '300'));
const sim = loadSim();
const graph = new WorldGraph();
const ALL = [...graph.rooms.keys()];
const DIR = arg('out-dir', 'docs/slice/data');
mkdirSync(DIR, { recursive: true });
const MB_GATE = WorldGraph.linkKey('T2', 'MB'), B1_GATE = WorldGraph.linkKey('K2', 'B1');
/** The encounter standing in each room for these runs: the one the arrival table fits (first row of the room). */
const ENCOUNTERS: Record<string, string> = {};
for (const r of ROOM_ARRIVAL) if (!ENCOUNTERS[r.room]) ENCOUNTERS[r.room] = r.encounter;
/** Design level at which a room is met on the intended route (lowest arrival row of the room). */
const ARRIVAL: Record<string, number> = {};
for (const r of ROOM_ARRIVAL) if (!ARRIVAL[r.room]) ARRIVAL[r.room] = r.design;

const obj = (room: string, kind: Objective['kind'] = 'reach', to?: string): Objective => ({ id: `${kind}-${room}${to ? `-${to}` : ''}`, kind, room, ...(to ? { to } : {}) });
type Style = 'cautious' | 'pressing';
const plan = (style: Style, objectives: Objective[], over: Partial<ExpeditionPlan> = {}): ExpeditionPlan =>
  style === 'cautious' ? { ...defaultPlan(), doctrine: 'guarded', retreatHpPct: 60, drinkBelowPct: 70, objectives, ...over } : { ...defaultPlan(), doctrine: 'pressing', retreatHpPct: 30, drinkBelowPct: 40, objectives, ...over };
const mean = (a: number[]) => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
const median = (a: number[]) => { if (!a.length) return 0; const s = a.slice().sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };

function expedition(c: Partial<ExpeditionConfig> & { seed: number; plan: ExpeditionPlan; startLevel: number }): { c: Chronicle; ticks: number } {
  const { chronicle } = runExpedition(sim, { level: 80, focus: 'balanced', known: ALL, encounters: ENCOUNTERS, ...c, progression: { startLevel: c.startLevel, kitRations: 2 } });
  return { c: chronicle, ticks: chronicle.ticks };
}
const lastRoom = (c: Chronicle) => c.route[c.route.length - 1];
const deepest = (c: Chronicle, order: string[]) => c.route.reduce((best, r) => Math.max(best, order.indexOf(r)), -1);

interface RouteDef { name: string; objectives: Objective[]; open?: string[]; order: string[]; arrivalStart: number }
const ROUTES: RouteDef[] = [
  { name: 'Old Road (O3, KT)', objectives: [obj('O3'), obj('KT')], order: ['C0', 'O1', 'O2', 'O3', 'KT'], arrivalStart: 1 },
  { name: 'Watchtower (T1, T2)', objectives: [obj('T1'), obj('T2')], order: ['C0', 'O1', 'O2', 'T1', 'T2'], arrivalStart: 3 },
  { name: 'Sunken Passage (S1, S2, sanctuary)', objectives: [obj('S1'), obj('S2')], order: ['C0', 'O1', 'O2', 'O3', 'S1', 'S2'], arrivalStart: 4 },
  { name: 'Crypt by the south (S3 sluice side, K1, K2)', objectives: [obj('S1'), obj('S2'), obj('K1'), obj('K2')], order: ['C0', 'O1', 'O2', 'O3', 'S1', 'S2', 'K1', 'K2'], arrivalStart: 5 },
  { name: 'Crypt by the north (T2, K3, K2)', objectives: [obj('T1'), obj('T2'), obj('K3'), obj('K2')], order: ['C0', 'O1', 'O2', 'T1', 'T2', 'K3', 'K2'], arrivalStart: 5 },
  { name: 'Bell Warden (gate already open)', objectives: [obj('T1'), obj('T2'), obj('MB', 'challenge')], open: [MB_GATE], order: ['C0', 'O1', 'O2', 'T1', 'T2', 'MB'], arrivalStart: 5 },
  { name: 'Castellan (both gates already open)', objectives: [obj('T1'), obj('T2'), obj('K3'), obj('K2'), obj('B1', 'challenge')], open: [MB_GATE, B1_GATE], order: ['C0', 'O1', 'O2', 'T1', 'T2', 'K3', 'K2', 'B1'], arrivalStart: 7 },
];

function routes() {
  const out: unknown[] = [];
  for (const r of ROUTES) for (const style of ['cautious', 'pressing'] as Style[]) for (const start of [1, r.arrivalStart].filter((v, i, a) => a.indexOf(v) === i)) {
    let extracted = 0, died = 0, complete = 0, bossKills = 0;
    const lvl: number[] = [], minutes: number[] = [], banked: number[] = [], depth: number[] = [], deathRooms: Record<string, number> = {};
    for (let seed = 1; seed <= N; seed++) {
      const { c, ticks } = expedition({ seed, plan: plan(style, r.objectives), startLevel: start, openLinks: r.open });
      if (c.outcome === 'extracted') extracted++; else if (c.outcome === 'died') { died++; const rm = lastRoom(c); deathRooms[rm] = (deathRooms[rm] ?? 0) + 1; }
      if (c.outcome === 'extracted' && c.objectives.every(o => o.status === 'completed')) complete++;
      bossKills += c.bossesDefeated.length;
      lvl.push(c.progress?.level ?? start); minutes.push(ticks / 30 / 60); depth.push(deepest(c, r.order)); banked.push(c.outcome === 'extracted' ? c.loot.carried.gold : 0);
    }
    out.push({ route: r.name, style, start, extracted, died, complete, bossKills, meanLevel: mean(lvl), meanMinutes: mean(minutes), meanBankedGold: mean(banked), meanDepth: mean(depth), deepest: r.order[Math.round(median(depth))], deathRooms });
    console.log('route', r.name, style, start);
  }
  writeFileSync(`${DIR}/pacing-routes.json`, JSON.stringify({ n: N, rows: out }, null, 1));
}

function farming() {
  const loops: { name: string; objectives: Objective[]; start: number }[] = [
    { name: 'safe loop: survey the Outer Road', objectives: [obj('O1', 'survey')], start: 1 },
    { name: 'safe loop: reach the Crossroads', objectives: [obj('O2')], start: 1 },
    { name: 'Old Road loop: O3 and the Key Trial', objectives: [obj('O3'), obj('KT')], start: 1 },
    { name: 'Watchtower: T1, T2', objectives: [obj('T1'), obj('T2')], start: 3 },
    { name: 'Sunken Passage: S1, S2', objectives: [obj('S1'), obj('S2')], start: 4 },
    { name: 'Crypt (north): T2, K3, K2', objectives: [obj('T1'), obj('T2'), obj('K3'), obj('K2')], start: 5 },
  ];
  const out: unknown[] = [];
  for (const l of loops) for (const style of ['cautious', 'pressing'] as Style[]) {
    const gold: number[] = [], mastery: number[] = [], xp: number[] = [], min: number[] = [];
    let extracted = 0;
    for (let seed = 1; seed <= N; seed++) {
      const { c, ticks } = expedition({ seed, plan: plan(style, l.objectives), startLevel: l.start });
      const ok = c.outcome === 'extracted';
      if (ok) extracted++;
      gold.push(ok ? c.loot.carried.gold : 0); mastery.push(ok ? c.loot.carried.mastery : 0); xp.push(c.progress?.xp ?? 0); min.push(ticks / 30 / 60);
    }
    const m = mean(min);
    out.push({ loop: l.name, style, start: l.start, extracted, meanGold: mean(gold), meanMastery: mean(mastery), meanXp: mean(xp), meanMinutes: m, goldPerHour: mean(gold) / (m / 60), masteryPerHour: mean(mastery) / (m / 60) });
    console.log('farm', l.name, style);
  }
  writeFileSync(`${DIR}/pacing-farming.json`, JSON.stringify({ n: N, rows: out }, null, 1));
}

function retreat() {
  const defs: { name: string; objectives: Objective[]; start: number }[] = [
    { name: 'Watchtower (T1, T2)', objectives: [obj('T1'), obj('T2')], start: 3 },
    { name: 'Sunken Passage (S1, S2)', objectives: [obj('S1'), obj('S2')], start: 4 },
    { name: 'Crypt (north)', objectives: [obj('T1'), obj('T2'), obj('K3'), obj('K2')], start: 5 },
  ];
  const out: unknown[] = [];
  for (const d of defs) for (const doctrine of ['guarded', 'measured', 'pressing'] as const) for (const t of [0, 30, 50, 70]) {
    let extracted = 0, died = 0, complete = 0;
    for (let seed = 1; seed <= N; seed++) {
      const { c } = expedition({ seed, plan: { ...defaultPlan(), doctrine, retreatHpPct: t, drinkBelowPct: 0, objectives: d.objectives }, startLevel: d.start });
      if (c.outcome === 'extracted') extracted++; else if (c.outcome === 'died') died++;
      if (c.outcome === 'extracted' && c.objectives.every(o => o.status === 'completed')) complete++;
    }
    out.push({ route: d.name, doctrine, threshold: t, start: d.start, extracted, died, complete });
    console.log('retreat', d.name, doctrine, t);
  }
  writeFileSync(`${DIR}/pacing-retreat.json`, JSON.stringify({ n: N, rows: out }, null, 1));
}

// ---- campaign: a scripted player from a fresh save to the Castellan ----
interface Goal { id: string; satisfied: (s: Save) => boolean; needKey: boolean; objectives: Objective[]; room: string }
const GOALS: Goal[] = [
  { id: 'warden', satisfied: s => s.world.defeatedBosses.includes('warden'), needKey: true, room: 'MB', objectives: [obj('T2', 'open', 'MB'), obj('MB', 'challenge')] },
  { id: 'castellan', satisfied: s => s.world.defeatedBosses.includes('castellan'), needKey: true, room: 'B1', objectives: [obj('K2', 'open', 'B1'), obj('B1', 'challenge')] },
];
/** Rooms on the way to `room` from camp, over every link that is ordinary or already open (the north way into the Crypt). */
function wayTo(room: string, save: Save): string[] {
  const open = new Set(save.world.openedLinks);
  // The gate to the Bell Warden is opened with a key during the goal itself; for exploring we want the path to the room beside the gate.
  const target = room === 'MB' ? 'T2' : room === 'B1' ? 'K2' : room;
  return graph.path('C0', target, open) ?? [];
}
function campaign() {
  const style = arg('policy', 'cautious') as Style, start = Number(arg('start', '1')), from = Number(arg('from', '1')), count = Number(arg('count', '20')), cap = Number(arg('cap', '120'));
  const results: unknown[] = [];
  for (let k = from; k < from + count; k++) {
    let save = defaultSave('sim');
    const milestones: Record<string, number> = {};
    const mark = (name: string, n: number) => { if (milestones[name] === undefined) milestones[name] = n; };
    let deaths = 0, stuck = 0, ticks = 0, maxLevel = 1, n: number;
    for (n = 1; n <= cap; n++) {
      const goal = GOALS.find(g => !g.satisfied(save));
      if (!goal) break;
      const route = wayTo(goal.room, save);
      const disc = new Set(save.world.discovered);
      const unknown = route.find(r => !disc.has(r));
      const needsKey = goal.needKey && !save.world.openedLinks.includes(goal.id === 'warden' ? MB_GATE : B1_GATE);
      let p: ExpeditionPlan, issue = 0;
      if (unknown) {
        // Explore toward the goal: start from the frontier room (the first unknown room on the way), bounded to three rooms.
        p = plan(style, [{ id: 'x', kind: 'explore', room: unknown, depth: 3 }]);
      } else if (needsKey && save.camp.bank.keys < 1) {
        // Bank a key at the Key Trial (known once the Crossroads is mapped).
        p = plan(style, [obj('KT')]);
      } else {
        p = plan(style, goal.objectives); issue = needsKey ? 1 : 0;
      }
      if (save.camp.cache) p = { ...p, objectives: [obj(save.camp.cache.room, 'recover'), ...p.objectives].slice(0, 5) };
      const cfg: ExpeditionConfig = { seed: k * 1000 + n, level: 80, focus: 'balanced', plan: p, known: save.world.discovered, encounters: ENCOUNTERS, progression: { startLevel: start, kitRations: 2 }, cache: save.camp.cache, issueKeys: issue, claims: save.world.claims, openLinks: save.world.openedLinks, defeatedBosses: save.world.defeatedBosses };
      const { chronicle: c } = runExpedition(sim, cfg);
      ticks += c.ticks; maxLevel = Math.max(maxLevel, c.progress?.level ?? 1);
      if (c.outcome === 'died') deaths++;
      const s = settle(save, c, save.camp.expeditions);
      if (!s.applied) { if (++stuck >= 6) break; continue; }
      save = s.save;
      if (save.world.discovered.includes('T2')) mark('mapped the Watchtower gate', n);
      if (save.camp.bank.keys > 0 || save.world.openedLinks.length) mark('first Gate Key banked', n);
      if (save.world.openedLinks.includes(MB_GATE)) mark('Watchtower gate opened', n);
      if (save.world.defeatedBosses.includes('warden')) mark('Bell Warden defeated', n);
      if (save.world.discovered.includes('K2')) mark('mapped the Castellan gate', n);
      if (save.world.openedLinks.includes(B1_GATE)) mark('Castellan gate opened', n);
      if (save.world.defeatedBosses.includes('castellan')) mark('Castellan defeated', n);
    }
    results.push({ campaign: k, expeditions: n > cap ? cap : n, finished: save.world.defeatedBosses.includes('castellan'), milestones, deaths, gameHours: ticks / 30 / 3600, maxLevel, gold: save.camp.bank.gold, discovered: save.world.discovered.length });
    console.log('campaign', k, JSON.stringify(milestones));
  }
  writeFileSync(`${DIR}/pacing-campaign-${style}-s${start}-${from}.json`, JSON.stringify({ style, rows: results }, null, 1));
}

function assemble() {
  const read = (f: string) => JSON.parse(readFileSync(`${DIR}/${f}`, 'utf8'));
  const pct = (a: number, n: number) => `${(a / n * 100).toFixed(1)}%`;
  const lines: string[] = ['# Calibration numbers (generated by tools/pacing-report.ts --assemble)', '', `Real runner, real health, shipped progression, full roster. Raw rows: ${DIR}/*.json. See docs/release/BASELINE.md for current sample limits; docs/slice/CALIBRATION.md is historical analysis.`, ''];
  lines.push('## Level table', '', '| Design level | Simulator level | Rows it was fitted to |', '|---|---|---|', ...LEVEL_TABLE.map(r => `| ${r.design} | ${r.sim} | ${r.note} |`), '');
  try {
    const fit = read('fit.json') as { checked: { row: { room: string; design: number; encounter: string; target: number }; sim: number; win: Record<string, Record<string, number>> }[] };
    lines.push('## Each room at its arrival level (fresh seeds, isolated fights)', '', '| Room | Design level | Sim level | Encounter | Target | Guarded | Measured | Pressing | Survivor measured |', '|---|---|---|---|---|---|---|---|---|');
    for (const c of fit.checked) lines.push(`| ${c.row.room} | ${c.row.design} | ${c.sim} | ${c.row.encounter} | ${(c.row.target * 100).toFixed(0)}% | ${(c.win.guarded.balanced * 100).toFixed(0)}% | ${(c.win.measured.balanced * 100).toFixed(0)}% | ${(c.win.pressing.balanced * 100).toFixed(0)}% | ${(c.win.measured.survivor * 100).toFixed(0)}% |`);
    lines.push('');
  } catch { /* no fit yet */ }
  const section = (file: string, title: string, head: string, row: (r: Record<string, number | string | Record<string, number>>, n: number) => string) => {
    try { const d = read(file) as { n: number; rows: Record<string, number | string | Record<string, number>>[] }; lines.push(`## ${title} (${d.n} seeds a row)`, '', head, ...d.rows.map(r => row(r, d.n)), ''); } catch { /* part not run */ }
  };
  section('pacing-routes.json', 'How far plans get', '| Route | Plan | Start level | Extracted | Died | All objectives | Boss kills | Mean level reached | Mean minutes | Mean gold banked | Deepest room (median) | Where deaths happen |\n|---|---|---|---|---|---|---|---|---|---|---|---|',
    (r, n) => `| ${r.route} | ${r.style} | ${r.start} | ${pct(r.extracted as number, n)} | ${pct(r.died as number, n)} | ${pct(r.complete as number, n)} | ${r.bossKills} | ${(r.meanLevel as number).toFixed(2)} | ${(r.meanMinutes as number).toFixed(1)} | ${(r.meanBankedGold as number).toFixed(1)} | ${r.deepest} | ${Object.entries(r.deathRooms as Record<string, number>).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, v]) => `${k} ${pct(v, n)}`).join(', ') || 'none'} |`);
  section('pacing-farming.json', 'Safe loop against dangerous route (banked per expedition and per game hour)', '| Loop | Plan | Start level | Extracted | Gold banked per expedition | Mastery banked per expedition | Mean experience | Minutes per expedition | Gold per hour | Mastery per hour |\n|---|---|---|---|---|---|---|---|---|---|',
    (r, n) => `| ${r.loop} | ${r.style} | ${r.start} | ${pct(r.extracted as number, n)} | ${(r.meanGold as number).toFixed(1)} | ${(r.meanMastery as number).toFixed(1)} | ${(r.meanXp as number).toFixed(0)} | ${(r.meanMinutes as number).toFixed(1)} | ${(r.goldPerHour as number).toFixed(0)} | ${(r.masteryPerHour as number).toFixed(0)} |`);
  section('pacing-retreat.json', 'Retreat threshold on the roster routes', '| Route | Doctrine | Retreat below | Start level | Extracted | Died | All objectives |\n|---|---|---|---|---|---|---|',
    (r, n) => `| ${r.route} | ${r.doctrine} | ${r.threshold === 0 ? 'off' : `${r.threshold}%`} | ${r.start} | ${pct(r.extracted as number, n)} | ${pct(r.died as number, n)} | ${pct(r.complete as number, n)} |`);
  const groups = [...new Set(readdirSync(DIR).filter(f => f.startsWith('pacing-campaign-')).map(f => f.replace(/-\d+\.json$/, '').replace('pacing-campaign-', '')))].sort();
  for (const group of groups) {
    const [style, startTag] = group.split('-s');
    const files = readdirSync(DIR).filter(f => f.startsWith(`pacing-campaign-${style}-s${startTag}-`));
    if (!files.length) continue;
    const rows = files.flatMap(f => (read(f) as { rows: Record<string, unknown>[] }).rows) as { expeditions: number; finished: boolean; milestones: Record<string, number>; deaths: number; gameHours: number; maxLevel: number; gold: number }[];
    const names = ['mapped the Watchtower gate', 'first Gate Key banked', 'Watchtower gate opened', 'Bell Warden defeated', 'mapped the Castellan gate', 'Castellan gate opened', 'Castellan defeated'];
    lines.push(`## Whole-game journeys, ${style} scripted player, start level ${startTag} (${rows.length} campaigns, cap 120 expeditions)`, '', '| Milestone | Campaigns that got there | Median expedition number | Mean | Slowest |', '|---|---|---|---|---|');
    for (const m of names) { const v = rows.filter(r => r.milestones[m] !== undefined).map(r => r.milestones[m]); lines.push(`| ${m} | ${pct(v.length, rows.length)} | ${v.length ? median(v) : '-'} | ${v.length ? mean(v).toFixed(1) : '-'} | ${v.length ? Math.max(...v) : '-'} |`); }
    lines.push('', `Finished (Castellan defeated within the cap): ${pct(rows.filter(r => r.finished).length, rows.length)}. Mean deaths per campaign ${mean(rows.map(r => r.deaths)).toFixed(1)}, mean game hours ${mean(rows.map(r => r.gameHours)).toFixed(1)}, highest level reached in any expedition (mean) ${mean(rows.map(r => r.maxLevel)).toFixed(1)}.`, '');
  }
  writeFileSync(arg('out', join(DIR, '..', 'CALIBRATION_NUMBERS.md')), lines.join('\n'));
  console.log(lines.join('\n'));
}

if (process.argv[1]?.endsWith('pacing-report.ts')) {
  const part = arg('part');
  if (process.argv.includes('--assemble')) assemble();
  else if (part === 'routes') routes();
  else if (part === 'farming') farming();
  else if (part === 'retreat') retreat();
  else if (part === 'campaign') campaign();
  else throw new Error('use --part routes|farming|retreat|campaign or --assemble');
}
