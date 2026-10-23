// Portable math: the single source for every transcendental function that feeds simulator state.
// Native Math.sin/cos/atan2/exp/hypot/pow are implementation-defined, and engines differ in the last bit
// (Chrome 156 vs Node 22 vs Chromium 141). The sim is chaotic, so one last-bit difference changes the whole fight.
// This block uses only + - * / and sqrt, floor and abs, which IEEE 754 fixes exactly, so every engine agrees bit for bit.
// Algorithms and coefficients follow fdlibm (Sun, public domain), error under 1 ulp.
//
// Do not edit the copies. Edit this file, then run: node tools/sync-portable-math.js
// The block between the markers is pasted into combat/deep-stats/combat-sim.js, combat/main/combat-sim.js
// and src/combat/portableMath.ts. `node tools/sync-portable-math.js --check` fails when a copy differs.

// >>> portable-math
const M = (function () {
  'use strict';
  const PI = 3.141592653589793, HALF_PI = 1.5707963267948966, PI_LO = 1.2246467991473532e-16;
  const sqrt = Math.sqrt, floor = Math.floor;

  // sin/cos: reduce by multiples of pi/2 in three exact pieces, then the fdlibm kernels on [-pi/4, pi/4].
  const INV_PIO2 = 6.36619772367581382433e-01;
  const PIO2_1 = 1.57079632673412561417e+00, PIO2_1T = 6.07710050650619224932e-11;
  const PIO2_2 = 6.07710050630396597660e-11, PIO2_2T = 2.02226624879595063154e-21;
  const S1 = -1.66666666666666324348e-01, S2 = 8.33333333332248946124e-03, S3 = -1.98412698298579493134e-04;
  const S4 = 2.75573137070700676789e-06, S5 = -2.50507602534068634195e-08, S6 = 1.58969099521155010221e-10;
  const C1 = 4.16666666666666019037e-02, C2 = -1.38888888888741095749e-03, C3 = 2.48015872894767294178e-05;
  const C4 = -2.75573143513906633035e-07, C5 = 2.08757232129817482790e-09, C6 = -1.13596475577881948265e-11;

  function kSin(x, y) {
    const z = x * x, v = z * x, r = S2 + z * (S3 + z * (S4 + z * (S5 + z * S6)));
    return x - ((z * (0.5 * y - v * r) - y) - v * S1);
  }
  function kCos(x, y) {
    const z = x * x, r = z * (C1 + z * (C2 + z * (C3 + z * (C4 + z * (C5 + z * C6)))));
    const hz = 0.5 * z, w = 1 - hz;
    return w + (((1 - w) - hz) + (z * r - x * y));
  }
  // Returns the quadrant n (0..3) and writes the reduced angle to R[0] + R[1] with |R| <= pi/4.
  const R = [0, 0];
  function reduce(x) {
    if (x >= -0.7853981633974483 && x <= 0.7853981633974483) { R[0] = x; R[1] = 0; return 0; }
    if (x > 1e5 || x < -1e5) { const k = floor(x / (2 * PI) + 0.5); x = ((x - k * 4 * PIO2_1) - k * 4 * PIO2_2) - k * 4 * PIO2_2T; } // exact for |k| < 2^20, about |x| < 6e6
    const n = floor(x * INV_PIO2 + 0.5);
    const r = x - n * PIO2_1;
    let w = n * PIO2_1T;
    let y0 = r - w;
    if (n > 32 || n < -32) { // second stage when n is large enough that PIO2_1T alone loses bits
      const t = r;
      w = n * PIO2_2;
      const rr = t - w;
      w = n * PIO2_2T - ((t - rr) - w);
      y0 = rr - w;
      R[0] = y0; R[1] = (rr - y0) - w;
    } else { R[0] = y0; R[1] = (r - y0) - w; }
    return ((n % 4) + 4) % 4;
  }
  function sin(x) {
    if (x !== x || x === Infinity || x === -Infinity) return NaN;
    const n = reduce(x), a = R[0], b = R[1];
    return n === 0 ? kSin(a, b) : n === 1 ? kCos(a, b) : n === 2 ? -kSin(a, b) : -kCos(a, b);
  }
  function cos(x) {
    if (x !== x || x === Infinity || x === -Infinity) return NaN;
    const n = reduce(x), a = R[0], b = R[1];
    return n === 0 ? kCos(a, b) : n === 1 ? -kSin(a, b) : n === 2 ? -kCos(a, b) : kSin(a, b);
  }

  // atan: fdlibm argument reduction to |x| <= 7/16 and an odd polynomial.
  const ATAN_HI = [4.63647609000806093515e-01, 7.85398163397448278999e-01, 9.82793723247329054082e-01, 1.57079632679489655800e+00];
  const ATAN_LO = [2.26987774529616870924e-17, 3.06161699786838301793e-17, 1.39033110312309984516e-17, 6.12323399573676603587e-17];
  const AT = [3.33333333333329318027e-01, -1.99999999998764832476e-01, 1.42857142725034663711e-01, -1.11111104054623557880e-01,
    9.09088713343650656196e-02, -7.69187620504482999495e-02, 6.66107313738753120669e-02, -5.83357013379057348645e-02,
    4.97687799461593236017e-02, -3.65315727442169155270e-02, 1.62858201153657823623e-02];
  function atanPos(x) { // x >= 0, finite or +Infinity
    if (x > 7.378697629483821e19) return ATAN_HI[3] + ATAN_LO[3];
    let id;
    if (x < 0.4375) id = -1;
    else if (x < 1.1875) { if (x < 0.6875) { id = 0; x = (2 * x - 1) / (2 + x); } else { id = 1; x = (x - 1) / (x + 1); } }
    else if (x < 2.4375) { id = 2; x = (x - 1.5) / (1 + 1.5 * x); }
    else { id = 3; x = -1 / x; }
    const z = x * x, w = z * z;
    const s1 = z * (AT[0] + w * (AT[2] + w * (AT[4] + w * (AT[6] + w * (AT[8] + w * AT[10])))));
    const s2 = w * (AT[1] + w * (AT[3] + w * (AT[5] + w * (AT[7] + w * AT[9]))));
    if (id < 0) return x - x * (s1 + s2);
    return ATAN_HI[id] - ((x * (s1 + s2) - ATAN_LO[id]) - x);
  }
  function atan2(y, x) {
    if (x !== x || y !== y) return NaN;
    if (x === Infinity || x === -Infinity || y === Infinity || y === -Infinity) return Math.atan2(y, x); // exact constants, no rounding involved
    const neg = y < 0 || (y === 0 && 1 / y < 0);
    if (y === 0) { // +-0 and +-pi
      return (x > 0 || (x === 0 && 1 / x > 0)) ? y : neg ? -PI : PI;
    }
    if (x === 0) return neg ? -HALF_PI : HALF_PI;
    const z = atanPos(Math.abs(y / x));
    const r = x > 0 ? z : PI - (z - PI_LO);
    return neg ? -r : r;
  }

  // exp: x = k ln2 + r, polynomial for exp(r), exact scaling by 2^k.
  const LN2_HI = 6.93147180369123816490e-01, LN2_LO = 1.90821492927058770002e-10, INV_LN2 = 1.44269504088896338700e+00;
  const P1 = 1.66666666666666019037e-01, P2 = -2.77777777770155933842e-03, P3 = 6.61375632143793436117e-05;
  const P4 = -1.65339022054652515390e-06, P5 = 4.13813679705723846039e-08;
  function pow2(k) { // 2^k for integer |k| <= 1000, by squaring: every product is an exact power of two
    let r = 1, b = k < 0 ? 0.5 : 2, e = k < 0 ? -k : k;
    while (e > 0) { if (e & 1) r *= b; b *= b; e = e >>> 1; }
    return r;
  }
  function exp(x) {
    if (x !== x) return NaN;
    if (x > 709.782712893384) return Infinity;
    if (x < -745.1332191019411) return 0;
    if (x < 1.862645149230957e-9 && x > -1.862645149230957e-9) return 1 + x;
    const k = floor(x * INV_LN2 + 0.5);
    const hi = x - k * LN2_HI, lo = k * LN2_LO, r = hi - lo;
    const t = r * r, c = r - t * (P1 + t * (P2 + t * (P3 + t * (P4 + t * P5))));
    let y = 1 - ((lo - (r * c) / (2 - c)) - hi);
    let e = k;
    while (e > 1000) { y *= pow2(1000); e -= 1000; }
    while (e < -1000) { y *= pow2(-1000); e += 1000; }
    return y * pow2(e);
  }

  // hypot: no overflow guard, the sim works with coordinates under 1e4.
  function hypot(x, y) { return sqrt(x * x + y * y); }

  // pow: non-negative integer exponent only (the sim raises a probability to a count).
  function pow(base, n) {
    let r = 1;
    for (let i = 0; i < n; i++) r *= base;
    return r;
  }

  return { sin, cos, atan2, exp, hypot, pow };
})();
// <<< portable-math

if (typeof module !== 'undefined') module.exports = M;
