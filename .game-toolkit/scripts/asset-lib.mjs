import fs from 'node:fs';
import path from 'node:path';
import { inside, isFile, json, toolkit } from './lib.mjs';

const policy = json(path.join(toolkit, 'config/asset-policy.json'));
const nonempty = value => typeof value === 'string' && Boolean(value.trim());
const positive = value => Number.isSafeInteger(value) && value > 0;
function url(value) {
  try { const parsed = new URL(value); return parsed.protocol === 'https:' && !parsed.username && !parsed.password; }
  catch { return false; }
}

export function validateAssets(root, manifest) {
  if (manifest?.schemaVersion !== 1 || !Array.isArray(manifest.assets)) {
    throw Error('Manifest needs schemaVersion 1 and an assets array');
  }
  const ids = new Set();
  const paths = new Set();
  return manifest.assets.map((asset, index) => {
    const issues = [];
    const id = asset?.id;
    if (!/^[a-z0-9]+(?:[-_][a-z0-9]+)*$/.test(id ?? '') || ids.has(id)) issues.push('Invalid or duplicate id');
    ids.add(id);
    for (const field of ['purpose', 'engine', 'exportTarget']) {
      if (!nonempty(asset?.[field])) issues.push('Missing ' + field);
    }
    if (!['pending', 'approved', 'rejected'].includes(asset?.visualQa)) issues.push('Invalid visualQa');
    if (!['image', 'model', 'audio', 'other'].includes(asset?.kind)) issues.push('Invalid kind');
    if (asset?.kind === 'image' && ![asset.width, asset.height].every(positive)) issues.push('Image dimensions required');
    if (asset?.kind === 'model') {
      if (!positive(asset.triangleBudget) || !positive(asset.textureResolution) ||
          !Array.isArray(asset.animations) || !asset.animations.every(nonempty)) issues.push('Model budgets and animations required');
    }
    const generated = asset?.generated;
    if (!Array.isArray(generated)) issues.push('generated must be an array');
    for (const file of [asset?.sourceFile, ...(Array.isArray(generated) ? generated : [])]) {
      try {
        if (!isFile(root, file)) { issues.push('Missing file: ' + file); continue; }
        if (!/^[a-z0-9][a-z0-9_.-]*$/.test(path.posix.basename(file))) issues.push('Invalid filename: ' + file);
        if (paths.has(file.toLowerCase())) issues.push('Duplicate file: ' + file);
        paths.add(file.toLowerCase());
        if (fs.statSync(inside(root, file)).size > policy.maxFileBytes) issues.push('File exceeds size budget: ' + file);
      } catch (error) { issues.push(error.message); }
    }
    return { id: id ?? index, issues };
  });
}

export function license(root, entry) {
  const blocked = [];
  const review = [];
  const known = [...policy.permissive, ...policy.attribution];
  if (!known.includes(entry?.license)) blocked.push('Unknown, restricted, or unsupported license');
  if (entry?.redistribution !== 'allowed') blocked.push('Redistribution permission must be recorded as allowed');
  if (!url(entry?.sourceUrl) && !(entry?.origin === 'first-party' && nonempty(entry.producer))) {
    blocked.push('Record HTTPS provenance or identify the first-party producer');
  }
  for (const field of entry?.license === 'Apache-2.0' && entry?.upstreamNotice === true
    ? ['licenseFile', 'noticeFile'] : ['licenseFile']) {
    try {
      if (!isFile(root, entry?.[field]) || !fs.statSync(inside(root, entry[field])).size) review.push('Missing ' + field);
    } catch { review.push('Missing or unsafe ' + field); }
  }
  if (policy.attribution.includes(entry?.license) && !nonempty(entry.attribution)) review.push('Attribution required');
  return { status: blocked.length ? 'BLOCKED' : review.length ? 'REVIEW_REQUIRED' : 'APPROVED', issues: [...blocked, ...review] };
}

export function dependencies(root, project, reviewed = {}) {
  const prefix = project === '.' ? '' : project + '/';
  const pkgPath = prefix + 'package.json';
  const lockPath = prefix + 'package-lock.json';
  if (!isFile(root, pkgPath)) return [];
  const pkg = json(inside(root, pkgPath));
  if (!isFile(root, lockPath)) {
    const runtime = { ...pkg.dependencies, ...pkg.optionalDependencies, ...pkg.peerDependencies };
    return Object.keys({ ...runtime, ...pkg.devDependencies }).map(id => ({
      id, dev: !Object.hasOwn(runtime, id), status: 'REVIEW_REQUIRED', issues: ['No npm lockfile evidence']
    }));
  }
  const lock = json(inside(root, lockPath));
  if (!lock.packages) return [{ id: lockPath, status: 'REVIEW_REQUIRED', issues: ['Expected npm lockfile v2 or later'] }];
  return Object.entries(lock.packages).filter(([id]) => id.includes('node_modules/')).map(([id, dep]) => {
    const entry = reviewed[id];
    const recorded = { id, version: dep.version ?? null, license: dep.license ?? null, dev: Boolean(dep.dev) };
    if (entry && dep.version && dep.integrity && entry.version === dep.version && entry.integrity === dep.integrity &&
        (!dep.license || entry.license === dep.license)) return { ...recorded, ...license(root, entry) };
    const blocked = dep.license && ![...policy.permissive, ...policy.attribution].includes(dep.license);
    return { ...recorded, status: blocked ? 'BLOCKED' : 'REVIEW_REQUIRED',
      issues: blocked ? ['License requires an explicit policy decision'] :
        ['Review license and source for this lockfile version and integrity'] };
  });
}
