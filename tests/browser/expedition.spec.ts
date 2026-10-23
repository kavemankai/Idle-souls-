import { test, expect, type Page } from '@playwright/test';
import { loadSim } from '../../src/combat/loadSimNode';
import { defaultPlan } from '../../src/expedition/plan';
import { runExpedition, type ExpeditionConfig } from '../../src/expedition/run';

const sim = loadSim();
// The planner starts in fog (only the map in the save). Most specs use the Old Road shortcut map so presets have somewhere to go; the fog specs say known=save.
const open = async (page: Page, query = '') => { await page.goto(`/?scene=expedition${query.includes('known=') ? '' : '&known=oldroad'}${query.includes('progress=') ? '' : '&progress=0'}${query}`); await page.waitForFunction(() => window.__EXPEDITION_READY__); };
const noSideScroll = (page: Page) => page.evaluate(() => { const x = document.getElementById('xp')!; return x.scrollWidth <= x.clientWidth + 1; });

for (const viewport of [{ width: 1280, height: 720 }, { width: 390, height: 844 }, { width: 844, height: 390 }]) {
  test(`plan, launch and read the Chronicle at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await open(page, '&seed=3&hp=5000');
    expect(await noSideScroll(page)).toBe(true);
    await expect(page.locator('#launch')).toBeDisabled();            // no objective yet
    await page.locator('[data-preset=cross]').click();
    await expect(page.locator('#preflight')).toHaveAttribute('data-status', 'confirmed');
    await page.locator('[data-seg=exploration-thorough]').click();
    expect(await noSideScroll(page)).toBe(true);
    await page.locator('#launch').click();
    await expect(page.locator('#map')).toBeVisible();
    expect(await noSideScroll(page)).toBe(true);
    await page.locator('#skip').click();
    await expect(page.locator('#outcome')).toHaveAttribute('data-outcome', 'extracted');
    await expect(page.locator('#feed li[data-kind=route]').first()).toBeVisible();
    expect(await page.locator('#feed li').count()).toBeGreaterThan(6);
    await expect(page.locator('#objstat li.completed')).toHaveCount(1);
    expect(await noSideScroll(page)).toBe(true);
    await expect(page.locator('#download')).toHaveAttribute('href', /chronicle|json/);
    await page.locator('#again').click();
    await expect(page.locator('#launch')).toBeVisible();
  });
}

test('the page and Node produce the same Chronicle for the same plan', async ({ page }) => {
  await open(page, '&seed=3&hp=5000');
  await page.locator('[data-preset=tower]').click();
  await page.locator('#launch').click();
  await page.locator('#skip').click();
  await expect(page.locator('#outcome')).toBeVisible();
  const state = await page.evaluate(() => window.__EXPEDITION_STATE__());
  const cfg: ExpeditionConfig = { seed: 3, level: 80, focus: 'balanced', hpOverride: 5000, known: ['C0', 'O1', 'O2', 'O3', 'KT'],
    plan: { ...defaultPlan(), exploration: 'thorough', doctrine: 'guarded', retreatHpPct: 50, objectives: [{ id: 'o1', kind: 'survey', room: 'T1' }] } };
  const node = runExpedition(sim, cfg).chronicle;
  expect(state.digest).toBe(node.digest);
  expect(await page.locator('#summary').textContent()).toBe(node.summary);
  const inPage = await page.evaluate(c => window.__EXPEDITION_RUN__(c), cfg);
  expect(inPage).toEqual(node);
});

test('browser and Node agree on expeditions across plans and seeds', async ({ page }) => {
  await open(page);
  const obj = (room: string, kind: 'reach' | 'survey' | 'recover' = 'reach') => ({ id: `${kind}-${room}`, kind, room });
  const cases: ExpeditionConfig[] = [];
  for (const seed of [1, 2, 3]) {
    cases.push({ seed, level: 80, focus: 'balanced', known: ['C0', 'O1', 'O2', 'O3', 'KT'], plan: { ...defaultPlan(), exploration: 'direct', objectives: [obj('T1', 'survey'), obj('O3')] } });
    cases.push({ seed, level: 80, focus: 'balanced', known: ['C0', 'O1', 'O2', 'O3', 'KT'], plan: { ...defaultPlan(), retreatHpPct: 95, doctrine: 'pressing', objectives: [obj('O3'), obj('KT')] } });
  }
  cases.push({ seed: 7, level: 80, focus: 'balanced', hpOverride: 5000, known: ['C0', 'O1', 'O2', 'O3', 'KT', 'T1', 'T2', 'K3', 'K2', 'S1', 'S2', 'K1'], plan: { ...defaultPlan(), avoid: ['T1'], returnRoute: 'shortest', objectives: [obj('K2')] } });
  cases.push({ seed: 4, level: 80, focus: 'balanced', hpOverride: 5000, known: ['C0', 'O1', 'O2', 'O3', 'KT'], cache: { room: 'O1', x: -100, y: 0, contents: { gold: 50, supplies: { ration: 1 }, gear: [], mastery: 3, keys: 0, prepared: 0 } }, plan: { ...defaultPlan(), objectives: [obj('O1', 'recover'), obj('O3')] } });
  const everything = ['C0', 'O1', 'O2', 'O3', 'KT', 'T1', 'T2', 'T3', 'MB', 'S1', 'S2', 'S3', 'K1', 'K2', 'K3', 'B1', 'SB'];
  cases.push({ seed: 6, level: 80, focus: 'balanced', hpOverride: 5000, known: everything, issueKeys: 1, plan: { ...defaultPlan(), retreatHpPct: 0, objectives: [{ id: 'g', kind: 'open', room: 'T2', to: 'MB' }, { id: 't', kind: 'reach', room: 'T3' }] } });
  cases.push({ seed: 8, level: 80, focus: 'balanced', hpOverride: 5000, known: everything, plan: { ...defaultPlan(), retreatHpPct: 0, returnRoute: 'shortest', objectives: [{ id: 's', kind: 'reach', room: 'S3' }, { id: 'o', kind: 'open', room: 'S3', to: 'C0' }, { id: 'x', kind: 'explore', room: 'K1' }] } });
  const deepPlan = { ...defaultPlan(), doctrine: 'guarded' as const, retreatHpPct: 60, drinkBelowPct: 70, healingReserve: 1, sanctuaryChoice: 'riposte' as const, objectives: [obj('O3'), obj('S2')] };
  for (const seed of [1, 2, 3, 4, 5, 6]) cases.push({ seed, level: 80, focus: 'balanced', known: ['C0', 'O1', 'O2', 'O3', 'KT', 'S1', 'S2'], progression: { startLevel: 4, kitRations: 2 }, plan: deepPlan });
  cases.push({ seed: 2, level: 80, focus: 'balanced', known: ['C0', 'O1', 'O2', 'O3', 'KT'], progression: { startLevel: 1 }, plan: { ...defaultPlan(), objectives: [obj('O1', 'survey')] } });
  const inPage = await page.evaluate(cs => cs.map(c => window.__EXPEDITION_RUN__(c)), cases);
  inPage.forEach((r, i) => expect(r, `case ${i}`).toEqual(runExpedition(sim, cases[i]).chronicle));
});

test('avoiding the objective room is a conflict and launch stays off; removing the avoid clears it', async ({ page }) => {
  await open(page);
  await page.locator('[data-preset=cross]').click();
  await page.locator('[data-avoid=O2]').click();
  await expect(page.locator('#preflight')).toHaveAttribute('data-status', 'conflicted');
  await expect(page.locator('#launch')).toBeDisabled();
  await page.locator('[data-avoid=O2]').click();
  await expect(page.locator('#preflight')).toHaveAttribute('data-status', 'confirmed');
  await expect(page.locator('#launch')).toBeEnabled();
});

test('a retreat order starts at once, is logged as manual, and suspends the objectives', async ({ page }) => {
  await open(page, '&seed=3&hp=5000');
  await page.locator('[data-preset=careful]').click();
  await page.locator('#launch').click();
  await expect.poll(async () => (await page.evaluate(() => window.__EXPEDITION_STATE__())).room, { timeout: 20000 }).toBe('O1');
  await page.locator('#retreat-now').click();
  await expect(page.locator('#xstatus')).toContainText('Retreat ordered');
  if (await page.locator('#skip').isEnabled()) await page.locator('#skip').click();
  await expect(page.locator('#outcome')).toHaveAttribute('data-outcome', 'extracted');
  await expect(page.locator('#feed li[data-kind=retreat]').first()).toContainText('Player ordered a retreat');
  await expect(page.locator('#objstat li.suspended').first()).toBeVisible();
});

test('the fresh map offers only what is on it and a preset drops places it cannot reach', async ({ page }) => {
  await open(page, '&known=fresh');
  await page.locator('[data-preset=careful]').click();
  await expect(page.getByText('left out')).toBeVisible();
  await page.locator('#add-objective').click();
  const options = await page.locator('[data-obj-room="0"] option').allTextContents();
  expect(options.some(o => o.includes('Crossroads'))).toBe(true);
  expect(options.some(o => o.includes('Tower'))).toBe(false);
});

const SAVE = '&save=memory';
const finish = async (page: Page) => { if (await page.locator('#skip').isEnabled()) await page.locator('#skip').click(); await expect(page.locator('#outcome')).toBeVisible(); };

test('a returning expedition banks its loot once, and the camp shows it next time', async ({ page }) => {
  await open(page, `&seed=1&hp=5000${SAVE}`);
  await expect(page.locator('#bank-line')).toContainText('nothing');
  await page.locator('[data-preset=cross]').click();
  await expect(page.locator('#risk-rule')).toContainText('Only camp banks it');
  await page.locator('#launch').click();
  await expect(page.locator('#carried-line')).toContainText('Carried, at risk until camp');
  await finish(page);
  await expect(page.locator('#outcome')).toHaveAttribute('data-outcome', 'extracted');
  await expect(page.locator('#settle-lines li').first()).toContainText('Banked: 33 gold');
  const save = await page.evaluate(() => window.__EXPEDITION_SAVE__());
  expect(save.camp.bank.gold).toBe(33); expect(save.camp.expeditions).toBe(1); expect(save.camp.cache).toBeNull();
  await page.locator('#again').click();
  await expect(page.locator('#bank-line')).toContainText('33 gold');
  expect(await noSideScroll(page)).toBe(true);
});

test('a fall leaves one cache, the camp warns about it, and a recover objective brings it home', async ({ page }) => {
  await open(page, `&seed=1&hp=45${SAVE}`);
  await page.locator('[data-preset=cross]').click();
  await page.locator('#retreat').fill('0');
  await page.locator('#launch').click();
  await finish(page);
  await expect(page.locator('#outcome')).toHaveAttribute('data-outcome', 'died');
  await expect(page.locator('#settle-lines')).toContainText('recovery cache');
  const dead = await page.evaluate(() => window.__EXPEDITION_SAVE__());
  expect(dead.camp.bank.gold).toBe(0); expect(dead.camp.deaths).toBe(1); expect(dead.camp.cache).not.toBeNull();
  await page.locator('#again').click();
  await expect(page.locator('#cache-line')).toContainText('A new fall before you collect it replaces it');
  await expect(page.locator('#add-recover')).toBeEnabled();
  await page.locator('#add-recover').click();
  await expect(page.locator('#preflight')).toHaveAttribute('data-status', 'confirmed');
});

test('the save can be exported and imported, and a damaged save is refused', async ({ page }) => {
  await open(page, `&seed=1&hp=5000${SAVE}`);
  await page.locator('#save-card summary').click();
  await expect(page.locator('#export-save')).toHaveAttribute('href', /idle-souls-save/);
  await page.locator('#import-text').fill('not a save');
  await page.locator('#import-go').click();
  await expect(page.locator('.warn').first()).toBeVisible();
  expect((await page.evaluate(() => window.__EXPEDITION_SAVE__())).camp.expeditions).toBe(0);
});

test('a new game starts in fog: only the Outer Road can be chosen, and walking it opens up the map', async ({ page }) => {
  await open(page, `&known=save&seed=1&hp=5000${SAVE}`);
  await page.locator('#add-objective').click();
  expect(await page.locator('[data-obj-room="0"] option').allTextContents()).toEqual(['Outer Road (unexplored)']);
  await page.locator('[data-preset=first]').click();
  await expect(page.locator('#preflight')).toHaveAttribute('data-status', 'frontier');
  await page.locator('#launch').click();
  if (await page.locator('#skip').isEnabled()) await page.locator('#skip').click();
  await expect(page.locator('#outcome')).toHaveAttribute('data-outcome', 'extracted');
  await expect(page.locator('#feed li[data-kind=discovery]').first()).toContainText('Outer Road');
  await page.locator('#again').click();
  await page.locator('#add-objective').click();
  const options = await page.locator('[data-obj-room="0"] option').allTextContents();
  expect(options.some(o => o.includes('Crossroads'))).toBe(true);
  expect(options.some(o => o.includes('Tower'))).toBe(false);
  const save = await page.evaluate(() => window.__EXPEDITION_SAVE__());
  expect(save.world.discovered).toEqual(['C0', 'O1']);
});

test('a banked key opens a gate only when issued; the gate then stays open and costs nothing again', async ({ page }) => {
  await open(page, `&known=all&seed=1&hp=5000${SAVE}`);
  await page.evaluate(() => {
    const s = window.__EXPEDITION_SAVE__();
    s.camp.bank.keys = 1;
    window.__EXPEDITION_SET_SAVE__!(s);
  });
  await expect(page.locator('#keys-line')).toContainText('Gate Keys banked: 1');
  await expect(page.locator('#gates-seen')).toContainText('Tower Barracks to Bell Warden: sealed');
  await page.locator('#add-objective').click();
  await page.locator('[data-obj-kind="0"]').selectOption('open');
  await page.locator('[data-obj-gate="0"]').selectOption('T2>MB');
  await expect(page.locator('#preflight')).toHaveAttribute('data-status', 'blocked');
  await expect(page.locator('.obj .why').first()).toContainText('banked Gate Key issued at camp');
  await page.locator('[data-issue="1"]').click();
  await expect(page.locator('#preflight')).toHaveAttribute('data-status', 'confirmed');
  await page.locator('#launch').click();
  if (await page.locator('#skip').isEnabled()) await page.locator('#skip').click();
  await expect(page.locator('#outcome')).toHaveAttribute('data-outcome', 'extracted');
  await expect(page.locator('#feed')).toContainText('Spent 1 Gate Key');
  await expect(page.locator('#settle-lines')).toContainText('Opened for good: Tower Barracks and Bell Warden');
  const save = await page.evaluate(() => window.__EXPEDITION_SAVE__());
  expect(save.world.openedLinks).toEqual(['MB~T2']); expect(save.camp.bank.keys).toBe(0);
  await page.locator('#again').click();
  await expect(page.locator('#keys-line')).toContainText('Opened gates and shortcuts: 1');
  expect(await noSideScroll(page)).toBe(true);
});

// M5: temporary levels, rations and the sanctuary.
for (const viewport of [{ width: 1280, height: 720 }, { width: 390, height: 844 }, { width: 844, height: 390 }]) {
  test(`progression controls, level line and Chronicle progress at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await open(page, '&progress=1&seed=3&startlevel=2');
    await expect(page.locator('#drink')).toBeVisible();
    await expect(page.locator('#reserve')).toBeVisible();
    await expect(page.locator('#ration-rule')).toContainText('never banked');
    await expect(page.locator('#sanctuary-rule')).toContainText('No banking here');
    await page.locator('[data-seg=upgrade-riposte]').click();
    await expect(page.locator('#sanctuary-rule')).toContainText('guards');
    await page.locator('#reserve').selectOption('1');
    expect(await noSideScroll(page)).toBe(true);
    await page.locator('[data-preset=careful]').click();
    await page.locator('#launch').click();
    await expect(page.locator('#level-line')).toContainText('Levels and upgrades end with the expedition');
    await expect(page.locator('#sanctuary-line')).toContainText(/no banking here/i);
    expect(await noSideScroll(page)).toBe(true);
    await page.locator('#skip').click();
    await expect(page.locator('#progress-line')).toContainText('only banked loot stays');
    expect(await noSideScroll(page)).toBe(true);
    const save = await page.evaluate(() => window.__EXPEDITION_SAVE__());
    expect(JSON.stringify(save)).not.toMatch(/"(xp|experience|sanctuary|upgrade)"/);
  });
}

test('progress=0 hides the progression controls and keeps the fixed level field', async ({ page }) => {
  await open(page, '&seed=3');
  await expect(page.locator('#drink')).toHaveCount(0);
  await expect(page.locator('#sanctuary-rule')).toHaveCount(0);
  await expect(page.locator('#level')).toHaveCount(1);
});
