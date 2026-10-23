# Old Road P0 — Artist / Claude Code Production Brief
**Proposal only — no art direction locked.** See full `29_OLD_ROAD_ART_PRODUCTION_AND_STYLE_VALIDATION.md` and manifest/review CSVs. This is a self-contained concise production request; no gameplay code included.

**Goal:** One hand-painted miniature dark-fantasy scene in O1 Outer Road, center (950,1750), 480×440 sim units. 1 sword/shield adventurer, 1 small/fast Mireling, 1 medium/melee Ashen Sentry. Test enemies alone before combined staging. **No new boss content, new playable kit, new combat AI or new map route.**

**Composition:** Quiet broken paving, narrow scattering of ash/olive moss, ancient military stone wall, east/west exits, one solid cover pillar, roadside marker, campward warm light cue. Maintain unobstructed movement and honest cover. Ground should remain visually calm so white light strike arcs and amber heavy warnings stand out.

**Art candidate:** Ashen Reliquary — handmade painted dark-fantasy miniature, sacred/military ruin, melancholy, muted slate/umber, rare brass/ember/cyan accents. Visual style remains **PROPOSED** pending creator review. Prototype screenshot is a layout only, not art reference to copy exactly.

**Asset delivery:** character silhouettes plus sprite atlases/masters; 8-direction player pose intention; clear Sentry shield/weapon; distinct Mireling hook/coiled leap; road tile kit; solid pillar/wall; core VFX; small HUD; metadata for feet pivots, collision, LOS and projectile-blocking roles. See CSV for exact P0 IDs. Source art editable and provenance documented.

**Technical truth:** combat-sim events at 30Hz own attack timing, hit geometry and actor positions. Sprite/FX are purely presentation. Do not change damage/poise, attack frames, turning, AI behaviour, or collision radii to make animation prettier. Keep a seeded before/after replay comparison.

**Review evidence:** six captures (traversal, Mireling pre-leap, Sentry guard, strike tell, mixed-overlap stress, mobile portrait/landscape), three unfamiliar-viewer recognition tests, grayscale/colour-deficiency checks, seeded parity and lower-end mobile measurements. If hazards or actor silhouettes aren't readable, simplify ground before adding particles.

**Release gate:** Creator explicitly approves or rejects visual direction after seeing these scenes; do NOT mass-produce more regions before that decision. Special optional boss key and many economy details remain undecided; do not infer locks from art.

## Workshop 22 — Mandatory pipeline clarification
**LOCKED L22:** characters are modeled/rigged/animated in Blender and rendered to 2D frames/atlases; their editable `.blend` sources are required. Environment and VFX are 2D hand-painted with retained editable masters. Do not deliver a runtime 3D implementation; 3D is for authoring assets only. Start with projection/feet-pivot calibration and a very small hero/Sentry/Mireling clip proof rather than full eight-way sheets. Consult `30`, `30A` and `30B`; camera elevation was open at Workshop 22 but has since been **locked L23 (+75° fixed orthographic)**; final direction count, texture dimensions, style approval and mobile orientation remain open. The original source requirements for 30Hz combat replay parity and art visibility still apply.

## Workshop 23 — LOCKED L23 technical-art correction
The 75° orthographic fixed Blender camera (above horizontal XY ground, 15° off top-down) is **no longer open**. Deliver all candidate Old Road character frame exports from the single shared fixed-camera master. Never rotate the export camera to fake facings; rotate actor yaw and maintain correct sword/shield hands. Align feet/ground pivots to simulation actors with no camera-dependent gameplay physics. Use `31A` shot list and `31B` deliverable sheet. **Still open:** final face-count/atlas limits and whether the Ashen Reliquary style is approved.

## Workshop 24 addendum — LOCKED L24
The locked 75° orthographic camera must export **eight compass directions for locomotion and guard**. Attacks are rendered in a **selected direction set per animation**, validated from all eight actual simulation headings before release. Four-direction attack frames are a possible *test candidate*, not a universal rule. Do not mirror the player/Sentry sword and shield without proving orientation correct. Consult `32_SELECTIVE_EIGHT_DIRECTION_ANIMATION_STANDARD.md` and `32A_DIRECTIONAL_CLIP_MATRIX.csv`. Preserve game timing and hitboxes.
