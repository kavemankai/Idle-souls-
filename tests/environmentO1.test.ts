import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const expected: Record<string, [number, number]> = {
  'wall-return-west': [128, 256], 'wall-return-east': [128, 256],
  'doorway-jamb-west': [128, 128], 'doorway-jamb-east': [128, 128],
  'endpoint-threshold': [64, 256],
};
test('O1 painted wall/door/threshold sources and runtime raster assets exist', () => {
  for (const [key, [w, h]] of Object.entries(expected)) {
    const svg = readFileSync(`assets/environments/source/${key}.svg`, 'utf8');
    assert.match(svg, /<svg /);
    assert.match(svg, /id="/, key);
    const png = readFileSync(`assets/environments/runtime/${key}.png`);
    assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', key);
    assert.equal(png.readUInt32BE(16), w, key);
    assert.equal(png.readUInt32BE(20), h, key);
  }
});
