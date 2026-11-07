import fs from 'node:fs';
import { inside, isFile, print, repoOption, repoRoot, run } from './lib.mjs';
import { installFiles } from './install-files.mjs';

const approved = ['repo-game-audit', 'game-web-playtest', 'game-mobile-qa', 'game-assets',
  'game-blender-headless', 'game-godot-validation', 'game-licence-audit', 'game-release-artifact'];
run(({ repo, apply }) => {
  const root = repoRoot(repo);
  const files = new Map();
  for (const name of approved) {
    const src = '.agents/skills/' + name + '/SKILL.md';
    if (isFile(root, src)) files.set('.claude/skills/' + name + '/SKILL.md', fs.readFileSync(inside(root, src)));
  }
  if (!files.size) throw Error('No canonical toolkit skills found');
  const result = installFiles(root, files, apply);
  print(result);
  if (result.blocked) process.exitCode = 1;
}, { ...repoOption, apply: { type: 'boolean' } });
