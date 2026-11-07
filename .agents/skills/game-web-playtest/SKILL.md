---
name: game-web-playtest
description: Capture and verify mobile and desktop browser evidence for a DOM, Phaser, PixiJS or Vite game.
---

# game-web-playtest

Run from the game repository root. In the standalone toolkit, use the same paths without the `.game-toolkit/` prefix.

Use the game’s locked Playwright and existing end-to-end tests first. Run `node .game-toolkit/adapters/web/playtest.mjs --project <game> --url <loopback-preview> --scenario <reviewed-module> --out <new-dir>`. The adapter covers 360×640, 390×844, 844×390 and desktop. Review screenshots and report any HTTP, console or scenario failures. Use project scenarios for legal input, save/reload, debug isolation, audio, lifecycle and safe areas. Record physical usability separately.
