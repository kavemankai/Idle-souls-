import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { BUDGET } from '../tools/perf-budget';
import { bundleGzip, timeOldRoad } from '../tools/perf-report';

// Budgets are ceilings for a slow CI machine (see tools/perf-budget.ts and docs/slice/M9.md for the measured numbers).
test('a headless Old Road expedition and its fights stay inside the time budget', () => {
  const t = timeOldRoad(5);
  assert.ok(t.medianMs <= BUDGET.oldRoadExpeditionMs, `median ${t.medianMs.toFixed(0)} ms > ${BUDGET.oldRoadExpeditionMs} ms`);
  assert.ok(t.medianPerFightMs <= BUDGET.perFightMs, `per fight ${t.medianPerFightMs.toFixed(0)} ms > ${BUDGET.perFightMs} ms`);
});

test('the built JavaScript stays inside the gzip budget (needs a build; skipped when dist is absent)', { skip: fs.existsSync('dist/assets') ? false : 'run npm run build first' }, () => {
  const b = bundleGzip()!;
  assert.ok(b.gzip <= BUDGET.bundleGzipBytes, `${b.gzip} bytes gzipped > ${BUDGET.bundleGzipBytes}`);
});
