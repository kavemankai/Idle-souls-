import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { loadSim } from '../src/combat/loadSimNode';
import { O1Controller } from '../src/world/o1Controller';
import { O1PresentationAdapter } from '../src/world/o1Adapter';
import { FACINGS, type ActorView } from '../src/contracts/presentation';
import { chooseFrame } from '../src/presentation/spriteSelection';
const atlas = (kind: string): Record<string, unknown> => JSON.parse(readFileSync(`assets/characters/runtime/${kind}.json`, 'utf8')).frames;

test('three death pose samples exist from all eight model yaws', () => {
  for (const kind of ['adventurer', 'sentry', 'mireling']) for (const facing of FACINGS) {
    const frames = atlas(kind);
    for (const [i, phase] of (['windup', 'active', 'recovery'] as const).entries()) {
      const actor: ActorView = { id:'dead', kind:kind as ActorView['kind'], x:0, y:0, facing, action:'death', phase, progress:0, visible:true };
      const selected = chooseFrame(actor, name => Boolean(frames[name]));
      assert.equal(selected.frame, `${kind}__death__${facing}__0${i}`);
      assert.equal(selected.missing, false);
    }
  }
});

test('dead player settles while the 30 Hz simulation is stopped', () => {
  const sim=loadSim(), c=new O1Controller(sim,{seed:3,opponent:'mireling',level:80,focus:'balanced',doctrine:'measured'});
  c.fight=sim.createFight({seed:3,stats:sim.allocate(80,'balanced',3),god:false,doctrine:'measured',encounter:'mireling'});
  c.state='defeated'; c.fight.p.dead=true; c.fight.p.hp=0;
  const v=new O1PresentationAdapter(c);
  assert.equal(v.read().actors[0].phase,'windup');
  assert.equal(v.read(200).actors[0].phase,'active');
  assert.equal(v.read(200).actors[0].phase,'recovery');
  assert.equal(c.tick,0);
});

test('winning O1 retains the enemy corpse at the simulator final position', () => {
  const sim=loadSim(), c=new O1Controller(sim,{seed:1,opponent:'sentry',level:80,focus:'balanced',doctrine:'measured'});
  c.fight=sim.createFight({seed:1,stats:sim.allocate(80,'balanced',1),god:false,doctrine:'measured',encounter:'sentry'});
  const e=c.fight.enemies[0];e.dead=true;e.hp=0;
  c.enemy.alive=false;c.state='travelling';
  const corpse=new O1PresentationAdapter(c).read().actors[1];
  assert.equal(corpse.visible,true);
  assert.equal(corpse.action,'death');
  assert.equal(corpse.x,e.x);assert.equal(corpse.y,e.y);
});
