import { detect } from './engine.mjs';
import { isMain, print, repoOption, run } from './lib.mjs';

const tasks = {
  audit: ['repo-game-audit'],
  web: ['game-web-playtest'],
  mobile: ['game-mobile-qa'],
  assets: ['game-assets', 'game-licence-audit'],
  blender: ['game-assets', 'game-blender-headless'],
  godot: ['game-godot-validation'],
  release: ['game-release-artifact', 'game-licence-audit']
};

export function route(project, task) {
  if (!Object.hasOwn(tasks, task)) throw Error('Choose a task: ' + Object.keys(tasks).join(', '));
  if ((task === 'web' || task === 'godot') && project.engine !== task) {
    throw Error('Task requires a ' + task + ' project');
  }
  return tasks[task];
}

if (isMain(import.meta.url)) run(({repo, project, task}) => {
  const result = detect(repo, project);
  if (result.status !== 'detected') throw Error(result.status + ': choose an explicit --project');
  print({ project: result.projects[0], recommendedSkills: route(result.projects[0], task) });
}, { ...repoOption, project: { type: 'string' }, task: { type: 'string', default: 'audit' } });
