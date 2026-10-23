import { test, expect, type Page } from '@playwright/test';
import { loadSim } from '../../src/combat/loadSimNode';
import { O1Controller, runO1, type O1Config } from '../../src/world/o1Controller';
import { O1PresentationAdapter } from '../../src/world/o1Adapter';

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

for (const viewport of [{ width: 1280, height: 720 }, { width: 390, height: 844 }, { width: 844, height: 390 }]) {
  test(`combat tabs show the simulator's numbers at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.setViewportSize(viewport);
    await ready(page, '/?scene=o1&opponent=sentry&seed=2&ticks=175&hold');
    const c = new O1Controller(sim, { seed: 2, opponent: 'sentry', level: 80, focus: 'balanced', doctrine: 'measured' });
    c.dispatch(); for (let i = 0; i < 175; i++) c.step();
    const want = new O1PresentationAdapter(c).read();
    const [hero, enemy] = want.combat!.combatants;
    expect((await state(page)).tick).toBe(175);
    for (const tab of ['run', 'combat', 'totals', 'build', 'log']) {
      const button = page.locator(`#tab-${tab}`);
      expect((await button.boundingBox())!.height, `${tab} tab height`).toBeGreaterThanOrEqual(44);
      await button.click();
      await expect(page.locator(`#pane-${tab}`)).toBeVisible();
      const panel = (await page.locator('.o1-bench').boundingBox())!;
      expect(panel.x).toBeGreaterThanOrEqual(0); expect(panel.y).toBeGreaterThanOrEqual(0);
      expect(panel.x + panel.width).toBeLessThanOrEqual(viewport.width); expect(panel.y + panel.height).toBeLessThanOrEqual(viewport.height);
    }
    await page.click('#tab-combat');
    await expect(page.locator('#body-combat')).toContainText(`Health ${Math.round(hero.hp.value)}/${hero.hp.max}`);
    await expect(page.locator('#body-combat')).toContainText(`Stamina ${Math.round(hero.stamina.value)}/${hero.stamina.max}`);
    await expect(page.locator('#body-combat')).toContainText(`Health ${Math.round(enemy.hp.value)}/${enemy.hp.max}`);
    await expect(page.locator('#body-combat')).toContainText(want.combat!.mind.thought);
    await page.click('#tab-totals');
    await expect(page.locator('#pane-totals')).toContainText(`Damage dealt${want.combat!.totals.dealt}`);
    for (const cause of want.combat!.causes.filter(x => x.damage)) await expect(page.locator('#pane-totals')).toContainText(cause.label);
    await page.click('#tab-build');
    for (const s of want.build!.families.flatMap(f => f.stats)) await expect(page.locator('#pane-build')).toContainText(s.line);
    await page.click('#tab-log');
    await expect(page.locator('#pane-log li')).toHaveCount(want.combat!.events.length);
    expect(errors).toEqual([]);
  });
}
test('combat cues can be turned off and the run does not change', async ({ page }) => {
  await ready(page, '/?scene=o1&opponent=sentry&seed=2&ticks=175&hold');
  const before = await state(page);
  await page.click('#tab-combat');
  for (const id of ['cues', 'ghosts']) { await page.click(`#${id}`); await expect(page.locator(`#${id}`)).toHaveAttribute('aria-pressed', id === 'cues' ? 'false' : 'true'); }
  expect((await state(page)).digest).toBe(before.digest);
});

for (const viewport of [{ width: 1280, height: 720 }, { width: 390, height: 844 }, { width: 844, height: 390 }]) {
  test(`zoom buttons and the action cam work at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.setViewportSize(viewport);
    await ready(page, '/?scene=o1&opponent=sentry&seed=2&ticks=175&hold');
    const cam = () => page.evaluate(() => window.__O1_STATE__ as { zoom: number; fit: number; digest: string; cam: { mode: string; step: number } });
    for (const id of ['camOut', 'camIn', 'camAction']) {
      const box = (await page.locator(`#${id}`).boundingBox())!;
      expect(box.height, `${id} height`).toBeGreaterThanOrEqual(44); expect(box.width, `${id} width`).toBeGreaterThanOrEqual(44);
      expect(box.x).toBeGreaterThanOrEqual(0); expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
      const panel = (await page.locator('.o1-bench').boundingBox())!;
      const overlaps = box.x < panel.x + panel.width && box.x + box.width > panel.x && box.y < panel.y + panel.height && box.y + box.height > panel.y;
      expect(overlaps, `${id} overlaps the panel`).toBe(false);
    }
    const start = await cam();
    expect(start.zoom).toBeCloseTo(start.fit, 2); expect(start.cam.mode).toBe('overview');
    await page.click('#camIn');
    await expect.poll(async () => (await cam()).zoom / start.fit, { timeout: 5000 }).toBeCloseTo(1.6, 1);
    await page.click('#camIn'); await page.click('#camIn'); await page.click('#camIn');
    await expect.poll(async () => (await cam()).zoom / start.fit, { timeout: 5000 }).toBeCloseTo(3.4, 1);
    expect((await cam()).cam.step).toBe(3);
    await page.click('#camAction');
    await expect(page.locator('#camAction')).toHaveAttribute('aria-pressed', 'true');
    await expect.poll(async () => (await cam()).cam.mode, { timeout: 5000 }).toBe('action');
    await expect.poll(async () => (await cam()).zoom / start.fit, { timeout: 5000 }).toBeLessThan(3.3);
    expect((await cam()).zoom / start.fit).toBeGreaterThan(1.25);
    await page.click('#camAction');
    await expect.poll(async () => (await cam()).zoom / start.fit, { timeout: 5000 }).toBeCloseTo(1, 1);
    expect((await cam()).digest, 'camera never changes the run').toBe(start.digest);
    expect(errors).toEqual([]);
  });
}
test('?cam=action opens in the action camera', async ({ page }) => {
  await ready(page, '/?scene=o1&opponent=sentry&seed=2&ticks=175&hold&cam=action');
  await expect(page.locator('#camAction')).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(async () => page.evaluate(() => { const s = window.__O1_STATE__ as { zoom: number; fit: number }; return s.zoom / s.fit; }), { timeout: 5000 }).toBeGreaterThan(1.25);
});
