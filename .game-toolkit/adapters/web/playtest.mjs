import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { inside, print, repoRoot, run } from '../../scripts/lib.mjs';

const sizes = [[360, 640], [390, 844], [844, 390], [1280, 720]];
run(async ({ url, project, out, scenario, executable }) => {
  const address = new URL(url);
  if (!['http:', 'https:'].includes(address.protocol) || !['127.0.0.1', 'localhost', '[::1]'].includes(address.hostname) ||
      address.username || address.password) throw Error('Pass a loopback preview --url');
  const root = repoRoot(project);
  const require = createRequire(path.join(root, 'package.json'));
  let playwright;
  try { playwright = require('playwright'); }
  catch (error) {
    if (error.code !== 'MODULE_NOT_FOUND') throw error;
    playwright = createRequire(require.resolve('@playwright/test'))('playwright');
  }
  const exercise = scenario ? (await import(pathToFileURL(inside(root, scenario)))).default : null;
  if (scenario && typeof exercise !== 'function') throw Error('Scenario must export a default function');
  const evidence = path.resolve(out);
  fs.mkdirSync(evidence);
  const browser = await playwright.chromium.launch({ executablePath: executable });
  const results = [];
  try {
    for (const [width, height] of sizes) {
      const mobile = width !== 1280;
      const key = width + 'x' + height;
      const errors = [];
      const context = await browser.newContext({ viewport: { width, height }, isMobile: mobile, hasTouch: mobile });
      const page = await context.newPage();
      page.setDefaultTimeout(10000);
      page.on('pageerror', error => errors.push(error.message));
      page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
      page.on('response', response => {
        if (response.status() >= 400) errors.push(response.status() + ' ' + response.url());
      });
      page.on('requestfailed', request => {
        if (request.failure()?.errorText !== 'net::ERR_ABORTED') errors.push(request.url() + ' ' + request.failure()?.errorText);
      });
      async function capture(name) {
        if (!/^[a-z0-9-]+$/.test(name)) throw Error('Invalid screenshot name');
        await page.screenshot({ path: path.join(evidence, key + '-' + name + '.png'), animations: 'disabled' });
      }
      try {
        const response = await page.goto(address.href, { waitUntil: 'load' });
        if (!response?.ok()) throw Error('Preview did not return HTTP success');
        await capture('initial');
        if (exercise) await exercise({ page, context, mobile, width, height, capture });
      } catch (error) { errors.push(error.message); }
      finally { await context.close(); }
      results.push({ viewport: key, mobile, scenario: Boolean(exercise), errors });
    }
  } finally { await browser.close(); }
  fs.writeFileSync(path.join(evidence, 'report.json'), JSON.stringify(results, null, 2) + '\n', { flag: 'wx' });
  print(results);
  if (results.some(result => result.errors.length)) process.exitCode = 1;
}, { url: { type: 'string' }, project: { type: 'string', default: '.' },
  out: { type: 'string', default: 'web-evidence' }, scenario: { type: 'string' }, executable: { type: 'string' } });
