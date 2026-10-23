import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { portableMath as M } from '../src/combat/portableMath';

function lcg(seed: number) { let s = seed; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }

test('portable sin, cos and atan2 match the native functions to within 2 ulp', () => {
  const r = lcg(7);
  for (let i = 0; i < 20000; i++) {
    const a = (r() - 0.5) * 40, x = (r() - 0.5) * 1000, y = (r() - 0.5) * 1000;
    assert.ok(Math.abs(M.sin(a) - Math.sin(a)) <= 2.3e-16, `sin ${a}`);
    assert.ok(Math.abs(M.cos(a) - Math.cos(a)) <= 2.3e-16, `cos ${a}`);
    assert.ok(Math.abs(M.atan2(y, x) - Math.atan2(y, x)) <= 4.5e-16, `atan2 ${y} ${x}`);
  }
});

test('portable exp, hypot and pow agree with the native functions', () => {
  const r = lcg(11);
  for (let i = 0; i < 20000; i++) {
    const e = (r() - 0.9) * 30, x = (r() - 0.5) * 1000, y = (r() - 0.5) * 1000;
    assert.ok(Math.abs(M.exp(e) / Math.exp(e) - 1) < 5e-16, `exp ${e}`);
    assert.ok(Math.abs(M.hypot(x, y) / Math.hypot(x, y) - 1) < 5e-16, `hypot ${x} ${y}`);
  }
  assert.equal(M.pow(0.5, 3), 0.125);
  assert.equal(M.pow(0.3, 0), 1);
  assert.equal(M.exp(0), 1);
  assert.equal(M.exp(-800), 0);
  assert.equal(M.exp(710), Infinity);
});

test('portable trig keeps its symmetries and special values', () => {
  const r = lcg(3);
  for (let i = 0; i < 2000; i++) {
    const a = (r() - 0.5) * 20;
    assert.equal(M.sin(-a), -M.sin(a));
    assert.equal(M.cos(-a), M.cos(a));
  }
  assert.ok(Object.is(M.sin(-0), -0));
  assert.equal(M.atan2(0, -1), Math.PI);
  assert.equal(M.atan2(-0, -1), -Math.PI);
  assert.ok(Object.is(M.atan2(-0, 1), -0));
  assert.equal(M.atan2(1, 0), Math.PI / 2);
  assert.equal(M.atan2(-1, 0), -Math.PI / 2);
  assert.equal(M.atan2(0, 0), 0);
  assert.ok(Number.isNaN(M.sin(NaN)));
  assert.ok(Number.isNaN(M.cos(Infinity)));
});

test('the portable block is identical in every copy', () => {
  execFileSync('node', ['combat/tools/sync-portable-math.js', '--check'], { stdio: 'pipe' });
});

// Native Math.sin/cos/atan2/hypot/exp/pow/log differ in the last bit between engines, and the sim is chaotic.
test('simulator and sim-feeding world code use no engine-dependent Math', () => {
  const banned = /\bMath\.(sin|cos|tan|asin|acos|atan2?|sinh|cosh|tanh|hypot|exp|expm1|log|log1p|log2|log10|pow|cbrt)\b|\*\*/;
  const strip = (s: string) => s.replace(/\/\/ >>> portable-math[\s\S]*?\/\/ <<< portable-math/, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  const files = ['combat/deep-stats/combat-sim.js', 'combat/main/combat-sim.js', 'src/world/o1Route.ts', 'src/world/o1Sight.ts', 'src/world/roomRunner.ts', 'src/world/o1Room.ts', 'src/world/o1Combat.ts', 'src/world/worldGraph.ts', 'src/world/roomRegistry.ts', 'src/world/roomTypes.ts', 'src/world/o1Controller.ts'];
  for (const f of files) {
    const hit = strip(readFileSync(f, 'utf8')).split('\n').find(l => banned.test(l));
    assert.equal(hit, undefined, `${f}: ${hit}`);
  }
  assert.ok(readdirSync('src/world').includes('roomRunner.ts'));
});
