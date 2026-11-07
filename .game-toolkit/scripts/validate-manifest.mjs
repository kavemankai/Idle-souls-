import { validateAssets } from './asset-lib.mjs';
import { inside, json, print, repoOption, repoRoot, run } from './lib.mjs';
run(({ repo, manifest }) => {
  const root = repoRoot(repo);
  const entries = validateAssets(root, json(inside(root, manifest)));
  print(entries);
  if (entries.some(entry => entry.issues.length)) process.exitCode = 1;
}, { ...repoOption, manifest: { type: 'string', default: 'asset-manifest.json' } });
