import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CUE_IDS,TRACKS} from '../src/audio/O1Audio';

test('14 source packs yield all music, ambience, and selected O1 cues',()=>{
 const m=JSON.parse(readFileSync('docs/audio/IMPORT_MANIFEST.json','utf8'));
 assert.equal(m.sources.length,14);
 assert.equal(Object.keys(m.music).length,5);
 assert.equal(Object.keys(m.ambience).length,1);
 assert.ok(m.library.length>=350,'full eight source packs must be imported');
 for(const name of TRACKS.map(t=>t.id)){
  const item=m.music[name];assert.ok(item,name);
  assert.ok(readFileSync('public/'+item.file).length>100);
 }
 for(const id of CUE_IDS){
  const item=m.cues[id];assert.ok(item,id);
  const bytes=readFileSync('public/'+item.file);
  assert.ok(bytes.length>100,id);
  assert.equal(bytes.subarray(0,4).toString(),'OggS');
  assert.equal(item.sha256.length,64);
 }
 for(const source of m.sources){assert.equal(source.license,'CC0-1.0');assert.equal(source.downloadSha256.length,64);}
});
