import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LocalStore, MemoryStore, defaultSave, exportSave, importSave, load, parse, persist, serialize, validateInvariants, wrap, type SaveV1 } from '../src/save/save';

const sample = (): SaveV1 => ({ ...defaultSave('test'), world: { discovered: ['C0', 'O1'], openedLinks: ['C0~S3'], defeatedBosses: ['B1'], keysBanked: 1 }, camp: { bank: { gold: 40, supplies: { tonic: 2 }, gear: ['rusted helm'], mastery: 7 }, cache: { room: 'O2', x: 10, y: 20, contents: { gold: 5, supplies: {}, gear: [], mastery: 1 } }, expeditions: 3, deaths: 1 } });

test('a save survives a round trip exactly, whatever the key order', () => {
  const s = sample(), r = parse(serialize(s));
  assert.ok(r.ok); assert.deepEqual(r.save, s); assert.equal(r.migratedFrom, null);
  const shuffled = JSON.parse(JSON.stringify(s)) as Record<string, unknown>;
  const reordered = Object.fromEntries(Object.entries(shuffled).reverse()) as unknown as SaveV1;
  assert.equal(serialize(reordered), serialize(s), 'the text does not depend on key order');
});
test('a changed or cut-short save is refused with a reason', () => {
  const text = serialize(sample());
  const cut = parse(text.slice(0, text.length - 12)); assert.equal(cut.ok, false);
  const edited = parse(text.replace('"gold":40', '"gold":4000')); assert.ok(!edited.ok); assert.match(edited.error, /checksum/);
  for (const bad of ['', 'not json', '[]', '{"format":"other","checksum":"x","data":{}}', '{"format":"idle-souls-save"}']) assert.equal(parse(bad).ok, false, bad);
});
test('a newer version is refused and an older one is migrated', () => {
  const future = parse(wrap({ ...sample(), version: 2 }));
  assert.ok(!future.ok); assert.match(future.error, /version 2/);
  const old = parse(wrap({ version: 0, build: 'sketch', gold: 12, discovered: ['C0', 'O1'] }));
  assert.ok(old.ok, JSON.stringify(old)); assert.equal(old.migratedFrom, 0);
  assert.equal(old.save.camp.bank.gold, 12); assert.deepEqual(old.save.world.discovered, ['C0', 'O1']); assert.deepEqual(validateInvariants(old.save), []);
  assert.equal(parse(wrap({ version: 'x' })).ok, false);
});
test('structurally wrong documents are named, not trusted', () => {
  const r = parse(wrap({ ...sample(), camp: { bank: { gold: 'lots' } } }));
  assert.ok(!r.ok); assert.match(r.error, /camp is malformed/);
});
test('invariants catch negative money, bad counts, duplicate rooms and bad keys', () => {
  assert.deepEqual(validateInvariants(sample()), []);
  const s = sample(); s.camp.bank.gold = -1; s.camp.bank.supplies.tonic = 1.5; s.world.discovered = ['C0', 'C0']; s.world.keysBanked = -1; s.camp.cache!.contents.gold = -2;
  const bad = validateInvariants(s).join(' | ');
  for (const re of [/bank has negative/, /cache has negative/, /invalid count of tonic/, /discovered twice/, /banked keys/]) assert.match(bad, re);
});
test('persist refuses a broken state and does not touch the store', () => {
  const store = new MemoryStore(); const s = sample(); s.camp.bank.gold = -5;
  assert.throws(() => persist(store, s), /refusing to save/); assert.equal(store.read(), null);
  persist(store, sample()); assert.deepEqual(load(store).save, sample());
});
test('a missing save starts fresh and a damaged one starts fresh with the reason, without overwriting it', () => {
  const store = new MemoryStore();
  assert.deepEqual(load(store), { save: defaultSave('dev'), note: null });
  store.write('garbage'); const r = load(store);
  assert.equal(r.save.camp.deaths, 0); assert.match(r.note!, /not valid JSON/); assert.equal(store.read(), 'garbage');
});
test('storage that throws never breaks saving; the save stays in memory and the store says it is degraded', () => {
  const broken = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('quota'); } };
  const store = new LocalStore('k', broken);
  persist(store, sample());
  assert.equal(store.degraded, true); assert.deepEqual(load(store).save, sample());
  const none = new LocalStore('k', undefined); persist(none, sample()); assert.deepEqual(load(none).save, sample());
});
test('import writes once, only when the whole text is valid', () => {
  const store = new MemoryStore();
  assert.equal(importSave(store, 'nope').ok, false); assert.equal(store.read(), null);
  const out = exportSave(sample()); assert.equal(importSave(store, out).ok, true); assert.equal(store.read(), out);
  const broken = sample(); broken.camp.bank.gold = -9;
  const r = importSave(new MemoryStore(), serialize(broken)); assert.ok(!r.ok); assert.match(r.error, /breaks a rule/);
});
