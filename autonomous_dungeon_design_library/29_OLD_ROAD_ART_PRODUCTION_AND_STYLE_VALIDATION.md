# 29 — Old Road Art Vertical Slice: Production Specification and Approval Gate
**Version:** v0.14 / Workshop 21 (2026-10-23)  
**Status:** **PROPOSED execution specification, NOT a locked art direction or implemented game.**  
**Art-direction candidate:** *Ashen Reliquary*, as defined in `28_VISUAL_STYLE_AND_ART_DIRECTION.md`.  
**Game-title note:** *Ashen Expedition* is the Phaser concept/prototype label; no commercial name has been approved.  
**Scope:** Art-production planning, visual-interface contract, asset manifest, review criteria. **No combat AI changes, gameplay code, or new locked mechanics.**

## 1. Production decision
Produce one **production-quality Old Road encounter** before expanding the character roster or generating complete region art. This is a controlled visual proof: one authored room, one player, one Mireling and one Ashen Sentry, with believable ruin materials, truthful attack warnings and unobtrusive HUD. It is deliberately smaller than the 17-zone macro map in `26`.

**Why this scene:** These three silhouettes exercise the hard visual problems: a shield readable from overhead, a small fast creature discernible against paving, a medium armed enemy with a guard pose, and a quick attack versus a deliberate attack. Prove these before undertaking the Bell Warden, Castellan, secret boss or extensive environmental dressing.

**Input references:** `28` art bible (candidate style), `25` proposed roster, `26` spatial map, `14` combat-interface contract, `12` expedition UX, `19` mobile accessibility, `16` locks. The existing `Ashen_Expedition_Visual_Preview.png` illustrates composition only, **not** a finished art standard, rendered asset source, or verified live gameplay screenshot.

**Hard constraints retained:** one sword-and-shield playable kit; six existing combat AI attributes and three doctrines as implemented in supplied bench; 30 Hz deterministic simulation controls hits and windups; player-led expeditions; absolute route exclusion; no sanctuary banking; key-sealed boss/miniboss encounters always require deliberate access and separate fight authorisation; bank-first universal Gate Keys; maximum two prepared keys. These gate/key systems are **outside the first Old Road art scene** except for planned shared visual language.

## 2. Scene brief: O1 Outer Road

### World coordinates and dimensions
Use already proposed location **O1 / Outer Road**, center **(950, 1750)**, with clear floor **480 × 440 simulation units** (`26`, `vertical_slice_room_schedule.csv`). This is approximately **15 × 13.75 cells** at the proposed 32-unit planning grid. Source-art planning basis from `28`: **4 authoring pixels per simulation unit**, e.g. a 32-unit cell ~128×128 source px. Do not author the room as one huge raster image. Tiles, decals, silhouette props, wall segments and independent FX are separately editable and exportable.

**Reference local coordinate frame:** scene center is (0,0); x in [-240,+240] and y in [-220,+220]. This is a *staging diagram*, not a collision plan or final spawn lock.

| Element | Illustrative placement | Constraint |
|---|---|---|
| West campward entrance | x≈−230, y≈0 | Make campward direction immediately legible; no wall-hidden exit |
| East Crossroads exit | x≈+230, y≈0 | Connected physically to O2; no teleport illusion |
| Adventurer start | x≈−165, y≈+35 | Initial face toward travel; shield silhouette visible |
| Mireling test spawn | x≈+65, y≈+80 | Run **alone** first, then add mixed test separately |
| Sentry test spawn | x≈+90, y≈−25 | Run **alone** first, then mixed test separately |
| Cover pillar | x≈+10, y≈−125; radius ≈24–32 units | Collision silhouette must match blocking; keep viable travel lane |
| Cracked paving landmark | Western/central approach | Decorative only; no false obstruction |
| Broken road marker | Along north or south edge | A recognisable Old Road identity without centre noise |

This positioning leaves deliberate space for the player's 92-unit dodge, the 13-unit adventurer collision radius and readable attack cones. **Do not treat drawn clearance as verified**: confirm against actual collision/navigation and enemy AI in Phaser. No key gate or boss encounter inside O1. Avoid spawning both enemies simultaneously until baseline individual fights and legibility pass.

### Environment layers (bottom to top)
1. Flat navigable cold-stone base with muted variation; terrain value never competes with characters.
2. Patchy chipped paving and occasional ash/olive weed clusters (edge-biased; sparse in fight center).
3. Ground-contact shadow and worn route edge; no invisible collision walls.
4. Spatially honest solid wall pieces, pillar and doorway jambs, each separately editable.
5. Actors, weapons, and contact shadows with proper depth sorting and ground pivot.
6. Local light halos, dust, impact sparks and combat telegraphs; warnings must appear above floor texture without concealing the fighters.
7. Context status and HUD outside or clear of active attack/hazard area.

### Spatial composition and visual attention
- Main player/enemy activity stays roughly within the central 300×250 units for the benchmark shots; alternate camera positions can be used for movement cases.
- Keep ~160 units of visibly open travel space on the principal west→east line wherever possible; this is a *readability and route test target*, not an established path width or new mechanical rule.
- Edge ruins create an asymmetrical silhouette (collapsed processional stones north, broken low wall south); architectural motifs remain consistent with Watchtower and Crypt materials.
- One quiet warm directional cue toward camp contrasts with colder exposed road ambience. It does **not** mean O1 is a sanctuary.
- The environment may contain story clues (weathered marker, old carvings) but no attention-dominating loot-glow scatter.

## 3. Three character proof sheets

### A0: Adventurer — hero-grade reference asset
- Readable overhead asymmetric equipment: **shield on one side, blade on the other** in every direction and major pose; no huge cloak hiding either.
- Compact body, weathered mail/cloth/leather, muted ash/linen or off-white shield highlight against charcoal/silt ground.
- Master turnaround: 8 facings for neutral move/idle; combat facings consistent with actual simulated heading. If art workflow cannot deliver eight dependable facings, provide a temporary honest rotation proxy and document the gap—do not fake sprite-facing collision decisions.
- Essential state illustrations: travel, idle, guard, light wind-up/contact/recovery, heavy wind-up/contact/recovery, dodge, stagger/hit, retreat intention, death. These are **visual poses**, not a new gameplay move set.
- Artist supplies a consistent ground-contact pivot at feet and a body/socket reference; oversized sword frames may extend outside physical collision bounds. Renderer must not resize the radius to match the illustration.

### E01: Mireling — small/fast/melee
- Low, hooked body with broad head/claws: visually distinct from any shield-carrying humanoid in silhouette only.
- Animation states: idle/skitter, approach, pre-leap **coil**, leap/contact, recover, flinch/death. The *coil* must clearly prefigure direction.
- Ground shadow remains connected under motion for spatial understanding; a subtle short leap trail may supplement pose but not replace it.
- Test against **bright road** and **dark edge** ground. If it vanishes at normal phone zoom, adjust silhouette brightness/outline, not its gameplay collision size.
- Attack timing/pattern are placeholders until separate combat AI implementation is integrated; the visuals must reflect actual event timestamps.

### E02: Ashen Sentry — medium/medium/melee
- Upright military ruin inhabitant, broad but distinct from the adventurer: rough faceplate, asymmetric short shield and worn sword, old ash/rust clothing.
- Essential states: patrol/turn, notice, advance, slash wind-up/active/recovery, shield-guard, guard-break or stagger, death; shield-bash pose only when implemented in combat AI.
- Strong angular shoulder/weapon pose gives a readable forward-facing strike, while guard uses a shield-forward silhouette.
- Keep Sentry's shield shape and colour **different** from the player's: sight recognition must not depend solely on health-bar colour.

## 4. Combat telegraph and VFX production contract

**Authoritative truth = current simulation tick/state.** Render art is a listener, not a second simulation. For each attack, read move ID, actor world transform, `windup`, `active`, `recovery`, attack range, facing arc, tracking stop time, optional projectile/hazard event. Do not change a hit frame because sprite animation looks better. Keep displayed warning cones distinct from collision solids.

| Test event | Proposed shape and visual evolution | Fail condition |
|---|---|---|
| Player light vs Sentry | Short pale blade arc; clear follow-through | Hit shown outside hit area or without contact |
| Sentry slash/chop | Shoulder pull and short directional pale/amber crescent | Pose looks like a lunge when attack is slash |
| Mireling lunge/leap | Coil toward intended target then fast body extension | Launch direction impossible to anticipate at 1× |
| Heavy guard-break (later shared VFX kit) | Broad orange wedge, thick double-line/chevrons, no colour dependence | Indistinguishable from ordinary slash |
| Successful block | Tiny warm shield spark + recoil, shield pose remains legible | Spark obscures enemy's next tell |
| Dodge | Restrained travel streak and final planted pose | FX implies invincibility outside actual i-frames |
| Stagger | Actor-wide posture collapse/recover | Looks like death; loses body position |
| Forbidden doorway indicator (UI rehearsal) | Barred line + diagonal hatch, no fake physical forcefield | Viewer thinks forbidden = physically locked terrain |

**Existing bench attack timings (source values, not new locks):** player `light` 7 wind-up / 3 active / 9 recovery ticks; `heavy` 15/4/16; enemy `chop` 15/4/18; `slash` 9/3/12; `lunge` 14/6/22 at 30 Hz. Different proposed new enemy moves may need new actual source definitions. Always recalculate presentation from those definitions after integration. At 1×, a 9-tick wind-up lasts 0.30 s; therefore clarity must come primarily from **pose and attack origin**, not slow VFX fade-in. No invented warnings that promise more reaction time than exists.

**Accessibility redundancy:** heavies use solid wedges + chevrons; toxic hazards use stipple; forbidden routes use slash-bar; spectral traces use numbered marks. Contrast must work in grayscale and simulated colour-vision deficiencies. Reduced-motion can shorten particles/shake but must retain essential active/warning shapes.

## 5. Visual quality bar and reference shots

Submit a **six-image evidence board**, all from the same candidate asset set and truthful camera settings, not six unrelated mood images:

| Capture | What must be visible | Test |
|---|---|---|
| S01 — Traversal | Open Old Road, west campward threshold, east exit, adventurer + equipment | Can viewer tell travel direction and collision boundaries? |
| S02 — Small fast attack | Mireling coil/leap while adventurer approaches | Can viewer locate and read small enemy on both light/dark terrain? |
| S03 — Armed guard | Sentry guarding against player; sword/shield distinct for both | Can viewer identify guard posture and actor ownership? |
| S04 — Attack telegraph | Sentry wind-up and impending attack extent | Can viewer identify origin/direction and avoid incorrectly predicted hit area? |
| S05 — Mixed visibility stress | Player + Mireling + Sentry + one contact VFX, edge pillar | Do actors remain separable at normal zoom? Not a demand to ship simultaneous combat yet |
| S06 — Small-screen framing | Same scene at narrow portrait and landscape reference view | Is HUD clear of protagonist, incoming blows and retreat direction? |

Use one low-detail annotated wireframe and one painterly version of **S01** to identify which surface detail affects readability. Do not treat concept artwork as proof of runtime performance or event accuracy. The older generated Phaser image is only the starting composition reference; it lacks the finished silhouettes and environment material standard specified here.

### Grading rubric — candidate only, not locked
Score each of five areas 0–3: **silhouette, attack truthfulness, route clarity, atmosphere, mobile readability**. A visual candidate must score ≥2 in every category and ≥12/15 overall **before the creator is asked to approve mass production**. Critical correctness failures (false gate state, hazard outside hit area, invisible opponent, actor concealed by wall without cutaway) automatically fail regardless of total score. Record review evidence in `29B_ART_REVIEW_MATRIX.csv`. This scoring proposal does not claim to measure fun or player retention.

## 6. Exact acceptance tests

- On 390×844 portrait and 844×390 landscape CSS layouts, check actual character screen-space size around **42–64 px visible diameter** at reference combat zoom (target from `28`); document rendered pixels and camera zoom, do not change collision size to hit this target.
- Test 1280×720 desktop, 1920×1080 desktop and one lower-end Android browser. Display/zoom must be captured rather than inferred.
- At 1× tick timing, record identical deterministic encounter outcomes with presentation visible and headless presentation absent; any mismatch is a blocking bug.
- Run two neutral static screenshot recognition tests with at least 3 unfamiliar observers: identify avatar/shield side, Sentry, Mireling, doorway, planned return direction and telegraphed attack. Record answers and confusion; proposed pass threshold **≥80% correct critical identifications**, **zero** systematic confusion of dangerous versus safe zones.
- Run grayscale and at least protanopia/deuteranopia visual simulations on screenshots; preserve shape/hatch/edge redundancy.
- Mask all non-observed enemies and check no shadow, label, particles or HUD marker leaks hidden patrol locations through persistent fog.
- Check architectural art and collision: behind-wall occlusion handled with appropriate cutaways, doorways pass when shown open, covers block only where shown solid; dodges never appear to pass through forbidden boundaries.
- Verify travel and all 3 doctrines at normal playback. Allow fast-forward for genuinely safe travel *only* if core design authorises it later; no sim-time changes via rendered animation speed.
- Include screenshot with normal lighting and deliberately dark environment; hazards and player must remain legible in both.
- Record renderer performance (FPS distribution, texture memory, atlas count, CPU/GPU budget if available) on target devices; do not set unmeasured 'runs at 60 FPS' claim.

## 7. Asset production manifest and scale

`29A_OLD_ROAD_ART_ASSET_MANIFEST.csv` is the **proposed** file-by-file production manifest: ID, class, priority, required views/states, suggested export format, dimension/pivot rule, dependencies, art-review checks, and approval. Nothing in the manifest is already produced merely because it appears in the CSV.

**Source art:** editable layered masters (Krita/PSD/etc.) or retained 3D scene + texture/rig files where a 3D-to-sprite pipeline is chosen. Retain source rights/provenance and final license. **Do not hand the team rasterized JPEGs as the only editable source.** Exports as lossless PNG/WebP sprites or packed atlases; avoid separate large images for each character frame in runtime distribution.

**Colour tokens:** Night Ink #142024; Cold Slate #34454B; Weathered Stone #6F7974; Ash Linen #D8D4C6; Silt Umber #6E5848; Olive Moss #5B6956; Brass #B89458; Safe Ember #DAA56C; Spectral Cyan #87C3C4; Warning Orange #E19B5F; Corruption Green #93B978; Critical Vermilion #CE6654. These remain candidate palette swatches, not approved master references.

**Texture scale:** 4px/unit authoring reference. 32 sim-unit floor cell ~128px; player r13 means 26-unit *collision diameter* (~104 source pixels if drawn at that scale), **not** a directive to crop rendered sword/cape to 104px. Sprite frame bounds may be larger; pivots and scale must be recorded separately. Keep atlases appropriately sized for actual web/device limits rather than pre-deciding a universal atlas count.

## 8. Technical integration contract for Claude Code / Phaser team

The art lane supplies metadata and exports; Claude Code owns implementation and is **already working on the combat/map lane**. Avoid touching its in-flight files unless coordinated.

Needed data from implementers: actor ID, type, position, forward direction, combat animation phase, move ID, attack hit shape / start-end ticks, projectile origin/velocity, hit/stagger/death events, current map visibility, target/retreat intent, known room navmesh/collision footprints, world layer order, and safe-screen area. Render layer never invents enemy positions, gates, keys or health.

Required conventions (proposed): `feet-center` actor pivot / independent shadow pivot; `GROUND` tile art; `WALL_SOLID` with matching collision outlines; `PROP_SOLID` versus `PROP_DECORATIVE`; `FX_WARNING` layered above ground but under critical actor/cursor cues; `UI_CRITICAL` in safe region. Props must label whether they occlude sight, block movement and block projectiles **independently**—those three properties are not identical.

Two checkpoints before integration: (1) freeze a baseline screenshot and combat replay seeds; (2) art swaps must pass replay parity. Do not force an art frame rate or sprite width into simulation time and collision radius.

## 9. Minimum handoff bundle from artist

**For player, Sentry, Mireling:** one silhouette-only sheet, one 8/4-way or otherwise honest directional turnaround, base move sheet, attack silhouette phases, pivot/socket key, lossless exports and editable masters. State whether each sprite's facing angles are authored or rotational proxies. Do not require an entire 9-enemy sprite atlas to validate the look.

**For room:** three base floor variants, a chipped paving edge kit, solid north/south/side wall segments, 2 door thresholds, one pillar/cover object, one roadside marker, sparse dust/weed decals, one restrained warm light cue and shadows. Use the manifest for precise IDs.

**For FX and HUD:** player attack arc, enemy wind-up line, block spark, dodge cue, stagger cue, compact HP/Stamina status, target/readout/Retreat and objective status. Full Chronicle, fog gate, special boss and final campaign UI are not in P0.

**Definition of done:** six coherent evidence captures, manifest complete with assets and provenance, grayscale/mobile checks, collision/event parity, and creator choice on whether *Ashen Reliquary* is locked. **Do not claim done based on a mood board.**

## 10. Proposed art workflow decision (OPEN)

| Option | Production method | Strength / drawback |
|---|---|---|
| A | Hand-painted 2D sprites + painted tiles | Maximum illustrated charm; high eight-direction animation labour |
| B | Model/rig in 3D, render all actor animation to top-down sprite atlases | Repeatable views and animation; can become stiff or too 3D unless heavily art-directed |
| C | **Hybrid — recommended:** 3D base for consistent actor poses/turnarounds, painterly paint-over or stylised shader, hand-painted modular environment and carefully authored 2D FX | Scalable character production while retaining a painted result; needs an explicit source/export contract |

All options ship a **2D top-down Phaser game** with the same sim hitboxes. Choosing C later is an art pipeline choice, **not** approval to make gameplay 3D or lock the complete visual style. Selecting any option remains an explicit future creator decision; **no option is locked by this document**.

## 11. Next development gates

- **Gate V1: silhouette approval** — the player, Sentry and Mireling each read uniquely without colour or detail.
- **Gate V2: Old Road painted room** — terrain, obstacle, exits and 3 actors readable at true scale.
- **Gate V3: motion/hit truth** — render integrates with deterministic sim, and controls/telegraphs are honest.
- **Gate V4: presentation approval** — candidate palette and visual style approved by creator *or returned for revision*. Only then commission other regions and bosses.

**Ownership:** document `28` is candidate world-wide look; this `29` is the first P0 delivery/validation contract. Art direction/manifest are proposals. Encounter stats, enemy-specific moves and level calculations stay with combat/map workstream. `16` is sole authority for creator locks.

## Workshop 22 pipeline decision — workflow C is LOCKED, projection remains OPEN
**L22 resolves the former workflow choice in §10:** use Blender for consistent models, rigs and actions, render to transparent 2D sprites, and combine with **hand-painted** 2D ground, walls, props and VFX. The table in §10 remains as historical comparison; A and B are no longer competing P0 authoring approaches. `30` now owns detailed pivot, source-file, directional-frame, memory and timing contracts. `30A` stages production: projection coupon → hero silhouette/actions → Sentry/Mireling → painted room/VFX → integration evidence, rather than commissioning all eight facings and every clip at once. Ashen Reliquary overall style (P18) is still **NOT LOCKED**. The art bench must not alter deterministic combat outcomes or gameplay collision geometry.

## Workshop 23 — Old Road character render camera is now locked L23
For the O1 proof, the adventurer, Sentry and Mireling must all use a shared **+75° above horizontal orthographic Blender camera**, rendered into flat 2D sprites. Reuse the same compass reference, azimuth, shader/light preset and root/feet pivot. Retain separate painted 2D flooring and telegraphs. Overhead camera A is no longer an alternative production choice; view-angle comparisons may be retained as historical notes. **First deliverable:** asymmetrical sword/shield mannequin +75° N/E/S/NE silhouette/pivot evidence, then minimal hero clips, then Sentry and Mireling. Do not claim P0 accepted without visual QA. Additional standard: `31`, `31A`, `31B`. Overall art LOOK remains proposed.

## Updated Old Road P0 art gate — selective eight-direction sprites (L24)
- Adventurer, Ashen Sentry and Mireling: **8-way movement**, and 8-way guard wherever that action exists; correct asymmetric shield side at every compass bearing.
- Sample attacks using an initial limited direction set only as a test; no completed character is approved until every eight-heading simulation test confirms honest tells, arcs, contact and recovery, expanding authored views where necessary.
- Record sprite atlas memory and 30Hz timing parity. Placeholder/diagnostic four-way rigs are not accepted as finished eight-way movement art.
- See `32A` coverage matrix and `32` acceptance gates. All other asset production remains proposal, and combat rules stay separate.
