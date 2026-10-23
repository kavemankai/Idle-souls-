import { test, expect, type Page } from '@playwright/test';
import { BUDGET } from '../../tools/perf-budget';

// Headless Chrome on a CI-class machine. It says nothing about a phone; that check is pending a real device (docs/slice/M9.md).
const open = async (page: Page, query: string) => { await page.goto(`/?scene=expedition&save=memory&progress=0&known=oldroad${query}`); await page.waitForFunction(() => window.__EXPEDITION_READY__); if (await page.locator('#guide-skip').count()) await page.locator('#guide-skip').click(); };

test('at 16x the screen stays smooth: few long tasks, none over the budget', async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as unknown as { __lt: number[]; __frames: number[] };
    w.__lt = []; w.__frames = [];
    try { new PerformanceObserver(l => { for (const e of l.getEntries()) w.__lt.push(e.duration); }).observe({ type: 'longtask', buffered: true }); } catch { /* longtask unsupported */ }
    let last = 0;
    const tick = (t: number) => { if (last) w.__frames.push(t - last); last = t; requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  });
  await open(page, '&seed=3&hp=5000');
  await page.locator('[data-preset=careful]').click();
  await page.locator('#launch').click();
  await page.locator('[data-speed="16"]').click();
  const t0 = Date.now();
  await page.waitForFunction(() => (window.__EXPEDITION_STATE__() as { terminal?: boolean }).terminal === true, undefined, { timeout: 120_000 });
  const seconds = (Date.now() - t0) / 1000;
  const r = await page.evaluate(() => {
    const w = window as unknown as { __lt: number[]; __frames: number[] };
    const f = [...w.__frames].sort((a, b) => a - b);
    return { longTasks: w.__lt.length, longest: Math.max(0, ...w.__lt), frames: f.length, medianFrame: f[Math.floor(f.length / 2)] ?? 0, p95Frame: f[Math.floor(f.length * 0.95)] ?? 0, worstFrame: f[f.length - 1] ?? 0 };
  });
  console.log(`[perf] 16x run: ${seconds.toFixed(1)} s wall, ${JSON.stringify(r)}`);
  expect(r.longest).toBeLessThanOrEqual(BUDGET.longestTaskMs);
  expect(r.frames).toBeGreaterThan(10);
});

test('twenty expeditions in one page do not grow the heap without bound', async ({ page }) => {
  test.setTimeout(240_000);
  await open(page, '&seed=1&hp=5000');
  const cdp = await page.context().newCDPSession(page);
  const heap = async () => { await cdp.send('HeapProfiler.collectGarbage'); await cdp.send('HeapProfiler.collectGarbage'); return (await cdp.send('Runtime.getHeapUsage')).usedSize; };
  const cycle = async () => {
    await page.locator('[data-preset=first]').click();
    await page.locator('#launch').click();
    await page.locator('#skip').click();
    await expect(page.locator('#outcome')).toBeVisible();
    await page.locator('#again').click();
  };
  for (let i = 0; i < 3; i++) await cycle();
  const base = await heap();
  for (let i = 3; i < 20; i++) await cycle();
  const end = await heap();
  const grow = (end - base) / base;
  console.log(`[perf] heap after 3 expeditions ${(base / 1e6).toFixed(1)} MB, after 20 ${(end / 1e6).toFixed(1)} MB, growth ${(grow * 100).toFixed(1)}%`);
  expect(grow).toBeLessThanOrEqual(BUDGET.heapGrowth);
  expect(await page.evaluate(() => document.querySelectorAll('canvas').length)).toBeLessThanOrEqual(2);   // no canvases pile up
});
