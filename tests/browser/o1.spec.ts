import { test, expect, type Page } from '@playwright/test';
import { loadSim } from '../../src/combat/loadSimNode';
import { runO1, type O1Config } from '../../src/world/o1Controller';

const sim = loadSim();
interface PageState { state: string; tick: number; digest: string; hp: number; fought: boolean; hero: { x: number; y: number }; source: string }
const state = (page: Page) => page.evaluate(() => window.__O1_STATE__) as Promise<PageState>;
const ready = async (page: Page, url: string) => { await page.goto(url); await page.waitForFunction(() => window.__O1_READY__); };

for (const viewport of [{ width: 1280, height: 720 }, { width: 390, height: 844 }, { width: 844, height: 390 }]) {
  test(`O1 dispatch matches the Node run at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
    await page.setViewportSize(viewport);
    await ready(page, '/?scene=o1&speed=16');
    await expect(page.locator('canvas')).toBeVisible();
    for (const id of ['seed', 'opponent', 'level', 'focus', 'doctrine', 'dispatch', 'speed', 'proxy', 'reduced']) {
      const box = (await page.locator(`#${id}`).boundingBox())!;
      expect(box.height, `${id} touch height`).toBeGreaterThanOrEqual(44);
      expect(box.x, `${id} left`).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width, `${id} right`).toBeLessThanOrEqual(viewport.width);
      expect(box.y + box.height, `${id} bottom`).toBeLessThanOrEqual(viewport.height);
    }
    await page.fill('#seed', '5');
    await page.selectOption('#opponent', 'sentry');
    await page.selectOption('#doctrine', 'guarded');
    await expect(page.locator('#status')).toContainText('Ready');
    await page.click('#dispatch');
    await page.waitForFunction(() => ['completed', 'defeated', 'unresolved'].includes((window.__O1_STATE__ as { state: string }).state), null, { timeout: 60000 });
    const got = await state(page);
    const want = runO1(sim, { seed: 5, opponent: 'sentry', level: 80, focus: 'balanced', doctrine: 'guarded' });
    expect(got.source).toBe('authoritative');
    expect(got.state).toBe(want.outcome);
    expect(got.digest).toBe(want.digest);
    expect(got.tick).toBe(want.ticks);
    expect(got.hp).toBe(want.hpLeft);
    expect(got.fought).toBe(want.fought);
    expect(got.hero).toEqual(want.finalPos);
    await expect(page.locator('#result')).toContainText(want.outcome === 'completed' ? 'Reached the slice endpoint' : want.outcome === 'defeated' ? 'Defeated' : 'Unresolved');
    await expect(page.locator('#dispatch')).toHaveText('Run again');
    expect(errors).toEqual([]);
  });
}

test('browser and Node agree on seeded O1 runs across opponents and doctrines', async ({ page }) => {
  await ready(page, '/?scene=o1');
  const cases: O1Config[] = [];
  for (const opponent of ['mireling', 'sentry'] as const) for (const doctrine of ['measured', 'guarded', 'pressing'] as const) for (const seed of [1, 2, 9]) cases.push({ seed, opponent, level: 80, focus: 'balanced', doctrine });
  cases.push({ seed: 4, opponent: 'sentry', level: 1, focus: 'balanced', doctrine: 'measured' }, { seed: 4, opponent: 'mireling', level: 140, focus: 'survivor', doctrine: 'pressing' });
  const inPage = await page.evaluate(cs => cs.map(c => window.__O1_RUN__(c)), cases);
  inPage.forEach((r, i) => expect(r, JSON.stringify(cases[i])).toEqual(runO1(sim, cases[i])));
});

test('the visual study and its scenes still load without the O1 scene', async ({ page }) => {
  await page.goto('/?t=5.8&action=guard');
  await page.waitForFunction(() => window.__VISUAL_READY__);
  await expect(page.locator('#status')).toContainText('guard');
  expect(await page.evaluate(() => window.__O1_READY__ ?? false)).toBe(false);
});
