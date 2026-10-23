# Reversible visual trial decisions

2026-10-23, visual milestone branch. None of these entries changes the design locks.

- Ashen Reliquary is a **PROPOSED** appearance. Muted olive/slate ruins, teal adventurer cloth, oxblood Sentry cloth, ivory Mireling hooks; editable material colours and 2D SVG groups make replacement inexpensive.
- Fixed Blender camera **+75° orthographic** follows L23. Trial azimuth −90° (camera south), target ground origin, orthographic scale 5.4, 192² source canvases. Actor local +Y is north; rotate root −45° per compass step. Lighting never follows root.
- Blender 4.3.2 Workbench studio lighting, material colours, cavity and restrained silhouette outline give a broad-plane miniature test. Physical key/fill references are retained for future EEVEE shading. This is a stylised rig proof, not a final painted character approval.
- Runtime scale: 22.4 trial world units/Blender unit, separate from simulation collision. Source canvas maps to 120.96 world units. Camera zoom is responsive; no collider is inferred from alpha.
- Locomotion four pose samples and guard enter/hold/release three samples at **all eight** facings. Light and Sentry slash/bash initially use N/NE/E/S/SW (SW tests shield-side occlusion). Heavy and low Mireling leap use all eight because asymmetric overhead sword depth and creature launch direction need additional views. Other attack headings remain explicitly unavailable for selective clips pending QA; never use a false quadrant.
- All animation timing and user movement here are **VISUAL-ONLY fixtures**. Preview action phases deliberately use readable exhibition durations. No simulation timing, hits, damage, defense, stamina or enemy decisions exist here.
- Environment masters are modular hand-authored vector-paint SVGs with named editable paint groups, exported by CairoSVG. Broad colour planes and sparse edge brushwork are the reversible first paint pass. They are not a flattened scene background. Further freehand paintover can replace individual groups.
- O1 clear floor remains the proposed 480×440 at world center (950,1750); east/west thresholds are visual routes only. Cover and wall proxy outlines are proposed annotations, **not tested movement/LOS/projectile collision**. There is no gate, sanctuary, loot or fake extraction button.
- Phone portrait uses a local adventurer-focused crop, while desktop and landscape use the full diorama when space permits. Orientation remains open.

Combat integration V5 was BLOCKED at eaf4475 (no combat source in the repository). It is now connected for O1 only, see the entry below. The visual study still uses no simulator.

2026-10-23, O1 traversal slice (`?scene=o1`). All values below are **trial settings**, kept in `combat/rooms/o1.json`, none is a design lock.

- Source: the deep-stats split in `combat/deep-stats/combat-sim.js`, the source Kyle chose for combat. Baseline for seeded replay: `combat/deep-stats/tools/legacy-golden.json` (78 cells x 20 seeds, legacy arena) and the per-run digest returned by `runO1`, compared between Node and the browser in `tests/browser/o1.spec.ts`.
- Room: 480x440 floor, local frame centre (0,0), x east, y south. North and south walls have inner faces at y = -200 and +200. West and east openings are 174 wide, so a radius-13 body can use the middle 148 units. Pillar at (10,-125), radius 27, the same proxy the study already drew. Wall art is painted on these faces.
- Travel: entry (-240,0), threshold x = 240. Reaching it completes the slice. Grid A* (8 units) around solids inflated by 15, smoothed. The route is fixed, seeds only change the fight.
- Enemy: fixed at the doc-29 test spawn (Mireling (65,80) facing NW, Sentry (90,-25) facing SW). Detection: 160 units, 120 degree cone, blocked by solids. With these spawns the adventurer is always seen, about 160 units out, so the no-contact path is tested with alternate spawns only.
- Hand-off: at detection the simulator receives the adventurer's current position and heading and the enemy's spawn. After a win travel resumes from the simulator's position. Death and the 150 s fight limit stop travel (`defeated`, `unresolved`).
- Perception: the adventurer AI still knows where enemies are through the pillar (handicapped-god model). Solids block movement, hits and projectiles, not the AI's knowledge. Revisit if O1 runs show it matters.
- Not claimed: no human review, no device or touch testing, no combat QA sign-off. Evidence images are software-rendered cloud captures in `docs/o1_slice/`.

2026-10-23, O1 combat detail. The O1 page now shows the simulator's full readout (bars, mind, totals, damage causes, build, log) and in-world cues. The data crosses an additive optional `combat`/`build` field on `PresentationSnapshot`; rendering never reads the simulator directly and never computes damage, arcs or timing. Cues are programmatic placeholders and can be switched off. The enemy guard half-arc (1.3 rad) mirrors the literal in `checkHit`; if the simulator changes it, `o1Combat.ts` must follow.

2026-10-23, O1 multiple enemies. The slice offers four encounters from the simulator: Mireling, Sentry, Two Mirelings, Sentry and Mireling (positions in `combat/rooms/o1.json`, all trial). Each enemy checks sight on its own (160 units, 120 degrees, blocked by solids). When one sees the adventurer, living allies within an alert radius of it (120 units, trial) join that fight; the simulator receives exactly that group. Enemies outside the radius stay where they are and can start a later fight after a win, with the adventurer's remaining health carried over and stamina and poise reset (the simulator has no other carry-over). Fights still run to victory, death or the 150 s limit before travel resumes. The pair spawns sit 78 and 108 units apart, so with the documented layouts the second enemy always joins the first fight; the later-fight path is covered by tests with a distant ally. Enemies never walk into a fight from outside the simulator.

