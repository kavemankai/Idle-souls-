import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { inside, isFile, print, repoOption, repoRoot, run } from '../../scripts/lib.mjs';

function apkEntries(file, bytes) {
  const fd = fs.openSync(file, 'r');
  function read(length, offset) {
    const buffer = Buffer.alloc(length);
    if (fs.readSync(fd, buffer, 0, length, offset) !== length) throw Error('Truncated APK');
    return buffer;
  }
  try {
    if (bytes < 22 || read(4, 0).readUInt32LE() !== 0x04034b50) throw Error('Expected a ZIP-based APK');
    const tail = read(Math.min(bytes, 65557), Math.max(0, bytes - 65557));
    let end = tail.length - 22;
    while (end >= 0 && (tail.readUInt32LE(end) !== 0x06054b50 ||
        end + 22 + tail.readUInt16LE(end + 20) !== tail.length)) end--;
    if (end < 0) throw Error('APK central directory trailer missing');
    const count = tail.readUInt16LE(end + 10);
    const length = tail.readUInt32LE(end + 12);
    const offset = tail.readUInt32LE(end + 16);
    if (tail.readUInt32LE(end + 4) !== 0 || count !== tail.readUInt16LE(end + 8) || count === 65535 ||
        length > 32 * 1024 * 1024 || offset + length !== bytes - tail.length + end) {
      throw Error('Unsupported or invalid APK directory');
    }
    const directory = read(length, offset);
    const names = new Set();
    let index = 0;
    for (let entry = 0; entry < count; entry++) {
      if (index + 46 > length || directory.readUInt32LE(index) !== 0x02014b50) throw Error('Invalid APK entry');
      const nameEnd = index + 46 + directory.readUInt16LE(index + 28);
      const next = nameEnd + directory.readUInt16LE(index + 30) + directory.readUInt16LE(index + 32);
      if (next > length) throw Error('Truncated APK entry');
      const name = directory.toString('utf8', index + 46, nameEnd);
      if (names.has(name)) throw Error('Duplicate APK entry: ' + name);
      names.add(name);
      index = next;
    }
    if (index !== length) throw Error('Unexpected bytes in APK directory');
    return names;
  } finally { fs.closeSync(fd); }
}

run(async ({ repo, apk, entry = [] }) => {
  const root = repoRoot(repo);
  if (!apk?.toLowerCase().endsWith('.apk') || !isFile(root, apk)) throw Error('Expected a built .apk at --apk');
  const file = inside(root, apk);
  const bytes = fs.statSync(file).size;
  const names = apkEntries(file, bytes);
  const requiredEntries = ['AndroidManifest.xml', ...entry];
  for (const name of requiredEntries) if (!names.has(name)) throw Error('APK missing entry: ' + name);
  const digest = createHash('sha256');
  for await (const chunk of fs.createReadStream(file)) digest.update(chunk);
  print({ path: apk, bytes, sha256: digest.digest('hex'), entryCount: names.size, requiredEntries,
    signing: 'UNTESTED', install: 'UNTESTED' });
}, { ...repoOption, apk: { type: 'string' }, entry: { type: 'string', multiple: true } });
