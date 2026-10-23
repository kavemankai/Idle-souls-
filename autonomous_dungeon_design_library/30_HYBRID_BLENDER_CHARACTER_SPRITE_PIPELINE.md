# 30 — Hybrid Blender-to-2D Character Pipeline
**Workshop:** 22 — Hybrid art-production workflow
**Decision status:** **LOCKED L22 — Workflow C:** characters are modeled/rigged/animated in Blender and rendered into 2D sprites. Hand-painted 2D environments, interface and combat VFX remain in the game. **P18 Ashen Reliquary overall aesthetic remains PROPOSED**, not approved merely by selecting production method.
**Applies to:** current standalone top-down 2D presentation lane (Phaser prototype), sword-and-shield adventurer, six provisional standard foes, provisional miniboss/area boss/secret boss.
**Source of truth:** `16` for locked decisions; `28` for visual-language proposal; `29` for Old Road scene quality gate; `14` for interaction with combat AI; `25` for provisional character attack roles and `27` for real combat benchmarks. This document owns the proposed production/export pipeline, not simulation behaviour.

## 1. Creative and technical promise
Deliver the *appearance of a hand-painted miniature* while keeping 3D modelling, rigging, symmetry management, material assignment, animation authoring and repeatable camera views inside Blender. Export flat 2D images, not 3D models used by the runtime. Hand-painted floors, architecture, UI, lighting overlays and physical strike/hazard telegraphs are separate 2D source assets.

**Locked constraints:** The gameplay remains top-down 2D; never add vertical gameplay, real-time Blender rendering, rotated 3D camera controls, a new combat model, new playable weapon kit or hidden geometry-dependent hitboxes. Attack, damage, poise, invulnerability, heading, collisions, navigation and death are simulation-owned. Neither an artist nor a render script can modify them to fit pretty animations.

**L23 NOW LOCKS PROJECTION:** the render camera uses fixed orthographic projection at approximately **75° above horizontal** (15° off directly overhead), shared across character sprites; see `31`. **Still OPEN:** final stylistic treatment, 4 vs 8 vs selective heading sets, azimuth convention, preferred renderer, atlas dimensions, clip frame cadence, source render pixel density, Blender version, primary mobile orientation and production cost. Confirm those with a small +75° silhouette/anchor proof before expansion.

## 2. Provisional projection and scale contract
- World and hitboxes use the existing JS sim's 2D coordinate plane, initially **32 logical units per planning cell**. Sprites are visual layers, not collision shapes.
- **LOCKED L23:** fixed **orthographic camera 75° above horizontal (15° off overhead)**. Camera trial A (exact overhead) is now only a historical proposal or optional diagnostic; it is not a production alternative. Verify silhouettes, floor alignment and animation foot sliding at the locked angle. Never silently change to 45° isometric or perspective.
- In Blender, keep the world grounded on the **XY plane** with vertical **+Z**. A character's 2D simulation direction corresponds to the model root's yaw about Z. The camera stays fixed while the CHARACTER root turns in 45° steps. Do not orbit the camera for every direction, because doing so changes light/shadow orientation and can contradict the room view. Character yaw mapping must be verified with an E/N/NE label chart and mirrored coordinate convention for screen Y-down.
- Use one orthographic scale, camera angle, view-layer/lens settings, colour-management settings and rig-root origin for the whole P0 character set. Calibrate a test mannequin and painted 32-unit floor tile side by side.
- Present at ordinary zoom with roughly **42–64 on-screen px protagonist silhouette diameter** where feasible (earlier proposed art readability target). Recheck mobile portrait and landscape. Geometry rendered larger than the simulation radius (e.g. sword/cape) never enlarges the real collision radius.
- **Feet/ground anchor**: source rig origin is the character's contact centre on the floor. Export a per-frame `feet_x`, `feet_y` (or a stable verified pivot) in sprite image coordinates. Do not blindly center on full alpha bounds; weapons, capes and recoil change those bounds.
- Shadows: separate soft ground-shadow presentation or independent shadow pass; no mandatory duplicated opaque black blob baked into every sprite frame. Shadow must neither leak through fog-of-war nor falsely imply collision.

## 3. Character architecture in Blender
**Editable master** per unique silhouette: `.blend` with labelled collections for `BODY`, `ARMOUR`, `LEFT_HAND_SHIELD`, `RIGHT_HAND_WEAPON`, `RIG`, `LIGHTS`, `CAMERA`, `EXPORT_MARKERS`. Keep recognizable asymmetry: shield arm, blade side and enemy weapon all require correct facing. Mirroring may be used only after visual inspection—never silently mirror the adventurer's handedness or Sentry shield.

**Proposed material style:** chunky, readable forms; strong painted gradients and broad highlight planes, muted rough stone/iron/cloth tones, limited texture detail, gentle edge outlining if needed, and bright accents reserved for important equipment/hit readouts. Use low-poly/limited-facet materials as a workflow tool, not a low-poly-looking final aesthetic. Prefer simple lighting and colour-managed renders that survive screenshots on both dark and pale tiles. Avoid photorealistic roughness/microtextures; hand-painted finishing can be material-based, limited post-processing and deliberate 2D paint-over on reusable overlays.

**Rig:** shared humanoid control template for player and Ashen Sentry **only where anatomy allows**, with root/facing, hips, spine, shield arm, weapon hand, head and feet. A separate low-creature rig for Mireling; do not stretch humanoid skeleton to make the small creature. Retarget animations only where timing silhouettes remain clear. Distinctive postures are more important than a single universal skeleton.

**Equipment:** one starter sword and shield is LOCKED L04. Modular gear sockets help visual updates and future sidegrades, but do not implement new playable weapon classes as part of P0. Weapons and shields remain physically associated with actor during swings, impact and stumbles. A shield must not flip sides for view-saving convenience.

## 4. Frame-direction and animation budget: scope-control gate
Avoid the naive multiplication **3 characters × 8 facings × many clips × many full frames**. Even 1,000 uncompressed 256×256 RGBA frames consume roughly **250 MiB** before atlas overhead; device memory and download size cannot be assumed safe. Transparent trimmed frames, fewer meaningful poses, atlases per character and calibrated display scale are mandatory considerations. Source `.blend` files remain high-resolution and replaceable without mandating huge runtime atlases.

**Proposed staged proof (NOT locked clip counts):**

| Gate | Actors | Facing angles | Actions | Outcome |
|---|---|---|---|---|
| V0 camera/pivot | Neutral mannequin + shield/sword | N, NE, E, S | Idle and rotate | Confirm facing, handedness, feet-anchor, painted floor alignment |
| V1 hero | Adventurer | 4 cardinal + one diagonal stress sample | idle 3 poses; locomotion 6; guard 2; light attack 5; heavy attack 6; dodge 4; hit 2 | Validate timing mapping and visible silhouettes before full atlas |
| V2 enemies | Sentry then Mireling | Same limited angles | idle, move, tell, attack, recover, death | Compare two radically different silhouettes at actual zoom |
| V3 coverage | All 3 | Expand to 8 only if needed | Add missing directions and validated clips | Prove memory, upload/download, animation readability and quality |

These frame quantities are **starting production estimates**, not ticks in combat logic. The player bench's light attack wind-up 7, active 3, recovery 9 ticks; heavy 15/4/16; Sentry `chop` 15/4/18 are authoritative sample actions at 30Hz only while unchanged in the actual integration. If the content lane changes a move definition, the exported mapping updates from it. Visual key poses: beginning of wind-up, latest tracked orientation, contact interval, recovery and return to idle. Sprites need not have a unique drawing every tick; renderer selects/holds/interpolates pose against authoritative action phase.

At 30Hz, a 7-tick warning occupies ~233 ms. Never lengthen the game warning, collision-active period, or invulnerability by slowing animation playback. Hit detection is not based on the drawn sword tip. A 5-image attack cycle can cover 19 simulation ticks when driven by the move's phase/tick data.

## 5. Export deliverables and metadata contract
**Preferred first-pass deliverables** (proposals to validate, not platform guarantees):
- Retain editable `.blend`, external textures, rig/action identifiers, camera/light rigs, material notes and texture/licence provenance. Keep final source paths relative to one workspace.
- Transparent straight-alpha RGBA PNG sequence per clip/direction during development. Atlases later via packaging; avoid premultiplied-black halos and padded edges. Use lossless WebP only after test for browser/renderer compatibility and quality.
- Proposed first-pass player/Sentry source frame canvas **256×256 px**, Mireling **192×192 px**, with trim and explicit pivots; test if smaller dimension suffices (e.g. 160–192). These are render/export candidates, **not player size on screen**. Allow oversized temporary action framing so swings never crop; use consistent anchor and avoid re-centering each frame.
- Sprite atlas contains rows/entries per `actor`, `action`, `facing`, `frame`. Preserve deterministic filenames (example `hero__light__NE__f03.png`) and a manifest; do not encode simulation hitboxes into pixels.
- Metadata per frame/clip: `actor_id`, `clip_id`, `facing_degrees`, `frame_index`, `source_frame`, `px_width`, `px_height`, `trim_rect`, `feet_pivot_px`, `weapon_socket_px` where needed, `frame_hold` or phase mapping, `source_hash`, `revision`, `license_note`, `review_status`. This is a proposed schema, not runnable code or an enforced tool contract.
- Root-to-frame transform is testable: world position + actor facing + state → art image/anchor without moving the game actor in simulation. Avoid animated pivot movement. For 8-way quantisation, choose nearest direction with hysteresis to avoid flicker when facing fluctuates near 22.5° boundaries; do not change sim heading.
- Textures and paintovers cannot bake fake floor hazards, unseen enemy shadows, UI markers or extra hit sparks: these must be rendered only upon authoritative gameplay events/visibility.

## 6. Hand-painted environment pipeline
Environment is separate from character Blender scenes. Create editable hand-painted 2D masters for quiet walkable paving, ash/dirt transitions, low-noise weathering, stone masonry, elevations, cutaway walls, pillars, cover, door thresholds, route landmarks and regional colour variations. P0 set is Old Road O1. Use 32-unit visual modular tiles at the earlier proposed ~128px source dimension if it tests well; collision/navmesh/LOS/proj-block flags come from the world builder, not painted alpha boundaries.

**Three-layer rule:** (1) authored low-frequency ground supports legibility; (2) props carry silhouette and cover information; (3) combat warnings/HUD are independent, truthful overlays drawn above environment and below critical actor/UI cues. Light halos and atmospheric fog are optional/adjustable per hardware and accessibility settings. World visibility masks override decorative FX; unseen actors must not leak through light, shadow, audio caption or particles.

## 7. Hand-authored VFX and 30Hz event mapping
VFX may be painted as short alpha clips or simple geometry and should support at least: regular slash, heavy/guard-break, blocking/parry contact, dodge motion, stagger, Mireling launch, arrow direction, boss ring/lane and exit/gate states later. **VFX warning shapes must agree with actual combat-sim arcs, tracking and active frames.** Redundancy through outline, hatch, motion and silhouette is essential in grayscale and colour-vision-deficiency simulation.

Combat presentation consumes events, not vice versa. `action_start`, `phase_change/tick`, `projectile_spawn`, `contact/block`, `stagger`, `death`, `retreat`, `visibility` are an integration vocabulary proposal that must map to real data already exposed by Claude Code's combat lane. Don't falsely assert existing APIs support every name. Where an event is unavailable, record the contract gap; do not silently invent attack outcomes in the renderer.

## 8. Proposed Old Road asset production sequence
**Step 0 — Baseline evidence:** preserve real visual bench state, 3 deterministically seeded combat examples, normal game zoom, mobile-size captures, and authoring version. Snapshot combat core so a presentation-only change can be compared.
**Step 1 — Fixed-camera calibration coupon:** export one asymmetric mannequin with sword/shield from **the locked 75° orthographic camera**, sampling N/E/S/NE and at least one opposing shield-side direction; place in O1 mock floor. Check compass mapping, occlusion, readable weapon side, pivot and contact. No alternate camera production trial or full animation suite yet; see `31A`.
**Step 2 — Silhouette coupon:** adventurer in neutral, guard, light tell and dodge; Sentry guard and chop; Mireling coil and bite/leap. Review without colour, both environments, small devices.
**Step 3 — Rig and limited clips:** single real adventurer in two directions plus shield/sword rig sockets, with event-timed pose sampling. Add Sentry and Mireling only after hero passes parity. No more enemies or bosses yet.
**Step 4 — Painted O1 kit:** floor, walls, transitions, obstruction pillar, thresholds and a readable campward light landmark from `29A`.
**Step 5 — Integration and QA:** align world feet anchors, test directional switches, combat telegraphs, terrain collisions, 30Hz replay parity, runtime atlas budget, lower-end phone and desktop; create S01–S06 evidence board.
**Step 6 — Creator presentation:** decide whether *Ashen Reliquary* becomes final direction (O15) based on scene evidence. **Only after explicit approval** expand six-enemy sprites and major bosses.

**Scope challenge:** full eight-way animations for all nine enemies before the first playable loop would be inefficient. There must be a signed-off compact P0 asset set and credible atlas/memory budget first.

## 9. Quality and failure gates
- Critical **FAIL** if a facing angle silently reverses weapon/shield ownership, a transparent sprite shifts player position, wall occlusion hides current lethal attack without indication, or VFX shows a miss as a hit.
- Critical **FAIL** if a render asset alters combat/simulation outcomes compared with the same seed, doctrine and build (the separate combat lane must provide event parity evidence).
- Critical **FAIL** if an atlas needs untested device capabilities, an animation consumes too much memory/download time, or phone-size enemy identification fails.
- Critical **FAIL** if a source edit cannot be reproduced from retained Blender scene, rigs, textures, export settings and rights information.
- Compare at least 4 facing directions including one diagonal; export same idle frame twice and compare hashes where deterministic asset build is promised (allow render environment differences to be recorded, not silently ignored).
- Camera/pivot reference chart passes: feet fixed through neutral/guard/wind-up; 8-way direction mapping correctly labels sprites; no involuntary mirroring across handedness.
- Conduct review checks in `29B`; record evidence and status. Do not mark any unrun tests as passing.

## 10. Interfaces and ownership
**Art lane owns:** models, rigs, textures, source assets, artist-readable animation cues, Blender camera, sprite frame/atlas export, provenance and visual inspection.
**Combat lane owns:** 30Hz simulation, AI decision timing, hitboxes, stamina/poise, enemy attacks, direction/velocity, events, navigation, avoidance and world state. Its latest source, not a stale workshop sketch, decides action definitions.
**Presentation integration owns:** mapping simulation state to scene sprites, camera/zoom, texture loading/atlases, hit-aligned VFX, interpolation and visibility. Claude Code must review any connector code changes; this workshop does **not** write gameplay code.
**Game design owns:** locked rules, scope, approved visual language, narrative, future roster/boss content and acceptance thresholds.

## 11. Camera decision resolved; next creator choice
**L23 locks camera B:** fixed orthographic approximately +75° above the horizontal. The earlier A/B camera choice is closed and cannot be reintroduced without the creator changing it. **Next decision is O31**—four-way, eight-way, or selective eight-way sprite facing/clip production at the locked angle. Do not produce full eight-direction atlases until a limited angle/pivot proof is tested. See `31`, `31A` and `31B`.

## Workshop 23 handoff supersession
Creator selected **L23 camera B**. In this document, any historical two-angle **test** instructions should be interpreted as **debug comparison only**; production outputs must exclusively use the locked orthographic +75° camera. Use the explicit standards in `31` for Blender modelling proportions, yaw mapping, ground pivots, metadata and device-scale review. Camera azimuth, exact rig proportions and *per-attack* direction coverage remain open; eight-way movement and guard are locked by L24.

## Workshop 24 authoritative direction update — L24 (LOCKED)
Creator selected **Option C**: **8-direction locomotion and guard** for all relevant characters, with **selective per-move directional coverage for attack animations**. This supersedes earlier text presenting 4/8/selective as undecided. Historical V0/V1 tests at four headings are preliminary QA steps only; they do not reduce the mandated 8-way movement/guard shipping coverage. The V3 line's "expand to 8 only if needed" applies only to **attack and other optional clips**, **not movement or guard**. Do not label all attacks four-direction by default. Follow `32` and `32A` for exact obligations and review gates. Source frame size, exact attacks requiring eight views, atlas bytes and camera azimuth remain proposals. Camera L23 and all simulation timing remain unchanged.
