---
name: game-mobile-qa
description: Triage mobile touch, layout, lifecycle, accessibility and device performance checks for a game.
---

# game-mobile-qa

Run from the game repository root. In the standalone toolkit, use the same paths without the `.game-toolkit/` prefix.

Use `node .game-toolkit/scripts/doctor.mjs` to check tools. Follow `.game-toolkit/docs/MOBILE_QUALITY_GATES.md`. Record browser/emulator/physical evidence in separate columns. For each phone capture model, OS, WebView, build hash and measured values. Leave missing measurements untested.
