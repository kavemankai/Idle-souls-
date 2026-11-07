import { detect } from './engine.mjs';
import { print, repoOption, run } from './lib.mjs';
run(({repo, project}) => {
  const result = detect(repo, project);
  print(result);
  if (result.status !== 'detected') process.exitCode = 1;
}, { ...repoOption, project: { type: 'string' } });
