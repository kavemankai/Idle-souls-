# R02 — durable expedition recovery (engineering record)

Status: implementation in **draft PR #29**. The authoritative acceptance evidence is GitHub Actions for that PR, not this text. No physical-device crash test has been conducted.

## Schema and ownership

- New `SaveV3` is intentionally separated from the existing V2 fixtures. It contains `revision`, `rulesVersion`, `contentVersion`, `activeExpedition`, a permanent-rank record and processed transaction identities. Existing bank, map, cache, key, boss and settings data migrate without an economic grant.
- The envelope uses the existing canonical checksum; malformed nested fields, invalid world identities, mismatched checksum, negative resources, invalid versions and impossible rank counts are refused.
- Migration chain is v0 → v1 → v2 → v3. The former browser localStorage entry is read-only and left in place during successful migration. Damaged legacy input is not overwritten.
- Core domain `settle` is unchanged. The durable wrapper rejects a settlement if it has no matching active expedition, the expedition counter changed, or the dispatch seed disagrees with the Chronicle.

## Atomic storage

Browser: `IndexedDbDurableRepository` uses one `readwrite` transaction per revision-checked change, writing the old primary to `backup` and the new primary to `main`; `oncomplete` marks success. A denied API or quota write is an error, not a memory fallback.

Android: `NativeSqliteDurableRepository` uses the Capacitor `IdleSoulsSave` bridge. Java's `SQLiteOpenHelper` stores primary, backup and a transaction-ID table, all under one Android SQLite transaction with expected revision enforcement. The system's SQLite runtime is used without additional npm dependencies. Java compilation in CI is **not** a replacement for runtime-device testing.

Storage failures pause the player. They never issue a success acknowledgement. Imported saves require explicit replacement confirmation; the prior primary is copied to quarantine, and a valid prior primary remains a backup.

## Exact simulator continuation

`ExpeditionCommandJournal` records every successfully accepted retreat/redirect with its authoritative `world.tick`. A checkpoint freezes the seed, full plan, start knowledge, original content/rules versions, tick, ordered commands and a fingerprint that includes current fight data, progression, world result, intents and pending orders.

Restore starts the **existing** `startExpedition` and replays each deterministic tick with accepted orders at their original simulation ticks. It refuses an incompatible version, an invalid order, a run that terminates early, a replay beyond 90,000 ticks or a fingerprint mismatch. It does **not** reconstruct an enemy or overwrite a simulator state to conceal a parity failure.

The running player writes a committed dispatch checkpoint before it enables the run, checkpoints approximately every 60 simulation ticks and on room/loot/world events, commits accepted player orders before running another tick, and persists the terminal state before atomic settlement. Recovery resumes the **last committed checkpoint**, so unsaved gameplay since that point may be replayed rather than recovered at the exact wall-clock moment of process death. No unsaved carried loot is banked by recovery.

## Safety constraints and verification

- No changes to `combat/deep-stats/combat-sim.js`, its fixtures, room manifests or golden comparisons.
- Automatic tests: V0/V1/V2 import, version-3 checksum/invariants, failed writes and stale revisions, identical combat-fight continuation and later Chronicle, order timing, checkpoint/camp settlement idempotency, and optional-configuration serialization.
- Mandatory CI before merge: `npm run lint`, `npm run typecheck`, `npm test`, both simulator golden checks, `npm run test:browser`, `npm run test:player`, `npm run android:debug` and `npm run android:release`.
- Physical validation outstanding: Android force-stop/relaunch in the middle of a live fight; app background/foreground with pending writes; out-of-space; native corrupt primary with valid backup; repeated import; restore after OS process eviction; slow-device replay latency. Browser reload and injected IndexedDB corruption are not physical validation.
- Recovery ceiling: 90,000 ticks / 2,048 accepted orders. Beyond the bound the game pauses rather than claiming an exact restore. Profile a safe duration on entry-level Android and either introduce full-state snapshots or adjust run length before release.
- The player now exposes **Inspect backup**, **Export verified backup**, and confirmation-gated **Restore this backup** when a primary fails validation. Browser Playwright exercises actual IndexedDB quarantine and read-back (`tests/player/durableRecovery.spec.ts`). Android SQLite backup recovery and process-kill behavior still require native-device validation.
- Do not label a passing GitHub Actions build as a validated install, force-stop, device cold start or signed release.

## Transaction boundaries

1. `dispatch:<expeditionId>`: commit new active checkpoint, without changing bank.
2. `checkpoint:<expeditionId>:<tick>:<commandCount>`: revise checkpoint, never rewind tick or drop an already accepted order.
3. `settle:<expeditionId>`: settle one terminal Chronicle, clear the active run in the **same transaction**, pay once and record the transaction identity.
4. `discard:<expeditionId>`: explicit loss of carried loot without calling `settle`.
5. Permanent-upgrade purchases in PR #30 also use the same revision and transaction-ID contract and cannot execute while an active expedition exists.

Keep R02 **open** until all acceptance checks and physical force-stop evidence are recorded.

## Current implementation evidence (24 October 2026)

- PR #29 implemented V3 transactional saves, deterministic command-journal replay and SQLite/IndexedDB stores; GitHub Android workflow `40065557182` completed successfully with a package artifact. Its browser-suite run `40065557254` failed one *retreat status text* test, while Ubuntu/Windows + simulator regressions passed.
- PR #31 corrected the developer-harness message regression and merged into main. GitHub CI run `40066470990` passed browser specs and Windows/Ubuntu; Android run `40066470937` completed successfully with artifacts.
- PR #33 introduced a fail-closed resume guard and confirmed backup controls. Browser reload/corrupt-primary assertions are implemented in `tests/player/durableRecovery.spec.ts` and are to be evaluated against the final merged-head workflow, not assumed passed by source presence.
- A successful CI build proves package contents and automated software checks, not a physical force-stop/cold-start recovery.

## Physical Android acceptance protocol

Use a **test device and an expendable test profile**. Preserve any valuable existing saves by exporting first. Do not clear Android app data between force-stop and relaunch.

1. Install the verified **debug** APK from the current head's `android-foundation` artifact, then launch the application:
   ```sh
   adb install -r app-debug.apk
   adb shell am start -n io.github.kavemankai.idlesouls/.MainActivity
   ```
2. Start an organic expedition. During active combat, record the visible room, elapsed time, HP, enemy state and progression. Capture `adb logcat` separately.
3. Kill the **process without clearing storage**, then cold-launch:
   ```sh
   adb shell am force-stop io.github.kavemankai.idlesouls
   adb shell am start -n io.github.kavemankai.idlesouls/.MainActivity
   ```
   Verify that the saved expedition is offered, the recovered checkpoint is deterministic (the game's saved state and its future Chronicle/digest agree with a no-kill seeded control) and carried rewards were not banked on restart.
4. Repeat at least three times: during combat, after a recorded order, and between reaching camp and final settlement. Confirm a settlement is counted once after relaunch and once after repeated button presses.
5. Purchase the first affordable earned upgrade at camp, force-stop and relaunch, then verify the bank was charged once and its permanent rank applies to the *next* expedition.
6. Repeat with simulated native write failures, full storage and a corrupt **test database** with a valid backup, using an isolated emulator or sacrificial test device; do not alter a live player's database.
7. Record model, Android version, build SHA, original/resumed tick, seed, Chronicle digest, bank before/after, debug logs and pass/fail. Exercise one low-end and one mid-range physical phone.

**Stop release** on any irrecoverable legitimate bank loss, duplicate reward or purchase, unexpected change in deterministic replay result, unsafe continuation after failed storage or inability to restore a valid backup. Browser-process reload is useful supporting evidence, not a replacement for this protocol.
