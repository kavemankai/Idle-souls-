# 31 — Locked 75° Character Camera, Modelling & 2D Sprite Standards
**Workshop:** 23 — Fixed render projection and first Blender character-production standards  
**Owner:** Art direction / technical art / presentation integration  
**Status:** **LOCKED L23** for the camera; modelling ratios, frame budgets, facing count, material recipes, export presets and QA thresholds below are **PROPOSED** until measured or approved.  
**Date:** 2026-10-23  
**Dependencies:** `16` (locks), `30` (Blender production contract), `28` (candidate Ashen Reliquary visual language), `29` (Old Road O1 proof), `14` (combat AI interface), `25` (proposed actor concepts), `26` (proposed zone geometry), `30A`/`30B` (production/test manifests).

## 1. Non-negotiable authoring contract
**LOCKED L23:** Character renders use a **fixed orthographic camera elevated approximately 75° above the horizontal ground plane (15° off directly overhead)**. This is not perspective, classic 45° isometric projection, or a camera rotating with the actor. In Blender the simulated ground is the XY plane and model height is +Z. Rendered PNG/atlas outputs remain sprites inside the top-down 2D game. The character rotates under the fixed camera to produce different facings.

**LOCKED L22:** Model, rig and animate characters in Blender, then render sprites/atlases; the environments and combat VFX are separately hand-painted in 2D. Neither the real-time game nor its combat AI becomes 3D. **LOCKED L04:** the initial player kit remains one sword and one shield. The combat AI and deterministic tick/hit result always outrank animation aesthetics. **P18 / O15 remain OPEN:** the complete *Ashen Reliquary* look and title are a proposal; locking camera B does not approve materials, exact palette, final models, UI or world fiction.

**Why this projection:** More visible gear, shoulders and intent than an exact overhead view, while keeping the result close enough to plan-view movement. At just 15° off overhead, faces and front torsos are *still relatively compressed*. Validate readability rather than exaggerating what this camera can show.

## 2. Camera calibration specification (fixed vs tunable)
| Setting | Requirement | Decision status |
|---|---|---|
| Projection | Orthographic, no perspective distortion | **LOCKED L23** |
| Elevation | Approximately **+75° above XY/horizon**, or 15° off the downward vertical | **LOCKED L23** |
| World plane | XY ground, up is +Z | Production contract, proposed convention from `30` |
| Camera azimuth | Fixed relative to game north; all actors share it | Production rule; exact azimuth OPEN |
| Camera distance / orthographic scale | Identical baseline for hero/Sentry/Mireling, with documented actor-specific framing only if justified | Numerical values OPEN |
| Colour management / exposure | One approved render preset across P0 characters | Preset values OPEN |
| Model yaw sampling | Rotate the model root around world Z; camera/light rig remains stationary | Production rule |
| Ground/shadow pass | Ground-contact shadow separated from transparent character where possible | Proposed implementation |
| Export alpha | Test straight alpha and premultiplication handling; verify browser edges | Proposed test target |
| Frame shape | Fixed source canvas in a clip OR trimmed frames with metadata preserving a common feet pivot | Proposed export contract |

### Coordinate sanity check
- Establish a **north arrow**, a clear **screen-up direction**, and a non-symmetric reference mannequin with a shield in one hand and sword in the other. Use these references to verify whether +Y world means north and whether Phaser screen coordinates are Y-down. Do not hardcode facing labels from Blender's viewport orientation without a contact-sheet comparison.
- Render source cardinals N/E/S/W and test diagonal NE at the chosen camera. If a sprite faces north in Blender but appears east when loaded in Phaser, correct the mapping in the art export/adapter; do **not** rotate game collisions or AI headings.
- One **camera master** scene provides camera/light/ground reference; individual character `.blend` files link or document the same transform. No artist is allowed to eyeball a slightly different 70°/80° camera for a specific enemy without change review.
- The camera view must remain visually coherent with **top-down 2D** level tiles. No fake height-based navigability: the shadow/feet point touches valid floor even if an overhead body projects across nearby wall art.

### Not a conventional isometric game
Rendered bodies at +75° elevation do not make the world a 3D/isometric navigation plane. Walls, corridors, occupancy, cover, projectile obstruction and LOS stay with the 2D map/collision system. If floor/object rendering appears contradictory, adjust the sprite projection, wall cutaways or environment shading; do not quietly change gameplay geometry.

## 3. Proposed modelling proportions and visual hierarchy
**Objective:** A player, a shield-bearing humanoid and a quick low creature should be distinguishable in a small mobile screenshot *without labels, glow or health bars*.

| Actor | Build/proportions (PROPOSED) | Top-down silhouette priority | Recognition stress case |
|---|---|---|---|
| Sword/shield adventurer | Compact torso and readable shoulders, about 4.5–5.5 stylised head-heights; shield broader than weapon hand | Separate blade/shield on opposite sides; clear sword-tip movement; unbroken feet/ground point | Guard vs wind-up vs retreat while facing N and NE |
| Ashen Sentry | Upright mid-size biped; heavier helmet/shoulder block than hero; asymmetric damaged shield | Guard silhouette distinct from hero at same camera angle | Sentry's chop tell against its idle/guard |
| Mireling | Small, low creature with long horizontal body, hooked legs/head; no humanoid skeleton | Lateral extension and compressed pre-leap coil | Identify coiled tell and leap direction while next to Sentry |

The above ratios are **design hypotheses**, not rig dimension locks. Other possible proportions may read better from 75°. Prioritise broad mass separation over surface detail. Deliberately exaggerate head/upper arm/shield *only as much as necessary*, because a 75° overhead render compresses some gestures.

### Three silhouette rules
1. **Weapon handedness is stable.** Do not horizontally flip directional sprites if it swaps the sword and shield or reverses an asymmetric attack cue. Render the missing facing or explicitly prove a safe mirroring case.
2. **Contacts remain grounded.** Feet/root stay tied to 2D actor position even when model torso swings or falls; no animation-driven teleport or collider drift.
3. **The asset announces intent.** A heavy attack must have a clear stronger anticipation silhouette than a quick strike. If the upper body is hidden by the overhead view, change the rig pose, weapon elevation, readable VFX or shoulder silhouette rather than modifying simulation wind-up frames.

## 4. Rig and animation master requirements
Each Blender actor source must contain named collections or documented equivalent:
- `MESH_BODY`, `MESH_EQUIPMENT`, `RIG`, `ANIMS`, `CAMERA_REF`, `LIGHT_RIG_REF`, `PIVOT_HELPERS`, `OUTPUT_MARKERS`, `SOURCE_NOTES`.
- **Root** at the ground-contact midpoint. Player/Sentry: pelvis, spine, chest/neck/head, upper/lower limbs, weapon hand, shield arm, two foot controls and equipment sockets; Mireling: a dedicated low-creature rig with body segment and leg/head articulation appropriate to anatomy.
- Rig controls should support consistent **model yaw**, directional contact poses, and the same action envelope at each sampled facing. The Sentry may reuse humanoid tooling but should not share the hero's final animation motion unchanged if its read differs.
- Distinct actions with meaningful names (proposed baseline): `idle`, `walk`, `guard`, `light_attack`, `heavy_attack`, `dodge`, `hit_react`, `stagger`, `death`, `retreat`. This is an art clip catalogue, **not** a claim the gameplay exposes every named state already.
- Include metadata for action start, impact/contact intent, recover to idle, and shield/socket offsets if the Phaser presentation layer needs alignment. Animation speed is adjusted to the authoritative event timeline, not the reverse.
- Any weapon variation for the starter kit stays sword/shield; alternate weapon *designs or equipment skins* are future art variants, not permission to add gameplay kits.

### Studio-scale proof convention (PROPOSED, not locked)
Adopt a master metric and stick to it across assets. Candidate: **one Blender ground unit = one 32-unit proposed map cell**, with actors calibrated against the current 2D fighter radii rather than using 3D armature collision. The hero's existing simulator radius is 13 game units; do not infer screen-space collision from visible sword length. Re-measure proportions against the real game zoom before freezing Blender dimensions. The calibration record must state **model metres/units, sprite pixels, game units, zoom and visible character height**—not only a source PNG size.

## 5. Asset lighting, material and paint standards
The candidate art thesis is restrained painted miniature dark fantasy; do not mistake the lock on the camera for creator approval of those colours or motifs.

**PROPOSED rendering rules:**
- Matte, broad plane-based shading, 2–4 distinguishable value groups, selectively painted trim. Silhouette, not high-frequency texture, explains anatomy/armour.
- One fixed key/fill/rim recipe shared across all starter actors; low contrast on armour interiors, controlled crisp weapon edge to show orientation. Test rotation so highlights do not imply an inconsistent world light direction.
- Do not bake strong opaque circular ground shadows into the character colour pass. Shadow is independently placeable and respects fog/occlusion.
- Keep albedo and material layering editable. Record shader type, colour management settings and whether painterly finishing is in Blender materials, post-process or separate painted overlay.
- Export review frames over **both light paving and dark wet stone** before approving the material set. Avoid a black-on-black Mireling in the dark scene or overly bright hero in the pale scene.
- No fine eye/facial details necessary at target zoom. Reserve contrast for shield, hand weapon, articulation and telegraphs.

## 6. Sprite projection, anchors and framing
**Most important contract:** a rendered 3D image is attached to a **2D simulation ground point**, never the image centre.

- Bake/export the rig-root world-origin as a **feet-ground pivot** in each source frame. Preserve this pivot on trim. Atlas packing must use a per-frame offset so swinging weapons do not make the hero slide or bob on the map.
- Pivot remains fixed in world space for idle/guard/wind-up while the sprite's alpha bounds can grow or move. During **real simulation movement** the pivot moves according to sim state; artistic walk bob alone never moves collisions.
- At +75°, any elevated head/weapon appears offset from the foot position in the 2D picture. This offset is expected. Do not re-centre the whole sprite by its changing painted body bounds.
- Separate 3D silhouette rendering from gameplay hit arcs. A blade may extend past a 13-unit collision radius; simulation sword reach, block angle and timing remain authoritative.
- Never clip the raised sword, shield edge, leap path or death collapse. Use padded capture regions or clip-specific bounds but keep exactly documented anchor transforms.
- Don't bind world draw order blindly to image bounding-box bottom. Use **simulation feet/ground depth** and explicit wall/cutaway layers. A long elevated sword should not reorder the character behind an adjacent floor object.

### Candidate first render output sizes (NOT LOCKED)
- Player and Sentry: **256×256 px source canvas**; Mireling: **192×192 px**. Compare to 160/192 for small-screen efficiency. These are **source frame sizes**, not on-screen character sizes.
- Proposed minimum camera/visual target: main character appears approximately **42–64 screen pixels in broad silhouette** at standard active zoom, adjusted using actual footage. Bigger than necessary hurts view of multiple enemies/telegraphs; smaller risks unreadable motion.
- Use **RGBA PNG sequences initially**, then test trimmed atlases. Measure real texture allocation after packing. One 2048×2048 RGBA texture is about **16 MiB uncompressed**; a 4096×4096 texture is about **64 MiB**, before other buffers. Image compression on disk does not automatically reduce GPU texture memory.
- Allow **2–4 px duplicated edge padding** on trimmed atlas entries as a proposed rendering safeguard; verify in Phaser at scaling and filtering modes actually used.
- Fallback at low-end/mobile zoom could reduce frames or texture size, but cannot remove essential danger warnings or change simulation outcomes.

## 7. Facing directions and motion clip economy
The camera angle is now fixed. **The number of directions is not.** Candidate design options for the next choice:

| Option | Production scheme | Cost/risk |
|---|---|---|
| A — 4-way | N/E/S/W for most clips | Smallest atlases but frequent orientation discontinuities and shield occlusion on diagonals |
| B — 8-way | N/NE/E/SE/S/SW/W/NW for all necessary clips | Best directional consistency; large rendering/revision cost |
| C — Selective 8-way | Eight for idle/walk/guard; start with four main attack axes plus critical diagonals, expand clips only when readability test fails | Good compromise but mixed direction sets need careful mapping and validation |

**Recommendation (not locked): C as a staged production plan**, with a right to escalate individual combat actions to full eight facings if a diagonal attack isn't truthful. For the *first* proof only, render N/E/S/NE plus one opposite/occluded angle that stresses shield handedness. Do not produce every character/clip eight ways before a successful game-zoom comparison.

Proposed event-to-frame standard:
- Author **poses**, not animation seconds: anticipation, latest tracking, active hit window, initial recovery, exit to idle.
- Simulation is 30 Hz in the supplied bench. `light` 7/3/9 ticks and `heavy` 15/4/16 ticks are **bench examples**, not guaranteed final integration values. Art sampling maps to authoritative timestamps and supports variable FPS without moving a hit.
- Never speed up the gameplay attack to fit a 5-frame cartoon; neither cancel windows nor invulnerable frames change for presentation.
- Quantized facing should use hysteresis around angle boundaries to prevent 2D sprites from flickering while the AI constantly turns. The actual simulation heading remains continuous.

## 8. Handoff file layout and metadata schema (specification, no code)
Deliver a structured, reproducible folder per actor. Required conceptual contents:

| Folder/file type | Contents |
|---|---|
| `source/` | Editable `.blend` scene, referenced textures, rig notes, colour setup, licenses |
| `renders/` | Rendered alpha frames per action and facing, untrimmed while evaluating |
| `atlas/` | Packed sprite sheets plus frame and pivot metadata after approval |
| `references/` | Neutral pose, N/E/S/W compass chart, grayscale comparison, lighting swatches |
| `review/` | Approved/rejected contact sheets, zoom examples, evidence of parity and budget |

Metadata fields (proposed data contract, not file-format lock):
`actor_id`, `revision`, `render_preset`, `camera_elevation_deg=75`, `camera_azimuth_deg`, `orthographic_scale`, `world_model_axis_convention`, `simulation_heading_reference`, `facing_label`, `model_yaw_deg`, `clip_id`, `phase`, `frame_index`, `source_frame`, `canvas_size_px`, `trim_rect_px`, `ground_pivot_px`, `animation_hold_ticks` or phase mapping, `weapon_socket_px` (if relevant), `sheet`, `source_hash`, `source_version`, `license_provenance`, `review_status`.

Every export must reproduce an actor at exactly the same world feet location from the same sim snapshot regardless of its attack pose. Create a camera/pivot reference PNG used as a calibration control in each export batch.

## 9. Mandatory production sequence
1. **P0a camera master:** A single mannequin with sword/shield asymmetry, a 32-unit test floor, compass arrow, fixed +75° orthographic camera, locked view transform. Render cardinals and two stress-facing samples. **Do not compare with exact overhead to reopen L23.** Use exact overhead only as a non-production debug diagnostic if needed.
2. **P0b hero silhouette test:** Establish a clean hero rig; render guard, idle, slash warning/active, heavy warning and a dodge pose at normal zoom on pale/dark floor. Check weapon side and pivot using an overlay.
3. **P0c first action clips:** Hero walk/guard/light/heavy/dodge/hit; map to actual simulation events, compare seeded fights with baseline. The renderer cannot add AI behaviour, changes to hit tick or extra attack range.
4. **P0d Sentry:** Humanoid derivative art and readable shield/chop; share the camera master. Test hero-vs-Sentry silhouette at a glance.
5. **P0e Mireling:** Separate low creature rig, coil/leap animation and small-actor visibility; test mixed-scene readability.
6. **P0f Old Road composition:** Integrate painted tiles, pillar, routes, doors and overlays from `29`, keeping simulation nav/collision independent.
7. **P0g review:** Capture normal device zoom, dark/light floors, grayscale, 30Hz seeded parity, source reproducibility and GPU memory/download size. Only then expand to other enemy types.

## 10. QA acceptance criteria and fail conditions
| ID | Test | Proposed sign-off threshold / evidence |
|---|---|---|
| C75-01 | Camera angle | Source file records fixed ortho 75°±small authored tolerance and common azimuth; mismatching actor rejected |
| C75-02 | Heading/handedness | All tested cardinals and diagonal mapped correctly, shield never swaps hands due to mirroring |
| C75-03 | Pivot truth | Character's feet/ground root within **2 rendered pixels** of the reference overlay when no sim displacement; no oscillating anchor from alpha trimming |
| C75-04 | Small-view recognition | Player, Sentry and Mireling distinguishable at target gameplay zoom; test with at least 3 unfamiliar observers; record findings, do not pre-claim pass |
| C75-05 | Animation authority | Same combat seed/config/doctrine yields identical hit/poise/HP/dodge results with art on and art hidden |
| C75-06 | Telegraph timing | Drawn anticipation/active/recovery map to logged sim ticks; no active hit appears without visual signal or vice versa |
| C75-07 | Floor/occlusion | Test beside 2D cover pillar and wall cutaway; feet shadow anchored and no exploitable false depth |
| C75-08 | Atlas budget | Record per-actor runtime texture size/format, sprite count and worst-case memory; budget measured on chosen target devices |
| C75-09 | Output reproducibility | Regenerate chosen frame from versioned Blender scene and references; retain render preset, third-party licenses and scene provenance |
| C75-10 | Accessibility | Grayscale and reduced VFX pass; tells still read by shape/pose, not just hue |

Critical fails: wrong handedness, untracked pivot drift, misleading telegraphs, mismatched sim events, unreported atlas/device errors, no editable sources, world sight blocked by painted sprite without matching actual 2D occlusion, or stealth adoption of 45° isometric camera.

## 11. Status, scope and next creator decision
**LOCKED:** L22 Blender-based source-to-sprite workflow; **L23 +75° fixed orthographic render projection**. All previous world/expedition/key/combat locks stand. The candidate Ashen Reliquary *appearance* and all precise modelling ratios, direction/fps/atlas budgets remain **PROPOSED/OPEN**. No finished rig/sprite or QA result is claimed by this design document.

**Recommended next creator decision:** Minimum final sprite facing scheme **A four-way**, **B full eight-way**, or **C selective eight-way production** (idle/walk/guard eight; combat clips expanded where evidence requires). This changes atlas and animation workload substantially; it does not affect combat physics.

## Workshop 24 facing lock — L24 (LOCKED)
Eight facing samples `N NE E SE S SW W NW` are now **mandatory for locomotion and guard clips**. Attack clips use **selective, individually justified direction sets** and a mandatory eight-heading readability test regardless of how many sprites are authored. Prior prose saying facing count is OPEN is superseded for movement/guard; it remains OPEN for individual attacks, idle, hit, dodge, death, atlas/pose counts and numeric fallback rules. No unsafe mirroring of asymmetric sword/shield models. The orthographic +75° camera remains locked L23. See `32`/`32A`.
