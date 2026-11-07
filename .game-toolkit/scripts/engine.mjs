import fs from 'node:fs';
import path from 'node:path';
import { inside, isFile, json, repoRoot, toolkit } from './lib.mjs';

const config = json(path.join(toolkit, 'config/engines.json'));

export function detect(repo, project) {
  const root = repoRoot(repo);
  const projects = [];
  function inspect(dir, depth) {
    const full = dir === '.' ? root : inside(root, dir);
    const pkg = isFile(full, 'package.json') ? json(path.join(full, 'package.json')) : {};
    const lock = isFile(full, 'package-lock.json') ? json(path.join(full, 'package-lock.json')) : {};
    const dependencies = { ...pkg.devDependencies, ...pkg.dependencies };
    const versions = Object.fromEntries(Object.entries(config.web.libraries)
      .filter(([name]) => dependencies[name])
      .map(([name, label]) => [label, {
        declared: dependencies[name], locked: lock.packages?.['node_modules/' + name]?.version ?? null
      }]));
    const engines = [];
    if (isFile(full, 'project.godot')) engines.push('godot');
    if (isFile(full, 'index.html') || ['Phaser', 'PixiJS', 'Vite'].some(name => versions[name])) engines.push('web');
    for (const engine of engines) {
      const godot = engine === 'godot' ? fs.readFileSync(path.join(full, 'project.godot'), 'utf8') : '';
      projects.push({ path: dir, engine, versions, godotFeatureVersion: godot.match(/config\/features\s*=\s*PackedStringArray\("(\d+\.\d+)"/)?.[1] ?? null,
        android: engine === 'web' && Boolean(versions['Capacitor Android']),
        scripts: pkg.scripts ?? {}, exportPresets: isFile(full, 'export_presets.cfg') });
    }
    if (depth >= 2 || project !== undefined) return;
    for (const entry of fs.readdirSync(full, { withFileTypes: true })) {
      if (entry.isDirectory() && !entry.name.startsWith('.') && !config.ignored.includes(entry.name)) {
        inspect(dir === '.' ? entry.name : dir + '/' + entry.name, depth + 1);
      }
    }
  }
  inspect(project ?? '.', 0);
  return { status: projects.length === 1 ? 'detected' : projects.length ? 'ambiguous' : 'unsupported', projects };
}
