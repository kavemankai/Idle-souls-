# Autonomous Dungeon Crawler — Design & Art Production Library

**Design library version:** v0.17 (Workshop 24, 2026-10-23).

This repository contains the modular game-design, combat interface and art-production specifications, plus the combat simulation in `combat/`. There is no full game yet. The combat code (deterministic sim, adventurer AI, enemy AI, balance runner and bench page) is the source of truth for combat numbers and overrides the design library where they disagree. Read `combat/CLAUDE.md` and `combat/CLAUDE_CODE_COMBAT_HANDOFF.md` before changing it.

Latest creator-lock: **L24** — eight-direction character locomotion and guard sprites; selective per-move directional animation coverage for attacks. Also preserve hybrid Blender-to-2D pipeline L22, fixed 75° orthographic camera L23 and all game/economy locks L01–L21.

Read `autonomous_dungeon_design_library/00_START_HERE.md`, `16_DECISIONS_AND_OPEN_QUESTIONS.md`, `32_SELECTIVE_EIGHT_DIRECTION_ANIMATION_STANDARD.md` and `32A_DIRECTIONAL_CLIP_MATRIX.csv`.

**GitHub destination is not configured.** Do not assume this design library belongs in the generic `Run.world-starter-` repository.
