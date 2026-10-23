import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { goldenRuns } from '../tools/o1-golden';

test('O1 results and digests are identical to the recorded golden runs', () => {
  const gold = JSON.parse(readFileSync('tests/golden/o1-runs.json', 'utf8')) as Record<string, unknown>, now = goldenRuns();
  assert.deepEqual(Object.keys(now), Object.keys(gold));
  for (const k of Object.keys(gold)) assert.deepEqual(now[k], gold[k], k);
});
