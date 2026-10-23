/** Real Chromium/Phaser captures of the O1 slice. Software-rendered cloud captures: no human review, no physical device. */
import { chromium } from '@playwright/test';
import { browserLaunchOptions } from './browser';
import { mkdirSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
const output = 'docs/o1_slice/screenshots'; mkdirSync(output, { recursive: true });
const base = process.env.PREVIEW_URL ?? 'http://127.0.0.1:4173';
const sizes = { desktop: [1280, 720], hd: [1920, 1080], portrait: [390, 844], landscape: [844, 390] } as const;
const moments: [string, string][] = [
  ['ready', '?scene=o1'],
  ['travelling', '?scene=o1&ticks=40&debug'],
  ['mireling-fight', '?scene=o1&ticks=190'],
  ['sentry-fight', '?scene=o1&ticks=170&opponent=sentry'],
  ['completed', '?scene=o1&ticks=3000'],
  ['defeated', '?scene=o1&ticks=3000&opponent=sentry&level=1&seed=2'],
  ['combat-tab', '?scene=o1&opponent=sentry&ticks=175&tab=combat&hold&ghosts'],
  ['totals-tab', '?scene=o1&opponent=sentry&ticks=400&tab=totals&hold'],
  ['build-tab', '?scene=o1&opponent=sentry&ticks=175&tab=build&hold'],
  ['action-cam', '?scene=o1&opponent=sentry&ticks=175&hold&cam=action'],
  ['zoom-2', '?scene=o1&opponent=sentry&ticks=175&hold&cam=zoom2'],
  ['log-tab', '?scene=o1&opponent=sentry&ticks=400&tab=log&hold'],
];
const browser = await chromium.launch(browserLaunchOptions);
const records: unknown[] = [];
for (const [sizeName, [width, height]] of Object.entries(sizes)) for (const [moment, query] of moments) {
  if (sizeName === 'hd' && moment !== 'mireling-fight') continue;
  const name = `O1-${sizeName}-${moment}`;
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message)); page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
  await page.goto(`${base}/${query}`); await page.waitForFunction(() => window.__O1_READY__); await page.waitForTimeout(250);
  await page.screenshot({ path: `${output}/${name}.png` });
  records.push({ file: `screenshots/${name}.png`, viewport: [width, height], deviceScaleFactor: 1, url: query, state: await page.evaluate(() => window.__O1_STATE__), errors });
  await page.close();
}
await browser.close();
writeFileSync('docs/o1_slice/capture-manifest.json', JSON.stringify({
  capturedAt: new Date().toISOString(), tool: 'Chromium / Playwright against the built preview, real Phaser runtime and the real simulator',
  checkoutSHA: execSync('git rev-parse HEAD').toString().trim(),
  note: 'Software-rendered cloud captures. No human review and no physical device or touch testing is claimed. State fields come from window.__O1_STATE__.',
  captures: records,
}, null, 1));
console.log(`Captured ${records.length} O1 images`);
