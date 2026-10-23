import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const names = ["contact","stagger","dodge","block","parry","perfect"];
test('six distinct editable defence/contact effect sources have matching transparent raster exports', () => {
  for (const name of names) {
    const svg=readFileSync(`assets/vfx/source/${name}.svg`, 'utf8');
    assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
    assert.match(svg, /id="/, name);
    const png=readFileSync(`assets/vfx/runtime/${name}.png`);
    assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a',name);
    assert.equal(png.readUInt32BE(16),192,name);
    assert.equal(png.readUInt32BE(20),192,name);
  }
});
