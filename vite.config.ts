import { defineConfig } from 'vite';
import { execSync } from 'node:child_process';
export default defineConfig({
  base: './',
  publicDir: 'assets',
  define: { __BUILD_SHA__: JSON.stringify(process.env.BUILD_SHA ?? execSync('git rev-parse --short HEAD').toString().trim()) },
  build: { chunkSizeWarningLimit: 1600 },
});
