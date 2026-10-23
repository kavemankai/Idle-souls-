import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FACINGS } from '../src/contracts/presentation';
import { facingFromVector, facingAngle, exactAttackFacing } from '../src/presentation/directions';
test('eight screen-space headings round trip without handedness transforms', () => {
  for (const f of FACINGS) {
    const a = facingAngle(f);
    assert.equal(facingFromVector(Math.cos(a), Math.sin(a)), f);
  }
});
test('missing selective attack view is explicitly unavailable', () => {
  assert.equal(exactAttackFacing({ N: 'north' }, 'SW'), undefined);
});
