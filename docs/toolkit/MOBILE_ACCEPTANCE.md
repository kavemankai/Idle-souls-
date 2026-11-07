# Idle Souls toolkit pilot

Baseline `bfbb9390b53c8ad4c6f7ec621a7ed9712d974c37` on `main`. Product priorities come from [release/SPEC.md](../release/SPEC.md) and [release/ISSUES.md](../release/ISSUES.md).

After the existing `npm run android:debug`, run `node tools/toolkit-debug-apk.mjs`. The JSON report includes bytes, SHA-256, ZIP entry count, and checks for the Android manifest, web entry and bundled wind ambience. Run Android SDK `apksigner verify --verbose` on the APK to verify signing. The installed skills and evidence command are separate from the existing Android CI.

| Gate | Local result |
| --- | --- |
| Baseline | `npm run check` passed: 242 unit tests, 67 browser tests, and 2,340/78 simulator matches with `different 0` in both. |
| Player browser | `npm run test:player` passed 7 tests, including 360×640 and 844×390 player layout, offline audio bytes, durable recovery and production debug isolation. |
| Android package | `npm run android:debug` produced a 16,756,903-byte APK using Java 21.0.12.1 and Android SDK 36. The report counted 938 entries. SDK apksigner verified APK Signature Scheme v2. SHA-256 is `8a73571e599ac958b33f9cb0909ca375fd43e4ba28bd8d9cea8fe03964592d8f`. |
| Emulator | Untested. ADB returned no devices. |
| Physical phone | Untested. Run the device checklist in [release/ANDROID.md](../release/ANDROID.md) and record model, Android/WebView version and APK digest. |

On device, prioritize Back during live combat, background/foreground and forced-stop recovery, offline audio and resume, cutout/gesture insets, TalkBack and cold-load/frame pacing on low- and mid-range hardware. Record actual measurements beside the build digest. See [mobile quality gates](../../.game-toolkit/docs/MOBILE_QUALITY_GATES.md) for the test matrix.
