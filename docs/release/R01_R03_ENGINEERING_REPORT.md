# Idle Souls — R01–R03 engineering completion report
**24 October 2026 · verified implementation state**

## Repository reconciliation

Source: `kavemankai/Idle-souls-`. The original handover baseline was `4756a9fd7cab1eed2798a0722ca83685ee03314c`; it matched main at the first audit. This report records subsequent merges separately to avoid implying unexecuted acceptance checks passed. The `AGENTS.md` constraints, release specification, deterministic simulator and existing goldens were preserved.

## Change log and provenance

| Stage | Pull requests and notable merges | Delivered |
| --- | --- | --- |
| R01 Android | PR #28, `549916b1` → main merge `f81caa5a` | Android SDK bootstrap on API 36/JDK 21/Node 22.16; verified nonempty debug APK, unsigned release APK, AAB, offline asset contents and uploaded workflow artifacts. |
| R02 durable save | PR #29, `fae1032a` → main merge `f4284331`; regression fix PR #31 → merge `c779e572`; recovery safety PR #33 integrated via #32 | Save V3, legacy migrations, atomic revision/transaction IDs, IndexedDB and Capacitor Android SQLite storage, backup/quarantine, command-journal deterministic replay, explicit resume/discard, terminal settlement CAS and fail-closed controls. |
| R03 earned progression | PR #30 merged into the **old feature branch**; integration PR #32 → main merge `d1bd3d6a` | Banked gold/mastery prices, capped permanent training/weapon/shield ranks, atomic idempotent purchases, camp UI and saved build preview, frozen launch bonuses using existing simulator stat allocation. |
| Release records | PR #34 → main merge `211061a2` | Updated R02/R03 work queue, backup-recovery status and physical Android validation procedure. |

**Important:** PR #30 alone did not put progression on main. PR #32 specifically corrected that integration error. PR #29 and PR #30 browser workflows initially failed one developer retreat-status assertion (66/67 passed), fixed in PR #31. These failures were not simulator golden failures.

## Executed automated evidence

| Evidence | Result | Workflow / tests |
| --- | --- | --- |
| R01 Android package set | **Passed** | [GitHub Actions 40064019423](https://github.com/kavemankai/Idle-souls-/actions/runs/40064019423): debug/release Gradle builds, offline assets and uploaded artifact. |
| R01 standard CI | **Passed** | [GitHub Actions 40064019417](https://github.com/kavemankai/Idle-souls-/actions/runs/40064019417): lint, typecheck, world checks, unit tests, browser, simulator regression and legacy checks across supported runners. |
| Post-merge retreat regression | **Passed** | [GitHub Actions 40066470990](https://github.com/kavemankai/Idle-souls-/actions/runs/40066470990): full browser suite + Ubuntu and Windows validation. Android [40066470937](https://github.com/kavemankai/Idle-souls-/actions/runs/40066470937) passed and uploaded an artifact. |
| Durable-save and earned progression unit tests | **Passed on Ubuntu/Windows for the feature heads** | Runs `40065557254` and `40065560839`: both OS build/test/simulator jobs succeeded; browser job initially failed the aforementioned retreat message and was subsequently repaired. |
| Genuine earned resource purchase | **Passed as a software test** | `tests/earnedCampaign.test.ts`: a new zero-resource, zero-rank save runs actual expeditions and settles rewards before purchasing first training rank. This is not proof of full-region/boss pacing. |
| Production-player backup and reload | **Passed as a browser/software test** | [Android workflow 40066816565](https://github.com/kavemankai/Idle-souls-/actions/runs/40066816565): 5 packaged-player Playwright tests passed, including malformed IndexedDB primary → validated backup export/restore/quarantine and unfinished expedition reload; Android debug/release artifacts also passed. |
| Mainline integrated Android package | **Passed** | [Android workflow 40066889745](https://github.com/kavemankai/Idle-souls-/actions/runs/40066889745) for `d1bd3d6a` (combined R01/R02/R03 implementation + recovery safety). |
| Final documentation-only merge `211061a2` | **Not asserted** | Its workflow status must be checked directly. Do not infer full CI success from preceding implementation branch results. |

## Invariants and limits

1. No simulator combat AI, RNG, world manifests, encounter fixtures or baseline golden outputs changed to make tests pass.
2. Active expeditions are persisted before dispatch and at periodic/event boundaries. Accepted retreat/redirect orders are durably checkpointed before simulation continues. Recovery replays the original seed, plan, accepted ordered commands and 30 Hz ticks, refusing mismatched fingerprints or incompatible content.
3. Recovery returns to the **last committed checkpoint**, **not necessarily the exact last visual frame** at OS process death. The bounded journal allows at most 90,000 ticks and 2,048 accepted commands; long recovery on a low-end phone is not yet measured.
4. Terminal settlement, upgrades, and dispatch/checkpoint mutations require revision checks and stable transaction identity. Retried operations may not credit rewards twice; rejected writes must not unlock production continuation. Failed storage pauses the player and disables Resume.
5. Banked mastery/gold alone buys permanent ranks. Unbanked loot, death caches, expedition-only XP and sanctuary bonuses do not buy ranks. The same earned build is frozen into the next expedition configuration; existing fixed-input simulations remain unchanged.
6. Signed Play Store-ready releases and native physical-device validation are outside the executed evidence.

## Release blockers

- **Physical Android device test still required:** force-stop and cold-restart during an active fight, after accepted orders, during settlement and during/after a purchase; check parity, single-payment invariants and saved bank on one low-end and one mid-range physical device.
- Exercise SQLite-specific low-storage, interrupted writes, damaged-primary backup recovery, repeated recovery/import, and Android process eviction. Existing browser IndexedDB test does not exercise native SQLite.
- Profile replay latency and memory on real phones, especially near the 90,000-tick ceiling.
- Organic mastery purchase is proven by a test but the first-region Warden completion, broader campaign pacing, offline farming and final product economy are not yet approved. R03/R04/R07 product requirements remain open.
- Existing R05–R10 content, billing, accessibility, human and store release gates remain separate.
- Any outstanding final-head GitHub workflow failure is a release blocker even if an earlier feature-head workflow was green.

## Recommended sign-off order

1. Verify full GitHub CI and all uploaded Android artifacts on the exact main commit to be shipped.
2. Perform the [R02 physical Android protocol](R02_DURABLE_RECOVERY.md) with an expendable test save; record device identifiers, build SHA, digest, before/after bank and any logcat errors.
3. Run an organic fresh-save journey to first-region completion and repeat across the planned seeded campaign sample before rebalancing prices or encounter difficulty.
4. Only then mark R02/R03 accepted. Do not call a GitHub runner, Playwright or Android emulator a physical device.

**Current engineering disposition:** R01 is complete for CI packaging; R02/R03 implementation is integrated into main with software evidence. Release sign-off for native crash durability, field device performance and campaign pacing remains **open**.
