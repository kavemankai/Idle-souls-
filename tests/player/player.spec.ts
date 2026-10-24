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
