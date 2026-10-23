# Combat system: rules for Claude Code

Read `CLAUDE_CODE_COMBAT_HANDOFF.md` before any change.

- This code overrides the design library on combat. Combat is the heart of the game.
- Work in `deep-stats/`. Keep `main/` frozen as the regression baseline.
- The engine stays deterministic (seeded `rngA`/`rngE`, 30 Hz, no `Math.random`, no clock) and never renders.
- Edit `combat-sim.js` and `bench-shell.html`, then run `node build.js`. Never edit `combat-bench.html` by hand.
- Mind stats are AI handicaps; physical stats only change move numbers. Every hit taken is blamed on one stat.
- No adaptive difficulty, no hidden multipliers, no global weakening of the player AI, no AI rewrite without evidence.
- Done means: `node tools/regress.js` prints `different 0` (or the difference is explained), `node balance.js` before/after on affected encounters with all doctrines and two or more focus profiles at 300 seeds, and `node tools/body-vs-mind.js 150` for any physical-stat or health change.
- Report results bluntly with numbers. Kyle prefers direct feedback.
- Room geometry is optional. `createFight` takes `room` (bounds, rect and circle solids) and `spawns`; without them the circular arena runs exactly as before. `node tools/legacy-check.js` must print `different 0` after any change to movement, hits or projectiles.
- `combat/package.json` sets this folder to CommonJS because the repo root is `"type": "module"`. Keep it.
- No native `Math.sin/cos/atan2/hypot/exp/pow/log` in the sim or in world code that feeds it (route, sight, runner). Engines differ in the last bit and the sim is chaotic, so browser and Node would disagree. Use `M.*` from `combat/portable-math.js`; edit that file, then run `node combat/tools/sync-portable-math.js` (it pastes the block into both sims and `src/combat/portableMath.ts`). `tests/portableMath.test.ts` enforces this. Exact ops (`sqrt`, `floor`, `round`, `abs`, `min`, `max`, `imul`) are fine.
