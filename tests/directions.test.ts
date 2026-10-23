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

import { chooseFrame } from '../src/presentation/spriteSelection';
test('a view the atlas does not have falls back to idle at the same facing and is flagged missing', () => {
  const actor = { id: 'x', kind: 'mireling', x: 0, y: 0, facing: 'W', action: 'guard', phase: 'active', progress: 0, visible: true } as const;
  const r = chooseFrame(actor, name => name === 'mireling__idle__W__00');
  assert.equal(r.missing, true);
  assert.equal(r.frame, 'mireling__idle__W__00');
  assert.equal(chooseFrame({ ...actor, action: 'idle' }, name => name === 'mireling__idle__W__00').missing, false);
});
