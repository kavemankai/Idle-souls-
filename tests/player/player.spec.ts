import { test, expect } from '@playwright/test';

for (const viewport of [{ width: 360, height: 640 }, { width: 844, height: 390 }]) {
  test(`packaged player ignores debug URLs and keeps retreat visible at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/?scene=o1&known=all&hp=99999&startlevel=9&save=memory');
    await expect(page.locator('#launch')).toBeVisible();
    expect(await page.evaluate(() => typeof window.__EXPEDITION_READY__)).toBe('undefined');
    await expect(page.locator('#seed, #startlevel, #knowledge')).toHaveCount(0);
    await page.locator('#guide-skip').click();
    await page.locator('[data-preset=first]').click();
    await page.locator('#launch').click();
    await page.keyboard.press('Escape');
    await expect(page.locator('#xp-pause')).toHaveText('Resume expedition');
    await expect(page.locator('#skip')).toHaveCount(0);
    await page.evaluate(() => {
      document.documentElement.style.setProperty('--safe-area-inset-bottom', '24px');
      document.getElementById('xp')!.scrollTop = 10000;
    });
    const bounds = await page.locator('#retreat-now').boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.y).toBeGreaterThanOrEqual(0);
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(viewport.height - 24);
    expect(await page.evaluate(() => {
      const screen = document.getElementById('xp')!;
      return screen.scrollWidth <= screen.clientWidth;
    })).toBe(true);
    await page.locator('#retreat-now').click();
    await expect(page.locator('#xstatus')).toContainText('Retreat');
    await page.screenshot({ path: `.tmp/mobile/player-${viewport.width}x${viewport.height}.png` });
  });
}

test('the production package serves real offline audio', async ({ request }) => {
  const response = await request.get('/audio/music/whispers.ogg');
  expect(response.ok()).toBe(true);
  expect((await response.body()).subarray(0, 4).toString()).toBe('OggS');
});

test('production Android entry shows live animated combat viewport rather than only a map dot', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto('/');
  await expect(page.locator('#launch')).toBeVisible();
  await page.locator('#guide-skip').click();
  await page.locator('[data-preset=first]').click();
  await page.locator('#launch').click();
  const stage = page.locator('#battle-scene');
  await expect(stage).toBeVisible();
  await expect(stage.locator('canvas')).toBeVisible({ timeout: 30000 });
  await expect.poll(() => stage.getAttribute('data-visual-ready'), { timeout: 30000 }).toBe('true');
  await expect.poll(async () => Number(await stage.getAttribute('data-visual-actors')), { timeout: 15000 }).toBeGreaterThanOrEqual(1);
  await expect.poll(async () => Number(await stage.getAttribute('data-visual-hp-bars')), { timeout: 15000 }).toBeGreaterThanOrEqual(1);
  const bounds = await stage.boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds!.width).toBeGreaterThanOrEqual(300);
  expect(bounds!.height).toBeGreaterThanOrEqual(300);
  await expect(page.locator('#expedition-map')).toBeVisible();
  await expect(page.locator('#expedition-map')).not.toHaveAttribute('open');
  const first = Number(await stage.getAttribute('data-visual-tick'));
  await expect.poll(async () => Number(await stage.getAttribute('data-visual-tick')), { timeout: 15000 }).toBeGreaterThan(first);
  await page.locator('#xp-pause').click();
  await expect(page.locator('#xp-pause')).toHaveText('Resume expedition');
  const stopped = Number(await stage.getAttribute('data-visual-tick'));
  await page.waitForTimeout(350);
  expect(Number(await stage.getAttribute('data-visual-tick'))).toBe(stopped);
  await expect(page.locator('#retreat-now')).toBeVisible();
  expect(await page.evaluate(() => typeof window.__O1_RUN__)).toBe('undefined');
});

test('production player uses one continuous dungeon canvas, hallways and hero action chip with no duplicate screen HP bar', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto('/');
  await page.locator('#guide-skip').click();
  await page.locator('[data-preset=first]').click();
  await page.locator('#launch').click();
  const stage = page.locator('#battle-scene');
  await expect.poll(() => stage.getAttribute('data-visual-ready'), { timeout: 30000 }).toBe('true');
  await expect(page.locator('.hpbar')).toHaveCount(0);
  await expect(page.locator('#xstatus')).toContainText('health');
  await expect.poll(() => stage.getAttribute('data-visual-action'), { timeout: 15000 }).toMatch(/^• /);
  const canvas = await stage.locator('canvas').elementHandle();
  expect(canvas).not.toBeNull();
  await page.locator('[data-speed="16"]').click();
  await expect.poll(async () => Number(await stage.getAttribute('data-visual-hallways')),
    { timeout: 40000 }).toBeGreaterThan(0);
  await expect.poll(() => stage.getAttribute('data-visual-room'),
    { timeout: 40000 }).toBe('O1');
  expect(await canvas!.evaluate(c => c === document.querySelector('#battle-scene canvas') && c.isConnected))
    .toBe(true);
  const numbers = await Promise.all(['visual-hero-x','visual-hero-y','visual-camera-x','visual-camera-y']
    .map(a => stage.getAttribute('data-' + a)));
  assertFinite(numbers);
  await expect.poll(async () => Number(await stage.getAttribute('data-visual-loaded-rooms')))
    .toBeGreaterThanOrEqual(1);
});
function assertFinite(values: (string | null)[]) {
  for (const value of values) expect(value !== null && Number.isFinite(Number(value))).toBe(true);
}
