// DEEP-STATS SPLIT (forked 2026-10-23 from the main combat sim). Main branch stays untouched.
// Combat sim core. Deterministic: same config + seed = same fight.
// One adventurer AI vs one or more enemies.
const SIM = (function () {
  'use strict';
  const HZ = 30, ARENA_R = 230, MAX_TICKS = HZ * 150;
  const GUARD_BREAK_STAGGER = 30; // ticks the adventurer is helpless after a broken guard

  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  function angDiff(a, b) {
    let d = a - b;
    while (d > Math.PI) d -= 2 * Math.PI;
    while (d < -Math.PI) d += 2 * Math.PI;
    return d;
  }
  function turnToward(f, target, rate) { f.face += clamp(angDiff(target, f.face), -rate, rate); }

  // Timings in ticks (30 per second). arc = half-angle in radians.
  // track: ticks before the hit when the attacker stops turning to follow you.
  // lookalike/deceive: what the attack can be mistaken for, and how easily.
  const MOVES = {
    light: { id: 'light', name: 'light attack', kind: 'attack', windup: 7, active: 3, recovery: 9, dmg: 11, poise: 14, stam: 14, range: 56, arc: 0.8, lunge: 10, track: 2 },
    heavy: { id: 'heavy', name: 'heavy attack', kind: 'attack', windup: 15, active: 4, recovery: 16, dmg: 24, poise: 34, stam: 26, range: 62, arc: 0.9, lunge: 16, track: 4 },
    dodge: { id: 'dodge', name: 'dodge', kind: 'dodge', dur: 13, iStart: 2, iEnd: 9, stam: 22, dist: 92 },
    // Parry: 2-tick startup, then a window whose length comes from Guard (S.d.parry), then a long whiff recovery.
    // A hit landing in the window is deflected and the attacker is left open for 45 ticks.
    parry: { id: 'parry', name: 'parry', kind: 'parry', windup: 2, recovery: 16, stam: 10 },
    // Rolling slash: only available for 10 ticks after a dodge that made an attack miss.
    dodgeAtk: { id: 'dodgeAtk', name: 'rolling slash', kind: 'attack', windup: 3, active: 3, recovery: 11, dmg: 15, poise: 22, stam: 14, range: 54, arc: 0.9, lunge: 20, track: 2 },

    slash: { id: 'slash', name: 'slash', tell: 'slash', kind: 'attack', windup: 9, active: 3, recovery: 12, dmg: 14, poise: 12, range: 54, arc: 0.9, lunge: 12, track: 3, lookalike: 'lunge', deceive: 0.35 },
    lunge: { id: 'lunge', name: 'lunge', tell: 'lunge', kind: 'attack', windup: 14, active: 6, recovery: 22, dmg: 18, poise: 20, range: 46, arc: 0.4, lunge: 80, track: 5, lookalike: 'slash', deceive: 0.35 },

    swing: { id: 'swing', name: 'swing', tell: 'swing', kind: 'attack', windup: 18, active: 6, recovery: 26, dmg: 22, poise: 30, range: 74, arc: 1.2, lunge: 14, track: 7, lookalike: 'overhead', deceive: 0.3 },
    delayed: { id: 'delayed', name: 'delayed swing', tell: 'swing', kind: 'attack', windup: 31, active: 6, recovery: 26, dmg: 24, poise: 30, range: 74, arc: 1.2, lunge: 14, track: 7, lookalike: 'swing', deceive: 1.0 },
    // Ashen Sentry: sword, shield bash (stamina pressure), guard stance that counters light attacks.
    sslash: { id: 'sslash', name: 'sword slash', tell: 'sslash', kind: 'attack', windup: 13, active: 4, recovery: 18, dmg: 16, poise: 18, range: 58, arc: 0.9, lunge: 12, track: 4, lookalike: 'bash', deceive: 0.3 },
    bash: { id: 'bash', name: 'shield bash', tell: 'bash', kind: 'attack', windup: 10, active: 3, recovery: 14, dmg: 5, poise: 30, stamDmg: 22, blockCost: 30, range: 34, arc: 0.8, lunge: 16, track: 3, lookalike: 'sslash', deceive: 0.3 },
    riposte: { id: 'riposte', name: 'counter', tell: 'riposte', kind: 'attack', windup: 6, active: 3, recovery: 16, dmg: 16, poise: 18, range: 60, arc: 1.0, lunge: 10, track: 2 },
    sguard: { id: 'sguard', name: 'guard stance', tell: 'sguard', kind: 'guard', windup: 0, active: 42, recovery: 8 },
    // Mireling: quick bite, committed leap that stops tracking well before it lands.
    bite: { id: 'bite', name: 'bite', tell: 'bite', kind: 'attack', windup: 8, active: 3, recovery: 12, dmg: 11, poise: 8, range: 38, arc: 0.9, lunge: 10, track: 3 },
    leap: { id: 'leap', name: 'leaping lunge', tell: 'leap', kind: 'attack', windup: 16, active: 7, recovery: 24, dmg: 13, poise: 14, range: 30, arc: 0.7, lunge: 72, track: 7, noParry: true },
    chop: { id: 'chop', name: 'chop', tell: 'chop', kind: 'attack', windup: 15, active: 4, recovery: 18, dmg: 12, poise: 12, range: 48, arc: 0.9, lunge: 10, track: 6 },
    shot: { id: 'shot', name: 'arrow', tell: 'shot', kind: 'ranged', windup: 24, active: 1, recovery: 20, dmg: 9, speed: 6.5, range: 250, track: 4 },
    overhead: { id: 'overhead', name: 'overhead smash', tell: 'overhead', kind: 'attack', windup: 26, active: 4, recovery: 38, dmg: 38, poise: 60, range: 80, arc: 0.45, lunge: 22, track: 7, guardBreak: 2.4, hyper: true, noParry: true, lookalike: 'swing', deceive: 0.3 },
  };

  const ARCH = {
    adventurer: { name: 'Adventurer', r: 13, hp: 100, st: 100, poise: 40, speed: 2.5, turn: 0.25 },
    stalker: { name: 'Stalker', r: 11, flinch: 'heavy', hp: 95, st: 999, poise: 40, speed: 3.1, turn: 0.3, aggro: [8, 22], threatReach: 80, moves: ['slash', 'lunge'] },
    sentry: { name: 'Ashen Sentry', r: 13, hp: 85, st: 999, poise: 60, speed: 2.2, turn: 0.18, aggro: [10, 24], threatReach: 83, moves: ['sslash', 'bash'] },
    mireling: { name: 'Mireling', r: 9, flinch: 'heavy', evasive: true, hp: 42, st: 999, poise: 36, speed: 3.0, turn: 0.3, aggro: [10, 24], threatReach: 61, moves: ['bite', 'leap'] },
    grunt: { name: 'Grunt', r: 10, fodder: true, flinch: 'any', hp: 22, st: 999, poise: 10, speed: 2.1, turn: 0.15, aggro: [16, 40], threatReach: 73, moves: ['chop'] },
    archer: { name: 'Archer', r: 9, fodder: true, flinch: 'any', ranged: true, hp: 14, st: 999, poise: 8, speed: 2.0, turn: 0.2, aggro: [40, 70], threatReach: 0, moves: ['shot'] },
    breaker: { name: 'Breaker', r: 18, hp: 170, st: 999, poise: 80, speed: 1.45, turn: 0.09, aggro: [18, 40], threatReach: 101, moves: ['swing', 'delayed', 'overhead'] },
  };

  const ENCOUNTERS = {
    mireling: { name: 'Mireling', group: 'regular', enemies: ['mireling'] },
    mireling2: { name: 'Two Mirelings', group: 'regular', enemies: ['mireling', 'mireling'] },
    sentry: { name: 'Ashen Sentry', group: 'regular', enemies: ['sentry'] },
    sentryMireling: { name: 'Sentry and Mireling', group: 'regular', enemies: ['sentry', 'mireling'] },
    grunts3: { name: 'Three Grunts', group: 'mob', enemies: ['grunt', 'grunt', 'grunt'] },
    gruntsArcher: { name: 'Two Grunts and an Archer', group: 'mob', enemies: ['grunt', 'grunt', 'archer'] },
    archers: { name: 'A Grunt and two Archers', group: 'mob', enemies: ['grunt', 'archer', 'archer'] },
    mob: { name: 'Four Grunts and an Archer', group: 'mob', enemies: ['grunt', 'grunt', 'grunt', 'grunt', 'archer'] },
    breaker: { name: 'Breaker', group: 'elite', enemies: ['breaker'] },
    stalker: { name: 'Stalker', group: 'elite', enemies: ['stalker'] },
    stalker2: { name: 'Two Stalkers', group: 'elite', enemies: ['stalker', 'stalker'] },
    mixed: { name: 'Stalker and Breaker', group: 'elite', enemies: ['breaker', 'stalker'] },
    breaker2: { name: 'Two Breakers', group: 'elite', enemies: ['breaker', 'breaker'] },
  };

  const PLAN_WORDS = { parry: 'parry', dodge: 'dodge', block: 'block', backstep: 'step out of reach', sidestep: 'sidestep', none: 'nothing, it freezes' };
  const DOCTRINES = {
    measured: { name: 'Measured', neutral: 0.3, parryBias: 0, blockBias: 0, dodgeBias: 0.05, backBias: -0.25, spacing: -16, guardIdle: false },
    guarded: { name: 'Guarded', neutral: 0.1, parryBias: -0.15, blockBias: 0.3, dodgeBias: -0.1, backBias: 0.1, spacing: 18, guardIdle: true },
    pressing: { name: 'Pressing', neutral: 0.75, parryBias: 0.15, blockBias: -0.15, dodgeBias: 0.1, backBias: -0.4, spacing: null, guardIdle: false },
  };

  // 18 stats in five families. Mind stats are AI-competence handicaps (perfect in god mode).
  // Sword, shield, legs and body are physical: they change the numbers on the fighter's own moves.
  // Physical rule: stat 10 reproduces the original sim exactly; 1 is weaker, 20 stronger.
  const STATS = [
    { key: 'swingSpeed', name: 'Swing Speed', family: 'sword' },
    { key: 'swingPower', name: 'Swing Power', family: 'sword' },
    { key: 'swingSkill', name: 'Swing Skill', family: 'sword' },
    { key: 'guardSpeed', name: 'Guard Speed', family: 'shield' },
    { key: 'guardStrength', name: 'Guard Strength', family: 'shield' },
    { key: 'guardSkill', name: 'Guard Skill', family: 'shield' },
    { key: 'moveSpeed', name: 'Move Speed', family: 'legs' },
    { key: 'dodgePower', name: 'Dodge Power', family: 'legs' },
    { key: 'dodgeSkill', name: 'Dodge Skill', family: 'legs' },
    { key: 'endurance', name: 'Endurance', family: 'body' },
    { key: 'wind', name: 'Wind', family: 'body' },
    { key: 'balance', name: 'Balance', family: 'body' },
    { key: 'vitality', name: 'Vitality', family: 'body' },
    { key: 'reflex', name: 'Reflex', family: 'mind' },
    { key: 'perception', name: 'Perception', family: 'mind' },
    { key: 'discipline', name: 'Discipline', family: 'mind' },
    { key: 'composure', name: 'Composure', family: 'mind' },
    { key: 'positioning', name: 'Positioning', family: 'mind' },
  ];
  const FAMILIES = [
    { key: 'sword', name: 'Sword arm' }, { key: 'shield', name: 'Shield arm' }, { key: 'legs', name: 'Legs' },
    { key: 'body', name: 'Body' }, { key: 'mind', name: 'Mind' },
  ];
  const isMind = k => STATS.find(s => s.key === k).family === 'mind';
  // A fresh adventurer: physical stats 7 (a little weaker than the original sim's fixed body), mind 1.
  const BASE = Object.fromEntries(STATS.map(s => [s.key, s.family === 'mind' ? 1 : 7]));

  // Mind stats: 1..20 maps to 0..0.9 of god level; god mode = 1.0.
  function statT(v, god) { return god ? 1 : ((v - 1) / 19) * 0.9; }
  // Physical stats: piecewise linear through (1, a1), (10, a10), (20, a20).
  // PHYS_SCALE shrinks every physical stat's spread around stat 10 (1 = the ranges in the plan).
  let PHYS_SCALE = 0.35, HP_PER_VIT = 2.5; // tuned: at full spread a strong body drowned out the mind
  function lin(v, a1, a10, a20) { const k = PHYS_SCALE; return v <= 10 ? a10 + (a1 - a10) * k * (10 - v) / 9 : a10 + (a20 - a10) * k * (v - 10) / 10; }
  function setPhys(scale, hpPer) { PHYS_SCALE = scale; if (hpPer != null) HP_PER_VIT = hpPer; }
  function derive(stats, god) {
    const v = k => (stats[k] != null ? stats[k] : 10);
    const tm = k => statT(v(k), god);      // mind: perfect in god mode
    const tp = k => statT(v(k), false);    // physical values that keep the original stat formulas
    return {
      // Mind
      delay: Math.round(lerp(13, 2, tm('reflex'))),
      misread: lerp(0.6, 0, tm('perception')),
      reserve: lerp(0, 24, tm('discipline')),
      greed: lerp(0.38, 0, tm('discipline')),
      temp: lerp(0.3, 0, tm('composure')),
      spacingErr: lerp(42, 0, tm('positioning')),
      dodgeErr: lerp(0.55, 0, tm('positioning')),
      flankSense: lerp(0.2, 1, tm('positioning')),
      // Sword arm
      swingSpeed: lin(v('swingSpeed'), 1.15, 1, 0.85),
      swingPower: lin(v('swingPower'), 0.8, 1, 1.3),
      poisePower: lin(v('swingPower'), 0.8, 1, 1.4),
      arcMult: lin(v('swingSkill'), 0.85, 1, 1.15),
      trackMult: lin(v('swingSkill'), 0.6, 1, 1.4),
      glance: v('swingSkill') >= 10 ? 1 : lin(v('swingSkill'), 0.6, 1, 1),
      chainMax: v('swingSkill') >= 17 ? 3 : v('swingSkill') >= 13 ? 2 : 1,
      // Shield arm
      raise: Math.round(lin(v('guardSpeed'), 4, 0, 0)),
      parryStart: Math.round(lin(v('guardSpeed'), 3, 2, 1)),
      blockMult: lerp(1.5, 0.6, tp('guardStrength')),
      chip: lin(v('guardStrength'), 0.4, 0.4, 0.2),
      breakStag: Math.round(lin(v('guardStrength'), 30, 30, 20)),
      perfPoise: Math.round(lin(v('guardStrength'), 14, 22, 30)),
      perfect: Math.round(lerp(1, 7, tp('guardSkill'))),
      parry: Math.round(lerp(3, 7, tp('guardSkill'))),
      guardArc: lin(v('guardSkill'), 1.05, 1.3, 1.57),
      // Legs
      moveMult: lerp(0.78, 1, tp('moveSpeed')),
      dodgeDist: Math.round(lin(v('dodgePower'), 75, 92, 105)),
      iframes: Math.round(lin(v('dodgeSkill'), 6, 8, 10)),
      dodgeDur: Math.round(lin(v('dodgeSkill'), 15, 13, 11)),
      dodgeStam: Math.round(lin(v('dodgeSkill'), 26, 22, 18)),
      counterWin: Math.round(lin(v('dodgeSkill'), 6, 10, 14)),
      // Body
      maxSt: Math.round(lin(v('endurance'), 80, 100, 140)),
      regen: lin(v('wind'), 0.65, 0.85, 1.1),
      regenPause: Math.round(lin(v('wind'), 16, 12, 8)),
      poise: Math.round(lin(v('balance'), 30, 40, 60)),
      staggerMult: lin(v('balance'), 1.25, 1, 0.75),
      hp: Math.round(75 + HP_PER_VIT * (v('vitality') - BASE.vitality)), // fresh adventurer (Vitality 7) = 75
    };
  }

  // The adventurer's own moves, with its physical stats applied. The AI reads these, so it adapts automatically.
  function playerMoves(d) {
    const swing = b => Object.assign({}, b, {
      windup: Math.max(1, Math.round(b.windup * d.swingSpeed)), recovery: Math.max(1, Math.round(b.recovery * d.swingSpeed)),
      dmg: Math.round(b.dmg * d.swingPower), poise: Math.round(b.poise * d.poisePower), arc: b.arc * d.arcMult,
    });
    return Object.assign({}, MOVES, {
      light: swing(MOVES.light), heavy: swing(MOVES.heavy), dodgeAtk: swing(MOVES.dodgeAtk),
      dodge: Object.assign({}, MOVES.dodge, { dist: d.dodgeDist, iEnd: MOVES.dodge.iStart + d.iframes - 1, dur: d.dodgeDur, stam: d.dodgeStam }),
      parry: Object.assign({}, MOVES.parry, { windup: d.parryStart }),
    });
  }

  // Level = points spent above the fresh adventurer. Health comes from Vitality, not level.
  const MAX_LEVEL = 1 + STATS.reduce((a, s) => a + 20 - BASE[s.key], 0);
  function playerLevel(stats) { return 1 + STATS.reduce((a, s) => a + Math.max(0, (stats[s.key] || BASE[s.key]) - BASE[s.key]), 0); }
  function playerHp(stats) { return derive(stats, false).hp; }

  // Training focus: how a level's points are spread. random: seeded.
  const ONES = Object.fromEntries(STATS.map(s => [s.key, 1]));
  // Weights are tuned so every focus lands within 15 points of the others at level 80 (tools/focus-spread.js).
  // Why the extras sit where they do: Vitality, Reflex, Swing Power and Discipline are worth 3 to 10 times a point of
  // Balance, Dodge Power, Positioning or Guard Speed, so focuses that lean on them get only a small extra weight.
  const PROFILES = {
    balanced: ONES,
    duelist: Object.assign({}, ONES, { swingSpeed: 2, swingPower: 2, swingSkill: 2, reflex: 1, perception: 2 }),
    bulwark: Object.assign({}, ONES, { guardSpeed: 2, guardStrength: 2, guardSkill: 2, balance: 2, endurance: 2, vitality: 1 }),
    skirmisher: Object.assign({}, ONES, { moveSpeed: 2, dodgePower: 2, dodgeSkill: 2, positioning: 2, reflex: 2, wind: 2 }),
    survivor: Object.assign({}, ONES, { vitality: 2, endurance: 2, balance: 2 }),
  };
  PROFILES.even = PROFILES.balanced;
  function allocate(level, profile, seed) {
    const st = Object.assign({}, BASE);
    let pts = clamp(level, 1, MAX_LEVEL) - 1;
    if (profile === 'random') {
      const rng = mulberry32(seed || 1);
      while (pts > 0) { const k = STATS[Math.floor(rng() * STATS.length)].key; if (st[k] < 20) { st[k]++; pts--; } }
      return st;
    }
    const w = PROFILES[profile] || PROFILES.balanced, acc = {}, total = Object.values(w).reduce((a, b) => a + b, 0);
    STATS.forEach(s => acc[s.key] = 0);
    while (pts > 0) {
      let best = null;
      for (const s of STATS) { if (st[s.key] >= 20) continue; acc[s.key] += w[s.key]; if (!best || acc[s.key] > acc[best]) best = s.key; }
      acc[best] -= total; st[best]++; pts--;
    }
    return st;
  }
  // Map an original six-stat build onto the split (used to check the split against the main branch).
  function fromSix(o) {
    const st = Object.fromEntries(STATS.map(s => [s.key, 10]));
    ['reflex', 'perception', 'discipline', 'composure'].forEach(k => st[k] = o[k]);
    st.positioning = o.footwork; st.moveSpeed = o.footwork; st.guardStrength = o.guard; st.guardSkill = o.guard;
    return st;
  }

  function makeFighter(arch, x, y, face, name) {
    const A = ARCH[arch];
    return {
      arch, name: name || A.name, x, y, face, r: A.r, hp: A.hp, maxHp: A.hp, st: A.st, maxSt: A.st,
      poise: A.poise, maxPoise: A.poise, speed: A.speed, turn: A.turn,
      act: null, actT: 0, actInst: 0, actHit: false, hitSet: null, evadeLogged: false, dodgeDir: 0,
      blocking: false, blockStart: -999, stagger: 0, stDelay: 0, mvx: 0, mvy: 0, iframe: false, punish: false,
      flash: 0, dead: false,
    };
  }

  function createFight(cfg) {
    const enc = ENCOUNTERS[cfg.encounter] || ENCOUNTERS.breaker;
    const S = {
      tick: 0, over: false, winner: null, events: [], cfg, inst: 0, lastEnemyAtk: -99,
      rngA: mulberry32((cfg.seed * 2654435761) ^ 0x1234),
      rngE: mulberry32((cfg.seed * 40503) ^ 0xBEEF),
      d: derive(cfg.stats, cfg.god),
      ai: { lastHit: 0, snaps: [], beliefs: [], plans: {}, target: 0, thinkT: 0, chase: null, recoverT: 0, noiseT: 0, spacingNoise: 0, strafe: 1, strafeT: 60, readout: '', truth: '', intent: '', windowInst: 0 },
      stats: { guardBreaksDealt: 0, counteredHits: 0, parries: 0, dodgeCounters: 0, dmgBy: { late: 0, misread: 0, committed: 0, stamina: 0, dodge: 0, short: 0, iframes: 0, parry: 0, gamble: 0, surrounded: 0, hesitated: 0, guardbreak: 0 }, dealt: 0, taken: 0, dodges: 0, blocks: 0, perfects: 0, punishes: 0 },
    };
    S.p = makeFighter('adventurer', -110, 0, 0);
    S.p.mv = playerMoves(S.d);
    S.p.hp = S.p.maxHp = cfg.hpOverride || S.d.hp;
    S.p.st = S.p.maxSt = S.d.maxSt;
    S.p.poise = S.p.maxPoise = S.d.poise;
    const n = enc.enemies.length;
    const counts = {};
    enc.enemies.forEach(a => counts[a] = (counts[a] || 0) + 1);
    const seen = {};
    const melee = enc.enemies.filter(a => !ARCH[a].ranged).length, ranged = n - melee;
    let mi = 0, ri = 0;
    S.projectiles = [];
    S.enemies = enc.enemies.map((arch, i) => {
      const isR = ARCH[arch].ranged;
      const k = isR ? ri++ : mi++, cnt = isR ? ranged : melee;
      const spread = cnt === 1 ? 0 : -0.9 + 1.8 * k / (cnt - 1);
      const rad = isR ? 185 : 110;
      const x = Math.cos(spread * (isR ? 0.6 : 1)) * rad, y = Math.sin(spread * (isR ? 0.6 : 1)) * rad;
      seen[arch] = (seen[arch] || 0) + 1;
      const name = counts[arch] > 1 ? `${ARCH[arch].name} ${'ABCD'[seen[arch] - 1]}` : ARCH[arch].name;
      const e = makeFighter(arch, x, y, Math.PI, name);
      e.mv = MOVES; e.idx = i; e.hist = []; e.ai = { cool: (ARCH[arch].fodder ? 20 + i * 18 : 30 + i * 25), mode: 'circle', modeT: 0, dir: i % 2 ? -1 : 1, feint: false, chained: false };
      return e;
    });
    return S;
  }

  function ev(S, text, kind) { S.events.push({ tick: S.tick, text, kind }); }
  const alive = S => S.enemies.filter(e => !e.dead);

  function startAct(S, f, id) {
    const m = (f.mv && f.mv[id]) || MOVES[id];
    if (f === S.p) { f.chainN = f._chaining ? (f.chainN || 0) + 1 : 0; f._chaining = false; }
    if (f.ai) f.ai.lastAct = id;
    f.act = m; f.actT = 0; f.actInst = ++S.inst; f.actHit = false; f.evadeLogged = false; f.blocking = false;
    f.hitSet = f === S.p ? new Set() : null;
    if (m.stam) { f.st = Math.max(0, f.st - m.stam); f.stDelay = f === S.p ? S.d.regenPause : 12; }
    if (f !== S.p && m.kind !== 'dodge') S.lastEnemyAtk = S.tick;
    if (f !== S.p && m.kind === 'attack') f.ai.engagedUntil = S.tick + 60;
  }

  const CAUSES = {
    late: ['Too slow to react', 'reflex'],
    misread: ['Misread the attack', 'perception'],
    committed: ['Caught mid-attack', 'discipline'],
    stamina: ['No stamina to defend', 'discipline'],
    dodge: ['Rolled the wrong way', 'positioning'],
    short: ['Dodge too short', 'dodgePower'],
    iframes: ['Ran out of i-frames', 'dodgeSkill'],
    surrounded: ['Hit from outside its guard', 'positioning'],
    parry: ['Mistimed the parry', 'guardSkill'],
    gamble: ['Gambled on a parry', 'composure'],
    hesitated: ['Hesitated', 'composure'],
    guardbreak: ['Guard broken', 'guardStrength'],
  };
  function causeText(S, c, extra) {
    const [label, key] = CAUSES[c];
    const st = STATS.find(s => s.key === key);
    const v = S.cfg.god && isMind(key) ? 'god' : S.cfg.stats[key];
    return `${label}${extra || ''} (${st.name} ${v}).`;
  }

  function classify(S, a, outsideGuard) {
    const p = S.p, plan = S.ai.plans[a.actInst];
    if (p.act && p.act.kind === 'attack') return 'committed';
    if (p.act && p.act.kind === 'parry') return S.ai.parryP != null && S.ai.parryP < 0.5 ? 'gamble' : 'parry';
    if (outsideGuard && (p.blocking || (plan && plan.resp === 'block'))) return 'surrounded';
    if (!plan || plan.late) return 'late';
    if (plan.misread) return 'misread';
    if (plan.noStam) return 'stamina';
    if (plan.resp === 'dodge') {
      if (p.act && p.act.kind === 'dodge') return 'iframes';        // still rolling, i-frames ran out
      return S.ai.lastDodgePanic ? 'dodge' : 'short';               // a panicked roll is a mind error; a clean one that fell short is the legs
    }
    if (plan.resp === 'backstep') return 'dodge';
    return 'hesitated';
  }

  function hurtPoise(S, f, amt) {
    f.poise -= amt;
    if (f.poise <= 0) {
      f.poise = f.maxPoise; f.stagger = f === S.p ? Math.round(24 * S.d.staggerMult) : 36; f.act = null; f.blocking = false; f.iframe = false;
      ev(S, `${f.name} staggered.`, f === S.p ? 'bad' : 'good');
    }
  }

  function checkHit(S, a, d, m) {
    const dx = d.x - a.x, dy = d.y - a.y, dist = Math.hypot(dx, dy);
    if (dist > m.range + d.r) return;
    if (Math.abs(angDiff(Math.atan2(dy, dx), a.face)) > m.arc + Math.atan2(d.r, Math.max(dist, 1))) return;
    const isP = d === S.p;
    if (d.iframe) {
      if (!a.evadeLogged) { a.evadeLogged = true; if (isP) { S.stats.dodges++; ev(S, `Dodged ${a.name}’s ${m.name}.`, 'good'); } }
      return;
    }
    if (isP) a.actHit = true; else a.hitSet.add(d.idx);
    const outsideGuard = Math.abs(angDiff(Math.atan2(-dy, -dx), d.face)) >= (isP ? S.d.guardArc : 1.3);
    if (isP && d.act && d.act.kind === 'parry' && !outsideGuard && !m.noParry &&
        d.actT > d.act.windup && d.actT <= d.act.windup + d.parryWin) {
      S.stats.parries++;
      ev(S, `Parried ${a.name}’s ${m.name}.`, 'good');
      a.act = null; a.stagger = 45; a.flash = 8;
      S.ai.riposte = { idx: a.idx, until: S.tick + 45 };
      d.act = null; S.ai.thinkT = 0;
      return;
    }
    if (isP && S.ai.plans[a.actInst]) S.ai.plans[a.actInst].hit = true;
    // An enemy in guard stance: a light attack into the front is blocked and answered with a counter;
    // a heavy breaks the guard. Attacks from the side or behind land normally.
    if (!isP && d.act && d.act.kind === 'guard' && d.actT <= d.act.active && !outsideGuard) {
      if (m.id === 'heavy') {
        const dmg = Math.round(m.dmg * 0.5);
        d.act = null; d.stagger = 32; d.hp -= dmg; d.flash = 8;
        S.stats.dealt += dmg; S.stats.guardBreaksDealt++; S.ai.lastHit = S.tick;
        ev(S, `Heavy attack breaks ${d.name}’s guard for ${dmg}.`, 'good');
        if (d.hp <= 0) { d.dead = true; d.stagger = 0; ev(S, `${d.name} is down.`, 'good'); }
      } else {
        S.stats.counteredHits++;
        ev(S, `${d.name} blocks the light attack and counters.`, 'bad');
        d.act = null; startAct(S, d, 'riposte');
      }
      return;
    }
    const shieldUp = !isP || S.tick - d.blockStart >= S.d.raise;   // Guard Speed: the shield takes time to come up
    if (d.blocking && shieldUp && !outsideGuard && !m.unblockable) {
      let cost = (m.blockCost || m.dmg * 1.6 * (m.guardBreak || 1)) * (isP ? S.d.blockMult : 1);
      const perfect = isP && S.tick - d.blockStart - S.d.raise <= S.d.perfect;
      if (perfect) cost *= 0.35;
      if (d.st >= cost) {
        d.st -= cost; d.stDelay = 18;
        if (isP) {
          S.stats.blocks++;
          if (perfect) { S.stats.perfects++; ev(S, `Perfect block on ${a.name}’s ${m.name}.`, 'good'); hurtPoise(S, a, S.d.perfPoise); }
          else ev(S, `Blocked ${a.name}’s ${m.name} for ${Math.round(cost)} stamina.`, 'neutral');
        }
      } else {
        const dmg = Math.round(m.dmg * (isP ? S.d.chip : 0.4));
        d.st = 0; d.blocking = false; d.stagger = isP ? S.d.breakStag : GUARD_BREAK_STAGGER; d.act = null; d.hp -= dmg; d.flash = 8;
        if (isP) {
          S.stats.dmgBy.guardbreak += dmg; S.stats.taken += dmg;
          ev(S, `Guard broken by ${a.name}’s ${m.name}, took ${dmg}. ${causeText(S, 'guardbreak')}`, 'bad');
        }
      }
      return;
    }
    let dmgDone = m.dmg;
    if (!isP && S.d.glance < 1 && Math.abs(angDiff(Math.atan2(dy, dx), a.face)) > m.arc * 2 / 3) dmgDone = Math.round(m.dmg * S.d.glance);
    const glanced = dmgDone < m.dmg;
    d.hp -= dmgDone; d.flash = 8;
    if (isP && m.stamDmg) { d.st = Math.max(0, d.st - m.stamDmg); d.stDelay = 18; }
    if (isP) {
      const c = classify(S, a, outsideGuard);
      S.stats.dmgBy[c] += m.dmg; S.stats.taken += m.dmg;
      const plan = S.ai.plans[a.actInst];
      const extra = c === 'misread' && plan ? `, read it as a ${plan.readAs}` : '';
      ev(S, `Hit by ${a.name}’s ${m.name} for ${m.dmg}. ${causeText(S, c, extra)}`, 'bad');
    } else {
      S.stats.dealt += dmgDone; S.ai.lastHit = S.tick;
      if (a.punish) S.stats.punishes++;
      if (m.id === 'dodgeAtk') S.stats.dodgeCounters++;
      ev(S, `${m.id === 'heavy' ? 'Heavy attack' : m.id === 'dodgeAtk' ? 'Rolling slash' : 'Light attack'} ${glanced ? 'glances off' : 'hits'} ${d.name} for ${dmgDone}${a.punish ? ', punishing the recovery' : ''}${a.chainN ? ' (chain ' + (a.chainN + 1) + ')' : ''}.`, 'good');
      if (d.hp <= 0) { d.dead = true; d.act = null; d.stagger = 0; ev(S, `${d.name} is down.`, 'good'); return; }
    }
    const hyper = d.act && d.act.hyper && d.actT <= d.act.windup + d.act.active;
    if (!hyper) hurtPoise(S, d, m.poise);
    // flinch 'any': any hit cancels its windup. flinch 'heavy': only a heavy does.
    const fl = ARCH[d.arch].flinch;
    if (!isP && fl && !hyper && d.stagger <= 0) {
      if (d.act && d.act.kind === 'attack' && d.actT <= d.act.windup && (fl === 'any' || m.id === 'heavy')) { ev(S, `Interrupts ${d.name}’s ${d.act.name}.`, 'good'); d.act = null; d.stagger = fl === 'any' ? 10 : 6; }
      if (d.arch === 'stalker' || d.arch === 'mireling') { d.ai.mode = 'retreat'; d.ai.modeT = 14; }
    }
  }

  function onActEnd(S, f) {
    if (f !== S.p) {
      const A = ARCH[f.arch];
      f.ai.cool = A.aggro[0] + Math.floor(S.rngE() * (A.aggro[1] - A.aggro[0]));
      if (f.arch === 'stalker') {
        const dist = Math.hypot(S.p.x - f.x, S.p.y - f.y);
        if (!f.ai.chained && dist < 75 && S.rngE() < 0.45) { f.ai.chained = true; startAct(S, f, 'slash'); return; }
        f.ai.chained = false; f.ai.mode = 'retreat'; f.ai.modeT = 16;
      } else if (f.arch === 'mireling') { f.ai.mode = 'retreat'; f.ai.modeT = 20; }
      else if (f.arch === 'sentry' && S.enemies.includes(f) && f.ai.lastAct === 'sguard') f.ai.cool = 6; // ready to swing as the guard drops
    } else { S.ai.thinkT = 0; f.punish = false; }
  }

  function advance(S, f) {
    if (f.dead) return;
    if (f.stagger > 0) { f.stagger--; return; }
    if (!f.act) return;
    const m = f.act;
    f.actT++;
    if (m.kind === 'parry') {
      if (f.actT >= m.windup + f.parryWin + m.recovery) { f.act = null; onActEnd(S, f); }
      return;
    }
    if (m.kind === 'dodge') {
      const t = f.actT;
      if (t <= 9) { const v = m.dist * (2 * (10 - t)) / 90; f.x += Math.cos(f.dodgeDir) * v; f.y += Math.sin(f.dodgeDir) * v; }
      f.iframe = t >= m.iStart && t <= m.iEnd;
      if (t >= m.dur) {
        f.act = null; f.iframe = false;
        // The dodge made its attack miss: a rolling slash is available for 10 ticks.
        const dp = S.ai.dodgePlan;
        if (f === S.p && dp && !dp.hit) { f.counterUntil = S.tick + S.d.counterWin; f.counterTarget = S.ai.dodgeIdx; }
        S.ai.dodgePlan = null;
        onActEnd(S, f);
      }
      return;
    }
    const isP = f === S.p;
    const tgt = isP ? (S.ai.snaps[S.ai.target] || S.enemies[0]) : S.p;
    if (m.kind === 'guard') {
      // Shield up: keeps turning to face and edges forward at a crawl.
      const dist = Math.hypot(tgt.x - f.x, tgt.y - f.y), ang = Math.atan2(tgt.y - f.y, tgt.x - f.x);
      turnToward(f, ang, f.turn);
      if (dist > 50) { f.x += Math.cos(ang) * f.speed * 0.35; f.y += Math.sin(ang) * f.speed * 0.35; }
      if (f.actT >= m.active + m.recovery) { f.act = null; onActEnd(S, f); }
      return;
    }
    if (m.kind === 'ranged') {
      if (f.actT < m.windup - m.track) turnToward(f, Math.atan2(tgt.y - f.y, tgt.x - f.x), f.turn * (f === S.p ? S.d.trackMult : 1));
      if (f.actT === m.windup + 1) {
        S.projectiles.push({ inst: ++S.inst, owner: f, name: m.name, dmg: m.dmg, x: f.x + Math.cos(f.face) * (f.r + 4), y: f.y + Math.sin(f.face) * (f.r + 4), vx: Math.cos(f.face) * m.speed, vy: Math.sin(f.face) * m.speed, born: S.tick, evaded: false });
      }
      if (f.actT >= m.windup + m.active + m.recovery) { f.act = null; onActEnd(S, f); }
      return;
    }
    if (f.actT <= m.windup) {
      if (f.actT < m.windup - m.track) turnToward(f, Math.atan2(tgt.y - f.y, tgt.x - f.x), f.turn * (f === S.p ? S.d.trackMult : 1));
    } else if (f.actT <= m.windup + m.active) {
      const v = m.lunge / m.active;
      f.x += Math.cos(f.face) * v; f.y += Math.sin(f.face) * v;
      if (isP) { for (const e of S.enemies) if (!e.dead && !f.hitSet.has(e.idx)) checkHit(S, f, e, m); }
      else if (!f.actHit) checkHit(S, f, S.p, m);
      if (!f.act) return;
    }
    if (f.actT >= m.windup + m.active + m.recovery) { f.act = null; onActEnd(S, f); }
  }

  function keepInArena(f) {
    const d = Math.hypot(f.x, f.y), lim = ARENA_R - f.r;
    if (d > lim) { f.x *= lim / d; f.y *= lim / d; }
  }
  function moveF(f) {
    if (!f.dead && !f.act && f.stagger <= 0) { f.x += f.mvx; f.y += f.mvy; }
    keepInArena(f);
  }
  function separate(S) {
    const bodies = [S.p, ...alive(S)];
    for (let i = 0; i < bodies.length; i++) for (let j = i + 1; j < bodies.length; j++) {
      const a = bodies[i], b = bodies[j], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 0.01, min = a.r + b.r;
      if (d < min) { const push = (min - d) / 2; a.x -= dx / d * push; a.y -= dy / d * push; b.x += dx / d * push; b.y += dy / d * push; keepInArena(a); keepInArena(b); }
    }
  }
  function updateProjectiles(S) {
    const p = S.p, keep = [];
    for (const pr of S.projectiles) {
      pr.x += pr.vx; pr.y += pr.vy;
      if (Math.hypot(pr.x, pr.y) > ARENA_R + 10 || S.tick - pr.born > 90) continue;
      if (Math.hypot(pr.x - p.x, pr.y - p.y) > p.r + 3) { keep.push(pr); continue; }
      if (p.iframe) { if (!pr.evaded) { pr.evaded = true; S.stats.dodges++; ev(S, `Rolled through ${pr.owner.name}’s ${pr.name}.`, 'good'); } keep.push(pr); continue; }
      const from = Math.atan2(-pr.vy, -pr.vx), outsideGuard = Math.abs(angDiff(from, p.face)) >= S.d.guardArc;
      const plan = S.ai.plans[pr.inst];
      if (p.blocking && S.tick - p.blockStart >= S.d.raise && !outsideGuard) {
        let cost = pr.dmg * 1.6 * S.d.blockMult;
        const perfect = S.tick - p.blockStart - S.d.raise <= S.d.perfect;
        if (perfect) cost *= 0.35;
        if (p.st >= cost) { p.st -= cost; p.stDelay = 18; S.stats.blocks++; if (perfect) S.stats.perfects++; ev(S, `${perfect ? 'Perfect block on' : 'Blocked'} ${pr.owner.name}’s ${pr.name}.`, perfect ? 'good' : 'neutral'); }
        else { const dmg = Math.round(pr.dmg * S.d.chip); p.st = 0; p.blocking = false; p.stagger = S.d.breakStag; p.act = null; p.hp -= dmg; p.flash = 8; S.stats.dmgBy.guardbreak += dmg; S.stats.taken += dmg; ev(S, `Guard broken by ${pr.owner.name}’s ${pr.name}, took ${dmg}. ${causeText(S, 'guardbreak')}`, 'bad'); }
        continue;
      }
      p.hp -= pr.dmg; p.flash = 8;
      let c;
      if (p.act && p.act.kind === 'attack') c = 'committed';
      else if (outsideGuard && (p.blocking || (plan && plan.resp === 'block'))) c = 'surrounded';
      else if (!plan || plan.late) c = 'late';
      else if (plan.misread) c = 'misread';
      else if (plan.noStam && plan.resp !== 'sidestep') c = 'stamina';
      else if (plan.resp === 'dodge' || plan.resp === 'sidestep') c = 'dodge';
      else c = 'hesitated';
      S.stats.dmgBy[c] += pr.dmg; S.stats.taken += pr.dmg;
      ev(S, `Hit by ${pr.owner.name}’s ${pr.name} for ${pr.dmg}. ${causeText(S, c, c === 'misread' ? ', thought it would miss' : '')}`, 'bad');
      hurtPoise(S, p, 8);
    }
    S.projectiles = keep;
  }

  function regen(f, d) {
    if (f.act) return;
    if (f.stDelay > 0) { f.stDelay--; return; }
    f.st = Math.min(f.maxSt, f.st + (f.blocking ? 0.25 : 0.85) * d.regen / 0.85);
  }

  function softmaxPick(opts, temp, rng) {
    let best = opts[0];
    for (const o of opts) if (o.s > best.s) best = o;
    if (temp <= 0.001) return best;
    let sum = 0;
    const w = opts.map(o => { const x = Math.exp((o.s - best.s) / temp); sum += x; return x; });
    let r = rng() * sum;
    for (let i = 0; i < opts.length; i++) { r -= w[i]; if (r <= 0) return opts[i]; }
    return best;
  }

  // ---------- Adventurer AI ----------
  function phaseInfo(S, i) {
    const b = S.ai.beliefs[i], snap = S.ai.snaps[i];
    if (!b || !snap) return null;
    const tNow = snap.t + S.d.delay;
    const m = snap.t > b.truth.windup ? b.truth : b.def;
    return { m, tNow, tta: m.windup - tNow, recLeft: m.windup + m.active + m.recovery - tNow, inRecovery: snap.t > b.truth.windup + b.truth.active };
  }
  function blockCost(S, m, perfect) { return (m.blockCost || m.dmg * 1.6 * (m.guardBreak || 1)) * S.d.blockMult * (perfect ? 0.35 : 1); }

  function planResponse(S, i) {
    const ai = S.ai, d = S.d, p = S.p, doc = DOCTRINES[S.cfg.doctrine];
    const b = ai.beliefs[i], plan = ai.plans[b.inst], snap = ai.snaps[i], m = b.def;
    const tta = m.windup - (snap.t + d.delay);
    const dist = Math.hypot(p.x - snap.x, p.y - snap.y);
    const reach = m.range + m.lunge + p.r + 6;
    plan.done = false;
    const opts = [];
    const dodgeOK = p.st + d.regen * Math.max(0, tta - 3 - p.stDelay) >= p.mv.dodge.stam;
    plan.noStam = !dodgeOK;
    if (dodgeOK) opts.push({ id: 'dodge', s: 1.0 + doc.dodgeBias + (m.guardBreak ? 0.3 : 0) });
    if (!m.unblockable) {
      let s = 0.92 + doc.blockBias;
      if (p.st < blockCost(S, m, d.perfect >= 3)) s -= 1.3 * (1 - 1.6 * d.greed);
      if (m.guardBreak) s -= 0.25;
      // Can it turn to face this attacker before the hit? Matters once there are two.
      const turnNeed = Math.max(0, Math.abs(angDiff(Math.atan2(snap.y - p.y, snap.x - p.x), p.face)) - 1.1) / p.turn;
      if (turnNeed > tta) s -= 1.2 * d.flankSense;
      // Blocking keeps it in reach to punish the recovery; a dodge usually carries it out of range.
      if (m.recovery >= p.mv.light.windup + 6) s += 0.15;
      opts.push({ id: 'block', s });
    }
    if ((reach - dist) / (p.speed * d.moveMult) < tta - 2) opts.push({ id: 'backstep', s: 0.95 + doc.backBias });
    // Parry: big payoff, full hit if mistimed. The AI judges its own odds of landing the window:
    // timing error grows with decision noise (Composure) and reaction lag (Reflex).
    const pJit = d.temp * 8 + d.delay * 0.15;
    // Not worth it against fodder (two hits kill it anyway).
    if (!m.noParry && !m.unblockable && p.st >= p.mv.parry.stam && !ARCH[S.enemies[i].arch].fodder) {
      // Odds of landing the window, then cut down if there is barely time to get the parry up at all.
      const gapP = Math.max(0, dist - (m.range + p.r)), inP = m.lunge > 0 ? Math.min(m.active - 1, Math.ceil(gapP / (m.lunge / m.active))) : 0;
      const ps = p.mv.parry.windup, lead = ps + Math.floor((d.parry - 1) / 2) - inP, earliest = ps - inP - (d.parry - 1);
      let P = clamp(d.parry / (2 * pJit + 1), 0, 1);
      if (tta < lead) P *= clamp((tta - earliest) / Math.max(1, lead - earliest), 0, 1);
      // If this enemy has a feint that looks like this attack, the read might be wrong: discount by the misread rate.
      const feint = ARCH[S.enemies[i].arch].moves.reduce((mx, k) => MOVES[k].lookalike === m.id ? Math.max(mx, MOVES[k].deceive) : mx, 0);
      P *= 1 - d.misread * feint;
      // A whiffed parry leaves it open to everyone nearby, so company makes it riskier.
      const near = S.enemies.filter((o, j) => j !== i && !o.dead && Math.hypot(o.x - p.x, o.y - p.y) < (ARCH[o.arch].threatReach || 150) + 40).length;
      P *= Math.pow(1 - 0.35 * d.flankSense, near);
      opts.push({ id: 'parry', s: 0.5 + 1.2 * P - 0.6 * (1 - P) + doc.parryBias, P });
    }
    opts.push({ id: 'none', s: -0.2 });
    const pick = softmaxPick(opts, d.temp, S.rngA);
    plan.resp = pick.id;
    if (pick.id === 'parry') plan.parryP = pick.P;
    const jit = Math.round((S.rngA() * 2 - 1) * d.temp * 10);
    if (pick.id === 'dodge') plan.trigger = clamp(3 + jit, 1, 8);
    // Aim for the middle of the parry window; the real timing error decides whether it lands.
    if (pick.id === 'parry') {
      // A lunging attack connects partway through its active phase, once it has closed the gap.
      const gap = Math.max(0, dist - (m.range + p.r)), ticksIn = m.lunge > 0 ? Math.ceil(gap / (m.lunge / m.active)) : 0;
      plan.trigger = p.mv.parry.windup + Math.floor((d.parry - 1) / 2) - Math.min(ticksIn, m.active - 1) + Math.round((S.rngA() * 2 - 1) * pJit);
    }
    if (pick.id === 'block') plan.trigger = clamp(Math.max(0, d.perfect - 1) + d.raise + Math.abs(jit), 0, 30);
  }

  function perceive(S) {
    const d = S.d, ai = S.ai;
    perceiveProjectiles(S);
    S.enemies.forEach((e, i) => {
      const snap = e.hist[Math.max(0, S.tick - d.delay)];
      ai.snaps[i] = snap;
      if (!snap.inst || snap.dead) { ai.beliefs[i] = null; return; }
      const truth = e.mv[snap.id], cur = ai.beliefs[i];
      if (!cur || cur.inst !== snap.inst) {
        let def = truth, mis = false;
        if (truth.lookalike && S.rngA() < d.misread * truth.deceive) { def = e.mv[truth.lookalike]; mis = true; }
        ai.beliefs[i] = { inst: snap.inst, truth, def, misread: mis, corrected: false };
        ai.plans[snap.inst] = { misread: mis, readAs: def.name, late: truth.windup - (snap.t + d.delay) < 1, resp: null, done: false, noStam: false, trigger: 0 };
        planResponse(S, i);
      } else if (cur.misread && !cur.corrected && snap.t > cur.def.windup + 1 && snap.t <= cur.truth.windup) {
        cur.def = cur.truth; cur.corrected = true; planResponse(S, i);
      }
    });
  }

  // Arrows: it sees each one d.delay ticks late and extrapolates where it will cross.
  function perceiveProjectiles(S) {
    const p = S.p, d = S.d, ai = S.ai, doc = DOCTRINES[S.cfg.doctrine];
    ai.projThreats = [];
    for (const pr of S.projectiles) {
      const age = S.tick - pr.born;
      if (age < d.delay) continue;
      const px = pr.x - pr.vx * d.delay, py = pr.y - pr.vy * d.delay;
      const vv = pr.vx * pr.vx + pr.vy * pr.vy;
      const t = ((p.x - px) * pr.vx + (p.y - py) * pr.vy) / vv;
      if (t <= 0) continue;
      const cx = px + pr.vx * t - p.x, cy = py + pr.vy * t - p.y, miss = Math.hypot(cx, cy);
      if (miss > p.r + 7) continue;
      const tta = t - d.delay;
      let plan = ai.plans[pr.inst];
      if (!plan) {
        plan = ai.plans[pr.inst] = { misread: false, readAs: 'miss', late: tta < 1, resp: 'none', done: false, noStam: false, trigger: 0 };
        if (S.rngA() < d.misread * 0.5) { plan.misread = true; }
        else {
          const opts = [{ id: 'none', s: -0.2 }];
          const spd = p.speed * d.moveMult;
          if ((p.r + 8 - miss) / spd < tta - 1) opts.push({ id: 'sidestep', s: 1.05 });
          plan.noStam = p.st < p.mv.dodge.stam;
          if (!plan.noStam) opts.push({ id: 'dodge', s: 0.95 + doc.dodgeBias });
          let bs = 0.9 + doc.blockBias;
          const turnNeed = Math.max(0, Math.abs(angDiff(Math.atan2(-pr.vy, -pr.vx), p.face)) - 1.1) / p.turn;
          if (turnNeed > tta) bs -= 1.2 * d.flankSense;
          if (p.st < pr.dmg * 1.6 * d.blockMult) bs -= 1.3;
          opts.push({ id: 'block', s: bs });
          plan.resp = softmaxPick(opts, d.temp, S.rngA).id;
          const jit = Math.round((S.rngA() * 2 - 1) * d.temp * 10);
          plan.trigger = plan.resp === 'dodge' ? clamp(3 + jit, 1, 8) : clamp(Math.max(0, d.perfect - 1) + Math.abs(jit), 0, 30);
        }
      }
      ai.projThreats.push({ pr, tta, cx, cy, miss, plan });
    }
    ai.projThreats.sort((a, b) => a.tta - b.tta);
  }

  function moveToward(S, ang, mag) {
    const p = S.p, spd = p.speed * S.d.moveMult * (p.blocking ? 0.5 : 1) * mag;
    p.mvx = Math.cos(ang) * spd; p.mvy = Math.sin(ang) * spd;
  }

  function doDodge(S, i, m) {
    const p = S.p, d = S.d, snap = S.ai.snaps[i];
    const away = Math.atan2(p.y - snap.y, p.x - snap.x);
    let dir;
    S.ai.lastDodgePanic = false;
    if (S.rngA() < d.dodgeErr) { dir = away + (S.rngA() * 2 - 1) * Math.PI; S.ai.lastDodgePanic = true; } // panicked roll
    else {
      let best = -1e9;
      const lx = snap.x + Math.cos(snap.face) * m.lunge, ly = snap.y + Math.sin(snap.face) * m.lunge;
      for (const r of [0, 0.8, -0.8, 1.57, -1.57]) {
        const a = away + r, ex = p.x + Math.cos(a) * p.mv.dodge.dist, ey = p.y + Math.sin(a) * p.mv.dodge.dist;
        let s = 0;
        if (Math.hypot(ex, ey) > ARENA_R - p.r - 8) s -= 3;
        const dEnd = Math.hypot(ex - lx, ey - ly);
        const off = Math.abs(angDiff(Math.atan2(ey - snap.y, ex - snap.x), snap.face));
        if (dEnd > m.range + p.r + 4 || off > m.arc + 0.35) s += 2;
        s -= Math.abs(dEnd - 60) / 100;
        // Don't roll into the other enemy.
        S.enemies.forEach((o, j) => {
          if (j === i || o.dead) return;
          const os = S.ai.snaps[j], od = Math.hypot(ex - os.x, ey - os.y);
          if (od < ARCH[o.arch].threatReach) s -= 1.2 * d.flankSense;
        });
        if (s > best) { best = s; dir = a; }
      }
    }
    p.dodgeDir = dir;
    startAct(S, p, 'dodge');
  }

  function offense(S, ctx) {
    const p = S.p, d = S.d, doc = DOCTRINES[S.cfg.doctrine], e = S.enemies[S.ai.target];
    const opts = [{ id: 'hold', s: 0.6 }];
    const spd = p.speed * d.moveMult;
    const ids = ['light', 'heavy'];
    if ((p.counterUntil || 0) > S.tick && p.counterTarget === S.ai.target) ids.unshift('dodgeAtk');
    for (const id of ids) {
      const m = p.mv[id];
      if (p.st < m.stam) continue;
      const reachA = m.range + m.lunge * 0.7 + e.r;
      const close = Math.max(0, ctx.dist - reachA + 4) / spd;
      let s, now = false;
      if (ctx.window != null) s = close + m.windup + 1 <= ctx.window ? (id === 'heavy' ? 1.25 : 1.1) : 0.05;
      else if (!ctx.threat && ARCH[e.arch].flinch && ctx.closing > 1.2 && (ctx.dist - reachA) / ctx.closing >= m.windup - 1 && (ctx.dist - reachA) / ctx.closing <= m.windup + 1 + d.greed * 24) { s = id === 'heavy' ? 0.95 : 1.05; now = true; }
      else if (ctx.threat) s = d.greed - 0.45 - (id === 'heavy' ? 0.15 : 0);
      else s = doc.neutral + d.greed - (id === 'heavy' ? 0.2 : 0) - (close > 10 && !ARCH[e.arch].ranged ? 0.25 : 0);
      // Can another enemy hit it before this attack finishes? A disciplined fighter checks.
      const commit = m.windup + m.active + m.recovery + close + 2;
      // Waiting forever loses too: the longer since it last landed a hit, the more risk it accepts.
      const patience = clamp(1 - (S.tick - S.ai.lastHit) / 240, 0, 1);
      if (ctx.otherSafe < commit) s -= 1.1 * clamp((commit - ctx.otherSafe) / commit, 0, 1) * (1 - d.greed * 2) * d.flankSense * patience;
      // Evasive targets dodge swings thrown in the open; only their recoveries are safe to hit.
      if (ARCH[e.arch].evasive && ctx.window == null) s -= 0.7 * (1 - d.greed * 2);
      // Target in guard stance facing it: a light that lands into the shield gets countered,
      // a heavy breaks the guard. Greedy fighters swing anyway.
      if (ctx.guardLeft > 0 && close + m.windup + 1 <= ctx.guardLeft) {
        if (id === 'light') s -= 1.0 * (1 - d.greed * 1.5);
        else s += 0.35;
      }
      // Fodder: a hit that kills or interrupts is nearly always worth it.
      if (ARCH[e.arch].fodder && ctx.window == null && !ctx.threat) { s += 0.35; if (ctx.tHp <= m.dmg) s += 0.25; if (ARCH[e.arch].ranged) s += 0.2; }
      if (id === 'dodgeAtk') s += 0.2;   // fast, and the enemy is usually still recovering
      if (p.st - m.stam < d.reserve) s -= 0.6;
      opts.push({ id, s, now });
    }
    if (p.st < p.maxSt * 0.35) opts.push({ id: 'recover', s: 0.5 + (0.35 - p.st / p.maxSt) * 2 });
    return softmaxPick(opts, d.temp, S.rngA);
  }

  function pickTarget(S) {
    const ai = S.ai, p = S.p, d = S.d;
    const opts = [];
    S.enemies.forEach((e, i) => {
      if (e.dead) return;
      const sn = ai.snaps[i], pi = phaseInfo(S, i);
      const dist = Math.hypot(sn.x - p.x, sn.y - p.y);
      const A = ARCH[e.arch];
      let s = (1 - e.hp / e.maxHp) * 0.6 - dist / (A.ranged ? 500 : 250) + (i === ai.target ? 0.25 : 0);
      if (A.fodder && e.hp <= p.mv.light.dmg) s += 0.4;   // one hit finishes it
      if (A.ranged) s += 0.45;                              // shut the archer up
      if (pi && pi.inRecovery) s += 0.8;          // an opening is worth switching for
      if (sn.stag) s += 0.6;
      if ((p.counterUntil || 0) > S.tick && p.counterTarget === i) s += 0.5;
      if (ai.riposte && ai.riposte.idx === i && ai.riposte.until > S.tick) s += 1.0;
      if (e.arch === 'stalker') s += 0.15;        // kill the fast one first, it's the one that flanks
      opts.push({ id: i, s });
    });
    if (!opts.length) return;
    const pick = softmaxPick(opts, d.temp, S.rngA);
    if (pick.id !== ai.target) { ai.target = pick.id; ai.chase = null; }
  }

  function decide(S) {
    const p = S.p, ai = S.ai, d = S.d, doc = DOCTRINES[S.cfg.doctrine];
    p.mvx = p.mvy = 0;
    if (S.tick % 6 === 0 || !S.enemies[ai.target] || S.enemies[ai.target].dead) pickTarget(S);
    const ti = ai.target, tgt = S.enemies[ti], snap = ai.snaps[ti];
    const dist = Math.hypot(snap.x - p.x, snap.y - p.y), angE = Math.atan2(snap.y - p.y, snap.x - p.x);

    // Every attack it believes is coming, most imminent first.
    const threats = [];
    S.enemies.forEach((e, i) => {
      if (e.dead) return;
      const pi = phaseInfo(S, i);
      if (!pi || pi.inRecovery) return;
      const sn = ai.snaps[i], dd = Math.hypot(sn.x - p.x, sn.y - p.y);
      if (dd <= pi.m.range + pi.m.lunge + p.r + 40) threats.push({ i, pi, dist: dd, ang: Math.atan2(sn.y - p.y, sn.x - p.x) });
    });
    threats.sort((a, b) => a.pi.tta - b.pi.tta);
    const top = threats[0];
    const pt = (ai.projThreats || []).find(x => !x.plan.done && x.plan.resp !== 'none') || null;
    const arrowGuard = (ai.projThreats || []).find(x => x.plan.done && x.plan.resp === 'block') || null;
    const arrowFirst = pt && (!top || pt.tta <= top.pi.tta);
    const faceArrow = (arrowFirst && pt.plan.resp === 'block') ? pt : (!top || (arrowGuard && arrowGuard.tta <= top.pi.tta)) ? arrowGuard : null;
    turnToward(p, faceArrow ? Math.atan2(-faceArrow.pr.vy, -faceArrow.pr.vx) : top && (p.blocking || top.pi.tta < 12) ? top.ang : angE, p.turn);

    // 0. An arrow that lands before any melee hit.
    if (arrowFirst) {
      const pl = pt.plan;
      ai.readout = `${pt.pr.owner.name}’s arrow lands in ${Math.max(0, pt.tta / HZ).toFixed(2)} s. Plan: ${PLAN_WORDS[pl.resp]}.`;
      ai.truth = '';
      if (pl.resp === 'sidestep') {
        const away = pt.miss > 0.5 ? Math.atan2(-pt.cy, -pt.cx) : Math.atan2(pt.pr.vx, -pt.pr.vy);
        moveToward(S, away, 1); ai.intent = 'Sidestep'; return;
      }
      if (pl.resp === 'dodge' && pt.tta <= pl.trigger) {
        pl.done = true;
        if (p.st >= p.mv.dodge.stam) { p.dodgeDir = Math.atan2(pt.pr.vx, -pt.pr.vy) + (S.rngA() < 0.5 ? Math.PI : 0); startAct(S, p, 'dodge'); ai.intent = 'Dodge'; return; }
        pl.noStam = true;
      }
      if (pl.resp === 'block' && pt.tta <= pl.trigger) { pl.done = true; p.blocking = true; p.blockStart = S.tick; }
      if (pl.resp === 'block' && !pl.done) { ai.intent = 'Ready guard'; return; }
      if (p.blocking) { ai.intent = 'Block'; return; }
    }

    // 1. Defensive plans.
    if (top) {
      const b = ai.beliefs[top.i], plan = ai.plans[b.inst], m = top.pi.m, tta = top.pi.tta;
      ai.readout = `Reads ${S.enemies[top.i].name}’s ${b.def.name}, lands in ${Math.max(0, tta / HZ).toFixed(2)} s. Plan: ${PLAN_WORDS[plan.resp] || plan.resp}.`;
      ai.truth = b.misread && !b.corrected ? `It’s actually a ${b.truth.name}.` : '';
      for (const th of threats) {
        const bb = ai.beliefs[th.i], pl = ai.plans[bb.inst], mm = th.pi.m, tt = th.pi.tta;
        if (pl.done) continue;
        const reach = mm.range + mm.lunge + p.r + 6;
        if (pl.resp === 'parry' && tt <= pl.trigger) {
          pl.done = true;
          if (th.dist <= reach + 8 && p.st >= p.mv.parry.stam) {
            p.face = th.ang; startAct(S, p, 'parry'); p.parryWin = d.parry; ai.parryP = pl.parryP; ai.intent = 'Parry'; return;
          }
        } else if (pl.resp === 'dodge' && tt <= pl.trigger) {
          pl.done = true;
          if (th.dist <= reach + 8) {
            if (p.st >= p.mv.dodge.stam) { ai.dodgePlan = pl; ai.dodgeIdx = th.i; doDodge(S, th.i, mm); ai.intent = 'Dodge'; return; }
            pl.noStam = true;
            if (!mm.unblockable) { p.blocking = true; p.blockStart = S.tick; }
          }
        } else if (pl.resp === 'block' && tt <= pl.trigger) {
          pl.done = true; p.blocking = true; p.blockStart = S.tick;
        } else if (pl.resp === 'backstep' && th === top) {
          moveToward(S, th.ang + Math.PI, 1); ai.intent = 'Back off'; return;
        }
      }
      if (p.blocking) { ai.intent = 'Block'; moveToward(S, top.ang + Math.PI, 0.3); return; }
    } else {
      ai.truth = '';
      const guardIdle = p.st >= p.maxSt * 0.5 && S.enemies.some((e, i) => {
        if (e.dead) return false;
        const A = ARCH[e.arch], sn = ai.snaps[i], dd = Math.hypot(sn.x - p.x, sn.y - p.y);
        return (doc.guardIdle && dd < A.threatReach + 25) ||
          (S.cfg.doctrine !== 'pressing' && dd < A.threatReach + 30 && Math.min(...A.moves.map(k => MOVES[k].windup)) < d.delay + 2);
      });
      if (arrowGuard) { ai.intent = 'Block'; return; }
      if (guardIdle) { if (!p.blocking) { p.blocking = true; p.blockStart = S.tick; } } else p.blocking = false;
    }

    // 2. Offense against the current target.
    const old = tgt.hist[Math.max(0, S.tick - d.delay - 3)];
    const closing = (Math.hypot(p.x - old.x, p.y - old.y) - dist) / 3;
    const tpi = phaseInfo(S, ti);
    let guardLeft = 0;
    if (snap.id === 'sguard' && snap.t + d.delay <= MOVES.sguard.active &&
        Math.abs(angDiff(Math.atan2(p.y - snap.y, p.x - snap.x), snap.face)) < 1.3) guardLeft = MOVES.sguard.active - (snap.t + d.delay);
    let window = null;
    if (ai.riposte && ai.riposte.idx === ti && ai.riposte.until > S.tick) window = ai.riposte.until - S.tick; // it knows how long a parry leaves them open
    else if (tpi && tpi.inRecovery && tpi.recLeft > 0) window = tpi.recLeft;
    else if (snap.stag) window = 20;
    const wKey = ai.riposte && ai.riposte.idx === ti && ai.riposte.until > S.tick ? 'r' + ai.riposte.until : ai.beliefs[ti] ? ai.beliefs[ti].inst : -1;
    if (window != null && ai.windowInst !== wKey) { ai.windowInst = wKey; ai.thinkT = 0; }
    if ((p.counterUntil || 0) > S.tick && ai.counterSeen !== p.counterUntil) { ai.counterSeen = p.counterUntil; ai.thinkT = 0; }
    // Soonest any other enemy could land a hit, from what it can see.
    let otherSafe = 999;
    S.enemies.forEach((e, i) => {
      if (i === ti || e.dead) return;
      const sn = ai.snaps[i], A2 = ARCH[e.arch], pi2 = phaseInfo(S, i);
      const dd = Math.hypot(sn.x - p.x, sn.y - p.y);
      const fastest = Math.min(...A2.moves.map(k => MOVES[k].windup));
      const walk = Math.max(0, dd - A2.threatReach) / e.speed;
      let t;
      if (A2.ranged) {
        const flight = dd / MOVES.shot.speed;
        t = sn.id === 'shot' ? Math.max(0, MOVES.shot.windup - (sn.t + d.delay)) + flight : (sn.stag ? 20 : 0) + MOVES.shot.windup + flight;
      }
      else if (sn.stag) t = 20 + walk + fastest;
      else if (pi2 && !pi2.inRecovery) t = dd <= pi2.m.range + pi2.m.lunge + p.r + 10 ? pi2.tta : walk + fastest;
      else if (pi2 && pi2.inRecovery) t = pi2.recLeft + walk + fastest;
      else t = walk + fastest;
      otherSafe = Math.min(otherSafe, t);
    });
    for (const x of ai.projThreats || []) otherSafe = Math.min(otherSafe, x.tta);
    if (--ai.thinkT <= 0) {
      ai.thinkT = closing > 1.2 ? 1 : 5;
      const pick = offense(S, { dist, window, threat: !!top, closing, otherSafe, tHp: tgt.hp, guardLeft });
      if (pick.now && Math.abs(angDiff(angE, p.face)) < 0.5) {
        startAct(S, p, pick.id); ai.chase = null; ai.intent = 'Intercept';
        ai.readout = `${tgt.name} is closing in. Meets it with a ${p.mv[pick.id].name}.`;
        return;
      }
      if (pick.id === 'light' || pick.id === 'heavy') ai.chase = { id: pick.id, until: S.tick + (ARCH[tgt.arch].ranged ? 75 : 20), punish: window != null, target: ti };
      else if (pick.id === 'dodgeAtk') ai.chase = { id: pick.id, until: p.counterUntil, punish: true, target: ti };
      else if (pick.id === 'recover') { ai.recoverT = 40; ai.chase = null; }
      else ai.chase = null;
    }
    if (ai.chase && ai.chase.target === ti && S.tick < ai.chase.until && p.st >= p.mv[ai.chase.id].stam) {
      const m = p.mv[ai.chase.id];
      if (guardLeft > 0 && ai.chase.id === 'light' && S.rngA() > d.greed * 2) { ai.chase = null; }
      else if (dist <= m.range + m.lunge * 0.7 + tgt.r && Math.abs(angDiff(angE, p.face)) < 0.5) {
        const c = ai.chase; ai.chase = null;
        startAct(S, p, c.id); p.punish = c.punish;
        if (c.id === 'dodgeAtk') p.counterUntil = 0;
        ai.intent = c.id === 'dodgeAtk' ? 'Counter' : c.punish ? 'Punish' : 'Attack';
        ai.readout = c.punish ? `Opening on ${tgt.name}. Commits a ${m.name}.` : `Takes a swing at ${tgt.name} in neutral: ${m.name}.`;
        return;
      }
      moveToward(S, angE, 1); ai.intent = 'Close in';
      return;
    }
    ai.chase = null;

    // 3. Footwork: spacing on the target, keep the others in front, stay off the wall.
    const A = ARCH[tgt.arch];
    if (--ai.noiseT <= 0) { ai.noiseT = 45; ai.spacingNoise = (S.rngA() * 2 - 1) * d.spacingErr; }
    let want = (doc.spacing === null ? 46 : A.threatReach + doc.spacing) + ai.spacingNoise;
    if (ai.recoverT > 0) { ai.recoverT--; want += 50; }
    if (--ai.strafeT <= 0) {
      ai.strafeT = 20 + Math.floor(S.rngA() * 30);
      // With company, strafe the way that lines the enemies up instead of letting them split around you.
      const others = S.enemies.filter((e, i) => i !== ti && !e.dead);
      if (others.length && S.rngA() < d.flankSense) {
        const score = dir => {
          const tx = p.x - Math.sin(angE) * dir * 25, ty = p.y + Math.cos(angE) * dir * 25;
          return others.reduce((acc, o) => { const sn = ai.snaps[o.idx]; return acc + Math.abs(angDiff(Math.atan2(sn.y - ty, sn.x - tx), Math.atan2(snap.y - ty, snap.x - tx))); }, 0);
        };
        ai.strafe = score(1) <= score(-1) ? 1 : -1;
      } else if (S.rngA() < 0.5) ai.strafe *= -1;
    }
    const radial = clamp((dist - want) / 20, -1, 1);
    let vx = Math.cos(angE) * radial - Math.sin(angE) * ai.strafe * 0.45;
    let vy = Math.sin(angE) * radial + Math.cos(angE) * ai.strafe * 0.45;
    S.enemies.forEach((e, i) => {
      if (i === ti || e.dead) return;
      const sn = ai.snaps[i], dx = p.x - sn.x, dy = p.y - sn.y, dd = Math.hypot(dx, dy) || 1;
      const lim = ARCH[e.arch].threatReach + 25 + 60 * d.flankSense;
      if (dd < lim) { const w = (lim - dd) / lim * 1.4 * d.flankSense; vx += dx / dd * w; vy += dy / dd * w; }
    });
    const fromC = Math.hypot(p.x, p.y);
    if (fromC > ARENA_R - 45) { vx -= p.x / fromC * 0.9; vy -= p.y / fromC * 0.9; }
    const mag = Math.hypot(vx, vy);
    if (mag > 0.05) moveToward(S, Math.atan2(vy, vx), Math.min(1, mag));
    if (!top) {
      ai.intent = ai.recoverT > 0 ? 'Recover' : (p.blocking ? 'Guard up' : 'Space');
      ai.readout = ai.recoverT > 0 ? 'Low stamina. Backing off to recover.'
        : window != null ? `${tgt.name} is open, but not worth taking.`
        : `Watching ${tgt.name}, ${Math.round(dist)} out, wants ${Math.round(want)}.`;
    }
  }

  // ---------- Enemy AI (hand-authored, fixed skill) ----------
  function enemyThink(S, e) {
    const p = S.p, ai = e.ai, r = S.rngE;
    const dx = p.x - e.x, dy = p.y - e.y, dist = Math.hypot(dx, dy), ang = Math.atan2(dy, dx);
    turnToward(e, ang, e.turn);
    if (ai.cool > 0) ai.cool--;
    const facing = Math.abs(angDiff(ang, e.face)) < 0.5;
    // Attack token: only one enemy may be winding up or swinging at a time, with a short gap after.
    // Groups pressure through position and timing, not simultaneous hits.
    const busy = S.enemies.some(o => o !== e && !o.dead && o.act && o.act.kind !== 'guard' && o.actT <= o.act.windup + (o.act.active || 0));
    const canAttack = !busy && S.tick - S.lastEnemyAtk >= 8;
    let vx = 0, vy = 0;
    // Taking turns: while another non-fodder melee enemy is engaged (attacked in the last 2 s),
    // this one circles at a distance instead of piling in. Fodder and archers don't wait.
    const A0 = ARCH[e.arch];
    if (!A0.fodder && !A0.ranged && !(e.arch === 'mireling' && ai.armed) &&
        S.enemies.some(o => o !== e && !o.dead && !ARCH[o.arch].fodder && !ARCH[o.arch].ranged && (o.ai.engagedUntil || 0) > S.tick && (ai.engagedUntil || 0) <= S.tick)) {
      const hold = Math.max(120, A0.threatReach + 40);
      const rad = clamp((dist - hold) / 25, -1, 1);
      vx = Math.cos(ang) * rad - Math.sin(ang) * ai.dir * 0.6; vy = Math.sin(ang) * rad + Math.cos(ang) * ai.dir * 0.6;
      const mag = Math.hypot(vx, vy) || 1;
      e.mvx = vx / Math.max(1, mag) * e.speed * 0.8; e.mvy = vy / Math.max(1, mag) * e.speed * 0.8;
      if (ai.mode === 'close') ai.mode = 'circle';
      return;
    }
    if (e.arch === 'stalker') {
      const pRec = p.act && p.act.kind === 'attack' && p.actT > p.act.windup + p.act.active;
      if (pRec && facing && canAttack && dist < 125 && ai.mode !== 'retreat') { startAct(S, e, dist < 60 ? 'slash' : 'lunge'); e.mvx = e.mvy = 0; return; }
      if (ai.mode === 'retreat') { vx = -Math.cos(ang); vy = -Math.sin(ang); if (--ai.modeT <= 0) ai.mode = 'circle'; }
      else if (ai.mode === 'close') {
        vx = Math.cos(ang); vy = Math.sin(ang);
        if (ai.feint && dist < 104) { ai.mode = 'retreat'; ai.modeT = 12; ai.cool = 6; }
        if (dist < 58 && facing && canAttack) { startAct(S, e, 'slash'); ai.mode = 'circle'; e.mvx = e.mvy = 0; return; }
      } else {
        const rad = clamp((dist - 105) / 25, -1, 1);
        vx = Math.cos(ang) * rad - Math.sin(ang) * ai.dir * 0.8;
        vy = Math.sin(ang) * rad + Math.cos(ang) * ai.dir * 0.8;
        if (r() < 0.01) ai.dir *= -1;
        if (ai.cool <= 0 && facing && canAttack) {
          if (dist < 60) { startAct(S, e, 'slash'); e.mvx = e.mvy = 0; return; }
          if (dist < 125 && r() < 0.6) { startAct(S, e, 'lunge'); e.mvx = e.mvy = 0; return; }
          ai.mode = 'close'; ai.feint = r() < 0.4;
        }
      }
    } else if (e.arch === 'sentry') {
      // Walks in to sword range. Mixes slashes and bashes, and sometimes raises its shield instead.
      if (dist > 60) { vx = Math.cos(ang); vy = Math.sin(ang); }
      else if (dist < 36) { vx = -Math.cos(ang) * 0.5; vy = -Math.sin(ang) * 0.5; }
      if (ai.cool <= 0 && facing && canAttack && dist <= 72) {
        const x = r();
        if (x < 0.3 && S.tick - (ai.lastGuard || -999) > 120) { ai.lastGuard = S.tick; startAct(S, e, 'sguard'); e.mvx = e.mvy = 0; return; }
        if (dist < 48 && x < 0.6) { startAct(S, e, 'bash'); e.mvx = e.mvy = 0; return; }
        if (dist <= 66) { startAct(S, e, 'sslash'); e.mvx = e.mvy = 0; return; }
      }
    } else if (e.arch === 'mireling') {
      // Circles close, darts in to bite or leaps from mid range, then backs off and comes again.
      // Evasive: hops back from an attack it sees winding up, and leaps on a whiffed swing.
      const pWind = p.act && p.act.kind === 'attack' && p.actT <= p.act.windup;
      const pRec = p.act && p.act.kind === 'attack' && p.actT > p.act.windup + p.act.active;
      if (pWind && dist < 95 && S.tick >= (ai.hopReady || 0) && r() < 0.5) { ai.hopReady = S.tick + 50; ai.mode = 'retreat'; ai.modeT = 10; ai.hop = 10; ai.armed = true; }
      else if (ai.armed && pRec && facing && canAttack && dist > 50 && dist < 110) { ai.armed = false; startAct(S, e, 'leap'); e.mvx = e.mvy = 0; return; }
      if (ai.armed && !p.act && ai.mode !== 'retreat') ai.armed = false;
      if (ai.mode === 'retreat') { vx = -Math.cos(ang) - Math.sin(ang) * ai.dir * 0.6; vy = -Math.sin(ang) + Math.cos(ang) * ai.dir * 0.6; if (--ai.modeT <= 0) ai.mode = 'circle'; }
      else if (ai.mode === 'close') {
        vx = Math.cos(ang); vy = Math.sin(ang);
        if (dist < 44 && facing && canAttack) { startAct(S, e, 'bite'); ai.mode = 'circle'; e.mvx = e.mvy = 0; return; }
      } else {
        const rad = clamp((dist - 85) / 25, -1, 1);
        vx = Math.cos(ang) * rad - Math.sin(ang) * ai.dir * 0.8;
        vy = Math.sin(ang) * rad + Math.cos(ang) * ai.dir * 0.8;
        if (r() < 0.012) ai.dir *= -1;
        if (ai.cool <= 0 && facing && canAttack) {
          if (dist < 46) { startAct(S, e, 'bite'); e.mvx = e.mvy = 0; return; }
          if (dist > 66 && dist < 110 && r() < 0.5) { startAct(S, e, 'leap'); e.mvx = e.mvy = 0; return; }
          ai.mode = 'close';
        }
      }
    } else if (e.arch === 'grunt') {
      // Walk in, fanning out to the sides a little so a pack can surround.
      if (dist > 56) { vx = Math.cos(ang); vy = Math.sin(ang); if (dist < 150) { vx -= Math.sin(ang) * ai.dir * 0.5; vy += Math.cos(ang) * ai.dir * 0.5; } }
      if (ai.cool <= 0 && dist <= 62 && facing && canAttack) { startAct(S, e, 'chop'); e.mvx = e.mvy = 0; return; }
    } else if (e.arch === 'archer') {
      if (dist < 110) { vx = -Math.cos(ang) - Math.sin(ang) * ai.dir * 0.4; vy = -Math.sin(ang) + Math.cos(ang) * ai.dir * 0.4; }
      else if (dist > 210) { vx = Math.cos(ang); vy = Math.sin(ang); }
      else { vx = -Math.sin(ang) * ai.dir * 0.4; vy = Math.cos(ang) * ai.dir * 0.4; if (r() < 0.01) ai.dir *= -1; }
      if (ai.cool <= 0 && dist <= MOVES.shot.range && facing && canAttack) { startAct(S, e, 'shot'); e.mvx = e.mvy = 0; return; }
    } else {
      if (dist > 86) { vx = Math.cos(ang); vy = Math.sin(ang); }
      if (ai.cool <= 0 && dist <= 92 && facing && canAttack) {
        const x = r();
        startAct(S, e, x < 0.45 ? 'swing' : x < 0.7 ? 'delayed' : 'overhead');
        e.mvx = e.mvy = 0; return;
      }
    }
    // Packs spread out a little rather than queuing behind each other.
    for (const o of S.enemies) {
      if (o === e || o.dead) continue;
      const ox = e.x - o.x, oy = e.y - o.y, od = Math.hypot(ox, oy) || 1;
      if (od < 60) { vx += ox / od * 0.6; vy += oy / od * 0.6; }
    }
    const mag = Math.hypot(vx, vy);
    const burst = ai.hop > 0 ? (ai.hop--, 1.7) : 1;
    e.mvx = vx / Math.max(1, mag) * e.speed * burst; e.mvy = vy / Math.max(1, mag) * e.speed * burst;
  }

  // Swing Skill 13+: a light that connected can chain into another light by cancelling the last 4 ticks
  // of its recovery. The AI chains if the target is still in reach and nothing is about to hit it;
  // greedy fighters chain anyway.
  function tryChain(S) {
    const p = S.p, d = S.d, ai = S.ai, m = p.act;
    if ((p.chainN || 0) + 1 >= d.chainMax) return false;
    if (p.actT < m.windup + m.active + m.recovery - 4 || p.actT >= m.windup + m.active + m.recovery) return false;
    if (!p.hitSet || p.hitSet.size === 0 || p.st < p.mv.light.stam) return false;
    const tgt = S.enemies[ai.target], sn = ai.snaps[ai.target];
    if (!tgt || tgt.dead || !sn) return false;
    const dist = Math.hypot(sn.x - p.x, sn.y - p.y), lm = p.mv.light;
    if (dist > lm.range + lm.lunge * 0.7 + tgt.r) return false;
    const danger = S.enemies.some((e, i) => { const pi = phaseInfo(S, i); return !e.dead && pi && !pi.inRecovery && pi.tta < lm.windup + lm.active + 2; });
    if (danger && S.rngA() > d.greed * 1.5) return false;
    if (p.st - lm.stam < d.reserve && S.rngA() > d.greed * 2) return false;
    const punish = p.punish;
    p._chaining = true; startAct(S, p, 'light'); p.punish = punish;
    ai.intent = 'Chain'; ai.readout = `Chains another light into ${tgt.name}.`;
    return true;
  }

  function step(S) {
    if (S.over) return;
    const p = S.p;
    for (const e of S.enemies) e.hist.push({ x: e.x, y: e.y, face: e.face, inst: !e.dead && e.act && e.act.kind === 'attack' ? e.actInst : 0, id: e.act ? e.act.id : null, t: e.actT, stag: e.stagger > 0, dead: e.dead });
    perceive(S);
    if (p.stagger > 0) { p.mvx = p.mvy = 0; p.blocking = false; }
    else if (p.act && p.act.id === 'light' && tryChain(S)) { /* chained into another light */ }
    else if (!p.act) decide(S);
    else { p.mvx = p.mvy = 0; }
    for (const e of S.enemies) {
      if (e.dead) continue;
      if (e.stagger > 0 || e.act) { e.mvx = e.mvy = 0; } else enemyThink(S, e);
    }
    advance(S, p);
    for (const e of S.enemies) advance(S, e);
    updateProjectiles(S);
    moveF(p); S.enemies.forEach(moveF); separate(S);
    regen(p, S.d);
    p.poise = Math.min(p.maxPoise, p.poise + 0.15);
    for (const e of S.enemies) e.poise = Math.min(e.maxPoise, e.poise + 0.15);
    for (const f of [p, ...S.enemies]) if (f.flash > 0) f.flash--;
    S.tick++;
    if (!alive(S).length) { S.over = true; S.winner = 'adventurer'; ev(S, `${S.enemies.length > 1 ? 'All enemies' : S.enemies[0].name} defeated at ${fmt(S.tick)}.`, 'end'); }
    else if (p.hp <= 0) { S.over = true; S.winner = 'enemy'; ev(S, `The adventurer falls at ${fmt(S.tick)}.`, 'end'); }
    else if (S.tick >= MAX_TICKS) { S.over = true; S.winner = 'draw'; ev(S, 'Time runs out. Draw.', 'end'); }
  }
  function fmt(t) { const s = Math.floor(t / HZ); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; }

  function runFight(cfg) { const S = createFight(cfg); while (!S.over) step(S); return S; }

  return { HZ, ARENA_R, MOVES, ARCH, ENCOUNTERS, DOCTRINES, STATS, CAUSES, derive, playerLevel, playerHp, allocate, setPhys, PROFILES, FAMILIES, BASE, MAX_LEVEL, fromSix, isMind, playerMoves, createFight, step, runFight, fmt };
})();
if (typeof module !== 'undefined') module.exports = SIM;
