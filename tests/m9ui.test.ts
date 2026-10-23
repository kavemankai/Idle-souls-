import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_PREFS, PrefsStore, parsePrefs } from '../src/ui/prefs';
import { History, HISTORY_BYTES, HISTORY_LIMIT, entryId, type HistoryEntry } from '../src/ui/history';
import { GLOSSARY, termById } from '../src/ui/glossary';
import { CUE_MAP, SILENT_KINDS, cueForIntent, ExpeditionAudio, type ExpeditionCue } from '../src/ui/audioCues';
import { GUIDE } from '../src/ui/onboarding';
import { MemoryStore } from '../src/save/save';
import { loadSim } from '../src/combat/loadSimNode';
import { WorldGraph } from '../src/world/worldGraph';
import { defaultPlan } from '../src/expedition/plan';
import { runExpedition, type ExpeditionConfig } from '../src/expedition/run';
import type { IntentKind } from '../src/expedition/expedition';
import type { Chronicle } from '../src/expedition/chronicle';
import fs from 'node:fs';

const sim = loadSim();
const graph = new WorldGraph();
const chronicle = (seed: number): Chronicle => {
  const plan = { ...defaultPlan(), objectives: [{ id: 'o1', kind: 'reach' as const, room: 'O2' }] };
  const cfg: ExpeditionConfig = { seed, level: 80, focus: 'balanced', plan, known: ['C0', 'O1', 'O2'], hpOverride: 5000 };
  return runExpedition(sim, cfg, 30 * 3000, graph).chronicle;
};
const entry = (c: Chronicle, n: number): HistoryEntry => ({ id: entryId(c, n), at: n, chronicle: c, settlement: ['Banked: nothing.'], deathCause: null });

test('prefs: defaults, damaged text, out-of-range volumes and a store that remembers', () => {
  assert.deepEqual(parsePrefs(null), DEFAULT_PREFS);
  assert.deepEqual(parsePrefs('not json'), DEFAULT_PREFS);
  assert.deepEqual(parsePrefs('{"bigText":"yes","music":9,"effects":-3}'), { ...DEFAULT_PREFS, music: 1, effects: 0 });
  assert.equal(parsePrefs('{"reduceMotion":false}').reduceMotion, false);
  const store = new MemoryStore();
  const p = new PrefsStore(store);
  p.set({ bigText: true, onboarded: true, music: 0.25 });
  const again = new PrefsStore(store).get();
  assert.equal(again.bigText, true); assert.equal(again.onboarded, true); assert.equal(again.music, 0.25); assert.equal(again.effects, DEFAULT_PREFS.effects);
});

test('prefs: reduced motion follows the system until the player chooses', () => {
  const p = new PrefsStore(new MemoryStore());
  assert.equal(p.reducedMotion(true), true); assert.equal(p.reducedMotion(false), false);
  p.set({ reduceMotion: false });
  assert.equal(p.reducedMotion(true), false);
  p.set({ reduceMotion: true });
  assert.equal(p.reducedMotion(false), true);
});

test('history: newest first, one entry per run id, never more than twenty, damaged text reads as empty', () => {
  const store = new MemoryStore();
  const h = new History(store);
  const c = chronicle(1);
  for (let i = 0; i < 25; i++) h.add(entry({ ...c, seed: i + 1 }, i));
  assert.equal(h.list().length, HISTORY_LIMIT);
  assert.equal(h.list()[0].chronicle.seed, 25);
  h.add(entry({ ...c, seed: 25 }, 24));   // same id again replaces rather than duplicates
  assert.equal(h.list().length, HISTORY_LIMIT);
  assert.ok(h.get(h.list()[3].id));
  store.write('{broken');
  assert.deepEqual(h.list(), []);
  store.write('[{"id":5}]');
  assert.deepEqual(h.list(), []);
  h.add(entry(c, 1)); h.clear();
  assert.deepEqual(h.list(), []);
});

test('history: stored text stays under the byte cap even with large Chronicles', () => {
  const store = new MemoryStore();
  const h = new History(store);
  const c = chronicle(1);
  const fat: Chronicle = { ...c, intent: Array.from({ length: 4000 }, (_, i) => ({ tick: i, kind: 'route' as const, room: 'O1', text: `line ${i} ${'x'.repeat(60)}`, cause: 'y'.repeat(60) })) };
  for (let i = 0; i < 20; i++) h.add(entry({ ...fat, seed: i + 1 }, i));
  assert.ok((store.read() ?? '').length <= HISTORY_BYTES, `stored ${(store.read() ?? '').length} bytes`);
  assert.ok(h.list().length >= 1);
  assert.equal(h.list()[0].chronicle.seed, 20, 'the newest entry always survives the cap');
});

test('glossary: unique ids, every term has a short meaning, and the feed vocabulary is covered', () => {
  assert.equal(new Set(GLOSSARY.map(t => t.id)).size, GLOSSARY.length);
  for (const t of GLOSSARY) { assert.ok(t.meaning.length > 20 && t.meaning.length < 260, t.id); assert.ok(t.term.length > 2, t.id); }
  for (const id of ['cache', 'bank', 'avoid', 'retreat', 'carried']) assert.ok(termById(id), id);
  const terms = GLOSSARY.map(t => t.term.toLowerCase()).join(' | ');
  for (const w of ['gate key', 'sanctuary', 'shortcut', 'edge of the map', 'fog']) assert.ok(terms.includes(w) || GLOSSARY.some(t => t.meaning.toLowerCase().includes(w)), `no entry mentions ${w}`);
});

test('guide: six short screens, each a title and a few plain sentences', () => {
  assert.equal(GUIDE.length, 6);
  for (const s of GUIDE) { assert.ok(s.title.length < 40, s.title); assert.ok(s.text.length < 260, s.text); assert.ok(!/[—–]/.test(s.text), 'no dash piles'); }
});

test('audio: every intent kind either maps to a cue or is declared silent', () => {
  const all: IntentKind[] = ['launch', 'route', 'objective', 'discovery', 'sweep', 'fight', 'retreat', 'redirect', 'skip', 'order', 'loot', 'level', 'ration', 'sanctuary', 'end'];
  const sampleText: Record<string, string> = { discovery: 'New ground', retreat: 'Heading for camp. Every objective is cancelled.', sanctuary: 'Rested', level: 'Level 2', end: 'Arrived at camp alive. Banking comes with M3.' };
  for (const k of all) assert.ok(SILENT_KINDS.includes(k) || cueForIntent({ kind: k, text: sampleText[k] ?? '' }) !== null, `${k} has neither a cue nor a place in SILENT_KINDS`);
  for (const k of SILENT_KINDS) assert.equal(cueForIntent({ kind: k, text: 'anything' }), null, `${k} is declared silent but makes a cue`);
});

test('audio: the texts the expedition actually writes pick the right cue', () => {
  assert.equal(cueForIntent({ kind: 'loot', text: 'Spent 1 Gate Key: the way from A to B is open for good. No fight has started.' }), 'keySpent');
  assert.equal(cueForIntent({ kind: 'loot', text: 'Worked the shortcut from A to B: it is open for good.' }), 'shortcut');
  assert.equal(cueForIntent({ kind: 'loot', text: 'Picked up a ration. Carried, at risk until camp.' }), null);
  assert.equal(cueForIntent({ kind: 'end', text: 'Arrived at camp alive. Banking comes with M3.' }), 'bank');
  assert.equal(cueForIntent({ kind: 'end', text: 'Fell in the Outer Road.' }), null);
  assert.equal(cueForIntent({ kind: 'retreat', text: 'Heading for camp. Retreat ordered.' }), 'retreat');
});

test('audio: every cue points at a shipped file, has a label, and fires its visual pair with sound off', () => {
  const files = new Set(fs.readdirSync('public/audio/cues').map(f => f.replace(/\.ogg$/, '')));
  for (const [cue, v] of Object.entries(CUE_MAP)) { assert.ok(files.has(v.file), `${cue} -> ${v.file} is not in public/audio/cues`); assert.ok(v.label.length > 5); }
  const seen: string[] = [];
  const audio = new ExpeditionAudio((text, cue) => seen.push(`${cue}:${text}`));
  for (const cue of Object.keys(CUE_MAP) as ExpeditionCue[]) audio.cue(cue);
  assert.equal(seen.length, Object.keys(CUE_MAP).length, 'a visual pair for every cue');
  assert.equal(audio.enabled, false);
  assert.ok(audio.played.every(p => !p.sounded), 'nothing sounds before Enable audio');
  audio.playBossPhase();
  assert.equal(audio.played.at(-1)?.cue, 'bossPhase');
});
