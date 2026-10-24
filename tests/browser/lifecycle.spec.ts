import { test, expect } from '@playwright/test';

test('background and Back pause the live run without discarding it or accumulating ticks', async ({ page }) => {
  await page.goto('/?scene=expedition&save=memory&known=oldroad&progress=0&hp=5000');
  await page.locator('[data-preset=cross]').click();
  await page.locator('#launch').click();
  await page.locator('[data-speed="1"]').click();
  await expect.poll(() => page.evaluate(() => window.__EXPEDITION_STATE__().tick)).toBeGreaterThan(0);
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide')));
  const tick = await page.evaluate(() => window.__EXPEDITION_STATE__().tick);
  await expect(page.locator('#xp-pause')).toBeDisabled();
  await page.waitForTimeout(500);
  expect(await page.evaluate(() => window.__EXPEDITION_STATE__().tick)).toBe(tick);
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pageshow')));
  await expect(page.locator('#xp-pause')).toHaveText('Resume expedition');
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => window.__EXPEDITION_STATE__().tick)).toBe(tick);
  await page.locator('#xp-pause').click();
  await expect.poll(() => page.evaluate(() => window.__EXPEDITION_STATE__().tick)).toBeGreaterThan(Number(tick));
  await page.keyboard.press('Escape');
  await expect(page.locator('#xp-pause')).toHaveText('Resume expedition');
  await expect(page.locator('#back-to-plan')).toBeDisabled();
  await expect(page.locator('#retreat-now')).toBeEnabled();
});
