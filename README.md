# Idle Souls — Old Road visual proof

A standalone Phaser **4.2.1** / TypeScript **7.0.2** / Vite **8.3.5** visual workbench. Explore a modular Old Road diorama with Blender-rendered adventurer, Ashen Sentry and Mireling tests. **VISUAL-ONLY:** movement and exhibition poses are artist controls; combat, collision, extraction and progression are not implemented. The authoritative combat source is absent.

This repositor contains the modular game-design, combat interface and art-production specifications, plus the combat simulation in `combat/`. There is no full game yet. The combat code (deterministic sim, adventurer AI, enemy AI, balance runner and bench page) is the source of truth for combat numbers and overrides the design library where they disagree. Read `combat/CLAUDE.md` and `combat/CLAUDE_CODE_COMBAT_HANDOFF.md` before changing it.

```sh
npm ci
npm run dev
```

Open http://localhost:5173. WASD/arrows (or touch arrows) move the visual adventurer; G selects guard, J light, K heavy, Space pauses animation. Select all eight facings, isolated or mixed compositions, poses, reduced effects and feet/proxy overlays. `?scene=calibration` shows the compass board; `?scene=silhouette` shows unlabeled bright/dark recognition samples. `?scene=attacks&actor=adventurer&clip=light` shows all eight requested attack headings and any explicitly unauthored views. No sprites are mirrored or rotated to invent a missing perspective.

```sh
npm run lint
npm run typecheck
npm test
npm run test:browser
npm run build
npm run preview
```

Preview production at http://localhost:4173. Browser checks use system Chromium when available, otherwise run `npx playwright install chromium`; optionally set `CHROMIUM_PATH`. `PREVIEW_URL=http://127.0.0.1:4173 npm run evidence` captures actual Phaser screenshots and software-renderer measurements. Build IDs are embedded at build/server startup; restart/rebuild after commits to capture a new SHA.

Asset regeneration (Blender **4.3.2**, Python **3.12**, pinned Python packages):

```sh
python -m pip install -r tools/requirements.txt
npm run assets:environment
npm run assets:characters
npm run assets:atlas
npm run assets:validate
blender -b -t 4 --python tools/blender/validate.py
npm run assets:reproduce
```

`assets:characters` exports the retained editable `.blend` sources, preserving manual modelling/rig edits. `assets:characters:rebuild` **reconstructs and overwrites** those masters from the procedural authoring script; use only when intentionally resetting the trial models. Generated untrimmed frames are ignored. Packed PNGs, complete metadata and editable masters are checked in, so Blender is not required to play. Production bundles contain runtime assets only, excluding `.blend`, SVG masters, metadata reports and intermediate renders.

See [delivery and evidence](docs/visual_proof/DELIVERY.md), [reversible decisions](docs/visual_proof/DECISIONS.md), [source provenance](assets/PROVENANCE.md) and [review matrix](docs/visual_proof/review-matrix.csv).

[The production handoff](CODEX_VISUAL_PRODUCTION_HANDOFF.md) and [design library v0.17](autonomous_dungeon_design_library/00_START_HERE.md) remain authoritative. Preserve L22 Blender-to-2D, L23 fixed +75° orthographic camera and L24 eight-way locomotion/guard with selective attacks. The Ashen Reliquary look remains **PROPOSED**. No RUN dependency or combat implementation has been introduced.
