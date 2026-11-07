import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { inside, isFile, print, repoOption, repoRoot, run } from './lib.mjs';
run(async ({ repo, file }) => {
  if (!file?.length) throw Error('Pass one or more --file paths relative to --repo');
  const root = repoRoot(repo);
  const files = [];
  for (const relative of file) {
    if (!isFile(root, relative)) throw Error('Evidence file missing: ' + relative);
    const full = inside(root, relative);
    const digest = createHash('sha256');
    for await (const chunk of fs.createReadStream(full)) digest.update(chunk);
    files.push({ path: relative, bytes: fs.statSync(full).size, sha256: digest.digest('hex') });
  }
  print(files);
}, { ...repoOption, file: { type: 'string', multiple: true } });
