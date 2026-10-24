# Combat system handoff for Claude Code
> Historical handoff: combat and expedition systems have expanded since this snapshot. Current product direction is [the mobile release specification](../docs/release/SPEC.md). Use `CLAUDE.md` and the current simulator for technical constraints and behavior; the original scope and next-work list below are historical.

Autonomous Dungeon Crawler (RUN.world). Combat is the heart of the game, and this folder is the only part of the game that exists as code. Read this file before changing anything.

Prepared 23 October 2026.

## 1. Authority

The code in this folder is the source of truth for combat. Where it disagrees with the design library (`Autonomous_Dungeon_Crawler_Design_Library_v0_12`, including its own `CLAUDE_CODE_COMBAT_AND_WORLD_HANDOFF.md`), the code wins. Kyle has approved that explicitly. Use the design library for intent (regions, enemy roles, the retreat and pursuit contract), not for numbers.

Kyle wants blunt reporting. If a change makes balance worse, say so with the numbers. Don't call something done until the tests in section 7 pass.

## 2. What's in the folder

```
combat-handoff/
  CLAUDE.md                          short rules, read automatically
  CLAUDE_CODE_COMBAT_HANDOFF.md      this file
  main/                              stable branch: six competence stats
    combat-sim.js                    engine (data, sim, adventurer AI, enemy AI)
    bench-shell.html                 test page without the engine; edit the page here
    build.js                         node build.js -> combat-bench.html
    combat-bench.html                built page; never edit by hand
    balance.js                       headless balance runner
  deep-stats/                        active branch: 18-stat line
    (same five files)
    tools/regress.js                 split must match main on mapped builds
    tools/body-vs-mind.js            guardrail: body and mind must both matter
```

**Work in `deep-stats/` by default.** It is the direction Kyle chose. Keep `main/` frozen as the regression baseline. Don't merge or delete either branch without Kyle's say-so.

Live references (claude.ai):

- Main bench: https://claude.ai/artifact/V4FmvbaPGgUirGMAbzNLYf
- Split bench: https://claude.ai/artifact/SLCRzV3kGFqNLtGCC5S5TY
- Combat AI code reference (main branch, detailed): https://claude.ai/artifact/V3G9u5958KgeKm5HbT7vus
- Deep stat line plan (split, with a "Built so far" section): https://claude.ai/artifact/77U2qYjH6gG6NpdSEHVAdw

## 3. Rules that don't bend

1. **Deterministic.** 30 ticks a second (`HZ`). All randomness comes from two seeded mulberry32 streams: `rngA` for the adventurer AI, `rngE` for enemies. Same config and seed must give the same fight. No `Math.random`, no clock reads in the engine.
2. **The engine never renders.** No DOM, no canvas in `combat-sim.js`. It must run in Node and in the browser (`module.exports` at the bottom).
3. **One engine, one page.** Edit `combat-sim.js` and `bench-shell.html`, then `node build.js`. The page and Node always run the same engine.
4. **The handicapped-god model.** The adventurer AI plays perfectly and the **mind** stats add back specific human mistakes. Never make a mind stat into a plain number buff, and never add hidden randomness that isn't owned by a stat.
5. **Physical stats change moves, not decisions.** In the split, sword, shield, legs and body stats only change numbers on the adventurer's own moves (`p.mv`) and pools. The AI reads those effective moves, so it adapts without knowing the stats exist. Keep it that way.
6. **Every hit the adventurer takes is blamed on one stat** (`classify`, `CAUSES`). New mechanics that can hurt the adventurer need a cause.
7. **No adaptive difficulty.** No enemy scaling to the player, no invisible damage multipliers, no making the game harder by weakening the player AI across the board. Difficulty comes from enemy stats, combinations and attrition.
8. **Don't rewrite the adventurer AI** without evidence from the bench or balance runs that the current logic is wrong. Most past "AI problems" were fixed with one targeted rule.
9. **God mode in the split means a perfect mind, not a perfect body.** It sets the five mind stats to perfect and leaves physical stats as configured.

## 4. How the engine works

### Tick order (`step`)

1. Snapshot every enemy into its history (position, facing, action, action tick, stagger, dead).
2. `perceive`: the adventurer reads each enemy as it was `delay` ticks ago and each arrow as it was `delay` ticks ago. New attacks form a belief, possibly a misread.
3. The adventurer acts: chain a light if `tryChain` allows, otherwise `decide` if it isn't mid-action or staggered.
4. Each enemy runs `enemyThink` unless mid-action or staggered.
5. `advance` actions, adventurer first. Hits resolve in `checkHit` during active ticks.
6. `updateProjectiles`.
7. Movement, arena clamp, body separation.
8. Stamina and poise regeneration, tick increment, end checks (all enemies dead, adventurer dead, or 150 s timeout = draw).

### Adventurer AI

- **Perception.** Sees enemies `delay` ticks late (Reflex). Misreads lookalike moves with chance `misread × deceive` (Perception). A misread slower attack corrects itself when the expected hit doesn't come.
- **Planning (`planResponse`).** One plan per enemy attack, made when first seen: parry, dodge, block, step out of reach, or nothing, chosen by softmax at Composure temperature. Parry odds are the AI's own estimate from its timing error, available time, feint risk and nearby enemies.
- **Decision order (`decide`).** Re-pick target every 6 ticks; turn; arrow plans; melee plans whose trigger has arrived; idle guard; offense every 5 ticks (or at once when an opening appears); chase; footwork.
- **Offense (`offense`).** Scores hold, light, heavy, rolling slash and recover. Includes the exposure check (can another enemy hit it before this attack finishes), patience (accepts more risk the longer since it last landed a hit), evasive-target and guard-stance rules, and fodder bonuses.
- **Footwork.** Spacing by doctrine and enemy reach, strafing that lines enemies up, repulsion from non-target enemies, wall avoidance.

### Enemy AI

Hand-written per archetype in `enemyThink`. Shared rules: one enemy may be winding up or swinging at a time (attack token, 8-tick gap); non-fodder melee enemies take turns, circling at 120+ units while another is engaged. Archetypes: Mireling and Ashen Sentry (regulars), Grunt and Archer (fodder), Stalker and Breaker (elites).

### Resolution (`checkHit`, `updateProjectiles`)

Range and arc check; adventurer attacks cleave. I-frames; parry window; enemy guard stance (light is countered, heavy breaks it); blocking with stamina cost, perfect block, guard break; poise and stagger; flinch (`'any'` or `'heavy'`); glancing edge hits (split, low Swing Skill).

## 5. The split's stat line (`deep-stats/`)

| Family | Stats |
| --- | --- |
| Sword arm | Swing Speed, Swing Power, Swing Skill |
| Shield arm | Guard Speed, Guard Strength, Guard Skill |
| Legs | Move Speed, Dodge Power, Dodge Skill |
| Body | Endurance, Wind, Balance, Vitality |
| Mind | Reflex, Perception, Discipline, Composure, Positioning |

- `derive(stats, god)` turns stats into every number the sim uses. Mind stats use `statT` (stat 20 = 90% of perfect, god = 100%). Physical stats use `lin(v, at1, at10, at20)`: stat 10 reproduces the original sim exactly.
- **`PHYS_SCALE = 0.35`.** Every physical spread is 35% of the plan's ranges. At full range a max body with a stat-1 mind won everything, including 91% against the Stalker and Breaker pair. Don't raise it without running `tools/body-vs-mind.js`.
- **Health** = 75 + 2.5 × (Vitality − 7). A fresh adventurer (body 7, mind 1) has 75, matching main's level 1, and two Breaker overhead smashes kill it.
- **Levels** are points above the fresh adventurer: `playerLevel`, `MAX_LEVEL = 265`.
- **Training focus** (`allocate(level, focus, seed)`): balanced, duelist, bulwark, skirmisher, survivor, random.
- **Abilities from Swing Skill:** chains two lights at 13, three at 17 (`tryChain`).
- **`fromSix(stats)`** maps a main-branch build onto the split. `regress.js` uses it.
- **`playerMoves(d)`** builds the adventurer's effective moves. Enemies currently share the base `MOVES` table (`e.mv = MOVES`); don't mutate it.

## 6. Commands

Run from inside `main/` or `deep-stats/`.

```
node build.js                                   rebuild combat-bench.html after any edit
node balance.js                                 every encounter, doctrine, default levels, 300 seeds
node balance.js --enc sentry,mob --doc measured --prof balanced,duelist,survivor --levels 1,40,80,140,god --n 300
node tools/regress.js                           (split only) must print "different 0"
node tools/body-vs-mind.js 150                  (split only) guardrail table
```

`balance.js` cells read: win %, draws (`dN`), mean fight seconds, mean health left after a win. In the split, `god` means a fresh body with a perfect mind.

## 7. Definition of done for any combat change

1. `node --check combat-sim.js` passes and `node build.js` succeeds.
2. In the split, `node tools/regress.js` still prints `different 0`, unless the change deliberately alters stat-10 behaviour. If so, say exactly what changed and why.
3. `node balance.js` on the affected encounters: all three doctrines, at least two focus profiles, 300 seeds. Report before and after.
4. If the change touches physical stats or health: `node tools/body-vs-mind.js 150`, before and after.
5. God mode / perfect mind must still win single regulars and single elites with no timeouts. A drop there means the change broke the AI's logic, not the balance.
6. Open the built bench in a browser and watch at least one fight of the affected encounter. The fight log should explain every hit.

Never tune from one build or one seed. Always report draws separately.

## 8. Current state (split, Measured doctrine, balanced focus, 150 seeds)

Win rate by level. God = fresh body, perfect mind.

| Encounter | L1 | L40 | L80 | L140 | God |
| --- | --- | --- | --- | --- | --- |
| Mireling | 95% | 99% | 100% | 100% | 100% |
| Two Mirelings | 42% | 54% | 67% | 99% | 100% |
| Ashen Sentry | 65% | 73% | 79% | 100% | 100% |
| Sentry and Mireling | 3% | 11% | 22% | 83% | 100% |
| Four Grunts and an Archer | 79% | 93% | 97% | 98% | 100% |
| Breaker | 3% | 12% | 22% | 62% | 99% |
| Stalker | 19% | 27% | 33% | 78% | 84% |
| Two Stalkers | 0% | 0% | 0% | 3% | 33% |
| Stalker and Breaker | 0% | 0% | 0% | 5% | 81% |
| Two Breakers | 0% | 0% | 1% | 3% | 68% |

Guardrail (`body-vs-mind.js`, 150 seeds):

| Build | Two Mirelings | Sentry | Sentry + Mireling | Mob | Breaker | Stalker | Stalker + Breaker |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Body 20, mind 1 | 99 | 100 | 77 | 100 | 82 | 89 | 7 |
| Body 1, perfect mind | 100 | 99 | 95 | 46 | 21 | 33 | 20 |
| L80 survivor | 93 | 92 | 41 | 99 | 49 | 51 | 1 |
| L80 skirmisher | 67 | 79 | 15 | 96 | 27 | 25 | 0 |

## 9. Known problems, in priority order

1. **Survivor focus is too strong and Skirmisher too weak** (split). At level 80, Survivor beats the Breaker 49% against 22 to 33% for the others. Health and stamina always help; dodge stats are worth less because the AI gets more out of blocking. Acceptance: at level 80, all five focuses within 15 points of each other on single elites and Sentry + Mireling.
2. **Progress from level 1 to 80 is flat, then jumps by 140** (split). The Breaker goes 3% → 22% → 62%. 80 levels of points should feel like more. Likely cause: 18 stats dilute each level, and PHYS_SCALE keeps each point small. Consider more points per level rather than raising PHYS_SCALE.
3. **Guarded is the best doctrine in most matchups** (both branches), by 20 to 30 points against pairs. Doctrine is meant to be a real choice.
4. **Two-enemy fights are a wall** (both). Sentry + Mireling at level 80 is 22%; elite pairs are near 0 until level 140, and even a perfect mind on a fresh body only wins Two Stalkers 33%. Decide with Kyle where pairs belong before tuning.
5. **"Caught mid-attack" is too broad.** It is the largest damage cause almost everywhere. Split deliberate trades (Pressing, punish attempts) from greed.
6. **Grunts cost too little.** Three Grunts take 18% of a fresh adventurer's health in 4 seconds.
7. **The rolling slash rarely fires** except against Mirelings, because heavy punishes are better against slow enemies. Probably fine.

## 10. Next work, in order

1. Fix problems 1 and 2 in the split (focus balance and level pacing).
2. Doctrine balance (problem 3).
3. Split the "Caught mid-attack" cause.
4. **Enemy variants through stat blocks.** Give `ARCH` entries an optional physical stat block, build `e.mv` with the same scaling as `playerMoves`, and add one variant (for example a Veteran Sentry with Guard Skill 16) as a test.
5. **Expedition mode.** Fights back to back with health and stamina carried over, healing items with a doctrine rule for when to drink, and a sequential-route test in `balance.js`. Then add the plan's two growth systems: training by use (landed hits raise Swing Skill, and so on) and learning from mistakes (each damage cause gives experience to its stat), both reset per expedition and capped once per enemy.
6. **Remaining roster** from design library doc 25: Tower Harrier (ranged with cover), Mudjaw Brute (charge that collides with obstacles), Silt Spitter (ground hazards), Crypt Duelist (combos, sidestep counter). Then the bosses with phases.
7. **World geometry and retreat**, per design library doc 14: walls, cover that blocks arrows, forbidden regions the AI must never enter, disengage and retreat with feasibility reporting. This is the largest piece and changes footwork and dodge logic.

## 11. Gotchas

- `offense` picks the first option on a tie. The rolling slash is listed first on purpose.
- Plans are keyed by action instance number (`S.ai.plans[inst]`), shared between melee attacks and arrows.
- `phaseInfo` uses the believed move until the attack is seen to go active, then the true move.
- A parry trigger can be negative (start after the windup has ended) for lunging attacks. That is correct.
- `PROFILES.even` is an alias of `balanced` so older scripts still run.
- `regress.js` only holds for builds with Guard 10, because Guard Strength also sets perfect-block poise damage.
- Fodder (`fodder: true`) is never parried and never takes turns.
- `e.mv = MOVES` is a shared object. Copy before changing per-enemy values.
- The bench's 300-fight test runs in chunks on the main thread. Keep per-fight cost low.
- Text shown to players uses typographic apostrophes (’). Keep straight quotes in code.

## 12. Function index (`combat-sim.js`)

| Function | Purpose |
| --- | --- |
| `derive` | Stats to numbers (handicaps, physical values, health) |
| `playerMoves` | Adventurer's effective moves from physical stats (split) |
| `allocate`, `playerLevel`, `playerHp`, `fromSix` | Builds, levels, health, branch mapping |
| `createFight`, `step`, `runFight` | Fight lifecycle |
| `perceive`, `perceiveProjectiles` | What the adventurer sees, beliefs, misreads |
| `planResponse` | Defensive plan per incoming attack |
| `decide`, `offense`, `pickTarget`, `doDodge`, `tryChain` | Adventurer decisions |
| `enemyThink`, `onActEnd` | Enemy behaviour |
| `advance`, `checkHit`, `updateProjectiles`, `hurtPoise` | Resolution |
| `classify`, `causeText`, `CAUSES` | Damage blame |
