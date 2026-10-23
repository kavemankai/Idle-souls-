import { test } from 'node:test';
import assert from 'node:assert/strict';
import { COLORS, PAIRS, contrast } from '../src/ui/palette';

test('every text and boundary colour pair the screens use meets WCAG AA (4.5:1 text, 3:1 boundaries)', () => {
  const failures = PAIRS.map(p => ({ p, r: contrast(COLORS[p.fg], COLORS[p.bg]) })).filter(x => x.r < x.p.min);
  assert.deepEqual(failures.map(x => `${x.p.use}: ${x.r.toFixed(2)} < ${x.p.min}`), []);
  assert.ok(PAIRS.length >= 35, 'the pair list is not trivially short');
});

test('the contrast function matches known values', () => {
  assert.equal(Math.round(contrast('#000000', '#ffffff')), 21);
  assert.equal(contrast('#777777', '#777777'), 1);
  assert.ok(Math.abs(contrast('#767676', '#ffffff') - 4.54) < 0.02);
});
