import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { FACINGS, type ActorView } from '../src/contracts/presentation';
import { chooseFrame } from '../src/presentation/spriteSelection';
import { VisualSequence } from '../src/presentation/visualSequence';
const atlas = (kind: string) => JSON.parse(readFileSync(`assets/characters/runtime/${kind}.json`, 'utf8'));
test('every locomotion and applicable guard pose exists at all eight headings', () => {
  for (const kind of ['adventurer', 'sentry', 'mireling', 'mannequin']) {
    const frames=atlas(kind).frames;
    for (const facing of FACINGS) {
      for (let frame=0;frame<4;frame++) assert.ok(frames[`${kind}__walk__${facing}__0${frame}`]);
      if(kind!=='mireling') for(let frame=0;frame<3;frame++) assert.ok(frames[`${kind}__guard__${facing}__0${frame}`]);
    }
  }
});
test('all trimmed frames reconstruct a common feet anchor independently of equipment bounds', () => {
  for(const kind of ['adventurer','sentry','mireling','mannequin']) {
    const metadata=JSON.parse(readFileSync(`assets/characters/runtime/${kind}.metadata.json`,'utf8'));
    const frames=atlas(kind).frames;
    for(const f of metadata) {
      const packed=frames[f.name];
      assert.equal(packed.spriteSourceSize.x+f.trimmedPivot[0],96);
      assert.equal(packed.spriteSourceSize.y+f.trimmedPivot[1],96);
      assert.equal(packed.rotated,false);
      assert.equal(f.renderPreset.elevation,75);
      assert.equal(f.sourceHash.length,64);
      assert.ok(f.trimRect[0]>=2 && f.trimRect[1]>=2);
    }
  }
});
test('O1 wave 1 has genuine eight-heading clips and never borrows a quadrant', () => {
  const cases: Array<{ kind: ActorView['kind']; action: ActorView['action']; phases: string[] }> = [
    { kind: 'adventurer', action: 'light', phases: ['windup', 'active', 'recovery'] },
    { kind: 'adventurer', action: 'dodge', phases: ['windup'] },
    { kind: 'adventurer', action: 'reaction', phases: ['windup'] },
    { kind: 'sentry', action: 'light', phases: ['windup', 'active', 'recovery'] },
    { kind: 'sentry', action: 'bash', phases: ['windup', 'active', 'recovery'] },
  ];
  for (const { kind, action, phases } of cases) {
    const frames = atlas(kind).frames;
    for (const facing of FACINGS) {
      for (const [index, phase] of phases.entries()) {
        const actor: ActorView = { id: 'proof', kind, x: 0, y: 0, visible: true, action, phase: phase as ActorView['phase'], progress: .5, facing };
        const selected = chooseFrame(actor, (name) => Boolean(frames[name]));
        const name = `${kind}__${action}__${facing}__${String(index).padStart(2, '0')}`;
        assert.equal(selected.frame, name, name);
        assert.equal(selected.missing, false, name);
      }
    }
  }
});
test('O1 wave 2 stagger and Mireling bite have genuine eight-heading frames', () => {
  const cases: Array<{ kind: ActorView['kind']; action: ActorView['action']; phases: ActorView['phase'][] }> = [
    { kind: 'sentry', action: 'reaction', phases: ['active'] },
    { kind: 'mireling', action: 'reaction', phases: ['active'] },
    { kind: 'mireling', action: 'light', phases: ['windup', 'active', 'recovery'] },
  ];
  for (const { kind, action, phases } of cases) {
    const frames = atlas(kind).frames;
    for (const facing of FACINGS) {
      for (const [i, phase] of phases.entries()) {
        const actor: ActorView = { id: 'proof', kind, x: 0, y: 0, visible: true, facing, action, phase, progress: .5 };
        const selection = chooseFrame(actor, name => Boolean(frames[name]));
        assert.equal(selection.frame, `${kind}__${action}__${facing}__${String(i).padStart(2, '0')}`);
        assert.equal(selection.missing, false);
      }
    }
  }
});
test('visual fixture cannot mutate simulation and never produces combat outcomes', () => {
  const fixture=new VisualSequence();const before=fixture.read();fixture.update(100,1,0);const after=fixture.read(true);
  assert.equal(after.source,'visual-only');assert.equal(after.actors[0].action,'walk');
  assert.equal(before.actors[0].x,-105);assert.ok(after.actors[0].x>before.actors[0].x);
  assert.equal('damage' in after,false);assert.equal('hp' in after.actors[0],false);
  fixture.paused=true;const time=fixture.time;fixture.update(500);assert.equal(fixture.time,time);
});

test('attack pose follows supplied phase even when move phase durations are unequal', () => {
  const frames=atlas('adventurer').frames;
  for (const [phase,progress,index] of [['windup',.8,'00'],['active',.05,'01'],['recovery',.1,'02']] as const) {
    const actor:ActorView={id:'hero',kind:'adventurer',x:0,y:0,visible:true,action:'heavy',facing:'NE',phase,progress};
    assert.equal(chooseFrame(actor,n=>Boolean(frames[n])).frame,`adventurer__heavy__NE__${index}`);
  }
});
