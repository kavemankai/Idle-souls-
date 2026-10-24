/** Run the release baseline in a fixed order, stopping at the first failed check.
 * Invoke through npm so its own CLI can be launched without a platform-specific shell. */
import { spawnSync } from 'node:child_process';

const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error('Run this tool with npm run check.');

const checks: [string, string[]][] = [
  ['lint', [npmCli, 'run', 'lint']],
  ['typecheck', [npmCli, 'run', 'typecheck']],
  ['world generation', [npmCli, 'run', 'world:check']],
  ['portable math', ['combat/tools/sync-portable-math.js', '--check']],
  ['production build', [npmCli, 'run', 'build']],
  // Build first: unit tests must include the built bundle's size budget.
  ['unit tests', [npmCli, 'test']],
  ['simulator regression', ['combat/deep-stats/tools/regress.js']],
  ['legacy arena', ['combat/deep-stats/tools/legacy-check.js']],
  ['browser tests', [npmCli, 'run', 'test:browser']],
];

console.log(`Baseline: ${process.platform}, Node ${process.version}`);
for (const [label, args] of checks) {
  console.log(`\nChecking ${label}`);
  const result = spawnSync(process.execPath, args, { stdio: 'inherit' });
  if (result.error) console.error(result.error.message);
  if (result.error || result.status !== 0) {
    console.error(`Baseline failed: ${label}${result.signal ? ` (${result.signal})` : ''}`);
    process.exit(result.status || 1);
  }
}
console.log('\nAll baseline checks passed.');
