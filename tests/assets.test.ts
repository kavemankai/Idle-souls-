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
test('selective attacks test every actual heading without rotating or borrowing a quadrant', () => {
  const frames=atlas('adventurer').frames;
  for(const facing of FACINGS) {
    const actor: ActorView={id:'hero',kind:'adventurer',x:0,y:0,visible:true,action:'light',phase:'active',progress:.5,facing};
    const selected=chooseFrame(actor,n=>Boolean(frames[n]));
    if(['N','NE','E','S','SW'].includes(facing)) {
      assert.equal(selected.frame,`adventurer__light__${facing}__01`);assert.equal(selected.missing,false);
    } else {
      assert.equal(selected.frame,`adventurer__idle__${facing}__00`);assert.equal(selected.missing,true);
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
