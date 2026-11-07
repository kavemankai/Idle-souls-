import { dependencies, license, validateAssets } from './asset-lib.mjs';
import { inside, json, print, repoOption, repoRoot, run } from './lib.mjs';
run(({ repo, manifest, project, 'include-dev': includeDev }) => {
  const root = repoRoot(repo);
  const data = json(inside(root, manifest));
  const validation = validateAssets(root, data);
  const assets = data.assets.map((asset, index) => {
    const result = license(root, asset);
    if (validation[index].issues.length) result.status = 'BLOCKED';
    return { id: validation[index].id, ...result, issues: [...validation[index].issues, ...result.issues] };
  });
  const packages = dependencies(root, project, data.packages);
  print({ assets, dependencies: packages, gatesDevDependencies: Boolean(includeDev) });
  if ([...assets, ...packages.filter(entry => includeDev || !entry.dev)]
    .some(entry => entry.status !== 'APPROVED')) process.exitCode = 1;
}, { ...repoOption, manifest: { type: 'string', default: 'asset-manifest.json' },
  project: { type: 'string', default: '.' }, 'include-dev': { type: 'boolean' } });
