---
name: game-release-artifact
description: Build or verify a project-native web or Android artifact and record reproducible evidence.
---

# game-release-artifact

Run from the game repository root. In the standalone toolkit, use the same paths without the `.game-toolkit/` prefix.

Use the project's pinned build, Gradle or Godot export commands. For a Capacitor debug build run `node .game-toolkit/adapters/android/verify-apk.mjs --repo . --apk <relative-path>`. Use `node .game-toolkit/scripts/collect-evidence.mjs --repo . --file <path>` for web outputs and logs. Verify APK structure/signing with the Android toolchain and record signing and install separately. Keep credentials out of the toolkit and package only cleared assets.
