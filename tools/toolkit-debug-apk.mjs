import { spawnSync } from 'node:child_process';
import process from 'node:process';
import { fileURLToPath, URL } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const verifier = fileURLToPath(new URL('../.game-toolkit/adapters/android/verify-apk.mjs', import.meta.url));
const result = spawnSync(process.execPath, [verifier, '--repo', root,
  '--apk', 'android/app/build/outputs/apk/debug/app-debug.apk',
  '--entry', 'assets/public/index.html',
  '--entry', 'assets/public/audio/ambience/wind.ogg'
], { stdio: 'inherit' });
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
