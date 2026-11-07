import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

export const toolkit = fileURLToPath(new URL('../', import.meta.url));
export const hash = bytes => createHash('sha256').update(bytes).digest('hex');
export const json = file => JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
export const print = value => console.log(JSON.stringify(value, null, 2));
export const isMain = url => Boolean(process.argv[1]) && path.resolve(process.argv[1]) === fileURLToPath(url);
export function run(main, options) {
  Promise.resolve().then(() => main(parseArgs({ options }).values)).catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
export const repoOption = { repo: { type: 'string', default: '.' } };
export function repoRoot(repo) {
  const root = fs.realpathSync(repo);
  if (!fs.statSync(root).isDirectory()) throw Error('Repository path must be a directory');
  return root;
}

// Managed paths use one portable spelling and reject links at every component.
export function inside(root, relative) {
  const parts = typeof relative === 'string' ? relative.split('/') : [];
  if (!parts.length || parts.some(part => !part || part === '.' || part === '..' ||
      /[\\:<>"|?*\x00-\x1f]|[. ]$|^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(part))) {
    throw Error('Unsafe relative path: ' + relative);
  }
  let current = root;
  for (const part of parts) {
    current = path.join(current, part);
    const stat = fs.lstatSync(current, { throwIfNoEntry: false });
    if (stat?.isSymbolicLink()) throw Error('Link in managed path: ' + relative);
  }
  return current;
}

export function isFile(root, relative) {
  return fs.lstatSync(inside(root, relative), { throwIfNoEntry: false })?.isFile() ?? false;
}
