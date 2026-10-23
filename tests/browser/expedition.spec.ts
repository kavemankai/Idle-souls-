import { test, expect, type Page } from '@playwright/test';
import { loadSim } from '../../src/combat/loadSimNode';
import { defaultPlan } from '../../src/expedition/plan';
import { runExpedition, type ExpeditionConfig } from '../../src/expedition/run';

const sim = loadSim();
const open = async (page: Page, query = '') => { await page.goto(`/?scene=expedition${query}`); await page.waitForFunction(() => window.__EXPEDITION_READY__); };
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
  const obj = (room: string, kind: 'reach' | 'survey' = 'reach') => ({ id: `${kind}-${room}`, kind, room });
  const cases: ExpeditionConfig[] = [];
  for (const seed of [1, 2, 3]) {
    cases.push({ seed, level: 80, focus: 'balanced', known: ['C0', 'O1', 'O2', 'O3', 'KT'], plan: { ...defaultPlan(), exploration: 'direct', objectives: [obj('T1', 'survey'), obj('O3')] } });
    cases.push({ seed, level: 80, focus: 'balanced', known: ['C0', 'O1', 'O2', 'O3', 'KT'], plan: { ...defaultPlan(), retreatHpPct: 95, doctrine: 'pressing', objectives: [obj('O3'), obj('KT')] } });
  }
  cases.push({ seed: 7, level: 80, focus: 'balanced', hpOverride: 5000, known: ['C0', 'O1', 'O2', 'O3', 'KT', 'T1', 'T2', 'K3', 'K2', 'S1', 'S2', 'K1'], plan: { ...defaultPlan(), avoid: ['T1'], returnRoute: 'shortest', objectives: [obj('K2')] } });
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
