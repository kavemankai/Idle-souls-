import { defineConfig } from '@playwright/test';
import { browserLaunchOptions } from './tools/browser';
// PW_PORT lets several checkouts run browser specs at once without sharing a dev server. Unset, it is 5173 and reuses a running server, as before.
const port = Number(process.env.PW_PORT) || 5173, url = `http://127.0.0.1:${port}`;
export default defineConfig({
  testDir: './tests/browser', workers: 1,
  use: { baseURL: url, launchOptions: browserLaunchOptions, trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  webServer: { command: `npm run dev -- --port ${port}`, url, reuseExistingServer: !process.env.CI && !process.env.PW_PORT },
});
