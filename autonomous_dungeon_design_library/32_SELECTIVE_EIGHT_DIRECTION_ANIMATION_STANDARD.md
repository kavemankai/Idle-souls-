# 32 — Selective Eight-Direction Character Animation Standard
**Workshop:** 24 — Eight-direction sprite-production strategy
**Decision status:** **LOCKED L24, Option C:** render eight headings for **locomotion and guard**, with **selective directional coverage for attack clips**. The selected attack heading sets, counts, clip durations, atlas dimensions and fallback tolerance remain PROPOSED pending production tests.
**Cross-links:** `16` decisions, `30` hybrid Blender pipeline, `31` 75° locked camera, `28` proposed visual bible, `29` Old Road art test, `14` combat-AI interface, `32A` per-clip coverage matrix, `30B` QA matrix.

## 1. Locked production contract
- **Eight compass headings for locomotion and guard:** N, NE, E, SE, S, SW, W, NW (45° intervals). Applicable to visible walking/running/retreat locomotion and guard stance/transitions, not a mandate to render all other states eight ways.
- **Attack clips are selective:** model artists and technical animators choose an appropriate number of camera-consistent sprite directions per individual move. An attack needing diagonal clarity must get the necessary diagonal rendering; there is **no universal four-direction attack rule**.
- **Existing production locks unchanged:** L22 Blender-authored character sprites + hand-painted 2D environments/VFX; L23 **fixed orthographic 75° above the XY ground plane**, camera not spun for alternate facings; L04 one sword/shield hero kit. Runtime is a 2D Phaser presentation, never a 3D navigation camera.
- **Combat truth is authoritative:** visual heading samples and frame interpolation must not alter move start, anticipation, active hit frames, recovery, aim tracking cutoff, dodge invulnerability, range, stamina, collisions, enemy selection, retreat or navigation. Render/adapter solves the visual mismatch, not the AI/physics.
- **No silent sprite mirroring:** reflection that swaps sword and shield or reverses weapon tell is disallowed until a deliberately symmetric actor/clip is proven safe. For our asymmetric sword-and-shield hero and Sentry, assume reflections require separately rendered directions.

## 2. Direction nomenclature and mapping
Use canonical facing labels `N, NE, E, SE, S, SW, W, NW` at +45° yaw increments in the character's local ground plane. Confirm Blender north/world +Y and Phaser screen-up/negative-Y conventions with an asymmetric sword-and-shield reference rig; DO NOT assume mathematical angle 0 maps to N. Record `sim_heading_radians`, `presentation_heading_label` and `model_yaw_degrees` in a test manifest.

Eight-way movement/guard sprite selection may quantize the appearance to the nearest authored compass direction; the *physical heading and movement vectors* remain continuous from the 30Hz simulation. If heading oscillates at a boundary, presentation may use hysteresis only if it never hides a genuine combat wind-up or wrong-guards a threat.

## 3. Selective attack coverage policy (PROPOSED)
Choose each attack's minimum directional set via a **directional truth test**, not by uniform frame-count arithmetic. Suggested first proof:

| Action class | First-pass trial | Review requirement |
|---|---|---|
| Walk/run/retreat | **8 LOCKED** | Feet/pivot stable in all N/NE/E/SE/S/SW/W/NW |
| Guard/guard-start/hold/release | **8 LOCKED** | Visible shield side, shield arc and vulnerable flank truthful |
| Idle | 4 or 8 (proposed) | Heading readable, avoid pop when shifting from guard |
| Light sword attack | 4 then add diagonals if needed (proposed) | Actual attack quadrant and sword contact arc never contradicted |
| Heavy sword attack | 4–8 selectively (proposed) | Guard-break tell/strong anticipation visible across diagonal angles |
| Dodge/rolling slash | 4–8 selectively (proposed) | Actual dodge vector/invulnerability and follow-up slash direction readable |
| Enemy bite/leap | At least angle stress tests incl. NE/SW (proposed) | Launch heading, tracking freeze and landing remain honest |
| Sentry sword slash/shield bash | Select by attack geometry (proposed) | Shield stays on correct side; bash vs slash unambiguous |
| Boss wide swings/lane moves | Likely eight for visually directional actions (proposed) | Floor hit-zone overlay must agree with actual hit geometry |

A 4-view attack is accepted only if eight test headings show understandable impact and tell silhouettes, with no misleading reach or handedness. If it fails, render the missing views. Do not use a rotated 2D bitmap to fabricate a new body perspective where shield/weapon depth becomes false.

## 4. 30Hz combat-action synchronization
The animation asset manifest records authoritative move IDs and stages `windup`, `active`, `recovery`, `guard`, `dodge` or relevant special phases. The presentation layer samples clip poses by combat action state/tick. The game engine emits actual strike/projectile/hazard timings; sprite frames never trigger authoritative damage. Preserve attack tracking cutoff direction even if facing changes in adjacent locomotion.

A state transition such as `walk NE -> guard NE -> heavy attack N -> guard N` must not jump the sprite root or appear to reverse the shield. Any smoothing is cosmetic and must not suggest that an attack lands in another zone. Proposed interpolation and facing hysteresis values are not locked.

## 5. Blender, export and technical constraints
- Keep **one fixed +75° orthographic camera and lighting rig**; rotate Blender actor root by yaw, not the camera. Establish repeatable `CAMERA_MASTER` and `PIVOT_HELPERS` reference.
- Use a canonical ground-contact pivot, identical scale calibration and consistent actor-to-tile ratio. Validate N/NE/E/SE/S/SW/W/NW contact sheets at real gameplay zoom.
- Each exported clip/direction provides frame ID, model yaw, cardinal label, action ID, pose phase, stable feet anchor, trim rectangle, rendered shadow reference and asset revision.
- Report packed atlas width/height, decoded GPU memory, number of active atlases, download size and worst-case frame hitch on a representative lower-end phone. Eight-way guard and movement are *required*; if budgets fail, optimise resolution, trims and clips before reverting locked directions.
- Retain editable `.blend` models, rigs, textures, animation actions and export settings. Do not deliver PNGs without source and pivots.

## 6. P0 actor test order
1. **Asymmetric calibration mannequin**: eight movement + guard headings, check hand orientation and foot pivot on a painted 32-unit terrain sample.
2. **Sword/shield adventurer**: eight movement + guard directions; first light/heavy attack heading samples N, NE, E, S, SW. Add remaining attack directions if evaluation requires them.
3. **Ashen Sentry**: eight walk + guard directions; slash/bash selective views. Explicitly test bash wind-up, shield side and heavy block readability.
4. **Mireling**: eight locomotion directions (not eight distinct move classes); bite/leap selective directional sprites, checking fixed launch and grounded impact.
5. **Old Road O1 integration**: one mixed encounter plus no-enemy travel, retreat and camera movement; inspect both normal and reduced mobile zoom.

## 7. Minimum acceptance gates
- 8/8 directions for each production locomotion/guard clip; no missing atlas entry, incorrect quadrant, mirrored shield hand, root drift or visible sprite snapping during diagonal travel.
- For every selective attack, review all eight *actual simulator facing headings* against authored/fallback sprite: impact lane, warning silhouette, weapon/guard handedness and recovery readability match the true simulation. Do not sign off by inspecting only authored angles.
- Seeded combat and path results remain identical before/after replacing placeholder art with sprite sheets, aside from tolerated non-authoritative rendering performance.
- At normal zoom, reviewer distinguishes player, Sentry and Mireling, guard vs light/heavy and enemy attack tells without UI labels.
- Publish one animation-coverage matrix and failure notes before bulk production. A failed test requires directional coverage expansion or visual asset revision, not AI accuracy changes.

## 8. Still open after L24
Per-move direction list, exact number of animation poses/frames, project art palette P18/O15, atlas budget and file layout, camera azimuth calibration, 2D appearance size and specific facing hysteresis values. These must be measured/proposed in the next visual proof before locking numeric defaults.
