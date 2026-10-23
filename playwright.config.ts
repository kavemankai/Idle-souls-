import { defineConfig } from '@playwright/test';
import { browserLaunchOptions } from './tools/browser';
export default defineConfig({
  testDir: './tests/browser', workers: 1,
  use: { baseURL:'http://127.0.0.1:5173', launchOptions: browserLaunchOptions },
  webServer: { command:'npm run dev -- --port 5173',url:'http://127.0.0.1:5173',reuseExistingServer:!process.env.CI },
});
