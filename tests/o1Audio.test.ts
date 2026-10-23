import {test} from 'node:test';
import assert from 'node:assert/strict';
import {TRACKS,CUE_IDS,classifyCombatEvent} from '../src/audio/O1Audio';
test('all five music slots and semantic sound keys are unique',()=>{
 assert.equal(new Set(CUE_IDS).size,CUE_IDS.length);
 assert.equal(new Set(TRACKS.map(t=>t.id)).size,5);
 for(const id of CUE_IDS)assert.match(id,/^[a-z0-9_]+$/);
});
test('only confirmed simulator event text triggers defence and contact cues',()=>{
 const c=(text:string)=>classifyCombatEvent({text,kind:'neutral'});
 assert.equal(c('Guard raised.'),null);
 assert.equal(c('Perfect block on Mireling bite.'),'perfect_block');
 assert.equal(c('Blocked Sentry slash for 9 stamina.'),'shield_block');
 assert.equal(c('Parried Ashen Sentry sword.'),'parry');
 assert.equal(c('The adventurer falls at 0:10.'),'hero_death');
 assert.equal(c('Mireling is down.'),'mireling_death');
 assert.equal(c('Dodged Mireling bite.'),'dodge');
 assert.equal(c('Hit by Sentry slash for 10.'),'sword_hit');
});
