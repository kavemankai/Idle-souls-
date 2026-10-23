# Idle Souls — Codex Visual Production Handoff
**Baseline:** GitHub main at a5d93d4 (design library v0.17)
**Scope:** Begin implementation with the visual vertical slice; protect existing game-design locks and leave tactical combat authoritative to its separate workstream.
**Execution mode:** Work autonomously through reasonable implementation choices, run checks, produce screenshots and commit coherent increments. Stop only for a change to an explicitly locked decision or an essential unavailable dependency.
**Status:** This is an implementation instruction, not a declaration that the visual assets, Phaser game or Blender files already exist.

## 1. Assignment and product goal
You are the lead developer and technical artist for Idle Souls, a standalone top-down 2D autonomous dungeon-crawling RPG. Build its first credible visual milestone before broadening world systems: **one polished, readable Old Road (O1) scene**, a 75-degree orthographic Blender character-rendering proof, and a Phaser 4 TypeScript presentation capable of playing directional character clips without altering combat calculations.

Target visual experience: a small, crafted ruined-road diorama with a sword-and-shield adventurer, an Ashen Sentry and a Mireling. It must feel markedly more accomplished than primitive circles or flat debug tiles while remaining understandable at normal desktop and phone zoom. "Ashen Reliquary" (painted miniature dark fantasy, ruined sacred/military stonework, muted materials, restrained warm/spectral accents) is the **current visual candidate, not an approved locked style**. Produce a reversible art test and evidence board for creator review, not hundreds of irreversible assets.

Do **not** make the game dependent on RUN.world. Phaser/Vite is the standalone front end; platform-specific adapters may be added later.

## 2. Actual repository starting state — verify first
Repo: https://github.com/kavemankai/Idle-souls-
At this handoff the main branch has **49 source/documentation/map files**, without package.json, AGENTS.md, runtime src, Phaser boot code, or game tests. It is a design baseline, **not a playable repo**. Confirm that before editing, and preserve any newer incoming changes.

Read the following in order:
1. autonomous_dungeon_design_library/00_START_HERE.md — full modular index and LOCKED / PROPOSED / OPEN convention.
2. autonomous_dungeon_design_library/16_DECISIONS_AND_OPEN_QUESTIONS.md — authoritative decision status, especially L04, L11–L24.
3. autonomous_dungeon_design_library/28_VISUAL_STYLE_AND_ART_DIRECTION.md — proposed visual language and palette.
4. autonomous_dungeon_design_library/29_OLD_ROAD_ART_PRODUCTION_AND_STYLE_VALIDATION.md — specific O1 scene and acceptance tests.
5. autonomous_dungeon_design_library/29A_OLD_ROAD_ART_ASSET_MANIFEST.csv and 29B_ART_REVIEW_MATRIX.csv — asset queue and evidence list.
6. autonomous_dungeon_design_library/29C_OLD_ROAD_ARTIST_HANDOFF.md.
7. autonomous_dungeon_design_library/30_HYBRID_BLENDER_CHARACTER_SPRITE_PIPELINE.md, 30A/30B, 31_LOCKED_75DEG_CAMERA_AND_CHARACTER_SPRITE_STANDARDS.md, 31A/31B, 32_SELECTIVE_EIGHT_DIRECTION_ANIMATION_STANDARD.md and 32A_DIRECTIONAL_CLIP_MATRIX.csv.
8. autonomous_dungeon_design_library/14_COMBAT_AI_INTERFACE_CONTRACT.md, 26_MAP_LAYOUT_AND_ENCOUNTER_ZONES.md, and root map schedule/connection CSVs.

Some earlier documents contain historical statements that a now-resolved camera/facing question is "open." **Apply later explicit locks L22, L23 and L24**; do not reopen those choices. The index may still label its version 0.16 despite the v0.17 source snapshot; correct stale header/navigation only, without rewriting rules.

## 3. Immutable requirements for this work
- L01/L04: The game is top-down 2D. First playable kit is **one sword and one shield**.
- L11: Tactical combat is developed separately; the presentation must not invent/replace the authoritative AI, damage, blocking, dodging, stamina, hitboxes, timing or enemy selection.
- L22: **Hybrid production is LOCKED.** Characters originate as editable rigged/animated Blender models and are rendered to 2D sprite frames/atlases. Environments and VFX are hand-painted 2D assets with editable sources. Blender is an authoring tool, not a runtime 3D engine.
- L23: Character sprite render camera is **fixed orthographic, approximately 75 degrees above the horizontal XY plane** (15 degrees from directly overhead). Rotate the actor under the stationary camera. This is **not isometric/perspective gameplay**.
- L24: Eight compass facings **N, NE, E, SE, S, SW, W, NW** for locomotion and guard. Attack clips have per-move **selective** authored view sets based on honest silhouettes/attack direction; test all eight real headings even when using fewer authored frames.
- Do **not** horizontally mirror an asymmetric sword/shield character to save directions unless proven not to swap hands or misrepresent the move.
- Draw sprites from a stable **ground/feet pivot** with trim offset metadata. Sprite bounds and blade appearance never change actual combat collision.
- Simulated world and 30Hz combat outcomes take precedence over art frame timing.
- Existing strategic promises—hard forbidden-region avoidance even during retreat, camp-only banking, permanent gate opening, deliberate encounter commitment and keys banked before use—must not be contradicted by fake UI. These systems are **not** required to be completed during visual P0.
- Overall "Ashen Reliquary" art style, exact colour palette, frame sizes, atlas limits, 2D game-camera zoom, camera azimuth and per-attack direction counts are **PROPOSED/OPEN**. Record any defaults as trial choices, never new creator locks.

## 4. Work order — build the smallest real visual proof

### Milestone V0: Clean application foundation
- Audit the tree for newer code and follow any existing instructions. If still docs-only, create a Phaser 4 + TypeScript + Vite app with pinned dependencies, npm scripts, deterministic test runner, a simple README and concise AGENTS.md pointing to the design library.
- Keep simulation concerns separate from rendering. Suggested folders:
  - src/scenes — OldRoadVisualScene and SpriteCalibrationScene
  - src/presentation — camera, environment, sprite selection, visual effects, HUD
  - src/contracts — typed presentation-state and future combat adapter boundary
  - assets/environments/source and assets/environments/runtime
  - assets/characters/source and assets/characters/runtime
  - assets/vfx/source and assets/vfx/runtime
  - tools/blender and tools/atlas
  - tests and docs/visual_proof
- Do not import the RUN SDK as a dependency of world/combat logic. Do not add a new levelling model, generic RPG framework or second playable class.

### Milestone V1: Old Road O1 illustrated environment
- Use the existing O1 proposal as a starting coordinate/layout reference: Outer Road, center approximately (950,1750), clear area 480 × 440 simulation units. The 32-unit grid and 4 source px/world unit are **authoring trial values, not approved art specifications**.
- Paint or construct **editable layered 2D masters**, then export runtime tiles/decals/props: worn paving, earth borders, moss cracks, broken military/sacred wall fragments, a recognisable pillar/cover silhouette, west/east travel openings and quiet atmospheric lighting.
- Use composed, reusable layers. Do not flatten the whole room into one screenshot background. Keep props/collision annotations separate from painted pixels.
- Produce a visibly intentional value hierarchy: walkable floor quiet, walls and cover distinct, interactive subjects highest priority. Avoid noisy mud/stone that hides telegraphs.
- At this stage, it is acceptable to simulate walk paths and action poses **only when clearly labelled VISUAL-ONLY**, as long as the renderer never claims these are proven AI decisions.
- Preserve future walls/line-of-sight semantics by maintaining collision-proxy outlines or debug overlays; do not pretend a decorated wall has functional collision until tested.

### Milestone V2: Reproducible Blender 75-degree camera + mannequin
- Detect the installed Blender version. If Blender is available, create a checked-in editable .blend calibration scene and a reproducible Blender Python export script. If unavailable, commit the scripts and a clear setup/run guide; **do not claim rendered Blender art exists**.
- Fix one orthographic camera at +75 degrees above the ground plane (XY ground, +Z height), one lighting/material/colour preset and one ground origin. Record orthographic scale, azimuth, axes, pixel density and feet pivot mapping.
- Make an **asymmetric sword/shield calibration mannequin**; render all eight directional locomotion and guard samples under that fixed camera. Verify handedness, N/NE/E/S mapping, stable contact point and no cropped equipment.
- Record a compass/contact sheet and the exact blender commands for regenerating output.
- Establish metadata per clip/frame: actor ID, action, compass facing, source frame, timing/phase, trim rectangle, source canvas, feet pivot, render preset hash/version, atlas/page and licence/provenance.

### Milestone V3: One character worth looking at
- Build the first **sword-and-shield adventurer** as an editable stylised 3D character/rig. Prioritise silhouette, weapon separation and readable shield posture; don't overinvest in tiny ornaments that vanish at game zoom.
- Deliver eight-view locomotion and guard. For light/heavy attacks, start with a **justified selective facing set** (not a locked universal four), including N, NE, E, S and a shield-occluded direction stress test. Add angles where attack telegraphs or weapon depth become misleading.
- Define the minimal useful poses: idle, travel, guard, light wind-up/contact/recovery, heavy wind-up/contact/recovery, dodge and reaction. Do not multiply full 8-way frame sets for every move before the first QA pass.
- Make a reproducible sprite export/trim/atlas step with **stable feet anchors**. Suggested 256×256 hero/Sentry and 192×192 Mireling **source** frames are candidates only; choose measured runtime size, not arbitrary large sheets.
- Show the hero in Phaser at gameplay zoom on bright paving and dark wet stone. Provide before/after comparisons against the earlier geometric prototype only if that prototype is actually available.

### Milestone V4: Distinct enemy proof and truthful VFX
- Build an **Ashen Sentry** (shielded humanoid; separate guard/bash/slash silhouette) and **Mireling** (small hooked low creature; coil/bite/leap), from the proposed roster. These are priority candidates, **not proof the entire nine-enemy roster is locked**.
- Maintain eight directional locomotion/guard **where the actor has a guard action**. For Mireling, there is no instruction to invent a shield guard.
- Paint restrained 2D attack tells and VFX: ordinary strike arc, heavier attack anticipation, guard impact, Mireling leap coil and landing cue, and subdued hit sparks. Warning shape, timing and location must match actual combat data once available.
- Implement a transparent presentation adapter. It reads actor transform, facing, action ID, phase/tick and visibility; it must never compute authoritative damage or decide AI movement. For the initial art viewer, a **predefined labelled animation sequence** is acceptable; keep it isolated from simulation modules.
- Show a solo Sentry sequence, solo Mireling and staged mixed composition, with camera framing and a minimal HUD/legend. Preserve UI readability and 44px-class touch targets where appropriate.

### Milestone V5: Integration gate, only when authoritative combat code is present
**Important:** The repository at handoff does not contain the actual combat JavaScript. Earlier user-supplied files include a main combat simulation and a separately forked **deep-stats split** variant; the two must **not** be silently conflated. Audit their lineage and obtain the creator/current combat-workstream choice before treating either as authoritative. Do not copy a random old combat-bench inline script into the game.
- Bridge to the selected simulation without rewriting its logic. The earlier bench is deterministic at 30Hz; future source may have changed, so inspect current move IDs and timings.
- Fixed-step simulation + interpolated renderer. Sprite clip pose follows the **sim's** wind-up, active and recovery timing, plus guard/dodge/projectile/contact events actually exposed. If events are missing, document adapter gaps rather than inventing hit confirmations.
- Run identical seeds/headless fights before/after sprite integration and compare outcome and important events. No changes to HP, combat doctrine, hit ranges, invulnerability or AI just to make animations line up.
- Full route, key and boss gameplay belong to later workstreams; do not block visual approval by attempting the entire RPG.

## 5. Acceptance and screenshot evidence — do not mark complete without proof
Capture real in-engine shots and/or footage with build SHA, viewport and zoom. Required evidence:
1. Desktop 1280×720 Old Road establishing view with clear west/east travel and distinct cover.
2. 390×844 portrait and 844×390 landscape layouts showing the adventurer at intended scale and clear key HUD controls.
3. Bright-floor and dark-floor grayscale contact sheets demonstrating hero/Sentry/Mireling recognition without labels.
4. Eight-facing mannequin and adventurer locomotion/guard sheet at the **locked +75°** camera.
5. At least one light and heavy attack sequence and a Sentry bash/Mireling leap cue; include authored-vs-sampled direction matrix.
6. Overlay showing sprite feet pivot, world position and collision/proxy bounds independent of the rendered weapon.
7. Atlas report: number of frames/directions, packed textures, decoded estimated GPU memory, transfer sizes and any measured phone performance; don't invent performance numbers.
8. Asset provenance/editability report: .blend rig sources, export scripts, painted masters and licence notes.
9. When combat is integrated: seeded parity log confirming renderer has not changed game outcomes.
10. Updated review matrix based on 29B and 30B, with statuses **PASS / FAIL / BLOCKED / NOT TESTED** and reproducible evidence paths.

Review fail conditions: mirrored sword/shield handedness, drifting ground pivot, incorrect attack quadrant, clipping, noisy unreadable floor, wrong collision cues, deceptive telegraph timing, fake screenshots, missing editable sources, or unverified claims that combat or lower-end mobile performance passed.

## 6. Repo hygiene and autonomous delivery
- Keep each milestone in a separate coherent Git commit with messages such as feat(visual): bootstrap Phaser scene; art(blender): add camera calibration; feat(visual): hero directional playback.
- Do not force-push or overwrite other contributors' commits. Rebase/merge safely if the branch advances. Prefer a visual milestone branch plus PR if others are actively implementing combat; otherwise commit incremental changes safely and report the chosen branch.
- Update README with actual install/run/build/test commands. Add source asset provenance and exclude generated caches. Avoid committing huge unnecessary intermediate frame sequences if packed/derivable assets suffice; retain editable masters and reproducible scripts.
- Treat new numeric styling choices as **prototype defaults**, listing them in a short decision/evidence log; do not silently promote them to LOCKED in 16.
- Use actual installed versions and check Phaser 4 APIs against the package/documentation. Do not assume the old RUN visual HTML proof has been committed; it is not in this repository snapshot.
- If Blender, a browser automation tool or visual preview is unavailable, finish other useful stages, document precise blocker/reproduction steps, and mark unverified checks honestly.
- No extra enemy roster, gear classes, new currencies, monetisation work, full 17-node world, finished boss fights or unapproved AI changes in this visual-first delivery.

## 7. Definition of done for the first meaningful deliverable
A fresh clone can install dependencies and launch a real Phaser scene presenting a **cohesive Old Road room**, the character test assets genuinely available at that moment, correct feet-ground coordinates, eight-way movement/guard presentation where implemented, clear visual attack cues, screenshot evidence and documented source regeneration. A user can see why the art approach is promising and where it still needs work.

If Blender is available, the ideal first deliverable includes the **editable 75° mannequin plus actual Blender-exported adventurer proof**. If not, ship the best supported scene and reusable export scripts, clearly stating the missing Blender render is still a blocker; do not substitute a 2D circle demo and describe it as the finished art production gate.

At the end report: exact commit(s)/branch/PR; what is demonstrably playable; screenshots and source paths; commands/results for lint, typecheck, build, tests; visual review pass/fail matrix; performance measurements if actually run; unresolved design approvals; and the **single highest-value next implementation step**.

**Do not ask for ordinary design preferences mid-task. Make reversible trial choices, log them as PROPOSED, and deliver evidence. Ask only before violating a LOCK or when the required authoritative source cannot be identified.**
