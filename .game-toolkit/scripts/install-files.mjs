import fs from 'node:fs';
import path from 'node:path';
import { hash, inside, repoRoot } from './lib.mjs';

export function installFiles(repo, files, apply = false) {
  const root = repoRoot(repo);
  const plan = [...files].sort(([left], [right]) => left.localeCompare(right)).map(([relative, bytes]) => {
    const dest = inside(root, relative);
    const stat = fs.lstatSync(dest, { throwIfNoEntry: false });
    const existing = stat?.isFile() ? fs.readFileSync(dest) : null;
    const desired = hash(bytes);
    return { path: relative, action: !stat ? 'add' : existing && hash(existing) === desired ? 'same' : 'conflict',
      sha256: desired, existingSha256: existing ? hash(existing) : null };
  });
  const blocked = plan.some(entry => entry.action === 'conflict');
  if (!apply || blocked) return { applied: false, blocked, files: plan };

  const created = [];
  const directories = [];
  function ensureDirectory(dir) {
    if (dir === root) return;
    ensureDirectory(path.dirname(dir));
    try {
      fs.mkdirSync(dir);
      directories.push(dir);
    } catch (error) {
      if (error.code !== 'EEXIST' || !fs.lstatSync(dir).isDirectory()) throw error;
    }
  }
  try {
    for (const entry of plan.filter(item => item.action === 'add')) {
      const dest = inside(root, entry.path);
      ensureDirectory(path.dirname(dest));
      const fd = fs.openSync(dest, 'wx');
      created.push(dest);
      try { fs.writeFileSync(fd, files.get(entry.path)); } finally { fs.closeSync(fd); }
    }
  } catch (error) {
    const cleanup = [];
    for (const dest of created.reverse()) {
      try { fs.unlinkSync(dest); } catch (failure) { cleanup.push(failure.message); }
    }
    for (const dir of directories.reverse()) {
      try { fs.rmdirSync(dir); } catch (failure) {
        if (failure.code !== 'ENOTEMPTY') cleanup.push(failure.message);
      }
    }
    throw Error('Installation failed: ' + error.message + (cleanup.length ? '; rollback: ' + cleanup.join(', ') : ''));
  }
  return { applied: true, blocked, files: plan };
}
