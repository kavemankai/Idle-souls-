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

Combat integration V5 is BLOCKED: only main branch docs and maps existed at eaf4475. Neither the main combat simulation nor deep-stats split is available. A creator/workstream-selected source and baseline seeded replay are required before connecting the readonly adapter. No source was guessed.
