# Idle Souls

An autonomous expedition RPG prototype built with Phaser 4.2.1, TypeScript 6.0.3 and Vite 8.3.5. Plan a route, watch the adventurer fight, retreat physically to camp, bank loot, and recover a cache after death. The deterministic combat simulator is `combat/deep-stats/combat-sim.js`; presentation reads its results.

The [mobile release specification](docs/release/SPEC.md) is the source of truth for product direction. It supersedes conflicting historical handoffs and design locks. Read the [verified baseline](docs/release/BASELINE.md), [Android foundation](docs/release/ANDROID.md) and [prioritized issues](docs/release/ISSUES.md) for implementation status. Durable active-run recovery, permanent power upgrades, safe offline farming and commerce are future milestones.

## Run locally

Use Node 22.16.0 (configured CI version) or 24.15.0 (verified locally), and npm. From the repository root:

```sh
npm ci
npx playwright install chromium
npm run dev
```

Development entry points:

- `http://localhost:5173/?scene=expedition` — expedition planner, map, camp, progression, boss challenges and Chronicle.
- `http://localhost:5173/?scene=o1` — animated Old Road combat viewer driven by the simulator.
- `http://localhost:5173/` — visual art workbench with movement and pose controls.
- `?scene=calibration`, `?scene=silhouette`, `?scene=attacks` — art review fixtures.

The expedition interface and animated O1 viewer are still separate. Starting-level and stat controls are developer tools; they do not represent earned permanent progression. Saves are version 2 and do not recover an active expedition.

`npm run dev:player` opens the player entry without developer scenes, URL cheats, test hooks or power controls. `npm run test:player` tests the production player bundle. With Java 21 and Android SDK 36 installed and `JAVA_HOME`/`ANDROID_HOME` configured, `npm run android:debug` builds an installable debug APK; `npm run android:release` builds unsigned release APK/AAB files. See [Android setup and device checks](docs/release/ANDROID.md).

## Verify

After installing dependencies and Chromium, `npm run check` runs the complete baseline in order and stops on the first failure. Its component commands are:

```sh
npm run lint
npm run typecheck
npm run world:check
node combat/tools/sync-portable-math.js --check
npm run build
npm test
node combat/deep-stats/tools/regress.js
node combat/deep-stats/tools/legacy-check.js
npm run test:browser
```

Build before unit tests to exercise the bundle-size check. Both simulator guards must print `different 0`. Git attributes retain LF checkouts so byte-for-byte generation checks also work on Windows. Existing checkouts with CRLF generated files can run `npm run world:build` and `node combat/tools/sync-portable-math.js`; a fresh clone uses LF automatically.

Browser tests select `/usr/bin/chromium` when present, otherwise Playwright's managed Chromium. Set `CHROMIUM_PATH` to use another executable. `PW_PORT` selects an isolated dev-server port. Failures retain screenshots and traces in `test-results/`; CI uploads them. Browser automation is software evidence; physical-phone, screen-reader and human comprehension checks remain pending.

`npm run build` creates `dist/`; `npm run preview` serves it at port 4173. Simulator regressions and golden results protect existing behavior; change goldens only for an intentional, explained gameplay change.

## Reports and asset production

See [baseline reproduction](docs/release/BASELINE.md) for isolated balance-report commands. Historical reports under `docs/slice/` describe earlier code and must not be treated as fresh measurements.

Rooms are generated from `vertical_slice_room_schedule.csv`, `vertical_slice_connections.csv` and `combat/rooms/overrides/`. Edit those sources and use `npm run world:build`.

Runtime atlases and editable masters are checked in; Blender is not needed to play. Asset production uses Blender 4.3.2, Python 3.12 and `tools/requirements.txt`:

```sh
python -m pip install -r tools/requirements.txt
npm run assets:environment
npm run assets:characters
npm run assets:atlas
npm run assets:validate
```

`assets:characters` exports retained `.blend` masters. `assets:characters:rebuild` reconstructs and overwrites them; use it only for an intentional art reset. Source provenance and historical evidence live in [assets/PROVENANCE.md](assets/PROVENANCE.md) and [docs/visual_proof/DELIVERY.md](docs/visual_proof/DELIVERY.md). Art quality, audio audition and device performance still need human validation.
