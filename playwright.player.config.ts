import { defineConfig } from '@playwright/test';
import { browserLaunchOptions } from './tools/browser';
export default defineConfig({
  testDir: './tests/player', workers: 1,
  outputDir: '.tmp/player-test-results',
  use: { baseURL: 'http://127.0.0.1:5183', launchOptions: browserLaunchOptions, trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  webServer: { command: 'npx vite preview --mode player --host 127.0.0.1 --port 5183 --strictPort', url: 'http://127.0.0.1:5183', reuseExistingServer: false },
});
