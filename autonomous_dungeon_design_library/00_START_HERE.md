# Autonomous Dungeon Crawler — Design Library
**Version:** 0.16 detailed design library (locked 75° orthographic sprite camera and character production standards)  
**Updated:** 2026-10-23  
**Platform:** standalone browser/PC/mobile-capable project with RUN.world as a possible distribution target; exact targets OPEN  
**Status:** Living design documents, not a final abbreviated GDD

## Purpose
These files are the source material for a future condensed game-design document, implementation handoff and production planning. Each substantial subsystem owns its rules in one file. Do **not** collapse these files into a single short GDD yet. Change the owning document first, then revise cross-references and the decision register.

The game is a top-down 2D **autonomous dungeon exploration and extraction RPG**. The player chooses a kit, prepares objectives and standing orders, dispatches an adventurer into a persistent interconnected world, intervenes only at meaningful decisions, and must physically extract possessions to camp. An expedition may end in extraction, boss victory followed by further travel, or death and recoverable loss. Routine combat is controlled by separate combat AI.

## How to interpret requirements
- **LOCKED** = explicitly selected by the creator in conversation. Do not silently replace.
- **PROPOSED** = working design recommendation; safe to workshop and prototype, not approved as immutable.
- **OPEN** = a decision requiring testing or a future explicit selection.
- **OUT OF SCOPE** = intentionally excluded from the first playable build, not necessarily the finished game.

A requirement must **not** become LOCKED merely because it appeared in an earlier assistant suggestion. Use `16_DECISIONS_AND_OPEN_QUESTIONS.md` for authoritative status.

## Document directory
| File | Design ownership |
|---|---|
| [`01_PRODUCT_VISION_AND_GAME_LOOP.md`](01_PRODUCT_VISION_AND_GAME_LOOP.md) | Premise, pillars, outcomes, player agency, game identity |
| [`02_WORLD_TOPOLOGY_AND_PERSISTENCE.md`](02_WORLD_TOPOLOGY_AND_PERSISTENCE.md) | Regions, connections, geography, shortcuts, world changes, save invariants |
| [`03_EXPLORATION_FOG_AND_DISCOVERIES.md`](03_EXPLORATION_FOG_AND_DISCOVERIES.md) | Fog of war, frontier objectives, map intelligence, discovery rewards |
| [`04_EXPEDITION_PLANNING_AND_ORDERS.md`](04_EXPEDITION_PLANNING_AND_ORDERS.md) | Itinerary, doctrines, standing orders, field orders, order arbitration |
| [`05_NONCOMBAT_AUTONOMY_AND_NAVIGATION.md`](05_NONCOMBAT_AUTONOMY_AND_NAVIGATION.md) | Navigation, investigation, tasks, interruptions, safe route selection |
| [`06_ENEMY_ECOLOGY_AND_ENCOUNTERS.md`](06_ENEMY_ECOLOGY_AND_ENCOUNTERS.md) | Territories, encounter population, patrols, variability, fairness |
| [`07_DETECTION_PURSUIT_AND_ALERT_RESET.md`](07_DETECTION_PURSUIT_AND_ALERT_RESET.md) | Awareness, searching, pursuit boundaries, quick reset after loss of contact |
| [`08_RETREAT_EXTRACTION_AND_DEATH.md`](08_RETREAT_EXTRACTION_AND_DEATH.md) | Extraction, disengagement requests, caches, loss and recoverability |
| [`09_SANCTUARIES_LOOT_AND_ECONOMY.md`](09_SANCTUARIES_LOOT_AND_ECONOMY.md) | Sanctuary limits, rewards, loot, gold trade-offs, consumables |
| [`10_CHARACTER_KIT_AND_PROGRESSION.md`](10_CHARACTER_KIT_AND_PROGRESSION.md) | Sword/shield baseline, in-run levels, upgrades, permanent mastery |
| [`11_BOSS_CAMPAIGN_AND_REMATCHES.md`](11_BOSS_CAMPAIGN_AND_REMATCHES.md) | Boss progression, world alteration, rematches, ending, challenge constraints |
| [`12_PLAYER_UX_AND_EXPEDITION_CHRONICLE.md`](12_PLAYER_UX_AND_EXPEDITION_CHRONICLE.md) | Maps, planning UI, live status, accessibility, post-run clarity |
| [`13_RETENTION_CHALLENGES_AND_REVENUE.md`](13_RETENTION_CHALLENGES_AND_REVENUE.md) | Session loops, ethical monetisation, challenge rotation, indicators |
| [`14_COMBAT_AI_INTERFACE_CONTRACT.md`](14_COMBAT_AI_INTERFACE_CONTRACT.md) | Design-level boundary to separate combat-AI session; no combat implementation |
| [`15_VERTICAL_SLICE_AND_ACCEPTANCE_TESTS.md`](15_VERTICAL_SLICE_AND_ACCEPTANCE_TESTS.md) | Prototype budget, design acceptance scenarios, failure criteria |
| [`16_DECISIONS_AND_OPEN_QUESTIONS.md`](16_DECISIONS_AND_OPEN_QUESTIONS.md) | Explicit locks, proposals, choices to resolve, changelog |
| [`17_WORLD_STATE_AND_EDGE_CASES.md`](17_WORLD_STATE_AND_EDGE_CASES.md) | Save scope, transitions, safety, disconnect and conflicting state cases |
| [`18_ART_AUDIO_AND_PRESENTATION_DIRECTION.md`](18_ART_AUDIO_AND_PRESENTATION_DIRECTION.md) | Visual direction options, readability, audio, asset categories |
| [`19_ONBOARDING_DIFFICULTY_AND_ACCESSIBILITY.md`](19_ONBOARDING_DIFFICULTY_AND_ACCESSIBILITY.md) | First-run learning, difficulty fairness, controls/accessibility |
| [`20_CONTENT_ROADMAP_AND_PRODUCT_TESTING.md`](20_CONTENT_ROADMAP_AND_PRODUCT_TESTING.md) | Roadmap, metrics, content authoring and production gates |
| [`21_FOG_GATES_KEYS_AND_COMMITMENT.md`](21_FOG_GATES_KEYS_AND_COMMITMENT.md) | First-use sealed fog gates, universal key resource, boss/miniboss entry approval, irreversible unlocks |
| [`22_GATE_KEY_ACQUISITION_AND_SOFTLOCK_PREVENTION.md`](22_GATE_KEY_ACQUISITION_AND_SOFTLOCK_PREVENTION.md) | Guaranteed and repeatable Gate Key sources (L18), extraction/recovery, campaign reachability tests |
| [`23_KEY_BANKING_LOADOUT_AND_FIRST_USE.md`](23_KEY_BANKING_LOADOUT_AND_FIRST_USE.md) | L19 camp-first bank eligibility, physical issuance, gate spending, carried loss, expedition cases |
| [`24_GATE_COSTS_MINIBOSS_REWARDS_AND_KEY_ALLOCATION.md`](24_GATE_COSTS_MINIBOSS_REWARDS_AND_KEY_ALLOCATION.md) | L20 prepared-keyring capacity, locked standard first-unlock cost of one key, optional miniboss investment and allocation ledgers |
| [`25_VERTICAL_SLICE_ENEMY_BOSS_ROSTER_AND_LEVEL_CURVE.md`](25_VERTICAL_SLICE_ENEMY_BOSS_ROSTER_AND_LEVEL_CURVE.md) | Six regular enemies, miniboss, main boss, optional secret boss; attack briefs, roles, static difficulty bands, combat AI handoff |
| [`25A_ENEMY_ROSTER_QUICK_REFERENCE.csv`](25A_ENEMY_ROSTER_QUICK_REFERENCE.csv) | Filterable condensed list of nine proposed enemies/bosses for content production (not gameplay code) |
| [`26_MAP_LAYOUT_AND_ENCOUNTER_ZONES.md`](26_MAP_LAYOUT_AND_ENCOUNTER_ZONES.md) | Proposed 17-zone physical map, coordinates, corridors, hazards and passage requirements |
| [`27_COMBAT_BENCH_CALIBRATION_AND_DIFFICULTY_TARGETS.md`](27_COMBAT_BENCH_CALIBRATION_AND_DIFFICULTY_TARGETS.md) | Bench-derived combat AI levels and proposed difficulty targets; not verified in an integrated world |
| [`28_VISUAL_STYLE_AND_ART_DIRECTION.md`](28_VISUAL_STYLE_AND_ART_DIRECTION.md) | Full **PROPOSED** Ashen Reliquary art bible: palette, mood, assets, UI, fog states, VFX readability and production acceptance |
| [`29_OLD_ROAD_ART_PRODUCTION_AND_STYLE_VALIDATION.md`](29_OLD_ROAD_ART_PRODUCTION_AND_STYLE_VALIDATION.md) | **PROPOSED** Old Road P0 art sprint: O1 staging, adventurer/Sentry/Mireling briefs, VFX truth, review and workflow alternatives |
| [`29A_OLD_ROAD_ART_ASSET_MANIFEST.csv`](29A_OLD_ROAD_ART_ASSET_MANIFEST.csv) | Proposed individual asset deliverables, sources, pivots, dependencies and review requirements |
| [`29B_ART_REVIEW_MATRIX.csv`](29B_ART_REVIEW_MATRIX.csv) | Art/UX/simulation parity verification checks; all initially not run |
| [`29C_OLD_ROAD_ARTIST_HANDOFF.md`](29C_OLD_ROAD_ARTIST_HANDOFF.md) | Concise production-ready brief for an artist or the Claude Code presentation lane |
| [`30_HYBRID_BLENDER_CHARACTER_SPRITE_PIPELINE.md`](30_HYBRID_BLENDER_CHARACTER_SPRITE_PIPELINE.md) | L22 Blender-rigged character-to-2D export contract, camera/facing candidates, pivots, atlas budget, timing/parity and first proof |
| [`30A_BLENDER_SPRITE_CLIP_AND_DELIVERABLE_PLAN.csv`](30A_BLENDER_SPRITE_CLIP_AND_DELIVERABLE_PLAN.csv) | Staged art clip deliverables and proposed frame/direction budgets; no assets created |
| [`30B_HYBRID_PIPELINE_VALIDATION.csv`](30B_HYBRID_PIPELINE_VALIDATION.csv) | Test evidence checklist, currently not run |
| [`31_LOCKED_75DEG_CAMERA_AND_CHARACTER_SPRITE_STANDARDS.md`](31_LOCKED_75DEG_CAMERA_AND_CHARACTER_SPRITE_STANDARDS.md) | L23 camera contract, modelling/rig standards, pivots, animation timing, sprite export and QA |
| [`31A_CAMERA_SILHOUETTE_SHOT_LIST.csv`](31A_CAMERA_SILHOUETTE_SHOT_LIST.csv) | Proposed P0 +75° camera calibration and hero/Sentry/Mireling screenshot checklist |
| [`31B_CAMERA_CHARACTER_DELIVERABLES.csv`](31B_CAMERA_CHARACTER_DELIVERABLES.csv) | Source files, outputs, parity and runtime review deliverables; none yet produced |

## Source-of-truth rules
1. Geography and permanence: `02` and `17`.
2. Discoveries and exploration: `03`.
3. Orders and player agency: `04`; noncombat execution: `05`.
4. Population and encounter selection: `06`; awareness and chase: `07`.
5. Loss/banking: `08`; reward quantities and spend opportunities: `09`.
6. Progression and initial equipment: `10`; bosses: `11`; boss/miniboss first-time access and key rules: `21`; key supply, challenge replenishment, and progression safety: `22`; bank-before-use and key-issued expeditions: `23`; prepared capacity, price alternatives and optional miniboss economics: `24`.
7. Combat details belong in a **separate session**. `14` defines only the inter-system contract.
8. Final locks and uncertainty are indexed in `16`.
9. **Locked production workflow L22** is documented in `30`: Blender-rendered character sprites with hand-painted environment/VFX. **Locked render camera L23** is specified in `31`: orthographic +75° above horizontal, shared across characters. **Proposed visual look P18** lives in `28`; `18` remains the cross-disciplinary presentation/audio overview. *Ashen Reliquary* aesthetic remains open until explicitly approved.

## Non-negotiable player promise
The player must be able to understand **where the adventurer went, which orders it attempted, what changed, why it took a risk, and why the expedition succeeded or failed**. The game may be difficult; it must not feel arbitrarily dishonest.

## Abridged-document plan (later)
Once remaining workshop decisions are settled, derive a compact master GDD from these full documents. The abridged version should retain: pitch, pillars, locked rules, one-page loop, prototype scope, key interface sketches, economy table and combat handoff. These detailed documents remain the canonical reference.


## v0.2 workshop extension (2026-10-23)
Expanded 04 (expedition route authoring, states, exceptions, attendance policy) and 12 (screen hierarchy, decision cards, mobile constraints and learning metrics). This is a **proposal update only**; no previously locked choice was changed. See 16 for the pending approval decision.

## v0.3 workshop extension (2026-10-23)
The creator **explicitly locked hybrid route planning (Option C)**. Route computation is automatic through known legal connections, with optional manual waypoints and avoidance constraints. Workshop 09 expanded files 03, 04, 05, 08, 12, 14, 15, 16, 17, 19 to detail the player map interaction, objective completion and fallback states, preflight conflicts, risk/retreat policies and tests. The map gestures, risk thresholds and unattended decisions remain **PROPOSED/OPEN**; absolute route avoidance has since been independently locked in v0.4. No code, combat-AI algorithm or abridged GDD was added.

## v0.4 workshop extension (2026-10-23)
The creator **explicitly locked absolute route avoidance (Option A; L13)**. A marked exclusion is a **hard prohibition** on intentional entry at all times, including retreat and imminent death. A Retreat command does not lift it; only a separate, explicit player change to the avoid order can do that. If all known permitted routes are blocked, the game reports `No permitted route home` and tries only permitted actions; survival or successful extraction is not guaranteed. Do not conflate this lock with optional preferred routes, enemy avoidance, or the unapproved policy for unattended blocked objectives. Updated 03, 04, 05, 08, 12, 14, 15, 16, 17 and 19. Abridged GDD remains deferred.

## v0.5 workshop extension (2026-10-23)
The creator **explicitly locked blocked-objective fallback C (L14)**. An ordinary task confirmed impossible after trying known, permitted alternatives is logged as `Skipped — Blocked`; the adventurer proceeds to the **next remaining permissible objective in the original order**. No automatic task reorder, forbidden-region override, indefinite idle wait or reflexive mission-abandonment. Manual/survival Retreat supersedes the remaining ordinary queue. `Return to Camp` is a non-skippable terminal extraction attempt; if illegal or unreachable, resources remain at risk and the state is `Extraction blocked`.

Updated detailed documents **03, 04, 05, 08, 12, 14, 15, 16, 17 and 19**, plus this index. Added explicit task-state vocabulary, decision precedence, dependence chains, HUD/Chronicle handling, handoff boundary and 16 acceptance tests. Other design choices remain PROPOSED/OPEN; no game code or abridged GDD created.

## v0.6 workshop extension (2026-10-23)
Creator locks **L15 standing defaults plus selective safe pauses** and **L16 first-unlock key-sealed fog gates for boss and miniboss encounters**. The new `21_FOG_GATES_KEYS_AND_COMMITMENT.md` is the system-of-record for access, key consumption, and opt-in boss engagement. Banked-before-use remains proposed; shared universal Gate Keys are now locked by L17, with a possible optional special-key exception only. Updated dependent rules and tests; no code. Absolute route bans, skip blocked-task fallback, sanctuary no-banking and first-boss permanent victory all remain untouched.

## v0.7 workshop extension (2026-10-23)
The creator **explicitly locked L17: universal Gate Keys** for ordinary major and miniboss fog-gate first unlocks. That settles the earlier shared-versus-region-specific dispute in favour of one common currency. A rare **special key for an exceptional optional boss** was suggested conditionally; keep it a bounded **PROPOSAL P16**, never a requirement for a mandatory route or the ending. Updated `21`, the economy, boss, map, planning, UX, tests, risk/retention, state and decision register. The prototype stays one sword-and-shield kit. Combat AI remains in a separate session. No code and no abridged GDD.

## v0.8 workshop extension (2026-10-23)
The creator explicitly locked **L18: universal Gate Keys are supplied by guaranteed authored discoveries plus challenging repeatable replenishment**. Added `22_GATE_KEY_ACQUISITION_AND_SOFTLOCK_PREVENTION.md` as the source of truth for key sources, loss and reacquisition, and mandatory-campaign anti-softlock requirements. Revised economy, world, objective planning, extraction, boss gating, UX, persistence, acceptance tests, roadmap and decision register. **At v0.8, bank-before-first-use was open; it was resolved by L19 in v0.9. Gate prices were subsequently resolved by L21 in v0.11. Source counts, trial details and optional special-boss keys remain OPEN/PROPOSED.** No code or abridged master GDD.

## v0.9 workshop extension (2026-10-23)
**Creator locked L19: Gate Key first use requires camp banking.** A key discovered or won during an expedition may be carried and ultimately extracted, but it is **ineligible for spending at a fog gate until a successful physical return to camp**. The player may then allocate banked keys to a subsequent expedition; the spent key must already have passed through camp. No first-use shortcuts via sanctuary, death-cache recovery, map reveal, or boss victory. This resolves the former proposal P14 and question O21. Source-of-truth detail in new file `23`; cross-doc states aligned. This sentence reflects v0.9 history; carry slots were resolved in L20 and standard price in L21. Optional special-key application remains open. Combat AI untouched; abridged GDD deferred.

## v0.10 workshop extension (2026-10-23)
**NEW LOCK L20:** expedition *prepared keyring* supports at most two previously banked universal Gate Keys, deliberately selected at camp (zero, one or two). Keys left home remain safe. L19 fresh key banking requirement remains: fresh field-earned keys do not replenish prepared slots and cannot open gates in that run. Added system document `24` with flat and differentiated pricing alternatives (numeric standard-gate cost subsequently LOCKED by L21), optional miniboss reward propositions (O22 OPEN), banked-versus-fresh inventory ledgers, acceptance scenarios and anti-softlock constraints. Updated 04, 08, 09, 11–13, 15–17, 20–23 and the decision register. No gameplay code or abridged GDD created.

## Workshop 18 — Working enemy roster
Creator requests a concrete roster to develop in separate combat-AI session; **not an explicit lock of specific names/attacks/numeric tuning**. Reference `25` for 6 regular enemies, 1 miniboss, 1 area boss and 1 optional secret boss, with recommended L1-dangerous/static regional challenge and near-impossible L1 main-boss attempt. Gate cost Option A was explicitly LOCKED in Workshop 17 (L21). Do not silently import new characters as campaign lore.


## Workshop 19 — attached combat-bench integration (2026-10-23)
Working proposals only: separate Claude Code combat/map handoff at archive root, `26_MAP_LAYOUT_AND_ENCOUNTER_ZONES.md`, `27_COMBAT_BENCH_CALIBRATION_AND_DIFFICULTY_TARGETS.md`, blueprint PNG/SVG and room/connection CSVs. Existing combat-bench HP/levels supersede *unapproved* prior sample numbers (100 HP, boss-ready L7–9); no new user approvals have been assumed.


## v0.12 physical map and implementation benchmark handoff (2026-10-23)
The previous archive added `26` (world map and encounter-zone geometry) and `27` (measured combat-bench calibration plus future balance targets). These were proposals and are not gameplay feature locks. The existing test bench remains independent of render engine.

## v0.13 visual direction workshop (2026-10-23)
The creator selected **Option A: draft a complete visual-style and art-direction document**. Added `28_VISUAL_STYLE_AND_ART_DIRECTION.md` describing proposed **Ashen Reliquary** painted-miniature dark fantasy, including the official palette candidate, region colour script, readable top-down/Phaser presentation, silhouettes for nine proposed enemies, truthful combat telegraphs, unique map/fog/gate/key/sanctuary visual states, animation contracts, responsive UI, editable asset deliverables, phased priority and acceptance tests. The proposed direction is **NOT LOCKED** merely by commissioning this document; decision O15 remains open. Kept `18` as overview and updated `12`, `19`, `20` and `16` cross references. Original VFX mechanics and existing combat AI are not changed. The abbreviated master GDD remains deferred.


## v0.14 workshop continuation — Old Road production gate (2026-10-23)
User asked to continue after commissioning full proposed style bible. Created `29` plus manifest/review/handoff, defining one Old Road O1 art-validation milestone without changing gameplay design or ongoing combat/map implementation. **P18 Ashen Reliquary remains PROPOSED, O15 unresolved; no new creator locks.** Production pipeline A/B/C remains OPEN. Source of truth remains `28` for proposed style and `29` for P0 delivery/evidence.

## v0.15 workshop — hybrid character sprite production decision (2026-10-23)
Creator explicitly locked production **Option C (L22)**: Blender modelling/rigging/animation for rendered 2D character sprites with hand-painted environment and VFX. Added complete `30` contract, test/asset sheets `30A`/`30B`, and updated `12`, `15`, `16`, `18`, `20`, `28`, `29`, `29C`. The existing gameplay/AI and all L01–L21 locks remain untouched. *Ashen Reliquary* final LOOK is still only P18, O15 OPEN. Next choice: orthographic projection angle for pre-rendered actors (O30), and validated facing/atlas budget (O31). No gameplay code, sprite assets or executed QA claimed.

## v0.16 workshop — 75° character camera lock (2026-10-23)
**Creator explicitly LOCKED L23:** fixed orthographic render camera, approximately **75° above the horizontal XY ground plane** (15° off overhead), for Blender-authored 2D character sprites. This resolves O30, superseding camera A/B comparison as an open selection. This is not 45° isometric, perspective, a gameplay camera orbit or 3D world navigation. Added `31` plus shot list `31A` and deliverables manifest `31B`, revised camera text in `30`, `28`, `29` and cross-disciplinary contracts. **Overall Ashen Reliquary art LOOK P18/O15 remains open**; facing/animation/atlas counts O31 also open. No new Blender rigs, sprite sheets or gameplay code are claimed.

## v0.17 workshop — selective eight-direction animation lock (2026-10-23)
**L24 LOCKED:** eight-direction locomotion/guard and selective per-attack directional sprite sets. Added `32_SELECTIVE_EIGHT_DIRECTION_ANIMATION_STANDARD.md` and `32A_DIRECTIONAL_CLIP_MATRIX.csv`, updated art bible, technical animation/camera docs, Old Road handoff, tests, roadmap and decision register. Existing L01–L23 preserved. P18 proposed visual identity still not locked. Uploaded `combat-sim.js` / `combat-bench.html` / `bench-shell.html` / `balance.js` / `build.js` are separate implementation artifacts **not modified or committed in this design-only revision**. The library archive is not proof of a remote Git push.
