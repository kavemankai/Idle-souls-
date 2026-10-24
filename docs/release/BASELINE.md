# Milestone 1: reproducible baseline

Run date: 2026-10-24. Source baseline: `d4219b1dbb761a7014a7df0dd01e663df06e6d63`, cloned from `https://github.com/kavemankai/Idle-souls-.git`. Environment: Windows PowerShell, Node 24.15.0, npm 11.14.1, Playwright 1.64.1, managed Chromium 156.0.8078.4, software rendering. CI is configured for Node 22.16.0; its remote results have not been executed or observed during this task.

Milestone 1 establishes the software baseline and assigns subsequent product work in [ISSUES.md](ISSUES.md). [SPEC.md](SPEC.md) owns current product requirements. No combat numbers, geometry, saves or golden gameplay results were deliberately changed.

## Reproduce

From the repository root:

```sh
npm ci
npx playwright install chromium
npm run check
```

`check` stops at the first failure and runs lint, types, world generation, portable-math synchronization, production build, unit tests, both simulator guards and browser tests. Building before unit tests includes the bundle-size check. See the README for individual commands and server/browser selection. Use `PW_PORT` when another checkout is serving Vite.

## Observed checks

| Check | Result |
|---|---|
| `npm ci` | Pass; 118 packages installed, audit reported zero vulnerabilities at execution time |
| Lint and TypeScript | Pass |
| World generation | Pass; all 18 generated files current |
| Portable math | Pass; all embedded copies in sync |
| Production build | Pass; Vite emits a chunk-size warning, tracked as R11 |
| Unit tests after build | 218 passed, zero skipped, zero failed |
| Split simulator regression | `identical 2340, different 0` |
| Legacy arena guard | `identical 78, different 0` |
| Full browser suite | 66 passed, including expedition settlement, boss parity, viewport layouts, accessibility structure and performance budgets |

The new `npm run check` runner was also exercised end to end. A separate targeted repetition of dispatch, O1 seeded parity and zoom checks passed all 21 cases (three repetitions across the configured viewports/cases). Playwright traces are retained only on failure.

The first Windows run failed two unit checks and the corresponding standalone generation checks. Git had converted LF files to CRLF, breaking exact string comparisons for generated rooms and the TypeScript portable-math wrapper. `.gitattributes` now retains LF text checkouts across platforms; local working files were normalized without semantic changes. The checks pass without regenerating gameplay or math data. A checkout-index reproduction with `core.autocrlf=true` retained LF in both affected file types. CI adds a Windows checks job to guard this failure mode; browser CI remains Linux. CI now builds before running unit tests so its bundle-budget test cannot silently skip.

M9's earlier desktop zoom and dispatch/parity failures did not reproduce in the full suite. The historical native transcendental-math divergence is documented in `docs/visual_proof/DECISIONS.md` and already addressed in the source by portable math. This task made no speculative camera or simulator change. Browser failures now retain screenshots and Playwright traces; the remaining cross-host historical follow-up is B03.

## Balance reproduction and limits

Create an output directory (PowerShell: `New-Item -ItemType Directory -Force .tmp/baseline`). These commands leave historical calibration files untouched:

```sh
npx tsx tools/o1-report.ts --out .tmp/baseline/O1_REPORT.md
npx tsx tools/pacing-report.ts --part routes --n 30 --out-dir .tmp/baseline/pacing
npx tsx tools/pacing-report.ts --part farming --n 30 --out-dir .tmp/baseline/pacing
npx tsx tools/pacing-report.ts --part retreat --n 30 --out-dir .tmp/baseline/pacing
npx tsx tools/pacing-report.ts --part campaign --policy cautious --start 1 --count 1 --cap 120 --out-dir .tmp/baseline/pacing
npx tsx tools/pacing-report.ts --part campaign --policy pressing --start 1 --count 1 --cap 120 --out-dir .tmp/baseline/pacing
npx tsx tools/pacing-report.ts --part campaign --policy cautious --start 9 --count 1 --cap 120 --out-dir .tmp/baseline/pacing
npx tsx tools/pacing-report.ts --assemble --out-dir .tmp/baseline/pacing --out .tmp/baseline/CALIBRATION_NUMBERS.md
npx tsx tools/boss-report.ts 30 1 5 9
npx tsx tools/perf-report.ts --runs 5
```

The pacing harness had lagged behind boss integration. Boss goals now use `challenge`, persisted defeated bosses feed the next expedition, and already-open gates no longer demand another prepared key. Boss route rows also explicitly challenge. `--out-dir` and `--out` support isolated results. The first level-1 cautious sample was run after challenge/persistence repair but before the open-gate key cleanup; it never opened that gate, so that later cleanup cannot affect its result.

Raw results are retained in [evidence/](evidence/). O1 covers 300 seeds per opponent/doctrine (3,600 room runs plus corresponding arena comparisons), balanced focus at simulator level 80. Measured completion after combat: Mireling 100%, Sentry 96%, two Mirelings 94.7%, Sentry/Mireling 49.7%. The last pair ranges from 24% pressing to 74% guarded. These are developer-level comparisons, not earned fresh-save balance.

Fresh-save campaign seed group 1, capped at 120 expeditions:

| Policy / starting design level | Result | Deaths | Highest temporary level | Banked gold |
|---|---|---|---|---|
| Cautious / 1 | Warden gate mapped at expedition 85; no boss defeated | 0 | 4 | 606 |
| Pressing / 1 | Warden gate mapped at 11, first key banked at 12; no boss defeated | 16 | 4 | 692 |
| Cautious / 9 diagnostic | Warden defeated at 3; Castellan gate opened at 26; campaign unfinished at 120 | 0 | 9 | 4,195 |

Only one campaign per policy/start was sampled. The level-9 diagnostic checks harness reachability and is not organic player progression. Routes, active farming loops, retreat and the separate boss report use 30 seeds per row, not the historical 300. These samples establish reproducibility and expose limits; they do not validate the release economy or the specification's 1,000-campaign requirement. Full roster refitting and intentional balance/golden updates remain R03/R07.

## Software performance and unverified gates

The first full browser run measured a 16x expedition at 11.1 seconds wall time, longest task 127 ms and median frame interval 16.7 ms. Heap use after forced GC grew from 23.4 MB after three expeditions to 23.9 MB after twenty (2.3%). A separate five-run headless report measured median expedition time 358 ms and median per-fight time 90 ms. Built JS totaled 1,669,972 bytes, 448,650 bytes gzipped against a 600,000-byte budget.

These are desktop/headless measurements. Physical phones, native lifecycle, audio audition, TalkBack/VoiceOver, low-memory/storage failures, human comprehension, closed testing, purchases/ads, production crash rates and store compliance remain unverified. Asset generation with Blender/Python was not rerun; this baseline exercises the checked-in runtime assets. Android release readiness is not established.
