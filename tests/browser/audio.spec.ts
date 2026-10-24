import { test, expect } from '@playwright/test';

test('O1 audio is user-unlocked, all music is lazily selectable and sound files are served', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('response', r => { if (r.status() >= 400 && r.url().includes('/audio/')) errors.push(String(r.status()) + ' ' + r.url()); });
  await page.goto('/?scene=o1');
  await page.waitForFunction(() => window.__O1_READY__);
  await expect(page.locator('#audio-enable')).toHaveAttribute('aria-pressed', 'false');
  await Promise.all([
    page.waitForResponse(r => r.url().endsWith('/audio/music/whispers.ogg') && r.ok() && r.headers()['content-type']?.includes('audio/') === true),
    page.locator('#audio-enable').click(),
  ]);
  await expect(page.locator('#audio-enable')).toHaveAttribute('aria-pressed', 'true');
  await Promise.all([
    page.waitForResponse(r => r.url().endsWith('/audio/music/cathedral.ogg') && r.ok() && r.headers()['content-type']?.includes('audio/') === true),
    page.selectOption('#audio-track','cathedral'),
  ]);
  await Promise.all([
    page.waitForResponse(r => r.url().endsWith('/audio/cues/ui_dispatch.ogg') && r.ok() && r.headers()['content-type']?.includes('audio/') === true),
    page.locator('#dispatch').click(),
  ]);
  await page.locator('#audio-enable').click();
  await expect(page.locator('#audio-enable')).toHaveAttribute('aria-pressed','false');
  for (const path of ['music/whispers', 'music/cathedral', 'cues/ui_dispatch']) {
    const response = await page.request.get(`/audio/${path}.ogg`);
    expect(response.ok()).toBe(true);
    expect((await response.body()).subarray(0, 4).toString()).toBe('OggS');
  }
  expect(errors).toEqual([]);
});
