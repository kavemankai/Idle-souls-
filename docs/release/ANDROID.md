# Android foundation — milestone 2

The Android application embeds the expedition planner and map. The animated O1 viewer remains a developer scene; its integration belongs to milestone 4. Milestone 2's physical low- and mid-range phone gate remains pending.

## Build

Use Node 22.16+ and Java 21. Install Android SDK platform 36, build-tools 36.0.0 and platform-tools. Set `JAVA_HOME` to the JDK and `ANDROID_HOME` to the SDK root (or configure Android Studio's local SDK path). Then:

```sh
npm ci
npm run test:player
npm run android:debug
npm run android:release
```

Both Android commands build the player web bundle, sync Capacitor and invoke the checked-in Gradle wrapper. Debug output: `android/app/build/outputs/apk/debug/app-debug.apk`. Release outputs: `android/app/build/outputs/apk/release/app-release-unsigned.apk` and `android/app/build/outputs/bundle/release/app-release.aab`. Release files are unsigned; production signing and store submission are not configured. Do not distribute them as a store-ready release. The generated Capacitor launcher artwork is still a placeholder.

Package ID: `io.github.kavemankai.idlesouls`. Minimum Android API 24; target/compile API 36. Capacitor core/Android/CLI 8.5.3 and App plugin 8.1.2 are pinned. The SDK/Java tools used locally are ignored under `.tmp/android-toolchain`; they are not required at that location. CI builds both variants and retains outputs for 14 days; remote CI has not yet been run.

## Runtime behavior

- `dist-player` always opens the expedition UI. Developer scenes, query-driven power changes, skip-to-end and global test hooks are unavailable. Player dispatch uses a new random seed and starts at the current prototype's earned-progress baseline (design level 1).
- Native pause/resume and document visibility are combined: both must permit foreground play. Backgrounding freezes simulation and silences music/effects. Returning preserves the in-memory run and requires an explicit Resume. Paused frame time never accumulates into catch-up simulation.
- Back closes an open drawer, pauses a running expedition, returns from Chronicle/history, closes the guide, then minimizes at camp. The live-run Back-to-plan button is disabled so it cannot silently discard a run.
- Music preference survives interruption, stale effects are discarded, and visual cue text remains available with sound off. Phone-call, focus-loss and external music behavior still require native device verification.
- Viewport cover plus Capacitor SystemBars CSS insets protect system edges. Retreat and playback controls stay fixed above the bottom safe area in the player build. Runtime audio is copied into the app for offline playback.

Active runs are still memory-only. Killing the process or reloading loses the active run; milestone 3 must implement durable checkpoints. This foundation does not add offline progression or claim process-death recovery. Browser file-download save export also needs a native export flow before relying on it as an Android backup.

## Device acceptance still required

Install the debug APK with `adb install -r android/app/build/outputs/apk/debug/app-debug.apk`. For each low- and mid-range physical phone, record model, Android version, WebView version and build commit, then:

1. Cold-launch in airplane mode; plan, dispatch, retreat, extract and read the Chronicle. Verify audio and assets need no network.
2. Background/foreground repeatedly during travel and combat, lock/unlock, and rotate. No ticks or rewards should accrue while away; Resume must continue the same run without a time jump.
3. Test gesture and three-button Back, drawers, history, camp and a paused expedition. No Back path may discard a live run.
4. Test calls, notifications, music from another app, sound-off preference and disconnected headphones. Record actual audio-focus behavior; fix any overlap/resume failure before closing R01.
5. Check portrait/landscape, cutouts, gesture bar, large text, TalkBack, scroll and Retreat visibility. Record cold-start time, memory and responsiveness on both devices.
6. Force-stop/relaunch to characterize the known active-run loss. It is a milestone-3 blocker, never a passing durability result.

## Local verification — 2026-10-24

Windows, Node 24.15.0, Java 21.0.12.1, SDK 36, Gradle 8.14.3 / AGP 8.13.0. AGP also installed its default build-tools 35.0.0 alongside 36.0.0.

- Lint, TypeScript, world generation, portable math and both web builds pass. All 221 unit tests pass. Simulator guards: 2,340 and 78 identical cases, each `different 0`; no simulator or golden changes.
- The production player passes three browser tests: 360×640 and 844×390 layouts with an injected bottom inset, disabled developer entry points, and actual Ogg audio bytes. Screenshots were inspected locally.
- Broad developer browser suite: 66/67 pass; the sole audio assertion failure was fixed and passed in a targeted rerun (1/1). This includes the new background/Back regression. The full suite was not rerun after that test-only repair; both outputs are retained in `evidence/android-browser-tests.txt` and `evidence/android-audio-retest.txt`.
- Debug APK and unsigned release APK/AAB builds pass. Debug v2 signature verifies; APK inspection confirms the player scripts and embedded audio. Release bundle verification reports unsigned. Artifact sizes and SHA-256 hashes are in [android-artifacts.json](evidence/android-artifacts.json); build logs and player results are in this evidence directory.
- Debug APK: 16,304,824 bytes. Release APK: 15,324,825 bytes. Release AAB: 14,742,930 bytes. Main player JavaScript: 262,877 bytes, approximately 82 KB gzip, excluding developer Phaser scenes.
- `adb devices -l` returned no connected devices. Physical-device checks and remote CI are unverified.

The initial broad browser run stalled while the local toolchain was being created. Vite now ignores SDK/Gradle/build directories. On a clean server, the audio test exposed a separate old assumption: it accepted only HTTP 200, while real Ogg range requests return 206. The test now checks a successful audio MIME response and Ogg magic bytes; its targeted rerun passes. Runtime audio is now included in production output, which previously disabled Vite's public-directory copying.

## Dependency review

`npm audit` on 2026-10-24 reports three moderate findings through the dev-only chain `@capacitor/cli -> xcode -> uuid` (GHSA-w5hq-g745-h8pq). They are not included in the Android runtime bundle. Avoid an unrelated forced downgrade; track a compatible upstream fix. Full audit evidence is in `evidence/android-audit.json`.

References: [Capacitor 8 toolchain requirements](https://capacitorjs.com/docs/updating/8-0), [App lifecycle and Back APIs](https://capacitorjs.com/docs/apis/app), [Android SDK tools](https://developer.android.com/studio).
